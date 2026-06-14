// ============================================================
// RunnerModal — full-screen overlay embedding the Grid Runner iframe.
//
// Lifecycle:
//   1. Mount iframe (sandbox="allow-scripts allow-same-origin")
//   2. Wait for runner:ready postMessage from game
//   3. Post runner:init with the level descriptor
//   4. On runner:complete: call /terminals/:id/submit, show result strip
//   5. On runner:quit or × button: close without submitting
//
// gameOrigin validation: we only trust messages from the same origin as the
// game iframe to prevent message-injection attacks.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, gameOrigin, terminalApi } from '../api/client';
import { theme } from '../theme';
import type { RunnerLevel, TerminalSubmitResponse } from '../api/types';

interface Props {
  spawnId: string;
  runToken: string;
  level: RunnerLevel;
  onClose: () => void;
}

type Phase =
  | 'loading'   // iframe loading, waiting for runner:ready
  | 'playing'   // runner:init sent, game is running
  | 'submitting'// runner:complete received, calling server
  | 'result'    // server responded, showing result strip
  | 'error';    // submit call failed

interface ResultState {
  score: number;
  best_score: number;
  rank: number;
  reward: { intel: number } | null;
}

// Friendly readable labels for error codes the submit endpoint can return.
function submitErrorLabel(message: string): string {
  if (message === 'IMPLAUSIBLE_RUN') return 'Run rejected by anti-cheat.';
  if (message === 'INVALID_TOKEN') return 'Run token was invalid. Please restart.';
  if (message === 'TOKEN_USED') return 'This run token has already been submitted.';
  return message;
}

const GAME_URL = `${gameOrigin}/games/runner/index.html`;

export default function RunnerModal({ spawnId, runToken, level, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [result, setResult] = useState<ResultState | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prevent submitting twice (runner:complete could theoretically fire twice).
  const submittedRef = useRef(false);

  const handleSubmit = useCallback(
    async (
      score: number,
      durationMs: number,
      orbsCollected: number,
      finished: boolean,
      trace: unknown,
    ) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setPhase('submitting');
      try {
        const resp: TerminalSubmitResponse = await terminalApi.submit(spawnId, {
          run_token: runToken,
          score,
          duration_ms: durationMs,
          orbs_collected: orbsCollected,
          finished,
          trace,
        });
        setResult({
          score: resp.score,
          best_score: resp.best_score,
          rank: resp.rank,
          reward: resp.reward,
        });
        setPhase('result');
      } catch (err) {
        // Surface server error codes (IMPLAUSIBLE_RUN etc.) or network error.
        const raw = (() => {
          if (
            typeof err === 'object' &&
            err !== null &&
            'response' in err
          ) {
            const axErr = err as { response?: { data?: { message?: string } } };
            return axErr.response?.data?.message ?? '';
          }
          return '';
        })();
        const label = raw ? submitErrorLabel(raw) : errorMessage(err, 'Submit failed');
        setSubmitError(label);
        setPhase('error');
      }
    },
    [spawnId, runToken],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Only trust messages from the game origin.
      if (event.origin !== gameOrigin) return;

      let data: { type?: string; score?: number; durationMs?: number; orbsCollected?: number; finished?: boolean; trace?: unknown };
      try {
        data = typeof event.data === 'string'
          ? (JSON.parse(event.data) as typeof data)
          : (event.data as typeof data);
      } catch {
        return;
      }

      if (!data || typeof data.type !== 'string') return;

      if (data.type === 'runner:ready') {
        // Game is ready — send the level.
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ type: 'runner:init', level }),
          gameOrigin,
        );
        setPhase('playing');
        return;
      }

      if (data.type === 'runner:complete') {
        void handleSubmit(
          data.score ?? 0,
          data.durationMs ?? 0,
          data.orbsCollected ?? 0,
          data.finished ?? false,
          data.trace ?? null,
        );
        return;
      }

      if (data.type === 'runner:quit') {
        onClose();
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [level, handleSubmit, onClose]);

  // ------ Styles ---------------------------------------------------------------

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(20, 18, 16, 0.55)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  };

  const closeBtn: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    right: 16,
    background: 'none',
    border: 'none',
    color: theme.color.textDim,
    fontSize: 28,
    lineHeight: 1,
    cursor: 'pointer',
    zIndex: 10000,
    padding: '4px 8px',
  };

  const iframeWrapper: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: 960,
    // 16:10 aspect ratio
    aspectRatio: '16 / 10',
    border: `1px solid ${theme.color.accent}`,
    borderRadius: theme.radius,
    overflow: 'hidden',
    background: theme.color.bg,
  };

  const iframeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  };

  const resultStrip: React.CSSProperties = {
    marginTop: 12,
    width: '100%',
    maxWidth: 960,
    background: theme.color.panel,
    border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius,
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  };

  const statStyle: React.CSSProperties = {
    color: theme.color.text,
    fontSize: 14,
  };

  const rewardStyle: React.CSSProperties = {
    color: theme.color.success,
    fontWeight: 600,
    fontSize: 14,
  };

  const errorStyle: React.CSSProperties = {
    color: theme.color.danger,
    fontSize: 14,
  };

  const dimStyle: React.CSSProperties = {
    color: theme.color.textDim,
    fontSize: 13,
  };

  // ------ Render ---------------------------------------------------------------

  return (
    <div style={overlay}>
      <button style={closeBtn} onClick={onClose} aria-label="Close">×</button>

      <div style={iframeWrapper}>
        {phase === 'loading' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.color.textDim,
              fontSize: 14,
            }}
          >
            Loading Grid Runner…
          </div>
        )}
        {phase === 'submitting' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.color.textDim,
              fontSize: 14,
              background: 'rgba(246,244,241,0.82)',
              zIndex: 1,
            }}
          >
            Submitting score…
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={GAME_URL}
          style={iframeStyle}
          sandbox="allow-scripts allow-same-origin"
          title="Grid Runner"
          allow="autoplay"
        />
      </div>

      {phase === 'result' && result && (
        <div style={resultStrip}>
          <span style={statStyle}>Score <strong>{result.score.toLocaleString()}</strong></span>
          <span style={dimStyle}>·</span>
          <span style={statStyle}>Best <strong>{result.best_score.toLocaleString()}</strong></span>
          <span style={dimStyle}>·</span>
          <span style={statStyle}>Rank <strong>#{result.rank}</strong></span>
          {result.reward && (
            <>
              <span style={dimStyle}>·</span>
              <span style={rewardStyle}>+{result.reward.intel} Intel</span>
            </>
          )}
        </div>
      )}

      {phase === 'error' && submitError && (
        <div style={resultStrip}>
          <span style={errorStyle}>{submitError}</span>
        </div>
      )}
    </div>
  );
}
