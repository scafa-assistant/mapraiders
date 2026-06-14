import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MapView, {
  Polygon,
  Polyline,
  Marker,
  PROVIDER_GOOGLE,
  MapPressEvent,
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { latLngToCell } from 'h3-js';
import type { CommanderMapScreenProps } from '../../navigation/types';
import { useCommanderStore } from '../../store/commanderStore';
import { useInventoryStore, ItemInstance } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { useFeatureStore } from '../../store/featureStore';
import { useBuildingStore } from '../../store/buildingStore';
import {
  COMMANDER_COLORS as C,
  RADAR_MAP_STYLE,
  cellToPolygon,
  cellCenter,
  pathPolyline,
  pathPositionAt,
  safeGridDistance,
  scoutEstimate,
  attackEstimate,
  inferDomain,
  DOMAIN_LABELS,
  DOMAIN_ICONS,
  domainColor,
  prettifyDefinitionId,
  formatCountdown,
  isHauler,
  carryCapacity,
  formatLoad,
  LatLng,
} from '../../utils/commander';
import type {
  CommanderTerritory,
  CommanderOwnMovement,
  CommanderForeignMovement,
  CommanderGarrison,
  SiloInfo,
  AirstrikeResult,
  Objective,
  ScoutCapacity,
  StockpileEntry,
} from '../../services/api';
import { HYPERBOREAN_AI_USER_ID, commanderApi } from '../../services/api';
import { useResourceStore } from '../../store/resourceStore';
import { SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';

const H3_RES = 8;
const VISION_HEX_CAP = 300;
const MAX_ATTACK_UNITS = 6;

/** Inventory unit = category 'unit' OR definition_id starts with 'unit_'. */
function isUnit(item: ItemInstance): boolean {
  return item.category === 'unit' || (item.definition_id || '').startsWith('unit_');
}

const MAX_HAUL_UNITS = 6;

/** Marker / chip color for an own movement by purpose. Haul → amber. */
function ownMovementColor(purpose: CommanderOwnMovement['purpose']): string {
  if (purpose === 'attack') return C.enemy;
  if (purpose === 'scout') return C.accent;
  if (purpose === 'haul') return C.warning;
  return C.foreign;
}

/** Ionicon name for an own movement by purpose. Haul → truck. */
function ownMovementIcon(purpose: CommanderOwnMovement['purpose']): string {
  if (purpose === 'attack') return 'flash';
  if (purpose === 'scout') return 'eye';
  if (purpose === 'haul') return 'bus'; // truck-like glyph available in Ionicons
  return 'shield';
}

/**
 * Chip label for a haul movement. Return leg shows actual cargo ("Carrying 120 wood");
 * outbound shows total carry capacity ("Haul · 120").
 */
function haulLoadLabel(m: CommanderOwnMovement): string {
  const loadStr = formatLoad(m.config?.load);
  if (loadStr) return `Carrying ${loadStr}`;
  const total = m.config?.carry_total;
  if (typeof total === 'number' && total > 0) return `Haul · ${total}`;
  return 'haul';
}

type ActiveFlow =
  | { kind: 'none' }
  | { kind: 'scout'; instanceId: string; fromTerritoryId: string }
  | { kind: 'scout-target'; instanceId: string; fromTerritoryId: string; targetCell: string }
  | {
      kind: 'attack';
      instanceIds: string[];
      fromTerritoryId: string;
      targetTerritoryId: string;
    }
  | {
      // Phase F.2 — haul a stockpile home from an own territory to another own territory.
      kind: 'haul';
      instanceIds: string[];
      fromTerritoryId: string;
      targetTerritoryId: string | null;
    }
  | {
      // Phase F.2 — intercept a loaded foreign haul column.
      kind: 'intercept';
      movementId: string;
      instanceIds: string[];
      fromTerritoryId: string | null;
    };

export default function CommanderMapScreen({ navigation }: CommanderMapScreenProps) {
  const {
    mapData,
    loading,
    error,
    fetchMap,
    sendScout,
    recall,
    deploy,
    undeploy,
    march,
    strike,
    sendHaul,
    intercept,
    battles,
    fetchBattles,
    clearError,
  } = useCommanderStore();
  const { items, fetchInventory } = useInventoryStore();
  const userId = useAuthStore((s) => s.user?.id);
  const economyEnabled = useFeatureStore(
    (s) => s.isEnabled('economy') && s.isEnabled('resources') && s.capabilities.resources
  );
  const { stockpileByTerritory, fetchBuildings } = useBuildingStore();

  const mapRef = useRef<MapView>(null);
  const fittedRef = useRef(false);
  const [tick, setTick] = useState(0); // forces marker recompute every 2s

  const [selectedTerritory, setSelectedTerritory] = useState<CommanderTerritory | null>(null);
  const [flow, setFlow] = useState<ActiveFlow>({ kind: 'none' });
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [buildRadar, setBuildRadar] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const unitItems = useMemo(() => items.filter(isUnit), [items]);
  // Phase F.2 — hauler units available for hauling (carry stat or known hauler def).
  const haulerItems = useMemo(
    () => unitItems.filter((u) => isHauler(u.definition_id, u.stats)),
    [unitItems]
  );

  // ── Data refresh: on focus + every 30s; clears on blur/unmount.
  useFocusEffect(
    useCallback(() => {
      fetchMap();
      fetchInventory();
      fetchBattles();
      const id = setInterval(() => {
        fetchMap();
      }, 30000);
      return () => clearInterval(id);
    }, [fetchMap, fetchInventory, fetchBattles])
  );

  // ── Marker position recompute every 2s (movement progress along path).
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  // ── Fit to explored ∪ active ∪ territory ∪ objective cells on first load.
  useEffect(() => {
    if (fittedRef.current || !mapData) return;
    const coords: LatLng[] = [];
    // Sample explored + active (up to 200 total) for the initial camera fit.
    const seedCells = [...new Set([...mapData.explored_cells, ...mapData.active_cells])].slice(0, 150);
    for (const cell of seedCells) {
      const c = cellCenter(cell);
      if (c) coords.push(c);
    }
    // Always include territory centroids and objective centroids.
    for (const t of mapData.territories) {
      const c = t.h3_cells[0] ? cellCenter(t.h3_cells[0]) : null;
      if (c) coords.push(c);
    }
    for (const obj of mapData.objectives) {
      const c = cellCenter(obj.h3_cell);
      if (c) coords.push(c);
    }
    if (coords.length >= 1 && mapRef.current) {
      fittedRef.current = true;
      // small delay so the MapView is laid out
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 80, bottom: 220, left: 80 },
          animated: true,
        });
      }, 350);
    }
  }, [mapData]);

  // ── Partition movements.
  const ownMovements = useMemo(
    () => (mapData?.movements.filter((m): m is CommanderOwnMovement => m.is_own) ?? []),
    [mapData]
  );
  const foreignMovements = useMemo(
    () => (mapData?.movements.filter((m): m is CommanderForeignMovement => !m.is_own) ?? []),
    [mapData]
  );

  // ── 3-tier fog: active cells (bright) and explored-but-not-active (dim).
  //    Priority under VISION_HEX_CAP cap: active > objective > territory > explored.
  const { activeCellSet, exploredDimCells } = useMemo(() => {
    if (!mapData) return { activeCellSet: new Set<string>(), exploredDimCells: [] as string[] };

    const activeSet = new Set<string>(mapData.active_cells);
    const exploredSet = new Set<string>(mapData.explored_cells);

    // Build the priority-ordered collection of all cells we want to render.
    // Tier A: active (bright) — these always render; also skip from explored-dim list.
    // Tier B: objective cells (always-visible markers — they have their own Marker, not polygon)
    // Tier C: territory cells (always render regardless of fog)
    // Tier D: plain explored-dim (drop first when over cap)

    const territoryCells = new Set<string>();
    for (const t of mapData.territories) {
      for (const c of t.h3_cells) territoryCells.add(c);
    }

    const objectiveCells = new Set<string>(mapData.objectives.map((o) => o.h3_cell));

    // Explored-dim = in explored but NOT in active and NOT in territory (territory gets its own richer render)
    const plainExplored: string[] = [];
    for (const c of exploredSet) {
      if (!activeSet.has(c) && !territoryCells.has(c)) {
        plainExplored.push(c);
      }
    }

    // Budget accounting: active + territory always rendered (no cap on those);
    // plain explored hexes fill the remaining budget.
    const fixedCount = activeSet.size + territoryCells.size;
    const remaining = Math.max(0, VISION_HEX_CAP - fixedCount);
    // Keep objective cells in explored-dim budget since they get Marker not Polygon.
    // Drop plain explored hexes first (least informative).
    const trimmedExplored =
      plainExplored.length <= remaining
        ? plainExplored
        : plainExplored.slice(0, remaining);

    return { activeCellSet: activeSet, exploredDimCells: trimmedExplored };
  }, [mapData]);

  // ── Territory cell → territory lookup (for tap detection on hexes).
  const territoryByCell = useMemo(() => {
    const map = new Map<string, CommanderTerritory>();
    if (mapData) {
      for (const t of mapData.territories) {
        for (const cell of t.h3_cells) map.set(cell, t);
      }
    }
    return map;
  }, [mapData]);

  const ownTerritories = useMemo(
    () => mapData?.territories.filter((t) => t.is_own) ?? [],
    [mapData]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openTerritory = useCallback(
    (t: CommanderTerritory) => {
      setSelectedTerritory(t);
      setBuildRadar(false);
      // Phase F.2 — pull the stockpile for own territories so "Haul home" can gate on it.
      if (t.is_own && economyEnabled) {
        fetchBuildings(t.id);
      }
    },
    [economyEnabled, fetchBuildings]
  );

  const closeSheet = useCallback(() => {
    setSelectedTerritory(null);
    setBuildRadar(false);
  }, []);

  const handleMapPress = useCallback(
    (e: MapPressEvent) => {
      if (flow.kind !== 'scout') return;
      const { latitude, longitude } = e.nativeEvent.coordinate;
      let cell: string;
      try {
        cell = latLngToCell(latitude, longitude, H3_RES);
      } catch {
        return;
      }
      setFlow({
        kind: 'scout-target',
        instanceId: flow.instanceId,
        fromTerritoryId: flow.fromTerritoryId,
        targetCell: cell,
      });
    },
    [flow]
  );

  const beginScout = useCallback(
    (instanceId: string, fromTerritoryId: string) => {
      closeSheet();
      setFlow({ kind: 'scout', instanceId, fromTerritoryId });
    },
    [closeSheet]
  );

  const confirmScout = useCallback(async () => {
    if (flow.kind !== 'scout-target') return;
    setSubmitting(true);
    const res = await sendScout(flow.instanceId, flow.fromTerritoryId, flow.targetCell, buildRadar);
    setSubmitting(false);
    if (res.success) {
      setFlow({ kind: 'none' });
      setBuildRadar(false);
    }
  }, [flow, buildRadar, sendScout]);

  const handleDeploy = useCallback(
    async (instanceId: string, territoryId: string) => {
      setSubmitting(true);
      await deploy(instanceId, territoryId);
      setSubmitting(false);
    },
    [deploy]
  );

  const handleUndeploy = useCallback(
    async (instanceId: string) => {
      setSubmitting(true);
      await undeploy(instanceId);
      setSubmitting(false);
    },
    [undeploy]
  );

  const confirmAttack = useCallback(async () => {
    if (flow.kind !== 'attack') return;
    setSubmitting(true);
    const res = await march(flow.instanceIds, flow.fromTerritoryId, flow.targetTerritoryId, 'attack');
    setSubmitting(false);
    if (res.success) setFlow({ kind: 'none' });
  }, [flow, march]);

  const handleStrike = useCallback(
    async (fromTerritoryId: string, targetTerritoryId: string) => {
      setSubmitting(true);
      const res = await strike(fromTerritoryId, targetTerritoryId);
      setSubmitting(false);
      if (!res.success) return;
      // Show result alert
      const r = res.result;
      if (!r) return;
      if ('shield_broken' in r && r.shield_broken) {
        Alert.alert('Airstrike', 'Shield destroyed!');
      } else if ('building_hit' in r) {
        const hit = r.building_hit;
        if (hit.destroyed) {
          Alert.alert('Airstrike', `${hit.type} destroyed!`);
        } else {
          Alert.alert('Airstrike', `${hit.type} hit — ${hit.hp_after} HP left.`);
        }
      } else {
        Alert.alert('Airstrike', 'No targets — strike wasted.');
      }
    },
    [strike]
  );

  // ── Phase F.2 — Haul ─────────────────────────────────────────────────────────
  const beginHaul = useCallback(
    (fromTerritoryId: string) => {
      closeSheet();
      setFlow({ kind: 'haul', instanceIds: [], fromTerritoryId, targetTerritoryId: null });
    },
    [closeSheet]
  );

  const confirmHaul = useCallback(async () => {
    if (flow.kind !== 'haul' || !flow.targetTerritoryId) return;
    setSubmitting(true);
    const res = await sendHaul(flow.instanceIds, flow.fromTerritoryId, flow.targetTerritoryId);
    setSubmitting(false);
    if (res.success) setFlow({ kind: 'none' });
  }, [flow, sendHaul]);

  // ── Phase F.2 — Intercept ──────────────────────────────────────────────────────
  const beginIntercept = useCallback((movementId: string) => {
    setFlow({ kind: 'intercept', movementId, instanceIds: [], fromTerritoryId: null });
  }, []);

  const confirmIntercept = useCallback(async () => {
    if (flow.kind !== 'intercept' || !flow.fromTerritoryId || flow.instanceIds.length === 0) return;
    setSubmitting(true);
    const res = await intercept(flow.movementId, flow.instanceIds, flow.fromTerritoryId);
    setSubmitting(false);
    if (res.success) {
      setFlow({ kind: 'none' });
      const won = res.result?.winner_side === 'attacker';
      Alert.alert(
        'Interception',
        won ? 'Haul destroyed — cargo lost!' : 'Interception failed.'
      );
    }
  }, [flow, intercept]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Ionicons name="scan-circle" size={20} color={C.accent} />
          <Text style={styles.headerTitle}>Commander</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              fetchBattles();
              setShowBattleLog(true);
            }}
            style={styles.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="list" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('DicePouch')}
            style={styles.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="dice" size={20} color={C.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={RADAR_MAP_STYLE}
          showsUserLocation={false}
          showsCompass={false}
          rotateEnabled={false}
          toolbarEnabled={false}
          initialRegion={{
            latitude: 51.3642,
            longitude: 7.9812,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onPress={handleMapPress}
        >
          {/* Tier 2 — Explored-dim hexes: thin violet stroke, near-zero fill (~0.25 alpha stroke) */}
          {exploredDimCells.map((cell) => {
            const coords = cellToPolygon(cell);
            if (coords.length < 3) return null;
            return (
              <Polygon
                key={`exp-${cell}`}
                coordinates={coords}
                strokeColor={`${C.accent}3F`}
                strokeWidth={0.5}
                fillColor={`${C.accent}06`}
              />
            );
          })}

          {/* Tier 3 — Active hexes: bright violet stroke (~0.8 alpha), faint fill */}
          {Array.from(activeCellSet).map((cell) => {
            // Skip territory cells — those get their own richer polygon below.
            if (territoryByCell.has(cell)) return null;
            const coords = cellToPolygon(cell);
            if (coords.length < 3) return null;
            return (
              <Polygon
                key={`act-${cell}`}
                coordinates={coords}
                strokeColor={`${C.accent}CC`}
                strokeWidth={0.8}
                fillColor={`${C.accent}14`}
              />
            );
          })}

          {/* Radar coverage — covert tinted differently */}
          {mapData?.radars.map((radar) =>
            radar.cells.map((cell) => {
              const coords = cellToPolygon(cell);
              if (coords.length < 3) return null;
              const col = radar.covert ? C.warning : C.accent;
              return (
                <Polygon
                  key={`radar-${radar.building_id}-${cell}`}
                  coordinates={coords}
                  strokeColor={`${col}55`}
                  strokeWidth={0.5}
                  fillColor={`${col}12`}
                />
              );
            })
          )}

          {/* AI zones — deep red fill, phase-based opacity; rendered UNDER territory layer */}
          {(mapData?.ai_zones ?? []).map((zone) => {
            const coords = cellToPolygon(zone.h3_cell);
            if (coords.length < 3) return null;
            // Fill opacity by phase: dormant 0.10 (1A), triggered 0.18 (2E), invasion 0.30 (4D)
            const fillAlpha = zone.phase === 'invasion' ? '4D' : zone.phase === 'triggered' ? '2E' : '1A';
            return (
              <Polygon
                key={`ai-${zone.h3_cell}`}
                coordinates={coords}
                strokeColor="#D7263D55"
                strokeWidth={0.8}
                fillColor={`#D7263D${fillAlpha}`}
              />
            );
          })}

          {/* Territories — own violet, foreign cyan; dimmed when live===false (stale intel) */}
          {mapData?.territories.map((t) =>
            t.h3_cells.map((cell) => {
              const coords = cellToPolygon(cell);
              if (coords.length < 3) return null;
              const col = t.is_own ? C.own : C.foreign;
              // live===false → dim outline only (0.4 alpha stroke, no fill)
              const isLive = t.live !== false;
              const strokeAlpha = isLive ? 'FF' : '66'; // 1.0 / 0.4
              const fillAlpha = isLive ? (t.is_own ? '59' : '40') : '0A'; // dim fill for stale
              return (
                <Polygon
                  key={`terr-${t.id}-${cell}`}
                  coordinates={coords}
                  strokeColor={`${col}${strokeAlpha}`}
                  strokeWidth={isLive ? 1 : 0.7}
                  fillColor={`${col}${fillAlpha}`}
                  tappable
                  onPress={() => openTerritory(t)}
                />
              );
            })
          )}

          {/* Objective markers — always-visible yellow diamonds; coarse strategic hints */}
          {mapData?.objectives.map((obj) => {
            const pos = cellCenter(obj.h3_cell);
            if (!pos) return null;
            const title =
              obj.kind === 'enemy_territory'
                ? 'Enemy territory'
                : obj.kind === 'pve_spawn'
                ? 'Hostile signal'
                : 'Hyperborean presence';
            return (
              <Marker
                key={`obj-${obj.h3_cell}`}
                coordinate={pos}
                anchor={{ x: 0.5, y: 0.5 }}
                title={title}
              >
                <View style={styles.objectiveDiamond}>
                  <Ionicons name="diamond" size={12} color="#F5A623" />
                </View>
              </Marker>
            );
          })}

          {/* Own movement paths + progress marker */}
          {ownMovements.map((m) => {
            const line = pathPolyline(m.path);
            const pos = pathPositionAt(m.path, m.progress);
            const col = ownMovementColor(m.purpose);
            return (
              <React.Fragment key={`mv-${m.id}`}>
                {line.length >= 2 ? (
                  <Polyline
                    coordinates={line}
                    strokeColor={`${col}AA`}
                    strokeWidth={2}
                    lineDashPattern={[6, 6]}
                  />
                ) : null}
                {pos ? (
                  <Marker key={`mv-dot-${m.id}-${tick}`} coordinate={pos} anchor={{ x: 0.5, y: 0.5 }}>
                    <View style={[styles.moveDot, { borderColor: col, backgroundColor: `${col}55` }]}>
                      <Ionicons name={ownMovementIcon(m.purpose) as any} size={10} color={col} />
                    </View>
                  </Marker>
                ) : null}
              </React.Fragment>
            );
          })}

          {/* Foreign movements — red marker at current cell, no path (fog).
              Carrying columns (Phase F.2) get a fatter red marker and a tap → intercept. */}
          {foreignMovements.map((m) => {
            const pos = cellCenter(m.current_cell);
            if (!pos) return null;
            const carrying = m.carrying === true;
            return (
              <Marker
                key={`fm-${m.id}`}
                coordinate={pos}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={carrying ? () => beginIntercept(m.id) : undefined}
              >
                <View style={carrying ? styles.enemyHaulDot : styles.enemyDot}>
                  <Ionicons name={carrying ? 'cube' : 'alert'} size={carrying ? 14 : 10} color="#FFFFFF" />
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Loading shimmer */}
        {loading && !mapData ? (
          <View style={styles.mapLoader}>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={styles.mapLoaderText}>Scanning the grid...</Text>
          </View>
        ) : null}

        {/* Scout targeting banner */}
        {flow.kind === 'scout' ? (
          <View style={styles.targetBanner}>
            <Ionicons name="locate" size={16} color={C.accent} />
            <Text style={styles.targetBannerText}>Tap the map to choose a scout target</Text>
            <TouchableOpacity onPress={() => setFlow({ kind: 'none' })}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Error toast */}
        {error ? (
          <TouchableOpacity style={styles.errorToast} onPress={clearError} activeOpacity={0.9}>
            <Ionicons name="warning" size={14} color="#FFFFFF" />
            <Text style={styles.errorToastText}>{error}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Movements strip + AI zone warning note */}
      {(ownMovements.length > 0 || (mapData?.ai_zones ?? []).length > 0) ? (
        <View style={styles.strip}>
          {(mapData?.ai_zones ?? []).length > 0 ? (
            <View style={styles.aiWarningRow}>
              <Ionicons name="warning" size={13} color="#D7263D" />
              <Text style={styles.aiWarningText}>
                {'⚠'} {(mapData?.ai_zones ?? []).length} cell{(mapData?.ai_zones ?? []).length !== 1 ? 's' : ''} under Hyperborean control
              </Text>
            </View>
          ) : null}
          {ownMovements.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
              {ownMovements.map((m) => {
                const col = ownMovementColor(m.purpose);
                // Phase F.2 — haul chips show carry capacity (outbound) or actual load (return leg).
                const loadLabel = m.purpose === 'haul' ? haulLoadLabel(m) : null;
                return (
                  <View key={`chip-${m.id}`} style={[styles.chip, { borderColor: col }]}>
                    <Ionicons name={ownMovementIcon(m.purpose) as any} size={12} color={col} />
                    <Text style={styles.chipLabel}>{loadLabel ?? m.purpose}</Text>
                    <Text style={[styles.chipEta, { color: col }]}>{formatCountdown(m.arrives_at)}</Text>
                    {m.purpose === 'scout' && m.status !== 'returning' ? (
                      <TouchableOpacity
                        onPress={() => recall(m.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="arrow-undo" size={13} color={C.textSecondary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      {/* Territory action sheet */}
      <TerritoryActionSheet
        territory={selectedTerritory}
        garrison={
          selectedTerritory
            ? mapData?.garrisons.find((g) => g.territory_id === selectedTerritory.id) ?? null
            : null
        }
        units={unitItems}
        ownTerritories={ownTerritories}
        silos={mapData?.silos ?? []}
        scoutCapacity={mapData?.scout_capacity ?? null}
        submitting={submitting}
        canHaul={
          !!selectedTerritory &&
          selectedTerritory.is_own &&
          economyEnabled &&
          (stockpileByTerritory[selectedTerritory.id]?.some((e) => e.amount > 0) ?? false)
        }
        onClose={closeSheet}
        onDeploy={handleDeploy}
        onUndeploy={handleUndeploy}
        onStartScout={beginScout}
        onStartHaul={beginHaul}
        onStartAttack={(target) => {
          // pick a from-territory: first own territory by default
          const from = ownTerritories[0];
          if (!from) return;
          closeSheet();
          setFlow({ kind: 'attack', instanceIds: [], fromTerritoryId: from.id, targetTerritoryId: target.id });
        }}
        onStrike={handleStrike}
      />

      {/* Haul composition modal */}
      <HaulModal
        flow={flow}
        haulers={haulerItems}
        ownTerritories={ownTerritories}
        stockpileByTerritory={stockpileByTerritory}
        submitting={submitting}
        onChange={setFlow}
        onConfirm={confirmHaul}
        onCancel={() => setFlow({ kind: 'none' })}
      />

      {/* Intercept composition modal */}
      <InterceptModal
        flow={flow}
        units={unitItems}
        ownTerritories={ownTerritories}
        submitting={submitting}
        onChange={setFlow}
        onConfirm={confirmIntercept}
        onCancel={() => setFlow({ kind: 'none' })}
      />

      {/* Scout confirm card */}
      <ScoutConfirmModal
        flow={flow}
        ownTerritories={ownTerritories}
        buildRadar={buildRadar}
        setBuildRadar={setBuildRadar}
        submitting={submitting}
        onConfirm={confirmScout}
        onCancel={() => setFlow({ kind: 'none' })}
      />

      {/* Attack composition modal */}
      <AttackModal
        flow={flow}
        units={unitItems}
        ownTerritories={ownTerritories}
        territories={mapData?.territories ?? []}
        submitting={submitting}
        onChange={setFlow}
        onConfirm={confirmAttack}
        onCancel={() => setFlow({ kind: 'none' })}
      />

      {/* Battle log modal */}
      <BattleLogModal
        visible={showBattleLog}
        battles={battles}
        userId={userId}
        onClose={() => setShowBattleLog(false)}
        onOpen={(id) => {
          setShowBattleLog(false);
          navigation.navigate('BattleReplay', { battleId: id });
        }}
      />
    </SafeAreaView>
  );
}

// ─── Territory action sheet ─────────────────────────────────────────────────────

// ─── Spy-radar detected result ─────────────────────────────────────────────────
interface DetectedRadar {
  building_id: string;
  owner_id: string | null;
  detected: true;
}

function TerritoryActionSheet({
  territory,
  garrison,
  units,
  ownTerritories,
  silos,
  scoutCapacity,
  submitting,
  canHaul,
  onClose,
  onDeploy,
  onUndeploy,
  onStartScout,
  onStartHaul,
  onStartAttack,
  onStrike,
}: {
  territory: CommanderTerritory | null;
  garrison: CommanderGarrison | null;
  units: ItemInstance[];
  ownTerritories: CommanderTerritory[];
  silos: SiloInfo[];
  scoutCapacity: ScoutCapacity | null;
  submitting: boolean;
  canHaul: boolean;
  onClose: () => void;
  onDeploy: (instanceId: string, territoryId: string) => void;
  onUndeploy: (instanceId: string) => void;
  onStartScout: (instanceId: string, fromTerritoryId: string) => void;
  onStartHaul: (fromTerritoryId: string) => void;
  onStartAttack: (target: CommanderTerritory) => void;
  onStrike: (fromTerritoryId: string, targetTerritoryId: string) => void;
}) {
  const [deployPickerOpen, setDeployPickerOpen] = useState(false);
  const [scoutPickerOpen, setScoutPickerOpen] = useState(false);
  const [siloPickerOpen, setSiloPickerOpen] = useState(false);
  const [showAirstrikeConfirm, setShowAirstrikeConfirm] = useState(false);
  const [selectedSiloTerritoryId, setSelectedSiloTerritoryId] = useState<string | null>(null);

  // Phase F.3 — spy scan state
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [detectedRadars, setDetectedRadars] = useState<DetectedRadar[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [destroyingId, setDestroyingId] = useState<string | null>(null);

  const intelBalance = useResourceStore((s) => s.balances.intel);
  const SCAN_COST = 30;

  // Reset scan state when territory changes
  const prevTerritoryId = React.useRef<string | null>(null);
  if (territory?.id !== prevTerritoryId.current) {
    prevTerritoryId.current = territory?.id ?? null;
    // Can't call setState here in render, but the reset effect below handles it
  }

  useEffect(() => {
    setScanning(false);
    setScanDone(false);
    setDetectedRadars([]);
    setScanError(null);
    setDestroyingId(null);
  }, [territory?.id]);

  const handleScan = async () => {
    if (!territory) return;
    setScanning(true);
    setScanDone(false);
    setScanError(null);
    setDetectedRadars([]);
    try {
      const result = await commanderApi.scanTerritory(territory.id);
      setDetectedRadars(result.found);
      setScanDone(true);
      // Scan always costs intel — refresh so the HUD isn't 30 too high.
      void useResourceStore.getState().fetchResources();
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setScanning(false);
    }
  };

  const handleDestroyRadar = async (buildingId: string) => {
    setDestroyingId(buildingId);
    try {
      await commanderApi.destroyRadar(buildingId);
      setDetectedRadars((prev) => prev.filter((r) => r.building_id !== buildingId));
    } catch (err: unknown) {
      Alert.alert('Destroy failed', err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setDestroyingId(null);
    }
  };

  if (!territory) return null;
  const isOwn = territory.is_own;
  const isLive = territory.live !== false;
  const scoutBase = ownTerritories[0];
  const scoutAtLimit = scoutCapacity != null && scoutCapacity.active >= scoutCapacity.max;

  // Ready silos: ready_at is null OR ready_at is in the past.
  const readySilos = silos.filter(
    (s) => s.ready_at === null || new Date(s.ready_at).getTime() <= Date.now()
  );
  const hasReadySilo = readySilos.length > 0;

  const SILO_DAMAGE: Record<number, number> = { 1: 50, 2: 75, 3: 100 };

  const handleAirstrikePress = () => {
    if (readySilos.length === 1) {
      // Only one ready silo — skip picker, go straight to confirm.
      setSelectedSiloTerritoryId(readySilos[0].territory_id);
      setShowAirstrikeConfirm(true);
    } else {
      setSiloPickerOpen((v) => !v);
    }
  };

  const handleSiloSelect = (siloTerritoryId: string) => {
    setSelectedSiloTerritoryId(siloTerritoryId);
    setSiloPickerOpen(false);
    setShowAirstrikeConfirm(true);
  };

  const handleAirstrikeConfirm = () => {
    if (!selectedSiloTerritoryId) return;
    setShowAirstrikeConfirm(false);
    onClose();
    onStrike(selectedSiloTerritoryId, territory.id);
  };

  const selectedSilo = readySilos.find((s) => s.territory_id === selectedSiloTerritoryId);

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={[styles.dot, { backgroundColor: isOwn ? C.own : C.foreign }]} />
          <Text style={styles.sheetTitle}>
            {isOwn ? 'Your Territory' : territory.owner_username || 'Hostile Territory'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sheetMeta}>
          Claim value {territory.claim_value} · {territory.h3_cells.length} cells
          {!isLive ? '  ·  (no live intel)' : ''}
        </Text>
        {scoutCapacity != null ? (
          <Text style={styles.scoutCapacityText}>
            Scouts: {scoutCapacity.active}/{scoutCapacity.max}
          </Text>
        ) : null}

        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {/* Garrison list — hidden when territory has no live intel */}
          <Text style={styles.sectionLabel}>GARRISON</Text>
          {!isLive ? (
            <Text style={styles.emptyLine}>No garrison data — scout to update intel.</Text>
          ) : garrison && garrison.count > 0 ? (
            isOwn && garrison.units ? (
              garrison.units.map((u: { instance_id: string; definition_id: string }) => (
                <View key={u.instance_id} style={styles.garrisonRow}>
                  <Ionicons name="shield-half" size={16} color={C.own} />
                  <Text style={styles.garrisonName}>{prettifyDefinitionId(u.definition_id)}</Text>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => onUndeploy(u.instance_id)}
                    disabled={submitting}
                  >
                    <Text style={styles.smallBtnText}>Undeploy</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.garrisonCount}>{garrison.count} defending unit(s)</Text>
            )
          ) : (
            <Text style={styles.emptyLine}>No units garrisoned.</Text>
          )}

          {isOwn ? (
            <>
              {/* Deploy picker */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setDeployPickerOpen((v) => !v)}
              >
                <Ionicons name="add-circle" size={18} color={C.accent} />
                <Text style={styles.actionBtnText}>Deploy a unit</Text>
                <Ionicons
                  name={deployPickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={C.textSecondary}
                />
              </TouchableOpacity>
              {deployPickerOpen ? (
                units.length === 0 ? (
                  <Text style={styles.emptyLine}>No units in inventory.</Text>
                ) : (
                  units.map((u) => {
                    const d = inferDomain(u.definition_id, u.stats);
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={styles.pickRow}
                        onPress={() => onDeploy(u.id, territory.id)}
                        disabled={submitting}
                      >
                        <View style={[styles.domainBadge, { borderColor: domainColor(d) }]}>
                          <Ionicons name={DOMAIN_ICONS[d] as any} size={11} color={domainColor(d)} />
                        </View>
                        <Text style={styles.pickName}>{prettifyDefinitionId(u.definition_id)}</Text>
                        <Text style={styles.pickDomain}>{DOMAIN_LABELS[d]}</Text>
                      </TouchableOpacity>
                    );
                  })
                )
              ) : null}

              {/* Scout dispatch entry */}
              {scoutBase ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, scoutAtLimit && { opacity: 0.5 }]}
                    onPress={scoutAtLimit ? undefined : () => setScoutPickerOpen((v) => !v)}
                    disabled={scoutAtLimit}
                  >
                    <Ionicons name="eye" size={18} color={scoutAtLimit ? C.textSecondary : C.accent} />
                    <Text style={[styles.actionBtnText, scoutAtLimit && { color: C.textSecondary }]}>
                      Dispatch scout
                    </Text>
                    {scoutAtLimit ? null : (
                      <Ionicons
                        name={scoutPickerOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={C.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                  {scoutAtLimit ? (
                    <Text style={styles.scoutLimitText}>
                      Scout limit reached ({scoutCapacity!.max}) — level up to deploy more.
                    </Text>
                  ) : scoutPickerOpen ? (
                    units.length === 0
                      ? <Text style={styles.emptyLine}>No units to scout with.</Text>
                      : units.map((u) => (
                          <TouchableOpacity
                            key={`scout-${u.id}`}
                            style={styles.pickRow}
                            onPress={() => onStartScout(u.id, territory.id)}
                          >
                            <Ionicons name="navigate" size={14} color={C.accent} />
                            <Text style={styles.pickName}>{prettifyDefinitionId(u.definition_id)}</Text>
                          </TouchableOpacity>
                        ))
                  ) : null}
                </>
              ) : null}

              {/* Phase F.2 — Haul home (economy flag + non-empty stockpile) */}
              {canHaul ? (
                <TouchableOpacity
                  style={styles.haulBtn}
                  onPress={() => onStartHaul(territory.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bus" size={18} color="#FFFFFF" />
                  <Text style={styles.haulBtnText}>🚚 Haul home</Text>
                </TouchableOpacity>
              ) : null}

              {/* Phase F.3 — Spy radar scan */}
              <Text style={styles.sectionLabel}>SPY DEFENSE</Text>
              <TouchableOpacity
                style={[
                  styles.scanBtn,
                  (intelBalance < SCAN_COST || scanning) && styles.scanBtnDisabled,
                ]}
                onPress={intelBalance >= SCAN_COST && !scanning ? handleScan : undefined}
                disabled={intelBalance < SCAN_COST || scanning}
                activeOpacity={0.85}
              >
                {scanning ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="radio" size={18} color={intelBalance >= SCAN_COST ? '#FFFFFF' : C.textSecondary} />
                    <Text style={[styles.scanBtnText, intelBalance < SCAN_COST && { color: C.textSecondary }]}>
                      {intelBalance < SCAN_COST
                        ? `Scan for spies (need ${SCAN_COST} intel, have ${intelBalance})`
                        : `Scan for spies (${SCAN_COST} intel)`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {scanError ? (
                <Text style={styles.scanErrorText}>{scanError}</Text>
              ) : null}
              {scanDone ? (
                detectedRadars.length === 0 ? (
                  <Text style={styles.emptyLine}>No enemy spy-radars found.</Text>
                ) : (
                  detectedRadars.map((radar) => (
                    <View key={radar.building_id} style={styles.radarRow}>
                      <Ionicons name="radio" size={16} color={C.enemy} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.radarId}>#{radar.building_id.slice(0, 8)}</Text>
                        {radar.owner_id ? (
                          <Text style={styles.radarOwner}>Owner: #{radar.owner_id.slice(0, 8)}</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.destroyBtn,
                          destroyingId === radar.building_id && { opacity: 0.5 },
                        ]}
                        onPress={() => handleDestroyRadar(radar.building_id)}
                        disabled={!!destroyingId}
                      >
                        {destroyingId === radar.building_id ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.destroyBtnText}>Destroy</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                )
              ) : null}
            </>
          ) : (
            <>
              {/* Foreign: attack + airstrike + send scout here */}
              <TouchableOpacity style={styles.attackBtn} onPress={() => onStartAttack(territory)}>
                <Ionicons name="flash" size={18} color="#FFFFFF" />
                <Text style={styles.attackBtnText}>Attack this territory</Text>
              </TouchableOpacity>

              {/* Airstrike button — only shown when commander flag is active (silos exist in map data) */}
              <TouchableOpacity
                style={[styles.airstrikeBtn, !hasReadySilo && styles.airstrikeBtnDisabled]}
                onPress={hasReadySilo ? handleAirstrikePress : undefined}
                disabled={!hasReadySilo || submitting}
                activeOpacity={0.8}
              >
                <Ionicons name="rocket" size={18} color={hasReadySilo ? '#FFFFFF' : C.textSecondary} />
                <Text style={[styles.airstrikeBtnText, !hasReadySilo && { color: C.textSecondary }]}>
                  {hasReadySilo ? 'Airstrike' : 'Airstrike (no silo ready)'}
                </Text>
              </TouchableOpacity>

              {/* Silo picker — multi-silo scenario */}
              {siloPickerOpen ? (
                readySilos.map((s) => {
                  const dmg = SILO_DAMAGE[s.tier] ?? 50;
                  const shortId = s.territory_id.slice(0, 6);
                  return (
                    <TouchableOpacity
                      key={s.territory_id}
                      style={styles.pickRow}
                      onPress={() => handleSiloSelect(s.territory_id)}
                    >
                      <Ionicons name="rocket" size={14} color={C.warning} />
                      <Text style={styles.pickName}>Silo T{s.tier} · #{shortId}</Text>
                      <Text style={styles.pickDomain}>{dmg} dmg</Text>
                    </TouchableOpacity>
                  );
                })
              ) : null}

              {/* Airstrike confirm card */}
              {showAirstrikeConfirm && selectedSilo ? (
                <View style={styles.airstrikeConfirmCard}>
                  <Text style={styles.airstrikeConfirmTitle}>Confirm Airstrike</Text>
                  <Text style={styles.airstrikeConfirmMeta}>
                    Silo Tier {selectedSilo.tier} · {SILO_DAMAGE[selectedSilo.tier] ?? 50} dmg · Cost 150⚡
                  </Text>
                  <View style={styles.confirmActions}>
                    <TouchableOpacity
                      style={styles.ghostBtn}
                      onPress={() => setShowAirstrikeConfirm(false)}
                    >
                      <Text style={styles.ghostBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.airstrikeConfirmBtn}
                      onPress={handleAirstrikeConfirm}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.attackConfirmText}>Launch</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {scoutBase ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, (units.length === 0 || scoutAtLimit) && { opacity: 0.5 }]}
                    onPress={(units.length === 0 || scoutAtLimit) ? undefined : () => onStartScout(units[0]?.id ?? '', scoutBase.id)}
                    disabled={units.length === 0 || scoutAtLimit}
                  >
                    <Ionicons name="eye" size={18} color={(units.length === 0 || scoutAtLimit) ? C.textSecondary : C.accent} />
                    <Text style={[styles.actionBtnText, (units.length === 0 || scoutAtLimit) && { color: C.textSecondary }]}>
                      Send scout here
                    </Text>
                  </TouchableOpacity>
                  {scoutAtLimit ? (
                    <Text style={styles.scoutLimitText}>
                      Scout limit reached ({scoutCapacity!.max}) — level up to deploy more.
                    </Text>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Scout confirm modal ─────────────────────────────────────────────────────────

function ScoutConfirmModal({
  flow,
  ownTerritories,
  buildRadar,
  setBuildRadar,
  submitting,
  onConfirm,
  onCancel,
}: {
  flow: ActiveFlow;
  ownTerritories: CommanderTerritory[];
  buildRadar: boolean;
  setBuildRadar: (v: boolean) => void;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (flow.kind !== 'scout-target') return null;
  const base = ownTerritories.find((t) => t.id === flow.fromTerritoryId) ?? ownTerritories[0];
  const baseCell = base?.h3_cells[0];
  const cells = baseCell ? safeGridDistance(baseCell, flow.targetCell) : null;
  const est = cells != null ? scoutEstimate(cells) : null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.centerBackdrop}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Dispatch Scout</Text>
          <Text style={styles.confirmMeta}>Target cell {flow.targetCell.slice(0, 8)}…</Text>
          <View style={styles.costRow}>
            {est ? (
              <>
                <View style={styles.costPill}>
                  <Ionicons name="flash" size={13} color={C.warning} />
                  <Text style={styles.costText}>≈ {est.energy} ⚡</Text>
                </View>
                <View style={styles.costPill}>
                  <Ionicons name="time" size={13} color={C.foreign} />
                  <Text style={styles.costText}>≈ {est.etaMin} min</Text>
                </View>
              </>
            ) : (
              <Text style={styles.confirmMeta}>Distance unknown · server will price it.</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => setBuildRadar(!buildRadar)}
            activeOpacity={0.8}
          >
            <View style={[styles.switchBox, buildRadar && styles.switchBoxOn]}>
              {buildRadar ? <Ionicons name="checkmark" size={14} color={C.bg} /> : null}
            </View>
            <Text style={styles.switchLabel}>Plant covert radar at target</Text>
          </TouchableOpacity>

          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.ghostBtn} onPress={onCancel}>
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onConfirm}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={C.bg} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Attack composition modal ───────────────────────────────────────────────────

function AttackModal({
  flow,
  units,
  ownTerritories,
  territories,
  submitting,
  onChange,
  onConfirm,
  onCancel,
}: {
  flow: ActiveFlow;
  units: ItemInstance[];
  ownTerritories: CommanderTerritory[];
  territories: CommanderTerritory[];
  submitting: boolean;
  onChange: (f: ActiveFlow) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (flow.kind !== 'attack') return null;
  const target = territories.find((t) => t.id === flow.targetTerritoryId);
  const from = ownTerritories.find((t) => t.id === flow.fromTerritoryId);

  const toggleUnit = (id: string) => {
    const has = flow.instanceIds.includes(id);
    let next: string[];
    if (has) next = flow.instanceIds.filter((u) => u !== id);
    else {
      if (flow.instanceIds.length >= MAX_ATTACK_UNITS) return;
      next = [...flow.instanceIds, id];
    }
    onChange({ ...flow, instanceIds: next });
  };

  const setFrom = (id: string) => onChange({ ...flow, fromTerritoryId: id });

  const fromCell = from?.h3_cells[0];
  const targetCell = target?.h3_cells[0];
  const cells = fromCell && targetCell ? safeGridDistance(fromCell, targetCell) : null;
  const est = cells != null ? attackEstimate(cells, Math.max(1, flow.instanceIds.length)) : null;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Ionicons name="flash" size={18} color={C.enemy} />
          <Text style={styles.sheetTitle}>Attack {target?.owner_username || 'territory'}</Text>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {/* Origin picker */}
          <Text style={styles.sectionLabel}>LAUNCH FROM</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
            {ownTerritories.map((t) => {
              const sel = t.id === flow.fromTerritoryId;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.originChip, sel && styles.originChipSel]}
                  onPress={() => setFrom(t.id)}
                >
                  <Text style={[styles.originChipText, sel && { color: C.bg }]}>
                    {t.h3_cells.length}c · {t.claim_value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Unit multiselect */}
          <Text style={styles.sectionLabel}>
            SELECT UNITS ({flow.instanceIds.length}/{MAX_ATTACK_UNITS})
          </Text>
          {units.length === 0 ? (
            <Text style={styles.emptyLine}>No units available.</Text>
          ) : (
            units.map((u) => {
              const sel = flow.instanceIds.includes(u.id);
              const d = inferDomain(u.definition_id, u.stats);
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.unitRow, sel && styles.unitRowSel]}
                  onPress={() => toggleUnit(u.id)}
                >
                  <View style={[styles.domainBadge, { borderColor: domainColor(d) }]}>
                    <Ionicons name={DOMAIN_ICONS[d] as any} size={11} color={domainColor(d)} />
                  </View>
                  <Text style={styles.pickName}>{prettifyDefinitionId(u.definition_id)}</Text>
                  <Text style={styles.pickDomain}>{DOMAIN_LABELS[d]}</Text>
                  <Ionicons
                    name={sel ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={sel ? C.accent : C.textSecondary}
                  />
                </TouchableOpacity>
              );
            })
          )}

          {/* Cost */}
          {est ? (
            <View style={styles.costRow}>
              <View style={styles.costPill}>
                <Ionicons name="flash" size={13} color={C.warning} />
                <Text style={styles.costText}>≈ {est.energy} ⚡</Text>
              </View>
              <View style={styles.costPill}>
                <Ionicons name="time" size={13} color={C.foreign} />
                <Text style={styles.costText}>≈ {est.etaMin} min</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.confirmActions}>
          <TouchableOpacity style={styles.ghostBtn} onPress={onCancel}>
            <Text style={styles.ghostBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attackConfirmBtn, flow.instanceIds.length === 0 && { opacity: 0.5 }]}
            onPress={onConfirm}
            disabled={submitting || flow.instanceIds.length === 0}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.attackConfirmText}>Launch Attack</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Haul composition modal (Phase F.2) ──────────────────────────────────────────

function HaulModal({
  flow,
  haulers,
  ownTerritories,
  stockpileByTerritory,
  submitting,
  onChange,
  onConfirm,
  onCancel,
}: {
  flow: ActiveFlow;
  haulers: ItemInstance[];
  ownTerritories: CommanderTerritory[];
  stockpileByTerritory: Record<string, StockpileEntry[]>;
  submitting: boolean;
  onChange: (f: ActiveFlow) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (flow.kind !== 'haul') return null;
  const from = ownTerritories.find((t) => t.id === flow.fromTerritoryId);
  const destinations = ownTerritories.filter((t) => t.id !== flow.fromTerritoryId);

  const toggleUnit = (id: string) => {
    const has = flow.instanceIds.includes(id);
    let next: string[];
    if (has) next = flow.instanceIds.filter((u) => u !== id);
    else {
      if (flow.instanceIds.length >= MAX_HAUL_UNITS) return;
      next = [...flow.instanceIds, id];
    }
    onChange({ ...flow, instanceIds: next });
  };

  const totalCarry = flow.instanceIds.reduce((sum, id) => {
    const u = haulers.find((h) => h.id === id);
    return sum + (u ? carryCapacity(u.definition_id, u.stats) : 0);
  }, 0);

  const stockpile = stockpileByTerritory[flow.fromTerritoryId] ?? [];
  const stockpileTotal = stockpile.reduce((s, e) => s + e.amount, 0);

  const canConfirm = flow.instanceIds.length > 0 && !!flow.targetTerritoryId;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Ionicons name="bus" size={18} color={C.warning} />
          <Text style={styles.sheetTitle}>Haul home</Text>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sheetMeta}>
          {from ? `${from.h3_cells.length} cells · ` : ''}
          {stockpile.length > 0
            ? `${stockpileTotal} in stockpile (${stockpile.map((e) => `${e.amount} ${e.resource}`).join(', ')})`
            : 'No stockpile data.'}
        </Text>

        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {/* Hauler multiselect */}
          <Text style={styles.sectionLabel}>
            SELECT HAULERS ({flow.instanceIds.length}/{MAX_HAUL_UNITS})
          </Text>
          {haulers.length === 0 ? (
            <Text style={styles.emptyLine}>No hauler units available.</Text>
          ) : (
            haulers.map((u) => {
              const sel = flow.instanceIds.includes(u.id);
              const carry = carryCapacity(u.definition_id, u.stats);
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.unitRow, sel && styles.unitRowSel]}
                  onPress={() => toggleUnit(u.id)}
                >
                  <Ionicons name="bus" size={16} color={C.warning} />
                  <Text style={styles.pickName}>{prettifyDefinitionId(u.definition_id)}</Text>
                  <Text style={styles.pickDomain}>carry {carry}</Text>
                  <Ionicons
                    name={sel ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={sel ? C.accent : C.textSecondary}
                  />
                </TouchableOpacity>
              );
            })
          )}

          {/* Destination picker */}
          <Text style={styles.sectionLabel}>DELIVER TO</Text>
          {destinations.length === 0 ? (
            <Text style={styles.emptyLine}>You need a second territory to haul to.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
              {destinations.map((t) => {
                const sel = t.id === flow.targetTerritoryId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.originChip, sel && styles.originChipSel]}
                    onPress={() => onChange({ ...flow, targetTerritoryId: t.id })}
                  >
                    <Text style={[styles.originChipText, sel && { color: C.bg }]}>
                      {t.h3_cells.length}c · {t.claim_value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Total carry */}
          {flow.instanceIds.length > 0 ? (
            <View style={styles.costRow}>
              <View style={styles.costPill}>
                <Ionicons name="cube" size={13} color={C.warning} />
                <Text style={styles.costText}>Total carry {totalCarry}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.confirmActions}>
          <TouchableOpacity style={styles.ghostBtn} onPress={onCancel}>
            <Text style={styles.ghostBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.haulConfirmBtn, !canConfirm && { opacity: 0.5 }]}
            onPress={onConfirm}
            disabled={submitting || !canConfirm}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.attackConfirmText}>Send haul ({totalCarry})</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Intercept composition modal (Phase F.2) ──────────────────────────────────────

function InterceptModal({
  flow,
  units,
  ownTerritories,
  submitting,
  onChange,
  onConfirm,
  onCancel,
}: {
  flow: ActiveFlow;
  units: ItemInstance[];
  ownTerritories: CommanderTerritory[];
  submitting: boolean;
  onChange: (f: ActiveFlow) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (flow.kind !== 'intercept') return null;

  const toggleUnit = (id: string) => {
    const has = flow.instanceIds.includes(id);
    let next: string[];
    if (has) next = flow.instanceIds.filter((u) => u !== id);
    else {
      if (flow.instanceIds.length >= MAX_HAUL_UNITS) return;
      next = [...flow.instanceIds, id];
    }
    onChange({ ...flow, instanceIds: next });
  };

  const canConfirm = flow.instanceIds.length > 0 && !!flow.fromTerritoryId;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Ionicons name="flash" size={18} color={C.enemy} />
          <Text style={styles.sheetTitle}>⚔ Intercept</Text>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sheetMeta}>
          Catch the loaded enemy column before it reaches base. Win and the cargo is destroyed.
        </Text>

        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {/* Origin picker */}
          <Text style={styles.sectionLabel}>LAUNCH FROM</Text>
          {ownTerritories.length === 0 ? (
            <Text style={styles.emptyLine}>You need a base territory to intercept from.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
              {ownTerritories.map((t) => {
                const sel = t.id === flow.fromTerritoryId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.originChip, sel && styles.originChipSel]}
                    onPress={() => onChange({ ...flow, fromTerritoryId: t.id })}
                  >
                    <Text style={[styles.originChipText, sel && { color: C.bg }]}>
                      {t.h3_cells.length}c · {t.claim_value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Unit multiselect */}
          <Text style={styles.sectionLabel}>
            SELECT UNITS ({flow.instanceIds.length}/{MAX_HAUL_UNITS})
          </Text>
          {units.length === 0 ? (
            <Text style={styles.emptyLine}>No units available.</Text>
          ) : (
            units.map((u) => {
              const sel = flow.instanceIds.includes(u.id);
              const d = inferDomain(u.definition_id, u.stats);
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.unitRow, sel && styles.unitRowSel]}
                  onPress={() => toggleUnit(u.id)}
                >
                  <View style={[styles.domainBadge, { borderColor: domainColor(d) }]}>
                    <Ionicons name={DOMAIN_ICONS[d] as any} size={11} color={domainColor(d)} />
                  </View>
                  <Text style={styles.pickName}>{prettifyDefinitionId(u.definition_id)}</Text>
                  <Text style={styles.pickDomain}>{DOMAIN_LABELS[d]}</Text>
                  <Ionicons
                    name={sel ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={sel ? C.accent : C.textSecondary}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <View style={styles.confirmActions}>
          <TouchableOpacity style={styles.ghostBtn} onPress={onCancel}>
            <Text style={styles.ghostBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attackConfirmBtn, !canConfirm && { opacity: 0.5 }]}
            onPress={onConfirm}
            disabled={submitting || !canConfirm}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.attackConfirmText}>Intercept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Battle log modal ────────────────────────────────────────────────────────────

function BattleLogModal({
  visible,
  battles,
  userId,
  onClose,
  onOpen,
}: {
  visible: boolean;
  battles: { id: string; winner_side: 'attacker' | 'defender' | null; attacker_id: string; defender_id: string; created_at: string; type: string }[];
  userId: string | undefined;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Ionicons name="list" size={18} color={C.accent} />
          <Text style={styles.sheetTitle}>Battle Log</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {battles.length === 0 ? (
            <Text style={styles.emptyLine}>No battles yet.</Text>
          ) : (
            battles.map((b) => {
              const playerIsAttacker = b.attacker_id === userId;
              const won =
                b.winner_side != null &&
                ((playerIsAttacker && b.winner_side === 'attacker') ||
                  (!playerIsAttacker && b.winner_side === 'defender'));
              const isAirstrike = b.type === 'airstrike';
              const isInterception = b.type === 'interception';
              // Battle-type icon: rocket for airstrike, crossed swords for assault/interception.
              const typeIcon = isAirstrike ? 'rocket' : 'flash';
              // Resolve opponent label — show 'Hyperboreans' for the AI faction.
              const opponentId = playerIsAttacker ? b.defender_id : b.attacker_id;
              const opponentLabel =
                opponentId === HYPERBOREAN_AI_USER_ID ? 'Hyperboreans' : null;
              return (
                <TouchableOpacity key={b.id} style={styles.battleRow} onPress={() => onOpen(b.id)}>
                  <Ionicons
                    name={typeIcon as any}
                    size={16}
                    color={isAirstrike ? C.warning : won ? C.warning : C.enemy}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.battleType}>
                      {isAirstrike
                        ? 'Airstrike'
                        : isInterception
                        ? `${playerIsAttacker ? 'Interception' : 'Defense'}`
                        : `${playerIsAttacker ? 'Attack' : 'Defense'} · ${prettifyDefinitionId(b.type)}`}
                      {opponentLabel ? (
                        <Text style={styles.battleOpponent}> vs {opponentLabel}</Text>
                      ) : null}
                    </Text>
                    <Text style={styles.battleDate}>{new Date(b.created_at).toLocaleString()}</Text>
                  </View>
                  <Text style={[styles.battleResult, { color: won ? C.own : C.enemy }]}>
                    {won ? 'WON' : 'LOST'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', gap: SPACING.lg },
  headerBtn: { padding: 2 },

  mapWrap: { flex: 1 },
  map: { flex: 1 },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${C.bg}CC`,
    gap: SPACING.md,
  },
  mapLoaderText: { color: C.textSecondary, fontSize: FONT_SIZE.sm },

  moveDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: C.enemy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Phase F.2 — loaded foreign haul column: fatter, brighter red marker (tappable).
  enemyHaulDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: C.enemy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  targetBanner: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${C.surface}F2`,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  targetBannerText: { flex: 1, color: C.text, fontSize: FONT_SIZE.sm },
  cancelLink: { color: C.accent, fontWeight: '700', fontSize: FONT_SIZE.sm },

  errorToast: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: C.enemy,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  errorToastText: { color: '#FFFFFF', fontSize: FONT_SIZE.sm, flex: 1 },

  strip: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  stripContent: { padding: SPACING.sm, gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: C.bg,
  },
  chipLabel: { color: C.text, fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'capitalize' },
  chipEta: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // Modals / sheets
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  centerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: C.border,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: SPACING.md,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sheetTitle: { flex: 1, color: C.text, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  sheetMeta: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },

  sectionLabel: {
    color: C.accent,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  garrisonRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 6 },
  garrisonName: { flex: 1, color: C.text, fontSize: FONT_SIZE.sm },
  garrisonCount: { color: C.text, fontSize: FONT_SIZE.sm },
  emptyLine: { color: C.textSecondary, fontSize: FONT_SIZE.sm, paddingVertical: 4 },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: SPACING.sm,
  },
  actionBtnText: { flex: 1, color: C.text, fontSize: FONT_SIZE.md, fontWeight: '600' },

  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: C.bg,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  pickName: { flex: 1, color: C.text, fontSize: FONT_SIZE.sm },
  pickDomain: { color: C.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  domainBadge: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallBtn: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  smallBtnText: { color: C.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' },

  attackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: C.enemy,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: SPACING.md,
  },
  attackBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: FONT_SIZE.md },

  // Phase F.2 — Haul home button + confirm
  haulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#F5A623', // amber, distinct from attack red
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: SPACING.md,
  },
  haulBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: FONT_SIZE.md },
  haulConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#F5A623',
  },

  airstrikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#F5A623', // amber
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: SPACING.sm,
  },
  airstrikeBtnDisabled: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  airstrikeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: FONT_SIZE.md },

  airstrikeConfirmCard: {
    marginTop: SPACING.md,
    backgroundColor: C.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: SPACING.md,
  },
  airstrikeConfirmTitle: { color: C.text, fontWeight: '800', fontSize: FONT_SIZE.md, marginBottom: 4 },
  airstrikeConfirmMeta: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  airstrikeConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#F5A623',
  },

  // Confirm card
  confirmCard: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: SPACING.lg,
  },
  confirmTitle: { color: C.text, fontSize: FONT_SIZE.lg, fontWeight: '800', marginBottom: SPACING.xs },
  confirmMeta: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  costRow: { flexDirection: 'row', gap: SPACING.sm, marginVertical: SPACING.sm, flexWrap: 'wrap' },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  costText: { color: C.text, fontSize: FONT_SIZE.sm, fontWeight: '700' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginVertical: SPACING.sm },
  switchBox: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchBoxOn: { backgroundColor: C.accent, borderColor: C.accent },
  switchLabel: { color: C.text, fontSize: FONT_SIZE.sm },

  confirmActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  ghostBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  ghostBtnText: { color: C.textSecondary, fontWeight: '700', fontSize: FONT_SIZE.md },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: C.accent,
  },
  primaryBtnText: { color: C.bg, fontWeight: '800', fontSize: FONT_SIZE.md },
  attackConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: C.enemy,
  },
  attackConfirmText: { color: '#FFFFFF', fontWeight: '800', fontSize: FONT_SIZE.md },

  // Attack origin / unit rows
  originChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  originChipSel: { backgroundColor: C.accent, borderColor: C.accent },
  originChipText: { color: C.text, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: C.bg,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unitRowSel: { borderColor: C.accent },

  // Objective marker (diamond)
  objectiveDiamond: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },

  // Scout capacity display
  scoutCapacityText: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  scoutLimitText: {
    color: C.warning,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  // AI zone warning
  aiWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#D7263D33',
  },
  aiWarningText: {
    color: '#D7263D',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Battle log rows
  battleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  battleType: { color: C.text, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  battleOpponent: { color: '#D7263D', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  battleDate: { color: C.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
  battleResult: { fontSize: FONT_SIZE.sm, fontWeight: '800', letterSpacing: 0.5 },

  // Phase F.3 — spy scan + destroy
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: C.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: SPACING.sm,
  },
  scanBtnDisabled: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  scanBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: FONT_SIZE.md },
  scanErrorText: {
    color: C.enemy,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  radarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: C.bg,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: C.enemy,
  },
  radarId: { color: C.text, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  radarOwner: { color: C.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
  destroyBtn: {
    backgroundColor: C.enemy,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  destroyBtnText: { color: '#FFFFFF', fontSize: FONT_SIZE.xs, fontWeight: '800' },
});
