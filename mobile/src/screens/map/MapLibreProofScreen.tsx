// ============================================================
// MapLibre , "Echte Gebäude werden Spielgebäude" Proof v2
// (2026-07-06, one-layer 3D milestone, Renés Reskin- + Einnahme-Modell)
//
// Beweist Renés verfeinerte Idee, so wie es später auf der EINEN Home-Map läuft:
//   - Echte EINZEL-Gebäude aus OSM (Overpass), jedes ein eigenes Objekt
//     (löst den Amber-Spill der zusammengeklebten Gratis-Kacheln).
//   - Häuser sind NEUTRAL (Welt-Textur), NICHT vorgefärbt.
//   - Antippen = "einnehmen": genau EIN Haus färbt sich in der Besitzerfarbe
//     (Profilfarbe; hier Demo = Marken-Blau).
//   - Eingenommene Funktionsgebäude tragen ein TYP-ABZEICHEN (Werkstatt,
//     Raffinerie, …), damit man sie erkennt statt tausend gleiche Blobs.
//   - Echte Straßen nach Ausbaustufe eingefärbt (aus dem Style).
//
// Berührt KEINEN produktiven Karten-Code. Siehe
// _docs/gdd/VISION_OneLayer_3D_Weltkarte.md.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Map, Camera, GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import type { MapRef } from '@maplibre/maplibre-react-native';
import type { MapLibreProofScreenProps } from '../../navigation/types';
import radarStyle from '../../../assets/map/radar-style.json';

// Brand palette (white/blue, no purple).
const ACCENT = '#1558F0';
const TEXT = '#141210';
const SURFACE = '#FFFFFF';
const BORDER = '#C0BAB4';

// Owner color = later the player's profile color; demo uses brand blue.
const OWNER_COLOR = '#1558F0';
// Neutral world building (unclaimed): warm off-grey, reads as "just there".
const NEUTRAL = '#D8D2CA';

// Sundern-Hachen village center + a bbox tight enough for a fast Overpass query.
const CENTER: [number, number] = [7.9895, 51.3577];
const BBOX = { s: 51.3547, w: 7.9835, n: 51.3607, e: 7.9955 }; // south,west,north,east

// Demo function types cycled on each claim so the badges read differently.
const CLAIM_TYPES = [
  { key: 'workshop', icon: 'construct' as const, label: 'Werkstatt' },
  { key: 'refinery', icon: 'flame' as const, label: 'Raffinerie' },
  { key: 'garrison', icon: 'shield' as const, label: 'Garnison' },
  { key: 'storage', icon: 'cube' as const, label: 'Lager' },
  { key: 'radar', icon: 'radio' as const, label: 'Radar' },
];

interface Building {
  id: string;
  ring: [number, number][]; // [lng,lat] closed ring
  centroid: [number, number];
  height: number;
}

/** Parse a height from OSM tags ("8", "8 m", building:levels). */
function heightFromTags(tags: Record<string, string> | undefined): number {
  if (!tags) return 7;
  if (tags.height) {
    const h = parseFloat(tags.height);
    if (!isNaN(h)) return h;
  }
  if (tags['building:levels']) {
    const l = parseFloat(tags['building:levels']);
    if (!isNaN(l)) return Math.max(3, l * 3);
  }
  return 7;
}

/** Average of ring vertices → good-enough label anchor. */
function centroidOf(ring: [number, number][]): [number, number] {
  let x = 0, y = 0;
  const n = ring.length - 1; // last repeats first
  for (let i = 0; i < n; i++) { x += ring[i][0]; y += ring[i][1]; }
  return [x / n, y / n];
}

/** Fetch individual building footprints for the bbox from Overpass. */
async function fetchBuildings(): Promise<Building[]> {
  const q = `[out:json][timeout:25];way["building"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});out geom;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    // overpass-api.de's WAF returns 406 without a real User-Agent (okhttp default is blocked).
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MapRaiders/1.0 (contact info@scafa-investments.com)',
      'Accept': 'application/json',
    },
    body: 'data=' + encodeURIComponent(q),
  });
  const json = await res.json();
  const out: Building[] = [];
  for (const el of json.elements || []) {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 4) continue;
    const ring: [number, number][] = el.geometry.map((p: any) => [p.lon, p.lat]);
    // Ensure the ring is closed.
    const first = ring[0], last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
    out.push({ id: String(el.id), ring, centroid: centroidOf(ring), height: heightFromTags(el.tags) });
  }
  return out;
}

export default function MapLibreProofScreen({ navigation }: MapLibreProofScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapRef>(null);
  const [pitched, setPitched] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // claimed: building id → assigned function type index
  const [claimed, setClaimed] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    fetchBuildings()
      .then((b) => { if (alive) { setBuildings(b); setStatus('ready'); } })
      .catch(() => { if (alive) setStatus('error'); });
    return () => { alive = false; };
  }, []);

  // Rendered FeatureCollection: every real building, tagged owned/neutral.
  const buildingsFC = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: buildings.map((b) => ({
      type: 'Feature' as const,
      id: b.id,
      properties: { id: b.id, height: b.height, owned: claimed[b.id] !== undefined },
      geometry: { type: 'Polygon' as const, coordinates: [b.ring] },
    })),
  }), [buildings, claimed]);

  const claimedList = useMemo(
    () => buildings.filter((b) => claimed[b.id] !== undefined),
    [buildings, claimed],
  );

  // Tap → take/release the single real building under the finger.
  const onMapPress = async (e: NativeSyntheticEvent<any>) => {
    const point = e?.nativeEvent?.point;
    if (!point || !mapRef.current) return;
    try {
      const feats = await mapRef.current.queryRenderedFeatures(point, { layers: ['bld'] });
      const id = feats?.[0]?.properties?.id;
      if (id == null) return;
      setClaimed((prev) => {
        const next = { ...prev };
        if (next[id] !== undefined) { delete next[id]; }
        else { next[id] = Object.keys(prev).length % CLAIM_TYPES.length; }
        return next;
      });
    } catch { /* query can fail mid-gesture, ignore */ }
  };

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapStyle={radarStyle as any}
        touchPitch
        compass={false}
        logo={false}
        onPress={onMapPress}
      >
        <Camera center={CENTER} zoom={16.5} pitch={pitched ? 55 : 0} bearing={20} duration={600} />

        {/* Real individual buildings: neutral until owned, then owner color. */}
        <GeoJSONSource id="blds" data={buildingsFC as any}>
          <Layer
            id="bld"
            type="fill-extrusion"
            source="blds"
            paint={{
              'fill-extrusion-color': ['case', ['get', 'owned'], OWNER_COLOR, NEUTRAL],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': ['case', ['get', 'owned'], 0.95, 0.7],
            }}
          />
        </GeoJSONSource>

        {/* Type badges on owned buildings so you can tell workshop from refinery. */}
        {claimedList.map((b) => {
          const t = CLAIM_TYPES[claimed[b.id]];
          return (
            <Marker key={b.id} lngLat={b.centroid}>
              <View style={styles.badge}>
                <Ionicons name={t.icon} size={14} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}
      </Map>

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerWrap} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Echte Gebäude einnehmen</Text>
          <View style={styles.headerBtn} />
        </View>
      </SafeAreaView>

      {/* Status / instructions */}
      <View style={[styles.hint, { top: insets.top + 60 }]} pointerEvents="none">
        {status === 'loading' && (
          <View style={styles.hintRow}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.hintText}>Lade echte Gebäude-Grundrisse aus OSM…</Text>
          </View>
        )}
        {status === 'error' && (
          <Text style={styles.hintText}>OSM-Abruf fehlgeschlagen (Overpass). Kurz später nochmal.</Text>
        )}
        {status === 'ready' && (
          <Text style={styles.hintText}>
            {claimedList.length === 0
              ? `${buildings.length} echte Häuser, alle neutral. Tippe eins an = einnehmen (deine Farbe + Typ-Abzeichen). Nochmal tippen = freigeben.`
              : `${claimedList.length} eingenommen (deine Farbe + Abzeichen). Zoom rein, dann triffst du einzeln.`}
          </Text>
        )}
      </View>

      {/* Flat / 3D toggle */}
      <TouchableOpacity
        style={[styles.toggle, { bottom: insets.bottom + 24 }]}
        onPress={() => setPitched((p) => !p)}
        activeOpacity={0.85}
      >
        <Ionicons name={pitched ? 'square-outline' : 'cube-outline'} size={18} color="#FFFFFF" />
        <Text style={styles.toggleText}>{pitched ? 'Flach' : '3D kippen'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  hint: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintText: { color: TEXT, fontSize: 12, fontWeight: '600', lineHeight: 17, flexShrink: 1 },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: OWNER_COLOR,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  toggle: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  toggleText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
