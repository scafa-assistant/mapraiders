// ============================================================
// "Walk to claim" — live GPS route recording on the WEB client.
//
// A phone browser HAS navigator.geolocation, so a player can record a real
// walk/run/cycle and claim territory exactly like the mobile app. Desktop
// browsers without GPS simply can't record (friendly hint shown).
//
// This component owns the geolocation watch, throttles fixes (>= ~2.5s OR
// >~5m movement) to avoid jitter spam, draws a live blue polyline + current
// position marker on the shared Leaflet map (via getMapInstance), and submits
// the track to POST /routes. Result card surfaces the server's success data or
// its `error` rejection text. All Leaflet layers are torn down on stop/unmount.
//
// Theme: white/blue light theme (accent #1558F0). No purple.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RouteClaimRejected, routeApi } from '../api/client';
import { getMapInstance, useMapStore } from '../store/mapStore';
import { theme } from '../theme';
import type { MovementClass, RouteClaimResult, RoutePoint } from '../api/types';

const MIN_POINTS = 10; // server requires >= 10 GPS points
const THROTTLE_MS = 2500; // accept at most ~1 fix / 2.5s …
const MIN_MOVE_M = 5; // … unless the player moved > ~5m since the last kept fix
const FOLLOW_ZOOM = 17;

/** Movement classes offered in the web picker (subset of the server enum). */
const CLASS_OPTIONS: { value: MovementClass; label: string }[] = [
  { value: 'walker', label: 'Walk' },
  { value: 'runner', label: 'Run' },
  { value: 'cyclist', label: 'Cycle' },
];

type Phase = 'idle' | 'recording' | 'submitting' | 'success' | 'error';

/** Haversine distance in metres between two lat/lng points. */
function haversineM(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

export default function WalkToClaim() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [movementClass, setMovementClass] = useState<MovementClass>('walker');

  // Live HUD state (driven by the watch callback + a 1s tick).
  const [pointCount, setPointCount] = useState(0);
  const [distanceM, setDistanceM] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Result / error state.
  const [result, setResult] = useState<RouteClaimResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [consolationXp, setConsolationXp] = useState(0);
  const [geoError, setGeoError] = useState<string | null>(null);

  const loadMine = useMapStore((s) => s.loadMine);

  // ---- Refs that live outside React state (no re-render on every fix) ----
  const pointsRef = useRef<RoutePoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastKeptRef = useRef<RoutePoint | null>(null);
  const tickRef = useRef<number | null>(null);

  // Leaflet layers we own (always cleaned up).
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  // ---- Teardown helper: stop the watch + remove our map layers ----
  function teardown() {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const map = getMapInstance();
    if (polylineRef.current) {
      if (map) map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (markerRef.current) {
      if (map) map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }

  // Always tear down on unmount.
  useEffect(() => () => teardown(), []);

  function resetTrack() {
    pointsRef.current = [];
    lastKeptRef.current = null;
    setPointCount(0);
    setDistanceM(0);
    setElapsedMs(0);
  }

  // ---- A new GPS fix arrived ----
  function onFix(pos: GeolocationPosition) {
    const c = pos.coords;
    const candidate: RoutePoint = {
      lat: c.latitude,
      lng: c.longitude,
      timestamp: Date.now(),
      accuracy: c.accuracy ?? undefined,
      speed: c.speed != null ? c.speed : undefined,
      altitude: c.altitude != null ? c.altitude : undefined,
      bearing: c.heading != null ? c.heading : undefined,
    };

    const last = lastKeptRef.current;
    if (last) {
      const dt = candidate.timestamp - last.timestamp;
      const moved = haversineM(last, candidate);
      // Throttle: keep only if enough time passed OR meaningful movement.
      if (dt < THROTTLE_MS && moved < MIN_MOVE_M) {
        // Still follow the camera so the user sees they're tracked.
        updateMarker(candidate);
        return;
      }
      setDistanceM((d) => d + moved);
    }

    pointsRef.current.push(candidate);
    lastKeptRef.current = candidate;
    setPointCount(pointsRef.current.length);

    drawTrack();
    updateMarker(candidate, true);
  }

  function onGeoError(err: GeolocationPositionError) {
    // PERMISSION_DENIED = 1. Recording continues for transient errors.
    if (err.code === err.PERMISSION_DENIED) {
      stopRecording();
      setGeoError(
        'GPS permission denied. To claim territory you must allow location — ' +
          'open mapraiders.com/play on your phone and allow location access.',
      );
      setPhase('idle');
    }
  }

  function drawTrack() {
    const map = getMapInstance();
    if (!map) return;
    const latlngs = pointsRef.current.map(
      (p) => [p.lat, p.lng] as L.LatLngTuple,
    );
    if (!polylineRef.current) {
      polylineRef.current = L.polyline(latlngs, {
        color: theme.color.accent,
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);
    } else {
      polylineRef.current.setLatLngs(latlngs);
    }
  }

  function updateMarker(p: RoutePoint, recenter = false) {
    const map = getMapInstance();
    if (!map) return;
    const ll: L.LatLngTuple = [p.lat, p.lng];
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(ll, {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        fillColor: theme.color.accent,
        fillOpacity: 1,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(ll);
    }
    if (recenter) {
      // Follow the player; keep their zoom if already close in.
      const z = Math.max(map.getZoom(), FOLLOW_ZOOM);
      map.setView(ll, z, { animate: true });
    }
  }

  // ---- Start / stop / submit ----
  function startRecording() {
    setGeoError(null);
    setResult(null);
    setErrorText(null);
    setConsolationXp(0);

    if (!('geolocation' in navigator)) {
      setGeoError(
        'GPS is not available in this browser. Open mapraiders.com/play on ' +
          'your phone and allow location access.',
      );
      return;
    }

    resetTrack();
    startTimeRef.current = Date.now();
    setPhase('recording');

    // Tick the elapsed clock once per second.
    tickRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(onFix, onGeoError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000,
    });
  }

  /** Stop the watch + the clock but KEEP the recorded points (for submit). */
  function stopRecording() {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function cancel() {
    teardown();
    resetTrack();
    setPhase('idle');
  }

  async function finishAndClaim() {
    stopRecording();
    const points = pointsRef.current.slice();
    if (points.length < MIN_POINTS) {
      setErrorText(
        `Need at least ${MIN_POINTS} GPS points — keep walking a bit longer.`,
      );
      setConsolationXp(0);
      setPhase('error');
      return;
    }

    setPhase('submitting');
    try {
      const res = await routeApi.claim(points, movementClass);
      setResult(res);
      setPhase('success');
      // Refresh My Territories + recenter on the freshly claimed territory.
      void loadMine();
      const last = points[points.length - 1];
      const map = getMapInstance();
      if (map && last) map.setView([last.lat, last.lng], FOLLOW_ZOOM, { animate: true });
    } catch (err) {
      const rejected = err instanceof RouteClaimRejected;
      setErrorText(rejected ? err.message : 'Something went wrong claiming this route.');
      setConsolationXp(rejected ? err.consolationXp : 0);
      setPhase('error');
    }
  }

  /** Dismiss the result/error card; clear the drawn track. */
  function done() {
    teardown();
    resetTrack();
    setPhase('idle');
  }

  // ---- Render ----
  const canFinish = pointCount >= MIN_POINTS;

  return (
    <div className="walk-claim">
      {phase === 'idle' && (
        <>
          <button className="walk-start-btn" onClick={startRecording}>
            ▶ Walk to claim
          </button>
          {geoError && <div className="walk-geo-error">{geoError}</div>}
        </>
      )}

      {phase === 'recording' && (
        <div className="walk-hud">
          <div className="walk-hud-stats">
            <div className="walk-stat">
              <span className="walk-stat-val">{pointCount}</span>
              <span className="walk-stat-label">points</span>
            </div>
            <div className="walk-stat">
              <span className="walk-stat-val">{formatDistance(distanceM)}</span>
              <span className="walk-stat-label">distance</span>
            </div>
            <div className="walk-stat">
              <span className="walk-stat-val">{formatElapsed(elapsedMs)}</span>
              <span className="walk-stat-label">time</span>
            </div>
          </div>

          <div className="walk-classes" role="group" aria-label="Movement type">
            {CLASS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`walk-class${movementClass === opt.value ? ' active' : ''}`}
                onClick={() => setMovementClass(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="walk-hint">
            Walk a loop and return near your start to enclose an area.
          </p>

          <div className="walk-actions">
            <button className="walk-cancel-btn" onClick={cancel}>
              Cancel
            </button>
            <button
              className="walk-finish-btn"
              onClick={() => void finishAndClaim()}
              disabled={!canFinish}
            >
              {canFinish
                ? 'Finish & claim'
                : `Finish (${pointCount}/${MIN_POINTS})`}
            </button>
          </div>
        </div>
      )}

      {phase === 'submitting' && (
        <div className="walk-hud">
          <div className="walk-submitting">Claiming territory…</div>
        </div>
      )}

      {phase === 'success' && result && (
        <div className="walk-result success">
          <div className="walk-result-title">Territory claimed!</div>
          <div className="walk-result-body">
            +{result.claim_value} · +{result.xp_earned} XP
            {result.is_takeover && (
              <div className="walk-result-note">
                Takeover
                {result.previous_owner ? ` from ${result.previous_owner}` : ''}!
              </div>
            )}
            {result.blocked_by_defenses && (
              <div className="walk-result-note warn">
                Some defenses blocked part of the claim.
              </div>
            )}
          </div>
          <button className="walk-done-btn" onClick={done}>
            Done
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="walk-result error">
          <div className="walk-result-title">Route rejected</div>
          <div className="walk-result-body">
            {errorText}
            {consolationXp > 0 && (
              <div className="walk-result-note">+{consolationXp} XP for the effort.</div>
            )}
          </div>
          <button className="walk-done-btn" onClick={done}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
