// ============================================================
// BuildingsLayer , echte OSM-Gebäude auf der Hauptkarte
// (2026-07-06, one-layer 3D milestone)
//
// Rendert die ECHTEN Gebäude des sichtbaren Ausschnitts (OpenFreeMap/OSM via
// Overpass) als unsere Spielgebäude: neutral bis EINGENOMMEN, dann in der
// Besitzerfarbe (Profilfarbe; aktuell Demo = Marken-Blau) + Typ-Abzeichen.
// Lebt als Kind der (MapLibre-)Hauptkarte, gated auf Zoom, lädt beim Pannen
// debounced nach. Claim-Status aktuell lokal (Server-Persistenz = nächster
// Schritt). Siehe _docs/gdd/VISION_OneLayer_3D_Weltkarte.md.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GeoJSONSource, Layer, Marker as MLMarker } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';

const OWNER_COLOR = '#1558F0'; // TODO: Spieler-Profilfarbe, sobald im User-Modell
const NEUTRAL = '#D8D2CA';
// Gebäude nur laden/zeigen, wenn nah genug gezoomt (sonst tausende Häuser).
const MAX_SPAN_DEG = 0.02; // ~2 km Nord-Süd

export interface Bbox { north: number; south: number; east: number; west: number; }

const CLAIM_TYPES = [
  { key: 'workshop', icon: 'construct' as const },
  { key: 'refinery', icon: 'flame' as const },
  { key: 'garrison', icon: 'shield' as const },
  { key: 'storage', icon: 'cube' as const },
  { key: 'radar', icon: 'radio' as const },
];

interface Building { id: string; ring: [number, number][]; centroid: [number, number]; height: number; }

function heightFromTags(tags?: Record<string, string>): number {
  if (!tags) return 6;
  if (tags.height) { const h = parseFloat(tags.height); if (!isNaN(h)) return h; }
  if (tags['building:levels']) { const l = parseFloat(tags['building:levels']); if (!isNaN(l)) return Math.max(3, l * 3); }
  return 6;
}

function centroidOf(ring: [number, number][]): [number, number] {
  let x = 0, y = 0; const n = ring.length - 1;
  for (let i = 0; i < n; i++) { x += ring[i][0]; y += ring[i][1]; }
  return [x / n, y / n];
}

async function fetchBuildings(b: Bbox): Promise<Building[]> {
  const q = `[out:json][timeout:25];way["building"](${b.south},${b.west},${b.north},${b.east});out geom;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    // overpass-api.de WAF returns 406 without a real User-Agent (okhttp default is blocked).
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
    const f = ring[0], l = ring[ring.length - 1];
    if (f[0] !== l[0] || f[1] !== l[1]) ring.push(f);
    out.push({ id: String(el.id), ring, centroid: centroidOf(ring), height: heightFromTags(el.tags) });
  }
  return out;
}

interface BuildingsLayerProps {
  /** Current map viewport bounds. Null disables the layer. */
  bbox: Bbox | null;
}

export default function BuildingsLayer({ bbox }: BuildingsLayerProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [claimed, setClaimed] = useState<Record<string, number>>({});
  const lastFetched = useRef<Bbox | null>(null);

  // Fetch (debounced) when the viewport moves outside the last fetched area.
  useEffect(() => {
    if (!bbox) return;
    const span = bbox.north - bbox.south;
    if (span > MAX_SPAN_DEG) { setBuildings([]); lastFetched.current = null; return; }
    const lf = lastFetched.current;
    if (lf && bbox.north <= lf.north && bbox.south >= lf.south && bbox.east <= lf.east && bbox.west >= lf.west) return;
    const t = setTimeout(() => {
      const pad = span * 0.5; // over-fetch so small pans don't re-hit Overpass
      const fb: Bbox = { north: bbox.north + pad, south: bbox.south - pad, east: bbox.east + pad, west: bbox.west - pad };
      fetchBuildings(fb).then((b) => { setBuildings(b); lastFetched.current = fb; }).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [bbox?.north, bbox?.south, bbox?.east, bbox?.west]);

  const fc = useMemo(() => ({
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

  // Tap a real building → take/release it.
  const onPress = (e: any) => {
    const id = e?.nativeEvent?.features?.[0]?.properties?.id;
    if (id == null) return;
    setClaimed((prev) => {
      const next = { ...prev };
      if (next[id] !== undefined) delete next[id];
      else next[id] = Object.keys(prev).length % CLAIM_TYPES.length;
      return next;
    });
  };

  if (buildings.length === 0) return null;

  return (
    <>
      <GeoJSONSource id="mainblds" data={fc as any} onPress={onPress}>
        <Layer
          id="mainblds-ext"
          type="fill-extrusion"
          source="mainblds"
          paint={{
            'fill-extrusion-color': ['case', ['get', 'owned'], OWNER_COLOR, NEUTRAL],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': ['case', ['get', 'owned'], 0.9, 0.55],
          } as any}
        />
      </GeoJSONSource>
      {claimedList.map((b) => {
        const t = CLAIM_TYPES[claimed[b.id]];
        return (
          <MLMarker key={b.id} lngLat={b.centroid}>
            <View style={styles.badge}>
              <Ionicons name={t.icon} size={13} color="#FFFFFF" />
            </View>
          </MLMarker>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: OWNER_COLOR, borderWidth: 2, borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 4,
  },
});
