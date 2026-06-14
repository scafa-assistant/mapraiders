// ============================================================
// Leaflet map — direct (no react-leaflet). Light OSM tiles, territory
// polygons, PvE spawn markers. Loads territories/spawns on debounced
// 'moveend'. Clicking a polygon selects it (App opens the side panel).
//
// Centering on mount: navigator.geolocation if granted, else the first own
// territory, else Berlin fallback.
// ============================================================

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { territoryApi } from '../api/client';
import WalkToClaim from './WalkToClaim';
import { registerMap, useMapStore } from '../store/mapStore';
import { useFeatureStore } from '../store/featureStore';
import { useAuthStore } from '../store/authStore';
import { useTerminalStore } from '../store/terminalStore';
import { theme } from '../theme';
import type { BBox } from '../store/mapStore';
import type { GeoJsonGeometry, Territory } from '../api/types';

const BERLIN: [number, number] = [52.52, 13.405];

/**
 * Convert ST_AsGeoJSON output (lng,lat ordering) to Leaflet LatLng rings.
 * Handles both Polygon and MultiPolygon. Returns an array of polygons, each
 * an array of rings (outer + holes), each ring an array of [lat,lng].
 */
function geometryToLatLngs(geom: GeoJsonGeometry): L.LatLngTuple[][][] {
  const out: L.LatLngTuple[][][] = [];
  if (geom.type === 'Polygon') {
    const rings = geom.coordinates as number[][][];
    out.push(rings.map((ring) => ring.map(([lng, lat]) => [lat, lng] as L.LatLngTuple)));
  } else if (geom.type === 'MultiPolygon') {
    const polys = geom.coordinates as number[][][][];
    for (const poly of polys) {
      out.push(poly.map((ring) => ring.map(([lng, lat]) => [lat, lng] as L.LatLngTuple)));
    }
  }
  return out;
}

function mapBoundsToBBox(map: L.Map): BBox {
  const b = map.getBounds();
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  };
}

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const territoryLayerRef = useRef<L.LayerGroup | null>(null);
  const spawnLayerRef = useRef<L.LayerGroup | null>(null);
  const debounceRef = useRef<number | null>(null);

  const territories = useMapStore((s) => s.territories);
  const spawns = useMapStore((s) => s.spawns);
  const loading = useMapStore((s) => s.loading);
  const loadViewport = useMapStore((s) => s.loadViewport);
  const select = useMapStore((s) => s.select);
  const selectSpawn = useMapStore((s) => s.selectSpawn);

  const userId = useAuthStore((s) => s.user?.id);
  const pveEnabled = useFeatureStore((s) => s.isEnabled('pve_spawns'));
  const terminalsEnabled = useFeatureStore((s) => s.isEnabled('terminals'));

  const terminalSelectSpawn = useTerminalStore((s) => s.selectSpawn);

  // ---- Initialise the map once ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(BERLIN, 13);
    mapRef.current = map;
    registerMap(map); // expose to panels (My Territories flyTo)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dark-tiles',
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    territoryLayerRef.current = L.layerGroup().addTo(map);
    spawnLayerRef.current = L.layerGroup().addTo(map);

    const triggerLoad = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        void loadViewport(mapBoundsToBBox(map));
      }, 350);
    };
    map.on('moveend', triggerLoad);

    // Decide the initial centre, then do the first load.
    decideInitialCenter(map, () => {
      void loadViewport(mapBoundsToBBox(map));
    });

    return () => {
      map.off('moveend', triggerLoad);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      registerMap(null);
      map.remove();
      mapRef.current = null;
    };
    // loadViewport is a stable zustand action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Render territory polygons whenever they change ----
  useEffect(() => {
    const layer = territoryLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const t of territories) {
      if (!t.polygon) continue;
      const own = Boolean(userId && t.owner_id === userId);
      const fillColor = own ? theme.color.accent : theme.color.foreign;
      const fillOpacity = own ? 0.35 : 0.18;
      const stroke = own ? theme.color.accentBright : theme.color.foreign;

      for (const rings of geometryToLatLngs(t.polygon)) {
        const polygon = L.polygon(rings, {
          color: stroke,
          weight: 2,
          fillColor,
          fillOpacity,
        });
        polygon.on('click', () => select(t.id));
        polygon.bindTooltip(tooltipFor(t), { sticky: true });
        polygon.addTo(layer);
      }
    }
  }, [territories, userId, select]);

  // ---- Render PvE spawn markers ----
  useEffect(() => {
    const layer = spawnLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!pveEnabled) return;

    for (const s of spawns) {
      if (terminalsEnabled && s.npc_type === 'terminal') {
        // Terminal: amber diamond divIcon with subtle CSS pulse animation.
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:18px;height:18px;
            background:${theme.color.amber};
            transform:rotate(45deg);
            border:2px solid rgba(255,255,255,0.85);
            border-radius:3px;
            box-shadow:0 0 0 0 ${theme.color.amber}88;
            animation:terminal-pulse 2s ease-in-out infinite;
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = L.marker([s.latitude, s.longitude], { icon });
        marker.bindTooltip('Hyperborean Terminal', { direction: 'top' });
        marker.on('click', () => {
          terminalSelectSpawn(s);
          selectSpawn(s.id);
        });
        marker.addTo(layer);
      } else {
        // Regular PvE spawn: amber circle.
        const marker = L.circleMarker([s.latitude, s.longitude], {
          radius: 7,
          color: theme.color.amber,
          fillColor: theme.color.amber,
          fillOpacity: 0.8,
          weight: 2,
        });
        marker.bindTooltip(
          `<strong>${s.npc_type}</strong> · Lvl ${s.level}<br/>` +
            'Hacking requires the mobile app (GPS proximity)',
          { direction: 'top' },
        );
        marker.addTo(layer);
      }
    }
  }, [spawns, pveEnabled, terminalsEnabled, selectSpawn, terminalSelectSpawn]);

  return (
    <div className="map-root">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {loading && <div className="map-loading">Loading map…</div>}
      <WalkToClaim />
    </div>
  );
}

function tooltipFor(t: Territory): string {
  const owner = t.owner_username ?? 'Unclaimed';
  return `<strong>${owner}</strong>${t.claim_value != null ? ` · ${t.claim_value}` : ''}`;
}

/**
 * Try browser geolocation (only if already granted — never blocks the first
 * paint). Falls back to the user's first own territory, then Berlin.
 */
function decideInitialCenter(map: L.Map, then: () => void): void {
  let settled = false;
  const settle = (center?: [number, number], zoom?: number) => {
    if (settled) return;
    settled = true;
    if (center) map.setView(center, zoom ?? 14);
    then();
  };

  // Permissions API lets us check without prompting where supported.
  const tryGeo = () => {
    if (!('geolocation' in navigator)) {
      void fallbackToOwnTerritory(settle);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => settle([pos.coords.latitude, pos.coords.longitude], 15),
      () => void fallbackToOwnTerritory(settle),
      { timeout: 4000, maximumAge: 60000 },
    );
  };

  if ('permissions' in navigator && navigator.permissions?.query) {
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (status.state === 'granted') tryGeo();
        else void fallbackToOwnTerritory(settle);
      })
      .catch(() => void fallbackToOwnTerritory(settle));
  } else {
    void fallbackToOwnTerritory(settle);
  }

  // Safety net: settle on Berlin if nothing resolved in time.
  window.setTimeout(() => settle(BERLIN, 13), 4500);
}

/** Center on the user's first own territory if any exist, else Berlin. */
async function fallbackToOwnTerritory(
  settle: (center?: [number, number], zoom?: number) => void,
): Promise<void> {
  try {
    // Pull a wide bbox of own territories: use a world bbox to find any owned one.
    const userId = useAuthStore.getState().user?.id;
    const world: BBox = { north: 85, south: -85, east: 179, west: -179 };
    const all = await territoryApi.getInBounds(world);
    const own = all.find((t) => userId && t.owner_id === userId && t.polygon);
    if (own?.polygon) {
      const rings = geometryToLatLngs(own.polygon)[0]?.[0];
      if (rings && rings.length) {
        const lat = rings.reduce((s, p) => s + p[0], 0) / rings.length;
        const lng = rings.reduce((s, p) => s + p[1], 0) / rings.length;
        settle([lat, lng], 15);
        return;
      }
    }
  } catch {
    /* ignore — fall through to Berlin */
  }
  settle(BERLIN, 13);
}
