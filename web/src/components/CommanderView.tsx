// ============================================================
// CommanderView — Indoor strategy layer: fog-of-war hex map.
//
// Uses H3 res-8 cells, direct Leaflet (no react-leaflet).
// - Visible cells: thin violet hex borders, low-opacity fill (the "revealed" zone).
// - Own territories: violet fill 35%; foreign: cyan fill 25%.
// - Radars: amber circles on their cells.
// - Movements: animated dashed polyline + live-interpolated dot marker.
// - Left panel: Deploy Scout flow (pick unit → pick origin → click map target).
// - Right panel: Active movements with ETA countdown + Recall button.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as h3 from 'h3-js';
import { useCommanderStore } from '../store/commanderStore';
import type { CommanderMovement } from '../store/commanderStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';
import type { InventoryItem } from '../api/types';

// ---- Colour constants -----------------------------------------------------------

const C_ACCENT   = theme.color.accent;       // #9D4EDD — own territory / scout
const C_FOREIGN  = theme.color.foreign;      // #4DD0E1 — foreign territory
const C_AMBER    = theme.color.amber;        // #FFB300 — radar / amber ring
const C_VIS_FILL = 'rgba(157,78,221,0.06)'; // very faint visible-zone fill
const C_VIS_BORDER = '#9D4EDD';             // thin violet hex border
const C_OWN_FILL   = 'rgba(157,78,221,0.35)';
const C_FOREIGN_FILL = 'rgba(77,208,225,0.25)';

// Scout unit definition_id prefixes (fallback when category field absent)
const UNIT_PREFIXES = ['unit_scout_disc', 'unit_tech_drone', 'unit_water_strider', 'unit_forest_construct'];

function isUnitItem(item: InventoryItem): boolean {
  if (item.category === 'unit') return true;
  return UNIT_PREFIXES.some((p) => item.definition_id.startsWith(p));
}

function prettifyDefinitionId(defId: string): string {
  return defId
    .replace(/^unit_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- H3 helpers ----------------------------------------------------------------

/** h3.cellToBoundary returns [[lat,lng],...] in h3-js v4 */
function cellToLeafletLatLngs(cell: string): L.LatLngTuple[] {
  const boundary = h3.cellToBoundary(cell);
  return boundary.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
}

function cellCenter(cell: string): L.LatLngTuple {
  const [lat, lng] = h3.cellToLatLng(cell);
  return [lat, lng];
}

/** Interpolate position along a path by progress 0-1 */
function interpolatePath(path: string[], progress: number): L.LatLngTuple {
  if (path.length === 0) return [0, 0];
  if (path.length === 1 || progress <= 0) return cellCenter(path[0]);
  if (progress >= 1) return cellCenter(path[path.length - 1]);

  const totalSegments = path.length - 1;
  const segF = progress * totalSegments;
  const segIdx = Math.floor(segF);
  const segT = segF - segIdx;

  const fromCenter = cellCenter(path[Math.min(segIdx, path.length - 1)]);
  const toCenter   = cellCenter(path[Math.min(segIdx + 1, path.length - 1)]);

  return [
    fromCenter[0] + (toCenter[0] - fromCenter[0]) * segT,
    fromCenter[1] + (toCenter[1] - fromCenter[1]) * segT,
  ];
}

/** Compute live progress from departs_at / arrives_at timestamps */
function computeProgress(departsAt: string, arrivesAt: string): number {
  const now = Date.now();
  const depart = new Date(departsAt).getTime();
  const arrive = new Date(arrivesAt).getTime();
  if (arrive <= depart) return 1;
  return Math.max(0, Math.min(1, (now - depart) / (arrive - depart)));
}

/** ms → "mm:ss" */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---- Component -----------------------------------------------------------------

export default function CommanderView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef       = useRef<L.Map | null>(null);

  // Leaflet layer groups (stable refs across renders)
  const hexLayerRef   = useRef<L.LayerGroup | null>(null);
  const terrLayerRef  = useRef<L.LayerGroup | null>(null);
  const radarLayerRef = useRef<L.LayerGroup | null>(null);
  const moveLayerRef  = useRef<L.LayerGroup | null>(null);

  // Per-movement marker refs for live progress updates
  const moveDotRefs = useRef<Map<string, L.CircleMarker>>(new Map());

  const { mapData, loading, error, dispatch, fetchMap, setDispatch, resetDispatch, sendScout, recallScout } = useCommanderStore();
  const { items: inventoryItems, refresh: refreshInventory } = useInventoryStore();
  const userId = useAuthStore((s) => s.user?.id);

  // UI state for the dispatch flow
  const [selectedUnit, setSelectedUnit]         = useState<InventoryItem | null>(null);
  const [originTerritoryId, setOriginTerritoryId] = useState<string>('');
  const [targetCell, setTargetCell]               = useState<string | null>(null);
  const [buildRadar, setBuildRadar]               = useState(false);
  const [dispatchError, setDispatchError]         = useState<string | null>(null);
  const [recallErrors, setRecallErrors]           = useState<Record<string, string>>({});

  // Target highlight layer (ephemeral)
  const targetLayerRef = useRef<L.LayerGroup | null>(null);

  // ---- Boot: fetch map + inventory --------------------------------------------
  useEffect(() => {
    void fetchMap();
    void refreshInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Auto-refresh every 30s -------------------------------------------------
  useEffect(() => {
    const id = window.setInterval(() => { void fetchMap(); }, 30_000);
    return () => window.clearInterval(id);
  }, [fetchMap]);

  // ---- Init Leaflet once -------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
      .setView([52.52, 13.405], 13);
    mapRef.current = map;

    // Dark tile layer with extra dimming for "radar" look
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dark-tiles commander-tiles',
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    hexLayerRef.current   = L.layerGroup().addTo(map);
    terrLayerRef.current  = L.layerGroup().addTo(map);
    radarLayerRef.current = L.layerGroup().addTo(map);
    moveLayerRef.current  = L.layerGroup().addTo(map);
    targetLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---- Map click handler: target-cell picking ----------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function onMapClick(e: L.LeafletMouseEvent) {
      if (dispatch.phase !== 'picking-target') return;
      const cell = h3.latLngToCell(e.latlng.lat, e.latlng.lng, 8);
      setTargetCell(cell);

      // Highlight target hex
      const tLayer = targetLayerRef.current;
      if (tLayer) {
        tLayer.clearLayers();
        L.polygon(cellToLeafletLatLngs(cell), {
          color: C_AMBER,
          weight: 2.5,
          fillColor: C_AMBER,
          fillOpacity: 0.2,
        }).addTo(tLayer);
      }
    }

    map.on('click', onMapClick);
    return () => { map.off('click', onMapClick); };
  }, [dispatch.phase]);

  // ---- Render visible cells (hex grid) ----------------------------------------
  useEffect(() => {
    const layer = hexLayerRef.current;
    if (!layer || !mapData) return;
    layer.clearLayers();

    for (const cell of mapData.visible_cells) {
      L.polygon(cellToLeafletLatLngs(cell), {
        color: C_VIS_BORDER,
        weight: 0.8,
        fillColor: C_VIS_FILL,
        fillOpacity: 1,
        opacity: 0.5,
      }).addTo(layer);
    }
  }, [mapData?.visible_cells]);

  // ---- Render territories ------------------------------------------------------
  useEffect(() => {
    const layer = terrLayerRef.current;
    if (!layer || !mapData) return;
    layer.clearLayers();

    for (const terr of mapData.territories) {
      const own = terr.is_own || (userId != null && terr.owner_id === userId);
      const fillColor = own ? C_OWN_FILL : C_FOREIGN_FILL;
      const stroke    = own ? C_ACCENT : C_FOREIGN;

      for (const cell of terr.h3_cells) {
        const poly = L.polygon(cellToLeafletLatLngs(cell), {
          color: stroke,
          weight: 1.5,
          fillColor,
          fillOpacity: 1,
        });
        const ownerLabel = terr.owner_username ?? (terr.owner_id ? 'Unknown' : 'Unclaimed');
        poly.bindTooltip(
          `<strong>${ownerLabel}</strong>${terr.claim_value ? ` · ${terr.claim_value}` : ''}`,
          { sticky: true },
        );
        poly.addTo(layer);
      }
    }

    // Auto-fit on first load
    const allCells = mapData.territories.flatMap((t) => t.h3_cells).concat(mapData.visible_cells);
    if (allCells.length > 0 && mapRef.current) {
      try {
        const bounds = allCells.map((c) => cellCenter(c));
        const lbounds = L.latLngBounds(bounds);
        if (lbounds.isValid()) mapRef.current.fitBounds(lbounds, { padding: [40, 40], maxZoom: 15 });
      } catch { /* ignore */ }
    }
    // Only fit once (when mapData first arrives)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData?.territories, userId]);

  // ---- Render radars ------------------------------------------------------------
  useEffect(() => {
    const layer = radarLayerRef.current;
    if (!layer || !mapData) return;
    layer.clearLayers();

    for (const radar of mapData.radars) {
      for (const cell of radar.cells) {
        const [lat, lng] = cellCenter(cell);
        L.circle([lat, lng], {
          radius: 60,
          color: C_AMBER,
          weight: 2,
          fillColor: C_AMBER,
          fillOpacity: 0.12,
        }).bindTooltip(radar.covert ? 'Covert Radar' : 'Radar', { sticky: true })
          .addTo(layer);
      }
    }
  }, [mapData?.radars]);

  // ---- Render movements (polylines + animated dots) ----------------------------
  useEffect(() => {
    const layer = moveLayerRef.current;
    if (!layer || !mapData) return;
    layer.clearLayers();
    moveDotRefs.current.clear();

    for (const mv of mapData.movements) {
      if (mv.path.length < 2) continue;
      const pathLatLngs = mv.path.map(cellCenter);

      // Dashed polyline
      L.polyline(pathLatLngs, {
        color: mv.purpose === 'scout' ? C_ACCENT : C_FOREIGN,
        weight: 2,
        opacity: 0.7,
        dashArray: '6 4',
      }).addTo(layer);

      // Progress dot
      const progress = computeProgress(mv.departs_at, mv.arrives_at);
      const dotPos   = interpolatePath(mv.path, progress);
      const isReturn = mv.purpose === 'return';

      const dot = L.circleMarker(dotPos, {
        radius: 7,
        color: isReturn ? '#7A5EB0' : C_ACCENT,
        fillColor: isReturn ? '#7A5EB0' : C_ACCENT,
        fillOpacity: isReturn ? 0.5 : 0.9,
        weight: 2,
      });
      dot.bindTooltip(
        `${mv.purpose.charAt(0).toUpperCase() + mv.purpose.slice(1)} · ${mv.status}`,
        { sticky: true },
      );
      dot.addTo(layer);
      moveDotRefs.current.set(mv.id, dot);
    }
  }, [mapData?.movements]);

  // ---- Tick: update movement dot positions every second -----------------------
  useEffect(() => {
    if (!mapData) return;
    const id = window.setInterval(() => {
      for (const mv of mapData.movements) {
        const dot = moveDotRefs.current.get(mv.id);
        if (!dot || mv.path.length < 2) continue;
        const progress = computeProgress(mv.departs_at, mv.arrives_at);
        dot.setLatLng(interpolatePath(mv.path, progress));
      }
    }, 1_000);
    return () => window.clearInterval(id);
  }, [mapData]);

  // ---- Clear target highlight when leaving picking-target phase ----------------
  useEffect(() => {
    if (dispatch.phase !== 'picking-target') {
      targetLayerRef.current?.clearLayers();
      setTargetCell(null);
    }
  }, [dispatch.phase]);

  // ---- Derived data ------------------------------------------------------------
  const unitItems   = inventoryItems.filter((i) => isUnitItem(i) && i.status === 'inventory');
  const ownTerrs    = mapData?.territories.filter((t) => t.is_own || (userId != null && t.owner_id === userId)) ?? [];
  const activeMovements = mapData?.movements ?? [];

  // ---- Dispatch action handlers -----------------------------------------------

  function handleStartDispatch() {
    setDispatchError(null);
    setSelectedUnit(null);
    setOriginTerritoryId(ownTerrs[0]?.id ?? '');
    setBuildRadar(false);
    setDispatch({ phase: 'picking-unit' });
  }

  function handlePickUnit(item: InventoryItem) {
    setSelectedUnit(item);
    setDispatch({ phase: 'picking-target', unit: item });
  }

  function handleCancelDispatch() {
    resetDispatch();
    setSelectedUnit(null);
    setTargetCell(null);
    setDispatchError(null);
  }

  async function handleConfirmSend() {
    if (!selectedUnit || !targetCell || !originTerritoryId) {
      setDispatchError('Pick a unit, origin and target first.');
      return;
    }
    setDispatchError(null);
    setDispatch({ phase: 'sending', unit: selectedUnit, originTerritoryId, targetCell, buildRadar });
    const result = await sendScout({
      instanceId: selectedUnit.id,
      fromTerritoryId: originTerritoryId,
      targetCell,
      buildRadar,
    });
    if (!result.ok) {
      setDispatchError(result.error ?? 'Unknown error');
      setDispatch({ phase: 'picking-target', unit: selectedUnit });
    } else {
      setSelectedUnit(null);
      setTargetCell(null);
    }
  }

  async function handleRecall(movementId: string) {
    setRecallErrors((prev) => { const n = { ...prev }; delete n[movementId]; return n; });
    const result = await recallScout(movementId);
    if (!result.ok) {
      setRecallErrors((prev) => ({ ...prev, [movementId]: result.error ?? 'Recall failed' }));
    }
  }

  // ---- Grid distance estimate for display --------------------------------------
  function getEstimate(): string | null {
    if (!targetCell || ownTerrs.length === 0 || !originTerritoryId) return null;
    const originTerr = ownTerrs.find((t) => t.id === originTerritoryId);
    if (!originTerr || originTerr.h3_cells.length === 0) return null;
    try {
      const fromCell = originTerr.h3_cells[0];
      const dist = h3.gridDistance(fromCell, targetCell);
      if (dist < 0) return null;
      return `~${dist} cells · ~${dist * 4} min`;
    } catch { return null; }
  }

  const estimate = getEstimate();

  // ---- Styles ------------------------------------------------------------------

  const panelBase: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 280,
    background: theme.color.panel,
    borderRight: `1px solid ${theme.color.border}`,
    zIndex: 700,
    overflowY: 'auto',
    padding: '14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };

  const rightPanel: React.CSSProperties = {
    ...panelBase,
    left: 'auto',
    right: 0,
    borderRight: 'none',
    borderLeft: `1px solid ${theme.color.border}`,
    width: 300,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: theme.color.textDim,
    marginBottom: 4,
  };

  const btnAccent: React.CSSProperties = {
    width: '100%',
    background: theme.color.accent,
    color: '#fff',
    border: 'none',
    borderRadius: theme.radius,
    padding: '9px 0',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  };

  const btnOutline: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    color: theme.color.textDim,
    border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius,
    padding: '7px 0',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  };

  const btnDanger: React.CSSProperties = {
    ...btnOutline,
    color: theme.color.danger,
    borderColor: theme.color.danger,
    width: 'auto',
    padding: '4px 10px',
    fontSize: 12,
  };

  const itemCard: React.CSSProperties = {
    background: theme.color.panelAlt,
    border: `1px solid ${theme.color.border}`,
    borderRadius: 8,
    padding: '8px 10px',
    cursor: 'pointer',
    fontSize: 13,
  };

  const itemCardSelected: React.CSSProperties = {
    ...itemCard,
    borderColor: theme.color.accent,
    background: `${theme.color.accent}22`,
  };

  const mvCard: React.CSSProperties = {
    background: theme.color.panelAlt,
    border: `1px solid ${theme.color.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const progressBarOuter: React.CSSProperties = {
    height: 4,
    background: theme.color.border,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  };

  // ---- Countdown ticker (forces re-render every second for ETA display) --------
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, []);

  // ---- Render ------------------------------------------------------------------

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Leaflet container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading / error overlay */}
      {loading && !mapData && (
        <div className="map-loading">Loading Commander…</div>
      )}
      {error && (
        <div className="map-loading" style={{ color: theme.color.danger }}>{error}</div>
      )}

      {/* ---- LEFT PANEL: Deploy Scout flow ---- */}
      <div style={panelBase}>
        <div style={{ fontWeight: 700, fontSize: 15, color: theme.color.accentBright, letterSpacing: '0.04em' }}>
          ◈ Commander
        </div>

        {dispatchError && (
          <div className="panel-error" style={{ margin: 0 }}>{dispatchError}</div>
        )}

        {/* IDLE: show Deploy Scout button */}
        {dispatch.phase === 'idle' && (
          <>
            <button style={btnAccent} onClick={handleStartDispatch}>
              Deploy Scout
            </button>
            <div style={{ ...sectionLabel, marginTop: 8 }}>Own Territories</div>
            {ownTerrs.length === 0 ? (
              <div className="muted">No territories yet.</div>
            ) : (
              ownTerrs.map((t) => (
                <div key={t.id} style={{ ...itemCard, cursor: 'default' }}>
                  <div style={{ fontWeight: 600 }}>{t.owner_username ?? 'Yours'}</div>
                  <div className="muted">{t.h3_cells.length} hex{t.h3_cells.length !== 1 ? 'es' : ''} · {t.claim_value} cv</div>
                </div>
              ))
            )}
          </>
        )}

        {/* PICKING UNIT */}
        {dispatch.phase === 'picking-unit' && (
          <>
            <div style={sectionLabel}>Select Unit</div>
            {unitItems.length === 0 ? (
              <div className="muted">No scout units in inventory.</div>
            ) : (
              unitItems.map((item) => (
                <div
                  key={item.id}
                  style={selectedUnit?.id === item.id ? itemCardSelected : itemCard}
                  onClick={() => handlePickUnit(item)}
                >
                  <div style={{ fontWeight: 600 }}>{prettifyDefinitionId(item.definition_id)}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{item.rarity} · #{item.mint_number ?? '—'}</div>
                </div>
              ))
            )}
            <button style={btnOutline} onClick={handleCancelDispatch}>Cancel</button>
          </>
        )}

        {/* PICKING TARGET */}
        {dispatch.phase === 'picking-target' && (
          <>
            <div style={sectionLabel}>Unit</div>
            <div style={{ ...itemCardSelected, cursor: 'default' }}>
              <div style={{ fontWeight: 600 }}>{prettifyDefinitionId(selectedUnit?.definition_id ?? '')}</div>
            </div>

            <div style={sectionLabel}>Origin Territory</div>
            {ownTerrs.length === 0 ? (
              <div className="muted">You have no territories.</div>
            ) : (
              <select
                value={originTerritoryId}
                onChange={(e) => setOriginTerritoryId(e.target.value)}
                style={{
                  width: '100%',
                  background: theme.color.panelAlt,
                  color: theme.color.text,
                  border: `1px solid ${theme.color.border}`,
                  borderRadius: 8,
                  padding: '7px 10px',
                  fontSize: 13,
                }}
              >
                {ownTerrs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.owner_username ?? 'Yours'} ({t.h3_cells.length} hex)
                  </option>
                ))}
              </select>
            )}

            <div style={{ ...sectionLabel, marginTop: 6 }}>Target Cell</div>
            {targetCell ? (
              <>
                <div style={{ ...itemCard, cursor: 'default', color: theme.color.amber, fontFamily: 'monospace', fontSize: 11 }}>
                  {targetCell}
                </div>
                {estimate && (
                  <div className="muted" style={{ fontSize: 11 }}>{estimate}</div>
                )}
              </>
            ) : (
              <div className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>
                Click the map to set target
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={buildRadar}
                onChange={(e) => setBuildRadar(e.target.checked)}
              />
              Plant covert radar (on enemy territory)
            </label>

            <button
              style={{ ...btnAccent, opacity: targetCell && originTerritoryId ? 1 : 0.5 }}
              disabled={!targetCell || !originTerritoryId || dispatch.phase !== 'picking-target'}
              onClick={() => void handleConfirmSend()}
            >
              Confirm & Deploy
            </button>

            <button style={btnOutline} onClick={handleCancelDispatch}>Cancel</button>
          </>
        )}

        {/* SENDING */}
        {dispatch.phase === 'sending' && (
          <div className="muted" style={{ textAlign: 'center', padding: 12 }}>
            Deploying scout…
          </div>
        )}
      </div>

      {/* ---- RIGHT PANEL: Active movements ---- */}
      <div style={rightPanel}>
        <div style={{ fontWeight: 700, fontSize: 13, color: theme.color.accentBright, letterSpacing: '0.04em' }}>
          Active Movements
        </div>

        {activeMovements.length === 0 ? (
          <div className="muted">No active movements.</div>
        ) : (
          activeMovements.map((mv) => (
            <MovementCard
              key={mv.id}
              mv={mv}
              onRecall={() => void handleRecall(mv.id)}
              recallError={recallErrors[mv.id]}
              cardStyle={mvCard}
              progressBarOuter={progressBarOuter}
              btnDanger={btnDanger}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---- Movement card sub-component -----------------------------------------------

interface MvCardProps {
  mv: CommanderMovement;
  onRecall: () => void;
  recallError?: string;
  cardStyle: React.CSSProperties;
  progressBarOuter: React.CSSProperties;
  btnDanger: React.CSSProperties;
}

const PURPOSE_ICONS: Record<string, string> = {
  scout: '◈',
  return: '↩',
  attack: '⚔',
  reinforce: '🛡',
};

function MovementCard({ mv, onRecall, recallError, cardStyle, progressBarOuter, btnDanger }: MvCardProps) {
  // Local tick state so each card re-renders its ETA independently
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const msLeft = new Date(mv.arrives_at).getTime() - Date.now();
  const progress = computeProgress(mv.departs_at, mv.arrives_at);
  const isRecallable = mv.purpose === 'scout' && mv.status === 'marching';
  const icon = PURPOSE_ICONS[mv.purpose] ?? '•';

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {icon} {mv.purpose.charAt(0).toUpperCase() + mv.purpose.slice(1)}
        </span>
        <span style={{ fontSize: 11, color: theme.color.textDim, fontFamily: 'monospace' }}>
          {formatCountdown(msLeft)}
        </span>
      </div>
      <div style={{ color: theme.color.textDim, fontSize: 11 }}>
        {mv.status} · {mv.path.length} cells
      </div>
      {/* Progress bar */}
      <div style={progressBarOuter}>
        <div style={{
          height: '100%',
          width: `${Math.round(progress * 100)}%`,
          background: mv.purpose === 'return' ? theme.color.textDim : theme.color.accent,
          borderRadius: 999,
          transition: 'width 1s linear',
        }} />
      </div>
      {isRecallable && (
        <button style={{ ...btnDanger, marginTop: 4 }} onClick={onRecall}>
          Recall
        </button>
      )}
      {recallError && (
        <div style={{ color: theme.color.danger, fontSize: 11, marginTop: 2 }}>{recallError}</div>
      )}
    </div>
  );
}
