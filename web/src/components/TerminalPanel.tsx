// ============================================================
// TerminalPanel — side panel for a selected Terminal spawn.
//
// Shows: title, level badge (with par maxScore if available),
// leaderboard (top 10 + own row when outside top 10),
// and a "▶ Play Grid Runner" button that calls POST /terminals/:id/start
// and opens RunnerModal on success.
//
// Consistent with TerritoryPanel: same <aside className="side-panel"> root,
// inline style objects using theme constants, no CSS framework.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { errorMessage, terminalApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useTerminalStore } from '../store/terminalStore';
import { theme } from '../theme';
import type { PveSpawn, RunnerLevel } from '../api/types';
import RunnerModal from './RunnerModal';

interface Props {
  spawn: PveSpawn;
  onClose: () => void;
}

// Friendly labels for POST /terminals/:id/start error codes.
function startErrorLabel(message: string): string {
  switch (message) {
    case 'FEATURE_DISABLED':
      return 'Terminals are not unlocked for your account yet.';
    case 'DAILY_CAP':
      return 'Daily run limit reached — come back tomorrow.';
    case 'TOO_FAR':
      return 'You must be at the terminal to play — allow location access and stand within 75 m.';
    case 'TERMINAL_NOT_FOUND':
      return 'This terminal no longer exists.';
    case 'NOT_A_TERMINAL':
      return 'This spawn is not a terminal.';
    case 'TERMINAL_EXPIRED':
      return 'This terminal has expired and is no longer active.';
    default:
      return message;
  }
}

interface RunState {
  runToken: string;
  level: RunnerLevel;
}

/**
 * Best-effort browser geolocation. The server's proximity check (unless
 * disabled via flag config) needs coordinates — without them every start
 * is rejected with TOO_FAR. Resolves undefined when unavailable/denied so
 * the server error message stays the single source of truth.
 */
function getBrowserPosition(): Promise<{ latitude: number; longitude: number } | undefined> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60_000 },
    );
  });
}

export default function TerminalPanel({ spawn, onClose }: Props) {
  const userId = useAuthStore((s) => s.user?.id);
  const leaderboard = useTerminalStore((s) => s.leaderboard);
  const leaderboardLoading = useTerminalStore((s) => s.leaderboardLoading);
  const leaderboardError = useTerminalStore((s) => s.leaderboardError);
  const loadLeaderboard = useTerminalStore((s) => s.loadLeaderboard);

  const [startBusy, setStartBusy] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);

  const refreshLeaderboard = useCallback(() => {
    void loadLeaderboard(spawn.id);
  }, [spawn.id, loadLeaderboard]);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  async function handlePlay() {
    setStartBusy(true);
    setStartError(null);
    try {
      const coords = await getBrowserPosition();
      const data = await terminalApi.start(spawn.id, coords);
      setRunState({ runToken: data.run_token, level: data.level });
    } catch (err) {
      // Surface the server error code or fall back to a generic message.
      const raw = (() => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axErr = err as { response?: { data?: { message?: string } } };
          return axErr.response?.data?.message ?? '';
        }
        return '';
      })();
      const label = raw ? startErrorLabel(raw) : errorMessage(err, 'Could not start run');
      setStartError(label);
    } finally {
      setStartBusy(false);
    }
  }

  function handleModalClose() {
    setRunState(null);
    refreshLeaderboard();
  }

  // The level badge shows the numeric spawn level.  If the server-returned
  // RunnerLevel carries par.maxScore we display it as context.
  const levelLabel = `Level ${spawn.level}`;

  // ------ Styles ---------------------------------------------------------------

  const titleRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  };

  const levelBadge: React.CSSProperties = {
    background: theme.color.amber,
    color: theme.color.bg,
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 20,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  };

  const sectionTitle: React.CSSProperties = {
    color: theme.color.textDim,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  };

  const thStyle: React.CSSProperties = {
    color: theme.color.textDim,
    fontWeight: 600,
    textAlign: 'left',
    paddingBottom: 6,
    borderBottom: `1px solid ${theme.color.border}`,
  };

  const thRight: React.CSSProperties = { ...thStyle, textAlign: 'right' };

  function rowStyle(isMe: boolean): React.CSSProperties {
    return {
      background: isMe ? `${theme.color.accent}22` : 'transparent',
      borderBottom: `1px solid ${theme.color.border}`,
    };
  }

  const tdStyle: React.CSSProperties = { padding: '5px 0', color: theme.color.text };
  const tdRight: React.CSSProperties = { ...tdStyle, textAlign: 'right' };
  const tdDim: React.CSSProperties = { ...tdStyle, color: theme.color.textDim };

  const playBtn: React.CSSProperties = {
    marginTop: 20,
    width: '100%',
    padding: '10px 0',
    background: theme.color.accent,
    color: '#fff',
    border: 'none',
    borderRadius: theme.radius,
    fontSize: 14,
    fontWeight: 700,
    cursor: startBusy ? 'not-allowed' : 'pointer',
    opacity: startBusy ? 0.6 : 1,
    letterSpacing: '0.03em',
  };

  const separatorRow: React.CSSProperties = {
    color: theme.color.textDim,
    fontSize: 12,
    textAlign: 'center',
    padding: '4px 0',
  };

  const meOutsideRow: React.CSSProperties = {
    background: `${theme.color.accent}22`,
    borderTop: `1px solid ${theme.color.border}`,
    borderBottom: `1px solid ${theme.color.border}`,
  };

  // ------ Render ---------------------------------------------------------------

  return (
    <>
      <aside className="side-panel">
        <button className="panel-close" onClick={onClose} aria-label="Close">×</button>

        <div style={titleRow}>
          <h2 style={{ margin: 0 }}>Terminal</h2>
          <span style={levelBadge}>{levelLabel}</span>
        </div>

        <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
          Hyperborean Terminal — access the Grid Runner
        </div>

        {/* Leaderboard */}
        <div style={sectionTitle}>Leaderboard</div>

        {leaderboardLoading && (
          <div className="muted" style={{ fontSize: 13 }}>Loading…</div>
        )}

        {leaderboardError && (
          <div className="panel-error">{leaderboardError}</div>
        )}

        {!leaderboardLoading && !leaderboardError && leaderboard && (
          <>
            {leaderboard.entries.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>
                No runs yet — be the first raider.
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 32 }}>#</th>
                    <th style={thStyle}>Player</th>
                    <th style={thRight}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.slice(0, 10).map((entry) => {
                    const isMe = Boolean(userId && entry.user_id === userId);
                    return (
                      <tr key={entry.user_id} style={rowStyle(isMe)}>
                        <td style={tdDim}>{entry.rank}</td>
                        <td style={tdStyle}>
                          {isMe ? <strong>{entry.username}</strong> : entry.username}
                        </td>
                        <td style={tdRight}>{entry.score.toLocaleString()}</td>
                      </tr>
                    );
                  })}

                  {/* Show own row separately when outside top 10 */}
                  {leaderboard.me &&
                    !leaderboard.entries
                      .slice(0, 10)
                      .some((e) => userId && e.user_id === userId) && (
                      <>
                        <tr>
                          <td colSpan={3} style={separatorRow}>· · ·</td>
                        </tr>
                        <tr style={meOutsideRow}>
                          <td style={tdDim}>{leaderboard.me.rank}</td>
                          <td style={tdStyle}><strong>You</strong></td>
                          <td style={tdRight}>{leaderboard.me.score.toLocaleString()}</td>
                        </tr>
                      </>
                    )}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Start error */}
        {startError && (
          <div className="panel-error" style={{ marginTop: 12 }}>{startError}</div>
        )}

        {/* Play button */}
        <button
          style={playBtn}
          disabled={startBusy}
          onClick={() => void handlePlay()}
        >
          {startBusy ? 'Starting…' : '▶ Play Grid Runner'}
        </button>
      </aside>

      {/* Runner modal — rendered outside the panel so it covers the full viewport */}
      {runState && (
        <RunnerModal
          spawnId={spawn.id}
          runToken={runState.runToken}
          level={runState.level}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
