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
  LatLng,
} from '../../utils/commander';
import type {
  CommanderTerritory,
  CommanderOwnMovement,
  CommanderForeignMovement,
  CommanderGarrison,
} from '../../services/api';
import { SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';

const H3_RES = 8;
const VISION_HEX_CAP = 300;
const MAX_ATTACK_UNITS = 6;

/** Inventory unit = category 'unit' OR definition_id starts with 'unit_'. */
function isUnit(item: ItemInstance): boolean {
  return item.category === 'unit' || (item.definition_id || '').startsWith('unit_');
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
    battles,
    fetchBattles,
    clearError,
  } = useCommanderStore();
  const { items, fetchInventory } = useInventoryStore();
  const userId = useAuthStore((s) => s.user?.id);

  const mapRef = useRef<MapView>(null);
  const fittedRef = useRef(false);
  const [tick, setTick] = useState(0); // forces marker recompute every 2s

  const [selectedTerritory, setSelectedTerritory] = useState<CommanderTerritory | null>(null);
  const [flow, setFlow] = useState<ActiveFlow>({ kind: 'none' });
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [buildRadar, setBuildRadar] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const unitItems = useMemo(() => items.filter(isUnit), [items]);

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

  // ── Fit to visible cells on first load.
  useEffect(() => {
    if (fittedRef.current || !mapData) return;
    const coords: LatLng[] = [];
    for (const cell of mapData.visible_cells.slice(0, 200)) {
      const c = cellCenter(cell);
      if (c) coords.push(c);
    }
    if (coords.length === 0) {
      for (const t of mapData.territories) {
        const c = t.h3_cells[0] ? cellCenter(t.h3_cells[0]) : null;
        if (c) coords.push(c);
      }
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

  // ── Decide which vision hexes to draw (cap to avoid overdraw).
  const visionCells = useMemo(() => {
    if (!mapData) return [];
    const all = mapData.visible_cells;
    if (all.length <= VISION_HEX_CAP) return all;
    // Over the cap: only render territory + radar cells, skip plain-vision hexes.
    const keep = new Set<string>();
    for (const t of mapData.territories) t.h3_cells.forEach((c) => keep.add(c));
    for (const r of mapData.radars) r.cells.forEach((c) => keep.add(c));
    return all.filter((c) => keep.has(c));
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

  const openTerritory = useCallback((t: CommanderTerritory) => {
    setSelectedTerritory(t);
    setBuildRadar(false);
  }, []);

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
          {/* Plain vision hexes — thin violet stroke, very low fill */}
          {visionCells.map((cell) => {
            // Skip cells that belong to a territory (those get a richer fill below).
            if (territoryByCell.has(cell)) return null;
            const coords = cellToPolygon(cell);
            if (coords.length < 3) return null;
            return (
              <Polygon
                key={`vis-${cell}`}
                coordinates={coords}
                strokeColor={`${C.vision}44`}
                strokeWidth={0.5}
                fillColor={`${C.vision}0D`}
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

          {/* Territories — own violet, foreign cyan */}
          {mapData?.territories.map((t) =>
            t.h3_cells.map((cell) => {
              const coords = cellToPolygon(cell);
              if (coords.length < 3) return null;
              const col = t.is_own ? C.own : C.foreign;
              const fillAlpha = t.is_own ? '59' : '40'; // 0.35 / 0.25
              return (
                <Polygon
                  key={`terr-${t.id}-${cell}`}
                  coordinates={coords}
                  strokeColor={col}
                  strokeWidth={1}
                  fillColor={`${col}${fillAlpha}`}
                  tappable
                  onPress={() => openTerritory(t)}
                />
              );
            })
          )}

          {/* Own movement paths + progress marker */}
          {ownMovements.map((m) => {
            const line = pathPolyline(m.path);
            const pos = pathPositionAt(m.path, m.progress);
            const col =
              m.purpose === 'attack' ? C.enemy : m.purpose === 'scout' ? C.accent : C.foreign;
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
                      <Ionicons
                        name={m.purpose === 'attack' ? 'flash' : m.purpose === 'scout' ? 'eye' : 'shield'}
                        size={10}
                        color={col}
                      />
                    </View>
                  </Marker>
                ) : null}
              </React.Fragment>
            );
          })}

          {/* Foreign movements — red marker at current cell, no path (fog) */}
          {foreignMovements.map((m) => {
            const pos = cellCenter(m.current_cell);
            if (!pos) return null;
            return (
              <Marker key={`fm-${m.id}`} coordinate={pos} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.enemyDot}>
                  <Ionicons name="alert" size={10} color="#FFFFFF" />
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

      {/* Movements strip */}
      {ownMovements.length > 0 ? (
        <View style={styles.strip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
            {ownMovements.map((m) => {
              const col =
                m.purpose === 'attack' ? C.enemy : m.purpose === 'scout' ? C.accent : C.foreign;
              return (
                <View key={`chip-${m.id}`} style={[styles.chip, { borderColor: col }]}>
                  <Ionicons
                    name={m.purpose === 'attack' ? 'flash' : m.purpose === 'scout' ? 'eye' : 'shield'}
                    size={12}
                    color={col}
                  />
                  <Text style={styles.chipLabel}>{m.purpose}</Text>
                  <Text style={[styles.chipEta, { color: col }]}>{formatCountdown(m.arrives_at)}</Text>
                  {(m.purpose === 'scout' || m.purpose === 'reinforce') && m.status !== 'returning' ? (
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
        submitting={submitting}
        onClose={closeSheet}
        onDeploy={handleDeploy}
        onUndeploy={handleUndeploy}
        onStartScout={beginScout}
        onStartAttack={(target) => {
          // pick a from-territory: first own territory by default
          const from = ownTerritories[0];
          if (!from) return;
          closeSheet();
          setFlow({ kind: 'attack', instanceIds: [], fromTerritoryId: from.id, targetTerritoryId: target.id });
        }}
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

function TerritoryActionSheet({
  territory,
  garrison,
  units,
  ownTerritories,
  submitting,
  onClose,
  onDeploy,
  onUndeploy,
  onStartScout,
  onStartAttack,
}: {
  territory: CommanderTerritory | null;
  garrison: CommanderGarrison | null;
  units: ItemInstance[];
  ownTerritories: CommanderTerritory[];
  submitting: boolean;
  onClose: () => void;
  onDeploy: (instanceId: string, territoryId: string) => void;
  onUndeploy: (instanceId: string) => void;
  onStartScout: (instanceId: string, fromTerritoryId: string) => void;
  onStartAttack: (target: CommanderTerritory) => void;
}) {
  const [deployPickerOpen, setDeployPickerOpen] = useState(false);
  const [scoutPickerOpen, setScoutPickerOpen] = useState(false);

  if (!territory) return null;
  const isOwn = territory.is_own;
  const scoutBase = ownTerritories[0];

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
        </Text>

        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {/* Garrison list */}
          <Text style={styles.sectionLabel}>GARRISON</Text>
          {garrison && garrison.count > 0 ? (
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
                    style={styles.actionBtn}
                    onPress={() => setScoutPickerOpen((v) => !v)}
                  >
                    <Ionicons name="eye" size={18} color={C.accent} />
                    <Text style={styles.actionBtnText}>Dispatch scout</Text>
                    <Ionicons
                      name={scoutPickerOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={C.textSecondary}
                    />
                  </TouchableOpacity>
                  {scoutPickerOpen
                    ? units.length === 0
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
                    : null}
                </>
              ) : null}
            </>
          ) : (
            <>
              {/* Foreign: attack + send scout here */}
              <TouchableOpacity style={styles.attackBtn} onPress={() => onStartAttack(territory)}>
                <Ionicons name="flash" size={18} color="#FFFFFF" />
                <Text style={styles.attackBtnText}>Attack this territory</Text>
              </TouchableOpacity>
              {scoutBase ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onStartScout(units[0]?.id ?? '', scoutBase.id)}
                  disabled={units.length === 0}
                >
                  <Ionicons name="eye" size={18} color={C.accent} />
                  <Text style={styles.actionBtnText}>Send scout here</Text>
                </TouchableOpacity>
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
              return (
                <TouchableOpacity key={b.id} style={styles.battleRow} onPress={() => onOpen(b.id)}>
                  <Ionicons
                    name={won ? 'trophy' : 'skull'}
                    size={16}
                    color={won ? C.warning : C.enemy}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.battleType}>
                      {playerIsAttacker ? 'Attack' : 'Defense'} · {prettifyDefinitionId(b.type)}
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
  battleDate: { color: C.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
  battleResult: { fontSize: FONT_SIZE.sm, fontWeight: '800', letterSpacing: 0.5 },
});
