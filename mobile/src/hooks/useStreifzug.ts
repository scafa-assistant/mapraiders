import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { streifzugApi, StreifzugEncounter } from '../services/api';

// ─── Streifzug (Patrol Mode) hook — Stage 1, foreground only ─────────────────
//
// Owns its own foreground location subscription while a session is active and
// pings the server on movement. The server paces encounters (90s cooldown),
// so the client only throttles lightly to avoid hammering. When an encounter
// is surfaced it is exposed via `encounter`; the screen routes it into the
// existing HackingScreen flow. NO background permission is requested — this is
// a deliberately-started, app-foreground session.

const PING_THROTTLE_MS = 12000;

export interface UseStreifzug {
  active: boolean;
  starting: boolean;
  encounter: StreifzugEncounter | null;
  start: () => Promise<boolean>;
  stop: () => Promise<void>;
  dismissEncounter: () => void;
}

export function useStreifzug(): UseStreifzug {
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [encounter, setEncounter] = useState<StreifzugEncounter | null>(null);

  const subRef = useRef<Location.LocationSubscription | null>(null);
  const lastPingRef = useRef(0);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);

  const ping = useCallback(async (lat: number, lng: number) => {
    if (busyRef.current) return;
    const now = Date.now();
    if (now - lastPingRef.current < PING_THROTTLE_MS) return;
    lastPingRef.current = now;
    busyRef.current = true;
    try {
      const res = await streifzugApi.ping(lat, lng);
      const data = res.data?.data;
      if (mountedRef.current && data?.encounter) {
        setEncounter(data.encounter);
      }
    } catch {
      // transient ping error — ignore, next movement retries
    } finally {
      busyRef.current = false;
    }
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (active || starting) return active;
    setStarting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return false;

      try {
        await streifzugApi.start();
      } catch {
        return false;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (loc) => {
          ping(loc.coords.latitude, loc.coords.longitude);
        },
      );
      subRef.current = sub;
      if (mountedRef.current) setActive(true);

      // Fire one immediate ping so a nearby encounter can surface at once.
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        ping(loc.coords.latitude, loc.coords.longitude);
      } catch {
        // no immediate fix — the watch will catch up
      }
      return true;
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }, [active, starting, ping]);

  const stop = useCallback(async () => {
    subRef.current?.remove();
    subRef.current = null;
    if (mountedRef.current) {
      setActive(false);
      setEncounter(null);
    }
    try {
      await streifzugApi.stop();
    } catch {
      // best-effort; session auto-expires server-side via TTL anyway
    }
  }, []);

  const dismissEncounter = useCallback(() => setEncounter(null), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, []);

  return { active, starting, encounter, start, stop, dismissEncounter };
}

export default useStreifzug;
