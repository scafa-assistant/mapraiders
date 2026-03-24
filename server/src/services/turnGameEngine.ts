// ============================================================
// Turn-Based Game Engine
// Manages async territory games: Tic Tac Toe & Mini Chess 5×5.
// Defender sets game type, challenger initiates, players take
// turns with time limits. Winner gets the territory.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { awardXp } from './progressionEngine';
import { notifyTerritoryAttack } from './notificationService';
import { wsService } from './wsService';

// ─── Types ──────────────────────────────────────────────────────────────────

type TurnGameType = 'tic_tac_toe' | 'mini_chess';
type CellTTT = null | 'X' | 'O';
type PieceChess = null | string; // 'wK', 'bR', 'wP', etc.

interface TicTacToeState {
  cells: CellTTT[]; // 9 cells (3×3, row-major)
}

interface MiniChessState {
  cells: PieceChess[]; // 25 cells (5×5, row-major: [0]=bottom-left)
  captured: { white: string[]; black: string[] };
}

interface GameRow {
  id: string;
  territory_id: string;
  defense_id: string | null;
  defender_id: string;
  challenger_id: string;
  game_type: TurnGameType;
  board_state: any;
  current_turn: string;
  turn_number: number;
  status: string;
  winner_id: string | null;
  turn_deadline: string;
  config: any;
  created_at: string;
  completed_at: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TTT_TURN_HOURS = 2;
const CHESS_TURN_HOURS = 4;
const WIN_XP = 300;
const LOSS_XP = 50;
const DRAW_XP = 100;

// ─── Initial Board States ───────────────────────────────────────────────────

function initialTTTBoard(): TicTacToeState {
  return { cells: Array(9).fill(null) };
}

/**
 * Mini Chess 5×5 starting position (row-major, row 0 = bottom/White):
 *   Row 4: .  bR bK bB .
 *   Row 3: .  bP bP bP .
 *   Row 2: .  .  .  .  .
 *   Row 1: .  wP wP wP .
 *   Row 0: .  wR wK wB .
 */
function initialChessBoard(): MiniChessState {
  const cells: PieceChess[] = Array(25).fill(null);
  // Row 0 (White back rank)
  cells[1] = 'wR'; cells[2] = 'wK'; cells[3] = 'wB';
  // Row 1 (White pawns)
  cells[6] = 'wP'; cells[7] = 'wP'; cells[8] = 'wP';
  // Row 3 (Black pawns)
  cells[16] = 'bP'; cells[17] = 'bP'; cells[18] = 'bP';
  // Row 4 (Black back rank)
  cells[21] = 'bR'; cells[22] = 'bK'; cells[23] = 'bB';
  return { cells, captured: { white: [], black: [] } };
}

// ─── Engine ─────────────────────────────────────────────────────────────────

class TurnGameEngine {
  /**
   * Create a new turn-based game when a challenger initiates.
   * Defender plays first (X in TTT, White in Chess).
   */
  async createGame(
    territoryId: string,
    defenderId: string,
    challengerId: string,
    gameType: TurnGameType,
    defenseId?: string
  ): Promise<any> {
    // Check no active game on this territory
    const existing = await queryOne(
      "SELECT id FROM territory_games WHERE territory_id = $1 AND status = 'active'",
      [territoryId]
    );
    if (existing) throw new Error('A game is already active on this territory');

    const board = gameType === 'tic_tac_toe' ? initialTTTBoard() : initialChessBoard();
    const turnHours = gameType === 'tic_tac_toe' ? TTT_TURN_HOURS : CHESS_TURN_HOURS;

    const game = await queryOne<GameRow>(
      `INSERT INTO territory_games
       (territory_id, defense_id, defender_id, challenger_id, game_type,
        board_state, current_turn, turn_number, config, turn_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, NOW() + INTERVAL '${turnHours} hours')
       RETURNING *`,
      [
        territoryId,
        defenseId || null,
        defenderId,
        challengerId,
        gameType,
        JSON.stringify(board),
        defenderId, // defender moves first
        JSON.stringify({ turn_timeout_hours: turnHours }),
      ]
    );

    // Notify both players
    try {
      const gameLabel = gameType === 'tic_tac_toe' ? 'Tic Tac Toe' : 'Mini Chess';
      wsService.sendToUser(defenderId, 'game_started', {
        game_id: game!.id,
        territory_id: territoryId,
        game_type: gameType,
        message: `${gameLabel}-Herausforderung! Du bist dran.`,
        your_turn: true,
      });
      wsService.sendToUser(challengerId, 'game_started', {
        game_id: game!.id,
        territory_id: territoryId,
        game_type: gameType,
        message: `${gameLabel} gestartet! Warte auf Gegner.`,
        your_turn: false,
      });
    } catch { /* non-critical */ }

    return this.formatGameForPlayer(game!, defenderId);
  }

  /**
   * Get a game by ID (public state for the requesting player).
   */
  async getGame(gameId: string, userId: string): Promise<any> {
    const game = await queryOne<GameRow>(
      `SELECT g.*, du.username as defender_username, cu.username as challenger_username
       FROM territory_games g
       JOIN users du ON du.id = g.defender_id
       JOIN users cu ON cu.id = g.challenger_id
       WHERE g.id = $1`,
      [gameId]
    );
    if (!game) throw new Error('Game not found');
    return this.formatGameForPlayer(game, userId);
  }

  /**
   * Get all active games for a user.
   */
  async getMyGames(userId: string): Promise<any[]> {
    const games = await queryMany<GameRow>(
      `SELECT g.*, du.username as defender_username, cu.username as challenger_username
       FROM territory_games g
       JOIN users du ON du.id = g.defender_id
       JOIN users cu ON cu.id = g.challenger_id
       WHERE (g.defender_id = $1 OR g.challenger_id = $1) AND g.status = 'active'
       ORDER BY CASE WHEN g.current_turn = $1 THEN 0 ELSE 1 END, g.turn_deadline ASC`,
      [userId]
    );
    return games.map((g) => this.formatGameForPlayer(g, userId));
  }

  /**
   * Make a move in a turn-based game.
   */
  async makeMove(gameId: string, userId: string, moveData: any): Promise<any> {
    // Use SELECT FOR UPDATE to prevent race conditions (double-move, timeout-vs-move)
    const game = await queryOne<GameRow>(
      "SELECT * FROM territory_games WHERE id = $1 AND status = 'active' FOR UPDATE",
      [gameId]
    );
    if (!game) throw new Error('Game not found or already completed');
    if (userId !== game.defender_id && userId !== game.challenger_id) {
      throw new Error('Not a participant in this game');
    }
    if (game.current_turn !== userId) throw new Error('Not your turn');

    // Check timeout (after locking row to prevent race with cron)
    if (new Date(game.turn_deadline) < new Date()) {
      return this.handleTimeout(game);
    }

    const board = typeof game.board_state === 'string' ? JSON.parse(game.board_state) : game.board_state;
    const isDefender = userId === game.defender_id;

    let result: { board: any; status: 'continue' | 'win' | 'draw'; winnerId?: string };

    if (game.game_type === 'tic_tac_toe') {
      result = this.processTTTMove(board, moveData, isDefender);
    } else {
      result = this.processChessMove(board, moveData, isDefender, game);
    }

    // Store the move
    await query(
      `INSERT INTO game_moves (game_id, player_id, move_data, move_number)
       VALUES ($1, $2, $3, $4)`,
      [gameId, userId, JSON.stringify(moveData), game.turn_number]
    );

    if (result.status === 'win') {
      // The player who made the winning move is always the winner
      return this.completeGame(game, userId, result.board, 'completed');
    }

    if (result.status === 'draw') {
      return this.completeGame(game, null, result.board, 'draw');
    }

    // Continue: switch turn
    const nextPlayer = isDefender ? game.challenger_id : game.defender_id;
    const turnHours = game.game_type === 'tic_tac_toe' ? TTT_TURN_HOURS : CHESS_TURN_HOURS;

    const updated = await queryOne<GameRow>(
      `UPDATE territory_games
       SET board_state = $1, current_turn = $2, turn_number = turn_number + 1,
           turn_deadline = NOW() + INTERVAL '${turnHours} hours'
       WHERE id = $3 RETURNING *`,
      [JSON.stringify(result.board), nextPlayer, gameId]
    );

    // Notify next player
    try {
      wsService.sendToUser(nextPlayer, 'game_turn', {
        game_id: gameId,
        territory_id: game.territory_id,
        game_type: game.game_type,
        your_turn: true,
        turn_number: game.turn_number + 1,
      });
    } catch { /* non-critical */ }

    return this.formatGameForPlayer(updated!, userId);
  }

  /**
   * Get move history for a game.
   */
  async getMoves(gameId: string): Promise<any[]> {
    return queryMany(
      `SELECT gm.*, u.username as player_username
       FROM game_moves gm
       JOIN users u ON u.id = gm.player_id
       WHERE gm.game_id = $1
       ORDER BY gm.move_number ASC`,
      [gameId]
    );
  }

  /**
   * Check for timed-out games and forfeit them (called by cron).
   */
  async checkTimeouts(): Promise<number> {
    const timedOut = await queryMany<GameRow>(
      "SELECT * FROM territory_games WHERE status = 'active' AND turn_deadline < NOW()"
    );

    let count = 0;
    for (const game of timedOut) {
      try {
        await this.handleTimeout(game);
        count++;
      } catch (e) {
        console.error(`[TurnGame] Timeout handling failed for game ${game.id}:`, e);
      }
    }
    return count;
  }

  // ─── Tic Tac Toe Logic ──────────────────────────────────────────────────

  private processTTTMove(
    board: TicTacToeState,
    moveData: { position: number },
    isDefender: boolean
  ): { board: TicTacToeState; status: 'continue' | 'win' | 'draw'; winnerId?: string } {
    const pos = moveData.position;
    if (pos < 0 || pos > 8) throw new Error('Invalid position (0-8)');
    if (board.cells[pos] !== null) throw new Error('Cell already occupied');

    const mark = isDefender ? 'X' : 'O';
    board.cells[pos] = mark;

    // Check win
    const winLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6],             // diags
    ];

    for (const line of winLines) {
      if (line.every((i) => board.cells[i] === mark)) {
        return { board, status: 'win' }; // winnerId set by caller
      }
    }

    // Check draw (all cells filled)
    if (board.cells.every((c) => c !== null)) {
      return { board, status: 'draw' };
    }

    return { board, status: 'continue' };
  }

  // ─── Mini Chess Logic ───────────────────────────────────────────────────

  private processChessMove(
    board: MiniChessState,
    moveData: { from: number; to: number; promotion?: string },
    isDefender: boolean,
    game: GameRow
  ): { board: MiniChessState; status: 'continue' | 'win' | 'draw'; winnerId?: string } {
    const { from, to } = moveData;
    if (from < 0 || from > 24 || to < 0 || to > 24) throw new Error('Invalid position');
    if (from === to) throw new Error('Must move to a different cell');

    const piece = board.cells[from];
    if (!piece) throw new Error('No piece at source');

    const color = isDefender ? 'w' : 'b';
    if (piece[0] !== color) throw new Error('Not your piece');

    // Validate move for piece type
    if (!this.isValidChessMove(board, from, to, piece)) {
      throw new Error('Illegal move');
    }

    // Check if capturing opponent's king → win
    const target = board.cells[to];
    const capturedKing = target && target[1] === 'K' && target[0] !== color;

    // Execute move
    if (target) {
      // Capture
      const capturedBy = color === 'w' ? 'white' : 'black';
      board.captured[capturedBy].push(target);
    }
    board.cells[to] = piece;
    board.cells[from] = null;

    // Pawn promotion (reaches last rank)
    const toRow = Math.floor(to / 5);
    if (piece[1] === 'P') {
      if ((color === 'w' && toRow === 4) || (color === 'b' && toRow === 0)) {
        // Auto-promote to Rook (strongest non-King piece in this variant)
        const promo = moveData.promotion || 'R';
        const validPromos = ['R', 'B'];
        board.cells[to] = color + (validPromos.includes(promo) ? promo : 'R');
      }
    }

    if (capturedKing) {
      return { board, status: 'win' };
    }

    // Check if opponent has any legal moves (stalemate → draw)
    const opponentColor = color === 'w' ? 'b' : 'w';
    if (!this.hasLegalMoves(board, opponentColor)) {
      return { board, status: 'draw' };
    }

    return { board, status: 'continue' };
  }

  private isValidChessMove(board: MiniChessState, from: number, to: number, piece: string): boolean {
    const color = piece[0]; // 'w' or 'b'
    const type = piece[1];  // 'K', 'R', 'B', 'P'
    const target = board.cells[to];

    // Can't capture own piece
    if (target && target[0] === color) return false;

    const fromRow = Math.floor(from / 5);
    const fromCol = from % 5;
    const toRow = Math.floor(to / 5);
    const toCol = to % 5;
    const dRow = toRow - fromRow;
    const dCol = toCol - fromCol;

    switch (type) {
      case 'K':
        return Math.abs(dRow) <= 1 && Math.abs(dCol) <= 1;

      case 'R':
        return this.isValidSlidingMove(board, from, to, fromRow, fromCol, toRow, toCol, true, false);

      case 'B':
        return this.isValidSlidingMove(board, from, to, fromRow, fromCol, toRow, toCol, false, true);

      case 'P':
        return this.isValidPawnMove(board, from, to, color, fromRow, fromCol, toRow, toCol, dRow, dCol, target);

      default:
        return false;
    }
  }

  private isValidSlidingMove(
    board: MiniChessState,
    _from: number, _to: number,
    fromRow: number, fromCol: number,
    toRow: number, toCol: number,
    allowStraight: boolean, allowDiagonal: boolean
  ): boolean {
    const dRow = toRow - fromRow;
    const dCol = toCol - fromCol;

    const isStraight = dRow === 0 || dCol === 0;
    const isDiagonal = Math.abs(dRow) === Math.abs(dCol);

    if (allowStraight && isStraight) { /* ok */ }
    else if (allowDiagonal && isDiagonal) { /* ok */ }
    else return false;

    // Check path is clear
    const stepRow = dRow === 0 ? 0 : dRow > 0 ? 1 : -1;
    const stepCol = dCol === 0 ? 0 : dCol > 0 ? 1 : -1;
    let r = fromRow + stepRow;
    let c = fromCol + stepCol;

    while (r !== toRow || c !== toCol) {
      if (board.cells[r * 5 + c] !== null) return false;
      r += stepRow;
      c += stepCol;
    }

    return true;
  }

  private isValidPawnMove(
    board: MiniChessState,
    _from: number, _to: number,
    color: string,
    fromRow: number, fromCol: number,
    toRow: number, toCol: number,
    dRow: number, dCol: number,
    target: PieceChess
  ): boolean {
    const direction = color === 'w' ? 1 : -1; // white moves up (+row), black down (-row)

    // Forward 1 (no capture)
    if (dRow === direction && dCol === 0 && !target) return true;

    // Diagonal capture
    if (dRow === direction && Math.abs(dCol) === 1 && target && target[0] !== color) return true;

    return false;
  }

  private hasLegalMoves(board: MiniChessState, color: string): boolean {
    for (let from = 0; from < 25; from++) {
      const piece = board.cells[from];
      if (!piece || piece[0] !== color) continue;
      for (let to = 0; to < 25; to++) {
        if (from === to) continue;
        if (this.isValidChessMove(board, from, to, piece)) return true;
      }
    }
    return false;
  }

  // ─── Game Completion ────────────────────────────────────────────────────

  private async completeGame(
    game: GameRow,
    winnerId: string | null,
    finalBoard: any,
    status: 'completed' | 'draw' | 'forfeit' | 'timeout'
  ): Promise<any> {
    await query(
      `UPDATE territory_games
       SET board_state = $1, status = $2, winner_id = $3, completed_at = NOW()
       WHERE id = $4`,
      [JSON.stringify(finalBoard), status, winnerId, game.id]
    );

    const isDrawOrDefenderWins =
      status === 'draw' || winnerId === game.defender_id;

    if (!isDrawOrDefenderWins && winnerId) {
      // Challenger won → transfer territory
      await query(
        'UPDATE territories SET owner_id = $1, last_defended = NOW() WHERE id = $2',
        [winnerId, game.territory_id]
      );

      // Expire the defense
      if (game.defense_id) {
        await query(
          "UPDATE territory_defenses SET status = 'expired' WHERE id = $1",
          [game.defense_id]
        );
      }

      await awardXp(winnerId, WIN_XP, 'turn_game_win');
      const loserId = winnerId === game.defender_id ? game.challenger_id : game.defender_id;
      await awardXp(loserId, LOSS_XP, 'turn_game_loss');

      // Notify
      try {
        await notifyTerritoryAttack(game.defender_id, game.territory_id, winnerId);
      } catch { /* non-critical */ }
    } else if (status === 'draw') {
      // Draw → defender keeps, both get XP
      await awardXp(game.defender_id, DRAW_XP, 'turn_game_draw');
      await awardXp(game.challenger_id, DRAW_XP, 'turn_game_draw');
    } else if (winnerId === game.defender_id) {
      // Defender won → keeps territory
      await awardXp(game.defender_id, WIN_XP, 'turn_game_win');
      await awardXp(game.challenger_id, LOSS_XP, 'turn_game_loss');

      // Reset decay
      await query(
        'UPDATE territories SET last_defended = NOW() WHERE id = $1',
        [game.territory_id]
      );
    }

    // WebSocket broadcasts
    try {
      const gameLabel = game.game_type === 'tic_tac_toe' ? 'Tic Tac Toe' : 'Mini Chess';
      const resultMsg = status === 'draw'
        ? `${gameLabel} — Unentschieden! Verteidiger behält Territorium.`
        : status === 'timeout'
        ? `${gameLabel} — Zeitüberschreitung!`
        : `${gameLabel} — Spiel beendet!`;

      wsService.sendToUser(game.defender_id, 'game_ended', {
        game_id: game.id,
        territory_id: game.territory_id,
        result: winnerId === game.defender_id ? 'won' : status === 'draw' ? 'draw' : 'lost',
        message: resultMsg,
      });
      wsService.sendToUser(game.challenger_id, 'game_ended', {
        game_id: game.id,
        territory_id: game.territory_id,
        result: winnerId === game.challenger_id ? 'won' : status === 'draw' ? 'draw' : 'lost',
        message: resultMsg,
      });
    } catch { /* non-critical */ }

    // Feed event
    try {
      await query(
        `INSERT INTO feed_events (type, user_id, data) VALUES ('turn_game_result', $1, $2)`,
        [
          winnerId || game.defender_id,
          JSON.stringify({
            game_id: game.id,
            territory_id: game.territory_id,
            game_type: game.game_type,
            status,
            winner_id: winnerId,
          }),
        ]
      );
    } catch { /* non-critical */ }

    return {
      game_id: game.id,
      status,
      winner_id: winnerId,
      board: finalBoard,
    };
  }

  private async handleTimeout(game: GameRow): Promise<any> {
    // Player whose turn it was loses (timeout forfeit)
    const timedOutPlayer = game.current_turn;
    const winnerId = timedOutPlayer === game.defender_id
      ? game.challenger_id
      : game.defender_id;

    const board = typeof game.board_state === 'string'
      ? JSON.parse(game.board_state)
      : game.board_state;

    return this.completeGame(game, winnerId, board, 'timeout');
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private formatGameForPlayer(game: any, userId: string): any {
    const board = typeof game.board_state === 'string'
      ? JSON.parse(game.board_state)
      : game.board_state;

    const isDefender = userId === game.defender_id;

    return {
      id: game.id,
      territory_id: game.territory_id,
      game_type: game.game_type,
      board: board,
      your_turn: game.current_turn === userId && game.status === 'active',
      your_role: isDefender ? 'defender' : 'challenger',
      your_symbol: game.game_type === 'tic_tac_toe'
        ? (isDefender ? 'X' : 'O')
        : (isDefender ? 'w' : 'b'),
      turn_number: game.turn_number,
      turn_deadline: game.turn_deadline,
      status: game.status,
      winner_id: game.winner_id,
      defender_id: game.defender_id,
      challenger_id: game.challenger_id,
      defender_username: game.defender_username,
      challenger_username: game.challenger_username,
      config: typeof game.config === 'string' ? JSON.parse(game.config) : game.config,
      created_at: game.created_at,
      completed_at: game.completed_at,
    };
  }
}

export const turnGameEngine = new TurnGameEngine();
