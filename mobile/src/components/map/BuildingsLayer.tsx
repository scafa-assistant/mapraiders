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
import { useSettingsStore } from '../../store/settingsStore';

const NEUTRAL = '#D8D2CA';
const NEUTRAL_EDGE = 'rgba(120,112,102,0.45)';
// Night mode (direction B): unclaimed buildings sit as dark slabs on the dark map.
const NEUTRAL_DARK = '#2E3540';
const NEUTRAL_EDGE_DARK = 'rgba(150,162,184,0.35)';
const FALLBACK_COLOR = '#1558F0'; // used only until the server color syncs in
const MAX_SPAN_DEG = 0.02; // only load buildings when zoomed in (~2 km N-S)

export interface Bbox { north: number; south: number; east: number; west: number; }

// Building color system (René 2026-07-14): fill = TYPE color, outline = OWNER
// profile color, badge = type icon. So you can read WHAT a building is (color +
// icon) and WHOSE it is (rim) at a glance, even when players share colors.
export const BUILDING_TYPE_COLORS: Record<string, string> = {
  workshop: '#F5A623',
  refinery: '#E2571B',
  garrison: '#4A6B3A',
  storage: '#8B5E3C',
  radar: '#0FA3A3',
  armory: '#455A64',
};

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  workshop: 'construct',
  refinery: 'flame',
  garrison: 'shield',
  storage: 'cube',
  radar: 'radio',
  armory: 'hammer',
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

interface BuildingsLayerProps {
  bbox: Bbox | null;
  /** Ask the host to pick a building type when claiming. Resolve null = cancel. */
  promptType?: () => Promise<string | null>;
}

export default function BuildingsLayer({ bbox, promptType }: BuildingsLayerProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [claims, setClaims] = useState<Record<string, Claim>>({});
  const darkMap = useSettingsStore((s) => s.settings.darkMapStyle);
  const neutral = darkMap ? NEUTRAL_DARK : NEUTRAL;
  const neutralEdge = darkMap ? NEUTRAL_EDGE_DARK : NEUTRAL_EDGE;
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
        properties: {
          id: b.id,
          height: b.height,
          owned: !!c,
          color: c ? (BUILDING_TYPE_COLORS[c.type] ?? FALLBACK_COLOR) : neutral,
          ownerColor: c ? c.color : neutralEdge,
        },
        geometry: { type: 'Polygon' as const, coordinates: [b.ring] },
      };
    }),
  }), [buildings, claims, neutral, neutralEdge]);

  // Badges only for claimed buildings whose footprint is in view.
  const claimedInView = useMemo(
    () => buildings.filter((b) => claims[b.id]),
    [buildings, claims],
  );

  // Tap a real building → claim (if free) or release (if mine). Others' = noop.
  const onPress = async (e: any) => {
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
      // Let the host pick a building type (falls back to workshop).
      const type = promptType ? await promptType() : 'workshop';
      if (!type) return; // cancelled
      // Claim , optimistic (real profile color syncs on refresh).
      setClaims((prev) => ({ ...prev, [key]: { type, color: FALLBACK_COLOR, isMine: true } }));
      mapBuildingApi
        .claim({ osmId: key, lat: b.centroid[1], lng: b.centroid[0], type })
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
            'fill-extrusion-opacity': ['case', ['get', 'owned'], 0.95, 0.6],
          } as any}
        />
        {/* Owner rim: claimed buildings carry their owner's profile color as a
            crisp outline (fill is the type color); faint edge on neutral ones. */}
        <Layer
          id="mainblds-line"
          type="line"
          source="mainblds"
          paint={{
            'line-color': ['get', 'ownerColor'],
            'line-width': ['case', ['get', 'owned'], 2.6, 0.6],
          } as any}
        />
      </GeoJSONSource>
      {claimedInView.map((b) => {
        const c = claims[b.id];
        const icon = TYPE_ICON[c.type] ?? 'business';
        return (
          <MLMarker key={b.id} lngLat={b.centroid}>
            <View style={[styles.badge, { backgroundColor: BUILDING_TYPE_COLORS[c.type] ?? FALLBACK_COLOR, borderColor: c.color }]}>
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
