// ============================================================
// BattleReplayModal — Full-screen replay of a battle log.
//
// Fetches battle detail on mount, then animates rounds one by
// one (800 ms per round). Each round shows:
//   - Attacker vs Defender dice values (pop-in keyframe)
//   - Modifier chips
//   - Effect callouts (shield cancels, etc.)
//   - Casualty strike-through
//   - Final VICTORY / DEFEAT banner + optional loot
//
// "Skip" button jumps straight to the final state.
// Walkover: shows a single 'Undefended — walkover.' frame.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useCommanderStore } from '../store/commanderStore';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';
import type { AirstrikeResultPayload, BattleDetail, BattleRound } from '../api/types';

interface Props {
  battleId: string;
  onClose: () => void;
}

// ---- Keyframe injection (done once) ------------------------------------------

const KEYFRAME_ID = 'battle-dice-pop';

function ensureKeyframes(): void {
  if (document.getElementById(KEYFRAME_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAME_ID;
  style.textContent = `
    @keyframes dicePop {
      0%   { transform: scale(0.3) rotate(-20deg); opacity: 0; }
      60%  { transform: scale(1.2) rotate(4deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes enemyPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,84,112,0.4); }
      50%     { box-shadow: 0 0 0 6px rgba(255,84,112,0); }
    }
  `;
  document.head.appendChild(style);
}

// ---- Helpers -----------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function prettifyDef(defId: string): string {
  return defId.replace(/^unit_/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- Die face component ------------------------------------------------------

function DieFace({ value, animated, color }: { value: number; animated: boolean; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 6,
        background: `${color}22`,
        border: `2px solid ${color}`,
        fontWeight: 800,
        fontSize: 15,
        color,
        margin: '0 2px',
        animation: animated ? 'dicePop 0.35s ease-out forwards' : 'none',
      }}
    >
      {value}
    </span>
  );
}

// ---- Single round display ----------------------------------------------------

interface RoundFrameProps {
  round: BattleRound;
  animated: boolean;
  isAttacker: boolean;
}

function RoundFrame({ round, animated, isAttacker }: RoundFrameProps) {
  const atkWon = round.casualty?.side === 'def';
  const atkColor = atkWon ? theme.color.success : theme.color.danger;
  const defColor = !atkWon ? theme.color.success : theme.color.danger;

  return (
    <div style={{
      background: theme.color.panelAlt,
      border: `1px solid ${theme.color.border}`,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Round header */}
      <div style={{ fontWeight: 700, fontSize: 12, color: theme.color.textDim, letterSpacing: '0.08em' }}>
        ROUND {round.round}
      </div>

      {/* Sides */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Attacker */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.accent, marginBottom: 6 }}>
            {isAttacker ? '▶ YOU (Attacker)' : 'Attacker'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
            {round.atk.rolls.map((r, i) => (
              <DieFace key={i} value={r} animated={animated} color={theme.color.accent} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: theme.color.textDim }}>
            {round.atk.bonus > 0 && <span style={{ marginRight: 6 }}>+{round.atk.bonus} bonus</span>}
            {round.atk.modifier !== 0 && (
              <span style={{ marginRight: 6, color: round.atk.modifier > 0 ? theme.color.success : theme.color.danger }}>
                {round.atk.modifier > 0 ? '+' : ''}{round.atk.modifier} domain
              </span>
            )}
            <span style={{ fontWeight: 700, fontSize: 14, color: atkColor }}>= {round.atk.total}</span>
          </div>
          {round.atk.unit && (
            <div style={{ fontSize: 10, color: theme.color.textDim, marginTop: 2 }}>{prettifyDef(round.atk.unit)}</div>
          )}
        </div>

        {/* VS */}
        <div style={{ alignSelf: 'center', fontWeight: 900, fontSize: 16, color: theme.color.textDim }}>VS</div>

        {/* Defender */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.foreign, marginBottom: 6 }}>
            {!isAttacker ? '▶ YOU (Defender)' : 'Defender'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
            {round.def.rolls.map((r, i) => (
              <DieFace key={i} value={r} animated={animated} color={theme.color.foreign} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: theme.color.textDim }}>
            {round.def.bonus > 0 && <span style={{ marginRight: 6 }}>+{round.def.bonus} bonus</span>}
            {round.def.modifier !== 0 && (
              <span style={{ marginRight: 6, color: round.def.modifier > 0 ? theme.color.success : theme.color.danger }}>
                {round.def.modifier > 0 ? '+' : ''}{round.def.modifier} domain
              </span>
            )}
            <span style={{ fontWeight: 700, fontSize: 14, color: defColor }}>= {round.def.total}</span>
          </div>
          {round.def.unit && (
            <div style={{ fontSize: 10, color: theme.color.textDim, marginTop: 2 }}>{prettifyDef(round.def.unit)}</div>
          )}
        </div>
      </div>

      {/* Effects */}
      {round.effects.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {round.effects.map((eff, i) => (
            <div key={i} style={{
              background: '#FFB30022',
              border: '1px solid #FFB30055',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              color: theme.color.amber,
            }}>
              {eff.effect === 'shield_cancel' && eff.cancelled != null
                ? `🛡 Shield die cancels a ${eff.cancelled}!`
                : eff.effect}
            </div>
          ))}
        </div>
      )}

      {/* Casualty */}
      {round.casualty && (
        <div style={{
          background: `${theme.color.danger}18`,
          border: `1px solid ${theme.color.danger}55`,
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 11,
          color: theme.color.danger,
        }}>
          💀 {round.casualty.side === 'atk' ? 'Attacker' : 'Defender'} loses{' '}
          <span style={{ textDecoration: 'line-through' }}>{prettifyDef(round.casualty.definition_id)}</span>
        </div>
      )}
    </div>
  );
}

// ---- Airstrike result summary card -------------------------------------------

function airstrikeResultLine(result: AirstrikeResultPayload): string {
  if ('shield_broken' in result && result.shield_broken) return '🛡 Shield destroyed!';
  if ('building_hit' in result) {
    const hit = result.building_hit;
    if (hit.destroyed) return `🏚 ${hit.type.replace(/_/g, ' ')} destroyed!`;
    return `🏚 ${hit.type.replace(/_/g, ' ')} hit — ${hit.hp_after} HP remaining.`;
  }
  return '☁ No targets — strike wasted.';
}

interface AirstrikeCardProps {
  battle: BattleDetail;
  onClose: () => void;
}

function AirstrikeCard({ battle, onClose }: AirstrikeCardProps) {
  const log = battle.log;
  const siloTier = log.silo_tier ?? 1;
  const damage = log.damage ?? 0;
  const result = log.result;

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(12,9,20,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const modal: React.CSSProperties = {
    background: theme.color.panel, border: `1px solid ${theme.color.border}`,
    borderRadius: 14, width: 'min(420px, 95vw)', overflow: 'hidden',
  };
  const header: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderBottom: `1px solid ${theme.color.border}`,
  };
  const body: React.CSSProperties = {
    padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
  };
  const closeBtn: React.CSSProperties = {
    background: 'transparent', border: `1px solid ${theme.color.border}`,
    color: theme.color.textDim, borderRadius: 8, padding: '5px 12px',
    cursor: 'pointer', fontSize: 12,
  };
  const resultLine = result ? airstrikeResultLine(result) : '—';

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={header}>
          <div style={{ fontWeight: 700, fontSize: 15, color: theme.color.accentBright }}>☄ Airstrike</div>
          <button style={closeBtn} onClick={onClose}>✕ Close</button>
        </div>
        <div style={body}>
          <div style={{ fontSize: 11, color: theme.color.textDim }}>
            Territory {battle.territory_id.slice(0, 8)}…
          </div>
          <div style={{
            background: theme.color.panelAlt, border: `1px solid ${theme.color.border}`,
            borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: theme.color.textDim }}>Silo Tier</span>
              <span style={{ fontWeight: 700, color: theme.color.amber }}>{'I'.repeat(siloTier)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: theme.color.textDim }}>Damage</span>
              <span style={{ fontWeight: 700, color: theme.color.danger }}>{damage} HP</span>
            </div>
          </div>
          <div style={{
            background: `${theme.color.accent}18`, border: `1px solid ${theme.color.border}`,
            borderRadius: 10, padding: '14px 16px',
            fontWeight: 700, fontSize: 14, textAlign: 'center', color: theme.color.text,
          }}>
            {resultLine}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main modal --------------------------------------------------------------

export default function BattleReplayModal({ battleId, onClose }: Props) {
  ensureKeyframes();

  const userId = useAuthStore((s) => s.user?.id);
  const fetchBattleDetail = useCommanderStore((s) => s.fetchBattleDetail);

  const [battle, setBattle] = useState<BattleDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visibleRounds, setVisibleRounds] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Load battle detail
  useEffect(() => {
    void (async () => {
      const detail = await fetchBattleDetail(battleId);
      if (!detail) {
        setLoadError('Failed to load battle details.');
      } else {
        setBattle(detail);
        setVisibleRounds(0);
      }
    })();
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId]);

  // Animate round-by-round after battle loaded
  useEffect(() => {
    if (!battle || skipped) return;
    if (battle.log.walkover) return; // walkover: show instantly
    const totalRounds = battle.log.rounds.length;
    if (visibleRounds >= totalRounds) return;

    timerRef.current = window.setTimeout(() => {
      setVisibleRounds((n) => n + 1);
    }, 800);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [battle, visibleRounds, skipped]);

  function handleSkip() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setSkipped(true);
    if (battle) setVisibleRounds(battle.log.rounds.length);
  }

  const isAttacker = battle ? battle.attacker_id === userId : false;
  const isComplete = battle
    ? skipped || battle.log.walkover || visibleRounds >= battle.log.rounds.length
    : false;
  const userWon = battle
    ? (isAttacker && battle.log.winner_side === 'attacker') ||
      (!isAttacker && battle.log.winner_side === 'defender')
    : false;

  // ---- Styles -----------------------------------------------------------------

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(12,9,20,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const modal: React.CSSProperties = {
    background: theme.color.panel,
    border: `1px solid ${theme.color.border}`,
    borderRadius: 14,
    width: 'min(620px, 95vw)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const header: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: `1px solid ${theme.color.border}`,
    flexShrink: 0,
  };

  const body: React.CSSProperties = {
    overflowY: 'auto',
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flex: 1,
  };

  const closeBtn: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${theme.color.border}`,
    color: theme.color.textDim,
    borderRadius: 8,
    padding: '5px 12px',
    cursor: 'pointer',
    fontSize: 12,
  };

  const skipBtn: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${theme.color.border}`,
    color: theme.color.textDim,
    borderRadius: 8,
    padding: '5px 12px',
    cursor: 'pointer',
    fontSize: 12,
  };

  // Guard: airstrike battles use a different summary card
  if (battle && battle.log.type === 'airstrike') {
    return <AirstrikeCard battle={battle} onClose={onClose} />;
  }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <div style={{ fontWeight: 700, fontSize: 15, color: theme.color.accentBright }}>
            ⚔ Battle Replay
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {battle && !isComplete && (
              <button style={skipBtn} onClick={handleSkip}>Skip →</button>
            )}
            <button style={closeBtn} onClick={onClose}>✕ Close</button>
          </div>
        </div>

        {/* Body */}
        <div style={body}>
          {loadError && (
            <div style={{ color: theme.color.danger, textAlign: 'center', padding: 20 }}>{loadError}</div>
          )}

          {!battle && !loadError && (
            <div style={{ color: theme.color.textDim, textAlign: 'center', padding: 20 }}>Loading battle…</div>
          )}

          {battle && (
            <>
              {/* Meta */}
              <div style={{ fontSize: 11, color: theme.color.textDim }}>
                {timeAgo(battle.created_at)} · Territory {battle.territory_id.slice(0, 8)}…
                <span style={{ marginLeft: 8 }}>
                  {battle.log.attacker_units_start}v{battle.log.defender_units_start}
                </span>
              </div>

              {/* Walkover */}
              {battle.log.walkover && (
                <div style={{
                  textAlign: 'center',
                  padding: '28px 16px',
                  background: `${theme.color.success}18`,
                  border: `1px solid ${theme.color.success}55`,
                  borderRadius: 10,
                  color: theme.color.success,
                  fontWeight: 700,
                  fontSize: 16,
                }}>
                  Undefended — walkover.
                </div>
              )}

              {/* Rounds */}
              {!battle.log.walkover && battle.log.rounds.slice(0, visibleRounds).map((r, idx) => (
                <RoundFrame
                  key={r.round}
                  round={r}
                  animated={idx === visibleRounds - 1 && !skipped}
                  isAttacker={isAttacker}
                />
              ))}

              {/* Final banner (shown when animation complete) */}
              {isComplete && !battle.log.walkover && (
                <div style={{
                  textAlign: 'center',
                  padding: '28px 16px',
                  background: userWon ? `${theme.color.success}18` : `${theme.color.danger}18`,
                  border: `1px solid ${(userWon ? theme.color.success : theme.color.danger)}55`,
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{
                    fontWeight: 900,
                    fontSize: 28,
                    color: userWon ? theme.color.success : theme.color.danger,
                    letterSpacing: '0.06em',
                  }}>
                    {userWon ? '🏆 VICTORY' : '💀 DEFEAT'}
                  </div>
                  <div style={{ fontSize: 12, color: theme.color.textDim }}>
                    Survivors — Attacker: {battle.log.survivors.attacker.length} · Defender: {battle.log.survivors.defender.length}
                  </div>
                  {battle.log.loot.dice_drop && (
                    <div style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: theme.color.amber,
                      fontWeight: 700,
                    }}>
                      🎲 Loot: {battle.log.loot.dice_drop.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} die
                    </div>
                  )}
                </div>
              )}

              {/* Walkover final banner */}
              {battle.log.walkover && isAttacker && (
                <div style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: theme.color.textDim,
                }}>
                  No defenders — territory was unguarded.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
