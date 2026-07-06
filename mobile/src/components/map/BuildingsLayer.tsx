// ============================================================
// BuildingsLayer , echte OSM-Gebäude auf der Hauptkarte (server-persistent)
// (2026-07-06, one-layer 3D milestone)
//
// Rendert die ECHTEN Gebäude des sichtbaren Ausschnitts (OSM via Overpass) als
// unsere Spielgebäude direkt auf der MapLibre-Hauptkarte: neutral bis
// EINGENOMMEN, dann in der Besitzer-PROFILFARBE (users.territory_color) + Typ-
// Abzeichen. Claims sind SERVER-persistent (/api/buildings/osm/*), also über
// Neustarts hinweg und für alle Spieler sichtbar. Tap = einnehmen/freigeben
// (optimistisch, dann Server-Sync). Gated auf Zoom, debounced Overpass-Fetch.
// Siehe _docs/gdd/VISION_OneLayer_3D_Weltkarte.md.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GeoJSONSource, Layer, Marker as MLMarker } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import { mapBuildingApi } from '@services/api';

const NEUTRAL = '#D8D2CA';
const FALLBACK_COLOR = '#1558F0'; // used only until the server color syncs in
const MAX_SPAN_DEG = 0.02; // only load buildings when zoomed in (~2 km N-S)

export interface Bbox { north: number; south: number; east: number; west: number; }

// Type → badge icon. Claiming defaults to 'workshop' (type-picker is future UX).
const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  workshop: 'construct',
  refinery: 'flame',
  garrison: 'shield',
  storage: 'cube',
  radar: 'radio',
};

interface Building { id: string; ring: [number, number][]; centroid: [number, number]; height: number; }
interface Claim { type: string; color: string; isMine: boolean; }

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

async function fetchClaims(b: Bbox): Promise<Record<string, Claim>> {
  try {
    const { data } = await mapBuildingApi.getClaimed(b);
    const list = data?.data?.buildings ?? [];
    const map: Record<string, Claim> = {};
    for (const c of list) map[String(c.osmId)] = { type: c.type, color: c.color, isMine: c.isMine };
    return map;
  } catch {
    return {};
  }
}

interface BuildingsLayerProps { bbox: Bbox | null; }

export default function BuildingsLayer({ bbox }: BuildingsLayerProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [claims, setClaims] = useState<Record<string, Claim>>({});
  const lastFetched = useRef<Bbox | null>(null);
  const currentBbox = useRef<Bbox | null>(null);

  // Fetch OSM footprints + server claims when the viewport moves out of the
  // last fetched area (debounced). Claims refetch too so others' claims appear.
  useEffect(() => {
    if (!bbox) return;
    currentBbox.current = bbox;
    const span = bbox.north - bbox.south;
    if (span > MAX_SPAN_DEG) { setBuildings([]); lastFetched.current = null; return; }
    const lf = lastFetched.current;
    if (lf && bbox.north <= lf.north && bbox.south >= lf.south && bbox.east <= lf.east && bbox.west >= lf.west) return;
    const t = setTimeout(() => {
      const pad = span * 0.5; // over-fetch so small pans don't re-hit Overpass
      const fb: Bbox = { north: bbox.north + pad, south: bbox.south - pad, east: bbox.east + pad, west: bbox.west - pad };
      fetchBuildings(fb).then((b) => { setBuildings(b); lastFetched.current = fb; }).catch(() => {});
      fetchClaims(fb).then(setClaims).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [bbox?.north, bbox?.south, bbox?.east, bbox?.west]);

  const refreshClaims = () => {
    const b = currentBbox.current;
    if (b) fetchClaims(b).then(setClaims).catch(() => {});
  };

  const fc = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: buildings.map((b) => {
      const c = claims[b.id];
      return {
        type: 'Feature' as const,
        id: b.id,
        properties: { id: b.id, height: b.height, owned: !!c, color: c ? c.color : NEUTRAL },
        geometry: { type: 'Polygon' as const, coordinates: [b.ring] },
      };
    }),
  }), [buildings, claims]);

  // Badges only for claimed buildings whose footprint is in view.
  const claimedInView = useMemo(
    () => buildings.filter((b) => claims[b.id]),
    [buildings, claims],
  );

  // Tap a real building → claim (if free) or release (if mine). Others' = noop.
  const onPress = (e: any) => {
    const id = e?.nativeEvent?.features?.[0]?.properties?.id;
    if (id == null) return;
    const key = String(id);
    const b = buildings.find((x) => x.id === key);
    if (!b) return;
    const existing = claims[key];

    if (existing?.isMine) {
      // Release , optimistic.
      setClaims((prev) => { const n = { ...prev }; delete n[key]; return n; });
      mapBuildingApi.release(key).then(refreshClaims).catch(refreshClaims);
    } else if (!existing) {
      // Claim , optimistic (real profile color syncs on refresh).
      setClaims((prev) => ({ ...prev, [key]: { type: 'workshop', color: FALLBACK_COLOR, isMine: true } }));
      mapBuildingApi
        .claim({ osmId: key, lat: b.centroid[1], lng: b.centroid[0], type: 'workshop' })
        .then(refreshClaims)
        .catch(refreshClaims);
    }
    // existing && !isMine → taken by someone else, ignore.
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
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': ['case', ['get', 'owned'], 0.9, 0.55],
          } as any}
        />
      </GeoJSONSource>
      {claimedInView.map((b) => {
        const c = claims[b.id];
        const icon = TYPE_ICON[c.type] ?? 'business';
        return (
          <MLMarker key={b.id} lngLat={b.centroid}>
            <View style={[styles.badge, { backgroundColor: c.color }]}>
              <Ionicons name={icon} size={13} color="#FFFFFF" />
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
    borderWidth: 2, borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 4,
  },
});
