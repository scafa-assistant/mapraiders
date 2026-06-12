// ============================================================
// CommanderView — Strategy layer: fog-of-war hex map.
//
// Phase C.2 additions:
//   LEFT PANEL:
//     - Territory click → own territory panel (garrison list, deploy picker)
//     - Territory click → foreign territory panel (fog count, attack flow)
//     - Attack flow: unit multi-select + origin + cost estimate + march
//     - Dice pouch: own dice items with rarity colors + equip
//   RIGHT PANEL:
//     - Active movements (own + foreign spotted as red dots)
//     - Battles collapsible section (list + BattleReplayModal)
// ============================================================

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as h3 from 'h3-js';
import { useCommanderStore } from '../store/commanderStore';
import type { AirstrikeResult, CommanderMovement, SiloInfo } from '../store/commanderStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { theme, colorForRarity } from '../theme';
import type { InventoryItem } from '../api/types';
import BattleReplayModal from './BattleReplayModal';

// ---- Colour constants -----------------------------------------------------------

const C_ACCENT   = theme.color.accent;
const C_FOREIGN  = theme.color.foreign;
const C_AMBER    = theme.color.amber;
const C_VIS_FILL = 'rgba(157,78,221,0.06)';
const C_VIS_BORDER = '#9D4EDD';
const C_OWN_FILL   = 'rgba(157,78,221,0.35)';
const C_FOREIGN_FILL = 'rgba(77,208,225,0.25)';
const C_RED_PULSE = '#FF5470';

const UNIT_PREFIXES = ['unit_scout_disc', 'unit_tech_drone', 'unit_water_strider', 'unit_forest_construct'];

function isUnitItem(item: InventoryItem): boolean {
  if (item.category === 'unit') return true;
  return UNIT_PREFIXES.some((p) => item.definition_id.startsWith(p));
}

function isDiceItem(item: InventoryItem): boolean {
  if (item.category === 'dice') return true;
  return item.definition_id.startsWith('dice_');
}

function prettifyDefinitionId(defId: string): string {
  return defId
    .replace(/^unit_/, '')
    .replace(/^dice_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Infer domain badge from definition_id */
function unitDomain(defId: string): string {
  if (defId.includes('water_strider')) return '🌊 naval';
  if (defId.includes('tech_drone') || defId.includes('scout_disc')) return '✈ air';
  return '⛰ ground';
}

// ---- H3 helpers ----------------------------------------------------------------

function cellToLeafletLatLngs(cell: string): L.LatLngTuple[] {
  const boundary = h3.cellToBoundary(cell);
  return boundary.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
}

function cellCenter(cell: string): L.LatLngTuple {
  const [lat, lng] = h3.cellToLatLng(cell);
  return [lat, lng];
}

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

function computeProgress(departsAt: string, arrivesAt: string): number {
  const now = Date.now();
  const depart = new Date(departsAt).getTime();
  const arrive = new Date(arrivesAt).getTime();
  if (arrive <= depart) return 1;
  return Math.max(0, Math.min(1, (now - depart) / (arrive - depart)));
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 2) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ---- Territory panel mode -------------------------------------------------------

type TerritoryPanelMode =
  | { type: 'none' }
  | { type: 'own'; territoryId: string }
  | { type: 'foreign'; territoryId: string };

// ---- Component -----------------------------------------------------------------

export default function CommanderView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef       = useRef<L.Map | null>(null);

  const hexLayerRef      = useRef<L.LayerGroup | null>(null);
  const terrLayerRef     = useRef<L.LayerGroup | null>(null);
  const radarLayerRef    = useRef<L.LayerGroup | null>(null);
  const moveLayerRef     = useRef<L.LayerGroup | null>(null);
  const foreignDotLayer  = useRef<L.LayerGroup | null>(null);
  const moveDotRefs      = useRef<Map<string, L.CircleMarker>>(new Map());
  const targetLayerRef   = useRef<L.LayerGroup | null>(null);

  const {
    mapData, loading, error,
    dispatch, fetchMap, setDispatch, resetDispatch, sendScout, recallScout,
    deployUnit, undeployUnit, marchTroops,
    equipDie, equippedDieInstanceId,
    battles, battlesLoading, fetchBattles,
    launchStrike,
  } = useCommanderStore();
  const { items: inventoryItems, refresh: refreshInventory } = useInventoryStore();
  const userId = useAuthStore((s) => s.user?.id);

  // ---- Scout dispatch UI state ------------------------------------------------
  const [selectedUnit, setSelectedUnit]           = useState<InventoryItem | null>(null);
  const [originTerritoryId, setOriginTerritoryId] = useState<string>('');
  const [targetCell, setTargetCell]               = useState<string | null>(null);
  const [buildRadar, setBuildRadar]               = useState(false);
  const [dispatchError, setDispatchError]         = useState<string | null>(null);
  const [recallErrors, setRecallErrors]           = useState<Record<string, string>>({});

  // ---- Territory panel --------------------------------------------------------
  const [terrPanel, setTerrPanel]         = useState<TerritoryPanelMode>({ type: 'none' });
  const [deployError, setDeployError]     = useState<string | null>(null);
  const [deployPending, setDeployPending] = useState(false);
  const [deployPickerId, setDeployPickerId] = useState<string | null>(null); // selected unit in picker

  // ---- Attack flow state ------------------------------------------------------
  const [attackMode, setAttackMode]             = useState(false);
  const [attackTargetId, setAttackTargetId]     = useState<string>('');
  const [attackSelectedIds, setAttackSelectedIds] = useState<Set<string>>(new Set());
  const [attackOriginId, setAttackOriginId]     = useState<string>('');
  const [attackError, setAttackError]           = useState<string | null>(null);
  const [attackPending, setAttackPending]       = useState(false);

  // ---- Battles UI -------------------------------------------------------------
  const [battlesOpen, setBattlesOpen]         = useState(false);
  const [replayBattleId, setReplayBattleId]   = useState<string | null>(null);

  // ---- Dice pouch UI ----------------------------------------------------------
  const [diceError, setDiceError]   = useState<string | null>(null);
  const [dicePending, setDicePending] = useState<string | null>(null);

  // ---- Airstrike flow UI (Phase C.3) ------------------------------------------
  const [strikeMode, setStrikeMode]           = useState(false);
  const [strikeOriginId, setStrikeOriginId]   = useState<string>('');
  const [strikeTargetId, setStrikeTargetId]   = useState<string>('');
  const [siloPickerId, setSiloPickerId]       = useState<string | null>(null); // selected silo territory_id
  const [strikeError, setStrikeError]         = useState<string | null>(null);
  const [strikePending, setStrikePending]     = useState(false);
  const [strikeToast, setStrikeToast]         = useState<string | null>(null);

  // ---- Boot -------------------------------------------------------------------
  useEffect(() => {
    void fetchMap();
    void refreshInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => { void fetchMap(); }, 30_000);
    return () => window.clearInterval(id);
  }, [fetchMap]);

  // Fetch battles once on mount + when section opens
  useEffect(() => {
    if (battlesOpen) void fetchBattles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battlesOpen]);

  // ---- Init Leaflet -----------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
      .setView([52.52, 13.405], 13);
    mapRef.current = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dark-tiles commander-tiles',
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    hexLayerRef.current     = L.layerGroup().addTo(map);
    terrLayerRef.current    = L.layerGroup().addTo(map);
    radarLayerRef.current   = L.layerGroup().addTo(map);
    moveLayerRef.current    = L.layerGroup().addTo(map);
    foreignDotLayer.current = L.layerGroup().addTo(map);
    targetLayerRef.current  = L.layerGroup().addTo(map);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ---- Map click: scout target OR territory select ----------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function onMapClick(e: L.LeafletMouseEvent) {
      if (dispatch.phase === 'picking-target') {
        const cell = h3.latLngToCell(e.latlng.lat, e.latlng.lng, 8);
        setTargetCell(cell);
        const tLayer = targetLayerRef.current;
        if (tLayer) {
          tLayer.clearLayers();
          L.polygon(cellToLeafletLatLngs(cell), {
            color: C_AMBER, weight: 2.5, fillColor: C_AMBER, fillOpacity: 0.2,
          }).addTo(tLayer);
        }
      }
    }

    map.on('click', onMapClick);
    return () => { map.off('click', onMapClick); };
  }, [dispatch.phase]);

  // ---- Render hex grid --------------------------------------------------------
  useEffect(() => {
    const layer = hexLayerRef.current;
    if (!layer || !mapData) return;
    layer.clearLayers();
    for (const cell of mapData.visible_cells) {
      L.polygon(cellToLeafletLatLngs(cell), {
        color: C_VIS_BORDER, weight: 0.8, fillColor: C_VIS_FILL, fillOpacity: 1, opacity: 0.5,
      }).addTo(layer);
    }
  }, [mapData?.visible_cells]);

  // ---- Render territories (clickable) -----------------------------------------
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
          color: stroke, weight: 1.5, fillColor, fillOpacity: 1,
        });
        const ownerLabel = terr.owner_username ?? (terr.owner_id ? 'Unknown' : 'Unclaimed');
        poly.bindTooltip(
          `<strong>${ownerLabel}</strong>${terr.claim_value ? ` · ${terr.claim_value}` : ''}`,
          { sticky: true },
        );
        poly.on('click', () => {
          setDeployError(null);
          setAttackError(null);
          setAttackMode(false);
          if (own) {
            setTerrPanel({ type: 'own', territoryId: terr.id });
          } else {
            setTerrPanel({ type: 'foreign', territoryId: terr.id });
          }
        });
        poly.addTo(layer);
      }
    }

    const allCells = mapData.territories.flatMap((t) => t.h3_cells).concat(mapData.visible_cells);
    if (allCells.length > 0 && mapRef.current) {
      try {
        const bounds = allCells.map((c) => cellCenter(c));
        const lbounds = L.latLngBounds(bounds);
        if (lbounds.isValid()) mapRef.current.fitBounds(lbounds, { padding: [40, 40], maxZoom: 15 });
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData?.territories, userId]);

  // ---- Render radars ----------------------------------------------------------
  useEffect(() => {
    const layer = radarLayerRef.current;
    if (!layer || !mapData) return;
    layer.clearLayers();
    for (const radar of mapData.radars) {
      for (const cell of radar.cells) {
        const [lat, lng] = cellCenter(cell);
        L.circle([lat, lng], {
          radius: 60, color: C_AMBER, weight: 2,
          fillColor: C_AMBER, fillOpacity: 0.12,
        }).bindTooltip(radar.covert ? 'Covert Radar' : 'Radar', { sticky: true }).addTo(layer);
      }
    }
  }, [mapData?.radars]);

  // ---- Render own movements + foreign spotted dots ----------------------------
  useEffect(() => {
    const layer = moveLayerRef.current;
    const fdLayer = foreignDotLayer.current;
    if (!layer || !fdLayer || !mapData) return;
    layer.clearLayers();
    fdLayer.clearLayers();
    moveDotRefs.current.clear();

    for (const mv of mapData.movements) {
      // Foreign spotted movement: red pulsing dot at current_cell
      if (mv.is_own === false) {
        const cell = mv.current_cell;
        if (!cell) continue;
        const [lat, lng] = cellCenter(cell);
        const dot = L.circleMarker([lat, lng], {
          radius: 9, color: C_RED_PULSE, fillColor: C_RED_PULSE, fillOpacity: 0.85, weight: 2,
        });
        const etaStr = mv.eta ? `ETA ${new Date(mv.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';
        dot.bindTooltip(`Enemy movement spotted · ${etaStr}`, { sticky: true });
        dot.addTo(fdLayer);
        continue;
      }

      // Own movements
      if (mv.path.length < 2) continue;
      const pathLatLngs = mv.path.map(cellCenter);

      L.polyline(pathLatLngs, {
        color: mv.purpose === 'attack' ? C_RED_PULSE : (mv.purpose === 'scout' ? C_ACCENT : C_FOREIGN),
        weight: 2, opacity: 0.7, dashArray: '6 4',
      }).addTo(layer);

      const progress = computeProgress(mv.departs_at, mv.arrives_at);
      const dotPos   = interpolatePath(mv.path, progress);
      const isReturn = mv.purpose === 'return';

      const dot = L.circleMarker(dotPos, {
        radius: 7,
        color: isReturn ? '#7A5EB0' : (mv.purpose === 'attack' ? C_RED_PULSE : C_ACCENT),
        fillColor: isReturn ? '#7A5EB0' : (mv.purpose === 'attack' ? C_RED_PULSE : C_ACCENT),
        fillOpacity: isReturn ? 0.5 : 0.9, weight: 2,
      });
      dot.bindTooltip(
        `${mv.purpose.charAt(0).toUpperCase() + mv.purpose.slice(1)} · ${mv.status}`,
        { sticky: true },
      );
      dot.addTo(layer);
      moveDotRefs.current.set(mv.id, dot);
    }
  }, [mapData?.movements]);

  // ---- Tick: update movement dot positions ------------------------------------
  useEffect(() => {
    if (!mapData) return;
    const id = window.setInterval(() => {
      for (const mv of mapData.movements) {
        if (!mv.is_own) continue;
        const dot = moveDotRefs.current.get(mv.id);
        if (!dot || mv.path.length < 2) continue;
        const progress = computeProgress(mv.departs_at, mv.arrives_at);
        dot.setLatLng(interpolatePath(mv.path, progress));
      }
    }, 1_000);
    return () => window.clearInterval(id);
  }, [mapData]);

  // ---- Clear target highlight on phase change ---------------------------------
  useEffect(() => {
    if (dispatch.phase !== 'picking-target') {
      targetLayerRef.current?.clearLayers();
      setTargetCell(null);
    }
  }, [dispatch.phase]);

  // ---- Countdown ticker -------------------------------------------------------
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, []);

  // ---- Derived data -----------------------------------------------------------
  const unitItems   = inventoryItems.filter((i) => isUnitItem(i) && i.status === 'inventory');
  const diceItems   = inventoryItems.filter((i) => isDiceItem(i));
  const ownTerrs    = mapData?.territories.filter((t) => t.is_own || (userId != null && t.owner_id === userId)) ?? [];
  const allTerrs    = mapData?.territories ?? [];
  const activeMovements = mapData?.movements ?? [];
  const garrisons   = mapData?.garrisons ?? [];
  const silos       = mapData?.silos ?? [];

  /** Own silos that are ready now (ready_at null or in the past) */
  function getReadySilos(): SiloInfo[] {
    return silos.filter((s) => {
      if (!s.ready_at) return true;
      return new Date(s.ready_at).getTime() <= Date.now();
    });
  }

  /** Format silo damage for a given tier: 50/75/100 */
  function siloDamage(tier: number): number {
    return [0, 50, 75, 100][tier] ?? 50;
  }

  function formatReadyAt(readyAt: string | null): string {
    if (!readyAt) return 'Ready';
    const ms = new Date(readyAt).getTime() - Date.now();
    if (ms <= 0) return 'Ready';
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function resultToastMessage(result: AirstrikeResult['result']): string {
    if ('shield_broken' in result && result.shield_broken) return '🛡 Shield destroyed!';
    if ('building_hit' in result) {
      const hit = result.building_hit;
      if (hit.destroyed) return `🏚 ${hit.type.replace(/_/g, ' ')} destroyed!`;
      return `🏚 ${hit.type.replace(/_/g, ' ')} hit — ${hit.hp_after} HP left.`;
    }
    return '☁ No targets — strike wasted.';
  }

  function garrisonForTerritory(terrId: string) {
    return garrisons.find((g) => g.territory_id === terrId) ?? null;
  }

  // ---- Scout dispatch handlers ------------------------------------------------
  function handleStartDispatch() {
    setDispatchError(null);
    setSelectedUnit(null);
    setOriginTerritoryId(ownTerrs[0]?.id ?? '');
    setBuildRadar(false);
    setDispatch({ phase: 'picking-unit' });
    setTerrPanel({ type: 'none' });
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
      instanceId: selectedUnit.id, fromTerritoryId: originTerritoryId, targetCell, buildRadar,
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

  // ---- Grid distance estimate -------------------------------------------------
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

  // ---- Attack cost estimate ---------------------------------------------------
  function getAttackEstimate(): { cells: number; cost: number; eta: string } | null {
    if (!attackTargetId || !attackOriginId) return null;
    const originTerr = ownTerrs.find((t) => t.id === attackOriginId);
    const targetTerr = allTerrs.find((t) => t.id === attackTargetId);
    if (!originTerr || !targetTerr) return null;
    if (originTerr.h3_cells.length === 0 || targetTerr.h3_cells.length === 0) return null;
    try {
      const dist = h3.gridDistance(originTerr.h3_cells[0], targetTerr.h3_cells[0]);
      if (dist < 0) return null;
      const unitCount = attackSelectedIds.size;
      const cost = dist * unitCount;
      const etaMins = dist * 6;
      const eta = etaMins < 60 ? `${etaMins}min` : `${Math.floor(etaMins / 60)}h ${etaMins % 60}min`;
      return { cells: dist, cost, eta };
    } catch { return null; }
  }

  // ---- Garrison deploy handlers -----------------------------------------------
  async function handleDeploy() {
    if (!deployPickerId || terrPanel.type !== 'own') return;
    setDeployPending(true);
    setDeployError(null);
    const result = await deployUnit(deployPickerId, terrPanel.territoryId);
    setDeployPending(false);
    if (!result.ok) {
      setDeployError(result.error ?? 'Deploy failed');
    } else {
      setDeployPickerId(null);
      await refreshInventory();
    }
  }

  async function handleUndeploy(instanceId: string) {
    setDeployError(null);
    const result = await undeployUnit(instanceId);
    if (!result.ok) setDeployError(result.error ?? 'Undeploy failed');
    else await refreshInventory();
  }

  // ---- March / attack handlers ------------------------------------------------
  function openAttackFlow(targetTerritoryId: string) {
    setAttackTargetId(targetTerritoryId);
    setAttackSelectedIds(new Set());
    setAttackOriginId(ownTerrs[0]?.id ?? '');
    setAttackError(null);
    setAttackMode(true);
    setTerrPanel({ type: 'none' });
  }

  async function handleMarch() {
    if (attackSelectedIds.size === 0 || !attackOriginId || !attackTargetId) {
      setAttackError('Select at least one unit, origin and target.');
      return;
    }
    setAttackPending(true);
    setAttackError(null);
    const result = await marchTroops({
      instanceIds: Array.from(attackSelectedIds),
      fromTerritoryId: attackOriginId,
      targetTerritoryId: attackTargetId,
      purpose: 'attack',
    });
    setAttackPending(false);
    if (!result.ok) {
      setAttackError(result.error ?? 'March failed');
    } else {
      setAttackMode(false);
      setAttackSelectedIds(new Set());
      if (result.teleport) {
        setStrikeToast('🌀 Teleported.');
        window.setTimeout(() => setStrikeToast(null), 4000);
      }
    }
  }

  // ---- Dice equip handler -----------------------------------------------------
  async function handleEquipDie(instanceId: string) {
    setDicePending(instanceId);
    setDiceError(null);
    const result = await equipDie(instanceId);
    setDicePending(null);
    if (!result.ok) setDiceError(result.error ?? 'Equip failed');
  }

  // ---- Airstrike handlers (Phase C.3) -----------------------------------------
  function openStrikeFlow(targetTerritoryId: string) {
    const readySilos = getReadySilos();
    setStrikeTargetId(targetTerritoryId);
    setStrikeOriginId(readySilos[0]?.territory_id ?? ownTerrs[0]?.id ?? '');
    setSiloPickerId(readySilos.length === 1 ? readySilos[0].territory_id : null);
    setStrikeError(null);
    setStrikeMode(true);
    setTerrPanel({ type: 'none' });
  }

  async function handleStrike() {
    const selectedSiloTerrId = siloPickerId ?? strikeOriginId;
    if (!selectedSiloTerrId || !strikeTargetId) {
      setStrikeError('Select a silo origin and a target territory.');
      return;
    }
    setStrikePending(true);
    setStrikeError(null);
    const res = await launchStrike(selectedSiloTerrId, strikeTargetId);
    setStrikePending(false);
    if (!res.ok) {
      setStrikeError(res.error);
    } else {
      setStrikeMode(false);
      setSiloPickerId(null);
      const msg = resultToastMessage(res.result.result);
      setStrikeToast(msg);
      window.setTimeout(() => setStrikeToast(null), 5000);
    }
  }

  // ---- Styles -----------------------------------------------------------------

  const panelBase: React.CSSProperties = {
    position: 'absolute', top: 0, bottom: 0, width: 288,
    background: theme.color.panel, borderRight: `1px solid ${theme.color.border}`,
    zIndex: 700, overflowY: 'auto', padding: '14px 14px',
    display: 'flex', flexDirection: 'column', gap: 10,
  };
  const rightPanel: React.CSSProperties = {
    ...panelBase, left: 'auto', right: 0, borderRight: 'none',
    borderLeft: `1px solid ${theme.color.border}`, width: 300,
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: theme.color.textDim, marginBottom: 4,
  };
  const btnAccent: React.CSSProperties = {
    width: '100%', background: theme.color.accent, color: '#fff',
    border: 'none', borderRadius: theme.radius, padding: '9px 0',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
  };
  const btnOutline: React.CSSProperties = {
    width: '100%', background: 'transparent', color: theme.color.textDim,
    border: `1px solid ${theme.color.border}`, borderRadius: theme.radius,
    padding: '7px 0', fontWeight: 600, fontSize: 12, cursor: 'pointer',
  };
  const btnDanger: React.CSSProperties = {
    ...btnOutline, color: theme.color.danger, borderColor: theme.color.danger,
    width: 'auto', padding: '4px 10px', fontSize: 12,
  };
  const btnSmall: React.CSSProperties = {
    background: 'transparent', color: theme.color.textDim,
    border: `1px solid ${theme.color.border}`, borderRadius: 8,
    padding: '4px 10px', cursor: 'pointer', fontSize: 12,
  };
  const itemCard: React.CSSProperties = {
    background: theme.color.panelAlt, border: `1px solid ${theme.color.border}`,
    borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 13,
  };
  const itemCardSelected: React.CSSProperties = {
    ...itemCard, borderColor: theme.color.accent, background: `${theme.color.accent}22`,
  };
  const mvCard: React.CSSProperties = {
    background: theme.color.panelAlt, border: `1px solid ${theme.color.border}`,
    borderRadius: 8, padding: '10px 12px', fontSize: 12,
    display: 'flex', flexDirection: 'column', gap: 4,
  };
  const progressBarOuter: React.CSSProperties = {
    height: 4, background: theme.color.border,
    borderRadius: 999, overflow: 'hidden', marginTop: 4,
  };

  // ---- OWN territory panel content --------------------------------------------
  function renderOwnTerritoryPanel(territoryId: string) {
    const terr = ownTerrs.find((t) => t.id === territoryId);
    if (!terr) return <div className="muted">Territory not found.</div>;
    const garrison = garrisonForTerritory(territoryId);
    const garrisonCount = garrison?.count ?? 0;
    const garrisonUnits = garrison?.units ?? [];
    const availableUnits = unitItems;

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: theme.color.accentBright }}>
            🏰 Own Territory
          </div>
          <button style={btnSmall} onClick={() => setTerrPanel({ type: 'none' })}>✕</button>
        </div>

        <div style={{ fontSize: 12, color: theme.color.textDim }}>
          {terr.h3_cells.length} hex{terr.h3_cells.length !== 1 ? 'es' : ''} · {terr.claim_value} cv
        </div>

        {deployError && (
          <div style={{ color: theme.color.danger, fontSize: 12 }}>{deployError}</div>
        )}

        {/* Garrison */}
        <div style={sectionLabel}>Garrison {garrisonCount}/6</div>
        {garrisonUnits.length === 0 ? (
          <div className="muted" style={{ fontSize: 12 }}>No units garrisoned.</div>
        ) : (
          garrisonUnits.map((u) => (
            <div key={u.instance_id} style={{
              ...mvCard, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {prettifyDefinitionId(u.definition_id)}
              </span>
              <button
                style={btnDanger}
                onClick={() => void handleUndeploy(u.instance_id)}
              >
                Undeploy
              </button>
            </div>
          ))
        )}

        {/* Deploy picker */}
        {garrisonCount < 6 && availableUnits.length > 0 && (
          <>
            <div style={{ ...sectionLabel, marginTop: 4 }}>+ Deploy Unit</div>
            {availableUnits.map((item) => (
              <div
                key={item.id}
                style={deployPickerId === item.id ? itemCardSelected : itemCard}
                onClick={() => setDeployPickerId(item.id)}
              >
                <div style={{ fontWeight: 600, fontSize: 12 }}>{prettifyDefinitionId(item.definition_id)}</div>
                <div style={{ fontSize: 11, color: colorForRarity(item.rarity) }}>{item.rarity}</div>
              </div>
            ))}
            {deployPickerId && (
              <button
                style={{ ...btnAccent, opacity: deployPending ? 0.6 : 1 }}
                disabled={deployPending}
                onClick={() => void handleDeploy()}
              >
                {deployPending ? 'Deploying…' : 'Confirm Deploy'}
              </button>
            )}
          </>
        )}

        {garrisonCount >= 6 && (
          <div style={{ fontSize: 12, color: theme.color.amber }}>Garrison full (6/6).</div>
        )}
        {availableUnits.length === 0 && garrisonCount < 6 && (
          <div className="muted" style={{ fontSize: 12 }}>No units in inventory.</div>
        )}

        {/* Silo status for this territory */}
        {silos.filter((s) => s.territory_id === territoryId).map((s) => (
          <div key={s.territory_id} style={{
            ...mvCard, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            borderColor: !s.ready_at || new Date(s.ready_at).getTime() <= Date.now()
              ? theme.color.accent : theme.color.border,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12 }}>☄ Silo Tier {'I'.repeat(s.tier)}</div>
              <div style={{ fontSize: 10, color: theme.color.textDim }}>
                {siloDamage(s.tier)} damage on hit
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: !s.ready_at || new Date(s.ready_at).getTime() <= Date.now()
                ? theme.color.success : theme.color.amber,
            }}>
              {formatReadyAt(s.ready_at)}
            </span>
          </div>
        ))}
      </>
    );
  }

  // ---- FOREIGN territory panel content ----------------------------------------
  function renderForeignTerritoryPanel(territoryId: string) {
    const terr = allTerrs.find((t) => t.id === territoryId);
    if (!terr) return <div className="muted">Territory not found.</div>;
    const garrison = garrisonForTerritory(territoryId);
    const garrisonCount = garrison?.count ?? 0;
    const ownerLabel = terr.owner_username ?? (terr.owner_id ? 'Unknown' : 'Unclaimed');

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: theme.color.foreign }}>
            🎯 Foreign Territory
          </div>
          <button style={btnSmall} onClick={() => setTerrPanel({ type: 'none' })}>✕</button>
        </div>

        <div style={{ fontSize: 13, color: theme.color.text }}>
          Owner: <strong>{ownerLabel}</strong>
        </div>
        <div style={{ fontSize: 12, color: theme.color.textDim }}>
          Garrison: {garrisonCount > 0 ? `${garrisonCount} unit${garrisonCount !== 1 ? 's' : ''}` : 'Unknown'} (fog of war)
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button
            style={{ ...btnAccent, background: theme.color.danger, flex: 1 }}
            onClick={() => openAttackFlow(territoryId)}
          >
            ⚔ Attack
          </button>
          {getReadySilos().length > 0 && (
            <button
              style={{ ...btnAccent, background: '#7B2D8B', flex: 1 }}
              onClick={() => openStrikeFlow(territoryId)}
            >
              ☄ Airstrike
            </button>
          )}
        </div>
        {silos.length > 0 && getReadySilos().length === 0 && (
          <div style={{ fontSize: 11, color: theme.color.textDim, marginTop: 4 }}>
            ☄ Silo is reloading…
          </div>
        )}
      </>
    );
  }

  // ---- Attack flow panel ------------------------------------------------------
  function renderAttackFlow() {
    const targetTerr = allTerrs.find((t) => t.id === attackTargetId);
    const attackEst = getAttackEstimate();

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: theme.color.danger }}>
            ⚔ Attack
          </div>
          <button style={btnSmall} onClick={() => setAttackMode(false)}>✕</button>
        </div>

        <div style={{ fontSize: 12, color: theme.color.textDim }}>
          Target: <strong style={{ color: theme.color.foreign }}>
            {targetTerr?.owner_username ?? attackTargetId.slice(0, 8)}…
          </strong>
        </div>

        {attackError && (
          <div style={{ color: theme.color.danger, fontSize: 12 }}>{attackError}</div>
        )}

        {/* Select units */}
        <div style={sectionLabel}>Select Units (1–6)</div>
        {unitItems.length === 0 ? (
          <div className="muted" style={{ fontSize: 12 }}>No units in inventory.</div>
        ) : (
          unitItems.map((item) => {
            const sel = attackSelectedIds.has(item.id);
            return (
              <div
                key={item.id}
                style={sel ? itemCardSelected : itemCard}
                onClick={() => {
                  setAttackSelectedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else if (next.size < 6) next.add(item.id);
                    return next;
                  });
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{prettifyDefinitionId(item.definition_id)}</span>
                  <span style={{
                    fontSize: 10, background: theme.color.border,
                    borderRadius: 4, padding: '2px 5px', color: theme.color.textDim,
                  }}>
                    {unitDomain(item.definition_id)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: colorForRarity(item.rarity) }}>{item.rarity}</div>
              </div>
            );
          })
        )}

        {/* Origin select */}
        <div style={{ ...sectionLabel, marginTop: 4 }}>Origin Territory</div>
        {ownTerrs.length === 0 ? (
          <div className="muted" style={{ fontSize: 12 }}>No territories.</div>
        ) : (
          <select
            value={attackOriginId}
            onChange={(e) => setAttackOriginId(e.target.value)}
            style={{
              width: '100%', background: theme.color.panelAlt, color: theme.color.text,
              border: `1px solid ${theme.color.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 12,
            }}
          >
            {ownTerrs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.owner_username ?? 'Yours'} ({t.h3_cells.length} hex)
              </option>
            ))}
          </select>
        )}

        {/* Cost estimate */}
        {attackEst && attackSelectedIds.size > 0 && (
          <div style={{
            background: theme.color.panelAlt, border: `1px solid ${theme.color.border}`,
            borderRadius: 8, padding: '8px 10px', fontSize: 12,
          }}>
            <div style={{ color: theme.color.amber }}>
              ⚡ Cost: {attackEst.cost} Energy ({attackEst.cells} cells × {attackSelectedIds.size} units)
            </div>
            <div style={{ color: theme.color.textDim, marginTop: 2 }}>
              ETA: {attackEst.eta}
            </div>
          </div>
        )}

        <button
          style={{
            ...btnAccent,
            background: theme.color.danger,
            opacity: (attackSelectedIds.size === 0 || !attackOriginId || attackPending) ? 0.5 : 1,
          }}
          disabled={attackSelectedIds.size === 0 || !attackOriginId || attackPending}
          onClick={() => void handleMarch()}
        >
          {attackPending ? 'Sending…' : `⚔ March (${attackSelectedIds.size} unit${attackSelectedIds.size !== 1 ? 's' : ''})`}
        </button>

        <button style={btnOutline} onClick={() => setAttackMode(false)}>Cancel</button>
      </>
    );
  }

  // ---- Airstrike flow panel ---------------------------------------------------
  function renderStrikeFlow() {
    const targetTerr = allTerrs.find((t) => t.id === strikeTargetId);
    const readySilos = getReadySilos();
    const selectedSilo = readySilos.find((s) => s.territory_id === (siloPickerId ?? strikeOriginId));
    const damage = selectedSilo ? siloDamage(selectedSilo.tier) : '?';

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#D4A5FF' }}>
            ☄ Airstrike
          </div>
          <button style={btnSmall} onClick={() => setStrikeMode(false)}>✕</button>
        </div>

        <div style={{ fontSize: 12, color: theme.color.textDim }}>
          Target: <strong style={{ color: theme.color.foreign }}>
            {targetTerr?.owner_username ?? strikeTargetId.slice(0, 8)}…
          </strong>
        </div>

        {strikeError && (
          <div style={{ color: theme.color.danger, fontSize: 12 }}>{strikeError}</div>
        )}

        {/* Silo picker — show when >1 ready silo */}
        {readySilos.length > 1 && (
          <>
            <div style={sectionLabel}>Select Silo</div>
            {readySilos.map((s) => {
              const siloTerrName = ownTerrs.find((t) => t.id === s.territory_id)?.owner_username ?? s.territory_id.slice(0, 8);
              const selected = (siloPickerId ?? strikeOriginId) === s.territory_id;
              return (
                <div
                  key={s.territory_id}
                  style={selected ? itemCardSelected : itemCard}
                  onClick={() => { setSiloPickerId(s.territory_id); setStrikeOriginId(s.territory_id); }}
                >
                  <div style={{ fontWeight: 600, fontSize: 12 }}>
                    ☄ Tier {'I'.repeat(s.tier)} — {siloTerrName}
                  </div>
                  <div style={{ fontSize: 11, color: theme.color.textDim }}>
                    {siloDamage(s.tier)} dmg · Ready
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Range / cost hint */}
        <div style={{
          background: theme.color.panelAlt, border: `1px solid ${theme.color.border}`,
          borderRadius: 8, padding: '8px 10px', fontSize: 12,
        }}>
          <div style={{ color: theme.color.amber }}>⚡ Cost: 150 Energy · Range: 40 cells</div>
          <div style={{ color: theme.color.textDim, marginTop: 2 }}>
            Damage: {damage} HP · Cooldown: 6h after launch
          </div>
        </div>

        <button
          style={{
            ...btnAccent, background: '#7B2D8B',
            opacity: (strikePending || readySilos.length === 0) ? 0.5 : 1,
          }}
          disabled={strikePending || readySilos.length === 0}
          onClick={() => void handleStrike()}
        >
          {strikePending ? 'Launching…' : '☄ Launch Strike'}
        </button>

        <button style={btnOutline} onClick={() => setStrikeMode(false)}>Cancel</button>
      </>
    );
  }

  // ---- Dice pouch panel -------------------------------------------------------
  function renderDicePouch() {
    if (diceItems.length === 0) return null;

    return (
      <>
        <div style={{ height: 1, background: theme.color.border, margin: '6px 0' }} />
        <div style={sectionLabel}>Dice Pouch</div>
        {diceError && <div style={{ color: theme.color.danger, fontSize: 12 }}>{diceError}</div>}
        {diceItems.map((item) => {
          const isEquipped = equippedDieInstanceId === item.id ||
            (item.state?.equipped === true);
          return (
            <div key={item.id} style={{
              ...mvCard,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              borderColor: isEquipped ? theme.color.accent : theme.color.border,
              background: isEquipped ? `${theme.color.accent}18` : theme.color.panelAlt,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: colorForRarity(item.rarity) }}>
                  🎲 {prettifyDefinitionId(item.definition_id)}
                </div>
                <div style={{ fontSize: 10, color: theme.color.textDim }}>{item.rarity}</div>
              </div>
              {isEquipped ? (
                <span style={{ fontSize: 10, color: theme.color.accent, fontWeight: 700 }}>EQUIPPED</span>
              ) : (
                <button
                  style={{ ...btnSmall, opacity: dicePending === item.id ? 0.6 : 1 }}
                  disabled={dicePending === item.id}
                  onClick={() => void handleEquipDie(item.id)}
                >
                  {dicePending === item.id ? '…' : 'Equip'}
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  }

  // ---- Left panel content switch ----------------------------------------------
  function renderLeftPanel() {
    // Strike flow takes priority over attack
    if (strikeMode) return renderStrikeFlow();

    // Attack flow
    if (attackMode) return renderAttackFlow();

    // Territory panel
    if (terrPanel.type === 'own') return renderOwnTerritoryPanel(terrPanel.territoryId);
    if (terrPanel.type === 'foreign') return renderForeignTerritoryPanel(terrPanel.territoryId);

    // Scout dispatch flow
    if (dispatch.phase === 'picking-unit') return (
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
    );

    if (dispatch.phase === 'picking-target') return (
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
              width: '100%', background: theme.color.panelAlt, color: theme.color.text,
              border: `1px solid ${theme.color.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 13,
            }}
          >
            {ownTerrs.map((t) => (
              <option key={t.id} value={t.id}>{t.owner_username ?? 'Yours'} ({t.h3_cells.length} hex)</option>
            ))}
          </select>
        )}
        <div style={{ ...sectionLabel, marginTop: 6 }}>Target Cell</div>
        {targetCell ? (
          <>
            <div style={{ ...itemCard, cursor: 'default', color: theme.color.amber, fontFamily: 'monospace', fontSize: 11 }}>
              {targetCell}
            </div>
            {estimate && <div className="muted" style={{ fontSize: 11 }}>{estimate}</div>}
          </>
        ) : (
          <div className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>Click the map to set target</div>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
          <input type="checkbox" checked={buildRadar} onChange={(e) => setBuildRadar(e.target.checked)} />
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
    );

    if (dispatch.phase === 'sending') return (
      <div className="muted" style={{ textAlign: 'center', padding: 12 }}>Deploying scout…</div>
    );

    // Idle: show action buttons + own territory list
    return (
      <>
        {dispatchError && <div className="panel-error" style={{ margin: 0 }}>{dispatchError}</div>}
        <button style={btnAccent} onClick={handleStartDispatch}>Deploy Scout</button>
        <div style={{ ...sectionLabel, marginTop: 8 }}>Own Territories</div>
        {ownTerrs.length === 0 ? (
          <div className="muted">No territories yet. Click a hex to start.</div>
        ) : (
          ownTerrs.map((t) => {
            const g = garrisonForTerritory(t.id);
            const hasSilo = silos.some((s) => s.territory_id === t.id);
            const siloReady = hasSilo && getReadySilos().some((s) => s.territory_id === t.id);
            return (
              <div
                key={t.id}
                style={{ ...itemCard }}
                onClick={() => setTerrPanel({ type: 'own', territoryId: t.id })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{t.owner_username ?? 'Yours'}</span>
                  {hasSilo && (
                    <span style={{ fontSize: 12, color: siloReady ? theme.color.success : theme.color.textDim }}
                      title={siloReady ? 'Silo ready' : 'Silo reloading'}>
                      ☄
                    </span>
                  )}
                </div>
                <div className="muted" style={{ fontSize: 11 }}>
                  {t.h3_cells.length} hex · {t.claim_value} cv
                  {g ? ` · 🏰 ${g.count}/6` : ''}
                </div>
              </div>
            );
          })
        )}
        {renderDicePouch()}
      </>
    );
  }

  // ---- Render -----------------------------------------------------------------
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Leaflet container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {loading && !mapData && <div className="map-loading">Loading Commander…</div>}
      {error && <div className="map-loading" style={{ color: theme.color.danger }}>{error}</div>}

      {/* ---- LEFT PANEL ---- */}
      <div style={panelBase}>
        <div style={{ fontWeight: 700, fontSize: 15, color: theme.color.accentBright, letterSpacing: '0.04em' }}>
          ◈ Commander
        </div>
        {renderLeftPanel()}
      </div>

      {/* ---- RIGHT PANEL ---- */}
      <div style={rightPanel}>
        <div style={{ fontWeight: 700, fontSize: 13, color: theme.color.accentBright, letterSpacing: '0.04em' }}>
          Active Movements
        </div>

        {/* Foreign spotted movements note */}
        {activeMovements.some((m) => !m.is_own) && (
          <div style={{ fontSize: 11, color: theme.color.danger }}>
            ⚠ Enemy movements spotted on map
          </div>
        )}

        {activeMovements.filter((m) => m.is_own !== false).length === 0 ? (
          <div className="muted">No active movements.</div>
        ) : (
          activeMovements
            .filter((mv) => mv.is_own !== false)
            .map((mv) => (
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

        {/* Battles section */}
        <div style={{ height: 1, background: theme.color.border, margin: '6px 0' }} />
        <button
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', padding: 0,
          }}
          onClick={() => setBattlesOpen((o) => !o)}
        >
          <span style={{ fontWeight: 700, fontSize: 13, color: theme.color.accentBright }}>
            ⚔ Battles
          </span>
          <span style={{ color: theme.color.textDim, fontSize: 12 }}>{battlesOpen ? '▲' : '▼'}</span>
        </button>

        {battlesOpen && (
          <>
            {battlesLoading && <div className="muted" style={{ fontSize: 12 }}>Loading…</div>}
            {battles.length === 0 && !battlesLoading && (
              <div className="muted" style={{ fontSize: 12 }}>No battles yet.</div>
            )}
            {battles.map((b) => {
              const isAtk = b.attacker_id === userId;
              const isAirstrike = b.type === 'airstrike';
              const won = b.winner_side != null && (
                (isAtk && b.winner_side === 'attacker') ||
                (!isAtk && b.winner_side === 'defender')
              );
              return (
                <div
                  key={b.id}
                  style={{
                    ...mvCard, cursor: 'pointer',
                    borderColor: won ? `${theme.color.success}55` : `${theme.color.danger}44`,
                  }}
                  onClick={() => setReplayBattleId(b.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>
                      {isAirstrike ? '☄ Airstrike' : (isAtk ? '⚔ Attack' : '🛡 Defense')}
                    </span>
                    <span style={{ fontSize: 11, color: won ? theme.color.success : theme.color.danger, fontWeight: 700 }}>
                      {isAirstrike ? '☄' : (b.winner_side == null ? '—' : won ? 'WIN' : 'LOSS')}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: theme.color.textDim }}>
                    {timeAgo(b.created_at)}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Battle Replay Modal */}
      {replayBattleId && (
        <BattleReplayModal
          battleId={replayBattleId}
          onClose={() => setReplayBattleId(null)}
        />
      )}

      {/* Airstrike result toast */}
      {strikeToast && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: theme.color.panel, border: `1px solid ${theme.color.border}`,
          borderRadius: 12, padding: '10px 20px', zIndex: 800,
          fontWeight: 700, fontSize: 14, color: theme.color.text,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          {strikeToast}
        </div>
      )}
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
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const msLeft = new Date(mv.arrives_at).getTime() - Date.now();
  const progress = computeProgress(mv.departs_at, mv.arrives_at);
  const isRecallable = mv.purpose === 'scout' && mv.status === 'marching';
  const icon = PURPOSE_ICONS[mv.purpose] ?? '•';
  const dotColor = mv.purpose === 'attack' ? theme.color.danger : theme.color.accent;

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
      <div style={progressBarOuter}>
        <div style={{
          height: '100%', width: `${Math.round(progress * 100)}%`,
          background: mv.purpose === 'return' ? theme.color.textDim : dotColor,
          borderRadius: 999, transition: 'width 1s linear',
        }} />
      </div>
      {isRecallable && (
        <button style={{ ...btnDanger, marginTop: 4 }} onClick={onRecall}>Recall</button>
      )}
      {recallError && (
        <div style={{ color: theme.color.danger, fontSize: 11, marginTop: 2 }}>{recallError}</div>
      )}
    </div>
  );
}
