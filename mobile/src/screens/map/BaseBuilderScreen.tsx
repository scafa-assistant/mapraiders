import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
  MapPressEvent,
} from 'react-native-maps';
import { BaseBuilderScreenProps } from '../../navigation/types';
import { RADAR_MAP_STYLE } from '../../utils/commander';
import { useBuildingStore } from '../../store/buildingStore';
import { useResourceStore } from '../../store/resourceStore';
import { useAuthStore } from '../../store/authStore';
import type { Building, BuildingType } from '../../services/api';
import { strings as S, t } from '../../i18n';
import { formatArea } from '../../utils/formatters';
import { fx } from '../../services/fx';
import { BuildToast } from '../../components/fx/BuildToast';
import BuildingPickerSheet from '../../components/BuildingPickerSheet';
import {
  FOOTPRINTS,
  BUILD_COSTS,
  BUILDING_EMOJI,
  BUILDING_SPRITE,
  TRAINING,
  CELL_SIZE_M,
  METERS_PER_DEG_LAT,
  isTrainer,
  footprintCells,
  footprintRect,
  footprintCenter,
  coordToCell,
  cellDeltas,
  MAX_TRAIN_BATCH,
  LatLng,
} from '../../utils/buildings';

// ─── Brand palette (white/blue, NO purple) ───────────────────────────────────
const ACCENT = '#1558F0';
const AMBER = '#F5A623';
const BG = '#F6F4F1';
const SURFACE = '#FFFFFF';
const BORDER = '#C0BAB4';
const TEXT = '#141210';
const TEXT_SECONDARY = '#7A7470';
const DANGER = '#D7263D';
const GOOD = '#1B9E5A';

// Commander radar look: white land, blue water, green woods — no real-world
// imagery, labels, or building footprints under the base.
const BASE_MAP_STYLE = [
  ...RADAR_MAP_STYLE,
  { featureType: 'landscape.man_made', stylers: [{ visibility: 'off' }] },
];

// Ground grid overlay tints (placement mode only).
const GRID_LINE = 'rgba(21,88,240,0.22)';
const TERRITORY_STROKE = ACCENT;
const TERRITORY_FILL = 'rgba(21,88,240,0.08)';
const GHOST_FREE = 'rgba(27,158,90,0.45)';
const GHOST_BLOCKED = 'rgba(215,38,61,0.45)';

// Sprite sizing bounds (px) and overhang factor for the pseudo-3D look.
const SPRITE_MIN = 24;
const SPRITE_MAX = 260;
const SPRITE_OVERHANG = 1.35;
const SPRITE_BUCKET = 8; // round size to this step so markers only re-rasterize on real zoom changes

const TIER_LABELS = ['', 'I', 'II', 'III'];

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// Localized building name / effect (mirrors TerritoryDetailScreen maps).
function getBuildingName(type: BuildingType): string {
  const names: Record<BuildingType, string> = {
    shield_generator: S.map.territoryDetail.buildingShieldGenerator,
    refinery: S.map.territoryDetail.buildingRefinery,
    radar: S.map.territoryDetail.buildingRadar,
    garrison: S.map.territoryDetail.buildingGarrison,
    silo: S.map.territoryDetail.buildingSilo,
    teleporter: S.map.territoryDetail.buildingTeleporter,
    sawmill: S.map.territoryDetail.buildingSawmill,
    quarry: S.map.territoryDetail.buildingQuarry,
    farm: S.map.territoryDetail.buildingFarm,
    fishery: S.map.territoryDetail.buildingFishery,
    military_base: S.map.territoryDetail.buildingMilitaryBase,
    airport: S.map.territoryDetail.buildingAirport,
    datacenter: S.map.territoryDetail.buildingDatacenter,
  };
  return names[type] ?? type;
}

function getBuildingEffect(type: BuildingType): string {
  const effects: Record<BuildingType, string> = {
    shield_generator: S.map.territoryDetail.buildingEffectShieldGenerator,
    refinery: S.map.territoryDetail.buildingEffectRefinery,
    radar: S.map.territoryDetail.buildingEffectRadar,
    garrison: S.map.territoryDetail.buildingEffectGarrison,
    silo: S.map.territoryDetail.buildingEffectSilo,
    teleporter: S.map.territoryDetail.buildingEffectTeleporter,
    sawmill: S.map.territoryDetail.buildingEffectSawmill,
    quarry: S.map.territoryDetail.buildingEffectQuarry,
    farm: S.map.territoryDetail.buildingEffectFarm,
    fishery: S.map.territoryDetail.buildingEffectFishery,
    military_base: S.map.territoryDetail.buildingEffectMilitaryBase,
    airport: S.map.territoryDetail.buildingEffectAirport,
    datacenter: S.map.territoryDetail.buildingEffectDatacenter,
  };
  return effects[type] ?? '';
}

const UNIT_NAME: Record<string, string> = {
  unit_militia: S.map.baseBuilder.unitMilitia,
  unit_infantry: S.map.baseBuilder.unitInfantry,
  unit_ranger: S.map.baseBuilder.unitRanger,
  unit_commando: S.map.baseBuilder.unitCommando,
  unit_recon_uav: S.map.baseBuilder.unitReconUav,
  unit_gunship: S.map.baseBuilder.unitGunship,
  unit_jet: S.map.baseBuilder.unitJet,
};

/** Do two footprint rectangles overlap? */
function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Parse a territory polygon into valid map coordinates (mirrors MapScreen). */
function parsePolygon(polygon: { latitude: number; longitude: number }[] | undefined): LatLng[] {
  if (!polygon || !Array.isArray(polygon)) return [];
  return polygon
    .filter((p) => p && typeof p.latitude === 'number' && typeof p.longitude === 'number')
    .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
}

export default function BaseBuilderScreen({ route, navigation }: BaseBuilderScreenProps) {
  const { territory } = route.params;
  const territoryId = territory.id;
  const territoryName = territory.ownerUsername;
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);

  const { buildingsByTerritory, gridByTerritory, loading, build, upgrade, demolish, train } =
    useBuildingStore();
  const { balances, fetchResources } = useResourceStore();
  const userLevel = useAuthStore((s) => s.user?.level ?? 1);

  const buildings = buildingsByTerritory[territoryId] ?? [];
  const grid = gridByTerritory[territoryId] ?? null;
  const side = grid?.side ?? 0;
  const cellM2 = grid?.cell_m2 ?? 25;

  // Territory geometry: polygon coords + SW-corner anchor of the bounding box.
  const coords = useMemo(() => parsePolygon(territory.polygon as any), [territory.polygon]);
  const bounds = useMemo(() => {
    if (coords.length < 3) return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const c of coords) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }
    return { minLat, maxLat, minLng, maxLng };
  }, [coords]);

  const initialRegion = useMemo<Region | null>(() => {
    if (!bounds) return null;
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.0005);
    const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.0005);
    return {
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      longitude: (bounds.minLng + bounds.maxLng) / 2,
      latitudeDelta: latSpan * 1.6,
      longitudeDelta: lngSpan * 1.6,
    };
  }, [bounds]);

  // ─── UI state ──────────────────────────────────────────────────────────────
  const [region, setRegion] = useState<Region | null>(initialRegion);
  const [now, setNow] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placementType, setPlacementType] = useState<BuildingType | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showPicker, setShowPicker] = useState(false);
  const [trainFor, setTrainFor] = useState<Building | null>(null);
  const [buildToast, setBuildToast] = useState<{ message: string; key: number } | null>(null);

  // Placed buildings (those with a grid position — server auto-places on fetch).
  const placed = useMemo(
    () => buildings.filter((b) => b.grid_x != null && b.grid_y != null),
    [buildings]
  );

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedId) ?? null,
    [buildings, selectedId]
  );

  // ─── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    useBuildingStore.getState().fetchBuildings(territoryId);
    fetchResources();
  }, [territoryId, fetchResources]);

  // Tick countdowns while anything is under construction.
  useEffect(() => {
    const active = buildings.some((b) => b.status === 'building' && b.completes_at);
    if (!active) return;
    const iv = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(iv);
  }, [buildings]);

  // Fit the camera to the territory once the native map is ready.
  const onMapReady = useCallback(() => {
    if (coords.length >= 3) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 90, right: 60, bottom: 160, left: 60 },
        animated: false,
      });
    }
  }, [coords]);

  // Screen pixels per real-world meter, derived from the current camera. Drives
  // sprite sizes so buildings feel pinned to the ground as the player zooms.
  const pxPerMeter = useMemo(() => {
    if (!region) return 0;
    const metersAcross =
      region.longitudeDelta * METERS_PER_DEG_LAT * Math.cos((region.latitude * Math.PI) / 180);
    if (metersAcross <= 0) return 0;
    return screenW / metersAcross;
  }, [region, screenW]);

  // Sprite side length (px), bucketed so markers re-rasterize only on real zoom steps.
  const spriteSize = useCallback(
    (type: BuildingType): number => {
      const [w] = FOOTPRINTS[type];
      const meters = w * CELL_SIZE_M;
      const raw = meters * pxPerMeter * SPRITE_OVERHANG;
      const clamped = clamp(Math.round(raw), SPRITE_MIN, SPRITE_MAX);
      return Math.round(clamped / SPRITE_BUCKET) * SPRITE_BUCKET;
    },
    [pxPerMeter]
  );

  // Free build area (cells not covered by any placed footprint).
  const usedCells = useMemo(
    () => placed.reduce((sum, b) => sum + footprintCells(b.type), 0),
    [placed]
  );
  const freeM2 = Math.max(0, (side * side - usedCells) * cellM2);

  // First free anchor for a footprint of size w×h.
  const findFirstFree = useCallback(
    (w: number, h: number): { x: number; y: number } => {
      for (let y = 0; y + h <= side; y++) {
        for (let x = 0; x + w <= side; x++) {
          const rect = { x, y, w, h };
          const collides = placed.some((b) =>
            rectsOverlap(rect, {
              x: b.grid_x as number,
              y: b.grid_y as number,
              w: FOOTPRINTS[b.type][0],
              h: FOOTPRINTS[b.type][1],
            })
          );
          if (!collides) return { x, y };
        }
      }
      return { x: 0, y: 0 };
    },
    [placed, side]
  );

  // Is the ghost footprint placement valid (in bounds + no overlap)?
  const ghostValid = useMemo(() => {
    if (!placementType) return false;
    const [w, h] = FOOTPRINTS[placementType];
    if (ghost.x < 0 || ghost.y < 0 || ghost.x + w > side || ghost.y + h > side) return false;
    const rect = { x: ghost.x, y: ghost.y, w, h };
    return !placed.some((b) =>
      rectsOverlap(rect, {
        x: b.grid_x as number,
        y: b.grid_y as number,
        w: FOOTPRINTS[b.type][0],
        h: FOOTPRINTS[b.type][1],
      })
    );
  }, [placementType, ghost, side, placed]);

  // ─── Map press → move ghost (placement mode only) ─────────────────────────────
  const onMapPress = (e: MapPressEvent) => {
    if (!placementType || !bounds || side === 0) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const [w, h] = FOOTPRINTS[placementType];
    const cell = coordToCell(bounds.minLat, bounds.minLng, latitude, longitude);
    const gx = clamp(cell.x, 0, Math.max(0, side - w));
    const gy = clamp(cell.y, 0, Math.max(0, side - h));
    setGhost({ x: gx, y: gy });
    fx.tick();
  };

  // ─── Countdown text for a building under construction ─────────────────────────
  const countdown = (completesAt: string | null): string => {
    if (!completesAt) return '';
    const ms = new Date(completesAt).getTime() - now;
    if (ms <= 0) return '…';
    const mins = Math.ceil(ms / 60_000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const enterPlacement = (type: BuildingType) => {
    setShowPicker(false);
    setSelectedId(null);
    const [w, h] = FOOTPRINTS[type];
    setGhost(findFirstFree(w, h));
    setPlacementType(type);
  };

  const confirmPlace = async () => {
    if (!placementType || !ghostValid) return;
    const type = placementType;
    const result = await build(territoryId, type, { x: ghost.x, y: ghost.y });
    if (result.success) {
      fx.buildFx();
      setBuildToast({
        message: t(S.map.territoryDetail.buildSuccessBanner, { name: getBuildingName(type) }),
        key: Date.now(),
      });
      setPlacementType(null);
    } else if (result.message) {
      Alert.alert(S.map.territoryDetail.buildFailedTitle, result.message);
    }
  };

  const handleUpgrade = (b: Building) => {
    Alert.alert(
      S.map.territoryDetail.upgradeDialogTitle,
      t(S.map.territoryDetail.upgradeDialogMsg, { name: getBuildingName(b.type) }),
      [
        { text: S.common.cancel, style: 'cancel' },
        {
          text: S.map.territoryDetail.upgradeAction,
          onPress: async () => {
            const r = await upgrade(b.id, territoryId);
            if (!r.success && r.message) Alert.alert(S.map.territoryDetail.upgradeFailedTitle, r.message);
          },
        },
      ]
    );
  };

  const handleDemolish = (b: Building) => {
    Alert.alert(
      S.map.territoryDetail.demolishTitle,
      t(S.map.territoryDetail.demolishMsg, { name: getBuildingName(b.type) }),
      [
        { text: S.common.cancel, style: 'cancel' },
        {
          text: S.map.territoryDetail.demolishAction,
          style: 'destructive',
          onPress: async () => {
            const r = await demolish(b.id, territoryId);
            if (r.success) {
              setSelectedId(null);
            } else if (r.message) {
              Alert.alert(S.common.error, r.message);
            }
          },
        },
      ]
    );
  };

  // ─── Grid lines (placement mode only) ─────────────────────────────────────────
  const gridLines = useMemo(() => {
    if (!bounds || !placementType || side === 0) return [];
    const { dLat, dLng } = cellDeltas(bounds.minLat);
    const { minLat, minLng } = bounds;
    const lines: { key: string; coordinates: LatLng[] }[] = [];
    for (let j = 0; j <= side; j++) {
      const lat = minLat + j * dLat;
      lines.push({
        key: `h${j}`,
        coordinates: [
          { latitude: lat, longitude: minLng },
          { latitude: lat, longitude: minLng + side * dLng },
        ],
      });
    }
    for (let i = 0; i <= side; i++) {
      const lng = minLng + i * dLng;
      lines.push({
        key: `v${i}`,
        coordinates: [
          { latitude: minLat, longitude: lng },
          { latitude: minLat + side * dLat, longitude: lng },
        ],
      });
    }
    return lines;
  }, [bounds, placementType, side]);

  // Ghost footprint corners (placement mode).
  const ghostCoords = useMemo(() => {
    if (!placementType || !bounds) return null;
    const [w, h] = FOOTPRINTS[placementType];
    return footprintRect(bounds.minLat, bounds.minLng, ghost.x, ghost.y, w, h);
  }, [placementType, bounds, ghost]);

  const placementCost = placementType ? BUILD_COSTS[placementType] : null;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {territoryName || S.map.baseBuilder.title}
          </Text>
          {grid != null && (
            <Text style={styles.headerFree}>
              {t(S.map.baseBuilder.freeArea, { area: formatArea(freeM2) })}
            </Text>
          )}
        </View>
        <View style={styles.balanceCol}>
          <Text style={styles.balanceItem}>⚡ {balances.energy}</Text>
          <Text style={styles.balanceItem}>⚙ {balances.tech}</Text>
        </View>
      </View>

      {/* Map board */}
      {initialRegion == null ? (
        <View style={styles.emptyWrap}>
          {loading ? (
            <ActivityIndicator size="large" color={ACCENT} />
          ) : (
            <Text style={styles.emptyText}>{S.map.territoryDetail.buildErrFeatureDisabled}</Text>
          )}
        </View>
      ) : (
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            customMapStyle={BASE_MAP_STYLE}
            initialRegion={initialRegion}
            onMapReady={onMapReady}
            onRegionChangeComplete={setRegion}
            onPress={onMapPress}
            rotateEnabled={false}
            pitchEnabled={false}
            scrollEnabled
            zoomEnabled
            showsCompass={false}
            showsUserLocation={false}
            toolbarEnabled={false}
          >
            {/* Territory outline */}
            {coords.length >= 3 && (
              <Polygon
                coordinates={coords}
                strokeColor={TERRITORY_STROKE}
                strokeWidth={2}
                fillColor={TERRITORY_FILL}
              />
            )}

            {/* Build grid (placement mode only) */}
            {gridLines.map((line) => (
              <Polyline
                key={line.key}
                coordinates={line.coordinates}
                strokeColor={GRID_LINE}
                strokeWidth={1}
              />
            ))}

            {/* Ghost footprint (placement mode) */}
            {ghostCoords && (
              <Polygon
                coordinates={ghostCoords}
                strokeColor={ghostValid ? GOOD : DANGER}
                strokeWidth={2}
                fillColor={ghostValid ? GHOST_FREE : GHOST_BLOCKED}
              />
            )}

            {/* Placed buildings as ground sprites */}
            {bounds &&
              placed.map((b) => {
                const [w, h] = FOOTPRINTS[b.type];
                const center = footprintCenter(
                  bounds.minLat,
                  bounds.minLng,
                  b.grid_x as number,
                  b.grid_y as number,
                  w,
                  h
                );
                const size = spriteSize(b.type);
                const underConstruction = b.status === 'building';
                return (
                  <BuildingMarker
                    key={`${b.id}-${size}`}
                    coordinate={center}
                    size={size}
                    type={b.type}
                    tier={b.tier}
                    dimmed={underConstruction}
                    countdown={underConstruction ? countdown(b.completes_at) : null}
                    selected={b.id === selectedId}
                    onPress={() => {
                      if (placementType) return;
                      setSelectedId(b.id);
                      fx.tick();
                    }}
                  />
                );
              })}
          </MapView>
        </View>
      )}

      {/* Floating "+ Build" button (hidden during placement / when a card is open) */}
      {grid != null && !placementType && !selectedBuilding && (
        <TouchableOpacity
          style={[styles.buildFab, { bottom: insets.bottom + 20 }]}
          onPress={() => { fx.soft(); setShowPicker(true); }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.buildFabText}>{S.map.baseBuilder.buildBtn}</Text>
        </TouchableOpacity>
      )}

      {/* Placement confirm bar */}
      {placementType && (
        <View style={[styles.placeBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.placeInfo}>
            <Text style={styles.placeName}>
              {BUILDING_EMOJI[placementType]} {getBuildingName(placementType)}
            </Text>
            {placementCost && (
              <Text style={styles.placeCost}>
                ⚡{placementCost.energy} ⚙{placementCost.tech}
              </Text>
            )}
            <Text style={ghostValid ? styles.placeHint : styles.placeBlocked}>
              {ghostValid ? S.map.baseBuilder.placeHint : S.map.baseBuilder.blockedHint}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.placeCancel}
            onPress={() => { fx.tick(); setPlacementType(null); }}
          >
            <Ionicons name="close" size={20} color={DANGER} />
            <Text style={styles.placeCancelText}>{S.map.baseBuilder.cancelBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.placeConfirm, (!ghostValid || loading) && styles.placeConfirmDisabled]}
            onPress={confirmPlace}
            disabled={!ghostValid || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.placeConfirmText}>{S.map.baseBuilder.placeBtn}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Building info card */}
      {selectedBuilding && !placementType && (
        <View style={[styles.infoCard, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoName}>
              {BUILDING_EMOJI[selectedBuilding.type]} {getBuildingName(selectedBuilding.type)}
            </Text>
            <TouchableOpacity onPress={() => { fx.tick(); setSelectedId(null); }}>
              <Ionicons name="close-circle" size={24} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoMeta}>
            {t(S.map.baseBuilder.tierLabel, { tier: selectedBuilding.tier })}
            {selectedBuilding.status === 'building'
              ? `  ·  ⏳ ${countdown(selectedBuilding.completes_at)}`
              : ''}
          </Text>
          <Text style={styles.infoEffect}>{getBuildingEffect(selectedBuilding.type)}</Text>
          <View style={styles.infoActions}>
            {selectedBuilding.status === 'active' && selectedBuilding.tier < 3 && (
              <TouchableOpacity
                style={styles.infoActionUpgrade}
                onPress={() => { fx.tick(); handleUpgrade(selectedBuilding); }}
              >
                <Ionicons name="arrow-up-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.infoActionText}>{S.map.baseBuilder.actionUpgrade}</Text>
              </TouchableOpacity>
            )}
            {isTrainer(selectedBuilding.type) && selectedBuilding.status === 'active' && (
              <TouchableOpacity
                style={styles.infoActionTrain}
                onPress={() => { fx.soft(); setTrainFor(selectedBuilding); }}
              >
                <Ionicons name="people-outline" size={16} color="#FFFFFF" />
                <Text style={styles.infoActionText}>{S.map.baseBuilder.actionTrain}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.infoActionDemolish}
              onPress={() => { fx.tick(); handleDemolish(selectedBuilding); }}
            >
              <Ionicons name="trash-outline" size={16} color={DANGER} />
              <Text style={styles.infoActionDemolishText}>{S.map.baseBuilder.actionDemolish}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Building picker sheet */}
      <BuildingPickerSheet
        visible={showPicker}
        balances={balances}
        loading={loading}
        economyEnabled
        advancedEnabled
        userLevel={userLevel}
        onClose={() => setShowPicker(false)}
        onBuild={enterPlacement}
      />

      {/* Training sheet */}
      <TrainingSheet
        building={trainFor}
        userLevel={userLevel}
        balances={balances}
        loading={loading}
        onClose={() => setTrainFor(null)}
        onTrain={async (unit, count) => {
          if (!trainFor) return;
          const r = await train(trainFor.id, unit, count);
          if (r.success) {
            fx.confirm();
            setBuildToast({
              message: t(S.map.baseBuilder.trainSuccess, { count, unit: UNIT_NAME[unit] ?? unit }),
              key: Date.now(),
            });
            setTrainFor(null);
          } else if (r.message) {
            Alert.alert(S.common.error, r.message);
          }
        }}
      />

      {/* Success banner */}
      <BuildToast
        message={buildToast?.message ?? null}
        fireKey={buildToast?.key ?? 0}
        onDone={() => setBuildToast(null)}
      />
    </SafeAreaView>
  );
}

// ─── Building marker (ground sprite) ───────────────────────────────────────────

interface BuildingMarkerProps {
  coordinate: LatLng;
  size: number;
  type: BuildingType;
  tier: number;
  dimmed: boolean;
  countdown: string | null;
  selected: boolean;
  onPress: () => void;
}

/**
 * A placed building rendered as a Marker anchored to the ground. tracksViewChanges
 * starts true so the native marker rasterizes the sprite, then flips false for
 * performance; a size change re-keys the marker (parent), remounting this so it
 * re-rasterizes at the new zoom bucket.
 */
function BuildingMarker({
  coordinate,
  size,
  type,
  tier,
  dimmed,
  countdown,
  selected,
  onPress,
}: BuildingMarkerProps) {
  const [tracks, setTracks] = useState(true);
  const tierLabel = TIER_LABELS[tier] ?? `${tier}`;
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.85 }}
      tracksViewChanges={tracks}
      onPress={onPress}
    >
      <View style={styles.markerWrap}>
        <View style={[styles.markerChip, selected && styles.markerChipSelected]}>
          <Text style={styles.markerChipText}>
            {BUILDING_EMOJI[type]}
            {tierLabel ? ` ${tierLabel}` : ''}
          </Text>
        </View>
        {dimmed && countdown ? (
          <View style={styles.markerCountdown}>
            <Text style={styles.markerCountdownText}>⏳ {countdown}</Text>
          </View>
        ) : null}
        <Image
          source={BUILDING_SPRITE[type]}
          style={{ width: size, height: size, opacity: dimmed ? 0.55 : 1 }}
          resizeMode="contain"
          onLoad={() => setTracks(false)}
        />
      </View>
    </Marker>
  );
}

// ─── Training sheet (modal) ────────────────────────────────────────────────────

interface TrainingSheetProps {
  building: Building | null;
  userLevel: number;
  balances: { energy: number; tech: number };
  loading: boolean;
  onClose: () => void;
  onTrain: (unit: string, count: number) => void;
}

function TrainingSheet({ building, userLevel, balances, loading, onClose, onTrain }: TrainingSheetProps) {
  const insets = useSafeAreaInsets();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const recipes = building && isTrainer(building.type) ? TRAINING[building.type] : [];
  const visible = building != null && isTrainer(building?.type ?? 'refinery');

  const countFor = (unit: string) => counts[unit] ?? 1;
  const setCount = (unit: string, v: number) =>
    setCounts((c) => ({ ...c, [unit]: clamp(v, 1, MAX_TRAIN_BATCH) }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.sheetTitleRow}>
          <Text style={styles.sheetTitle}>{S.map.baseBuilder.trainTitle}</Text>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Text style={styles.sheetCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceInline}>⚡ {balances.energy}</Text>
          <Text style={styles.balanceInline}>⚙ {balances.tech}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.trainList}>
          {recipes.map((r) => {
            const count = countFor(r.unit);
            const locked = userLevel < r.minLevel;
            const totalE = r.costEnergy * count;
            const totalT = r.costTech * count;
            const canAfford = balances.energy >= totalE && balances.tech >= totalT;
            const disabled = locked || !canAfford || loading;
            return (
              <View key={r.unit} style={[styles.trainRow, locked && styles.trainRowLocked]}>
                <Text style={styles.trainEmoji}>{locked ? '🔒' : r.emoji}</Text>
                <View style={styles.trainInfo}>
                  <Text style={styles.trainName}>{UNIT_NAME[r.unit] ?? r.unit}</Text>
                  {locked ? (
                    <Text style={styles.trainLocked}>
                      {t(S.map.baseBuilder.lockedLevel, { n: r.minLevel })}
                    </Text>
                  ) : (
                    <Text style={styles.trainStats}>
                      ATK {r.atk} · DEF {r.def} · ⚡{r.costEnergy} ⚙{r.costTech}
                    </Text>
                  )}
                </View>
                {!locked && (
                  <View style={styles.trainRight}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => { fx.tick(); setCount(r.unit, count - 1); }}
                      >
                        <Ionicons name="remove" size={16} color={TEXT} />
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{count}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => { fx.tick(); setCount(r.unit, count + 1); }}
                      >
                        <Ionicons name="add" size={16} color={TEXT} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[styles.trainBtn, disabled && styles.trainBtnDisabled]}
                      disabled={disabled}
                      onPress={() => { fx.tick(); onTrain(r.unit, count); }}
                    >
                      <Text style={styles.trainBtnText}>{S.map.baseBuilder.trainBtn}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: SURFACE,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { color: TEXT, fontSize: 17, fontWeight: '800' },
  headerFree: { color: ACCENT, fontSize: 12, fontWeight: '700', marginTop: 2 },
  balanceCol: { alignItems: 'flex-end', gap: 2 },
  balanceItem: { color: TEXT, fontSize: 13, fontWeight: '700' },

  mapWrap: { flex: 1, overflow: 'hidden' },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: TEXT_SECONDARY, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Ground marker
  markerWrap: { alignItems: 'center', justifyContent: 'flex-end' },
  markerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,18,16,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  markerChipSelected: { backgroundColor: ACCENT },
  markerChipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  markerCountdown: {
    backgroundColor: 'rgba(20,18,16,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginBottom: 2,
  },
  markerCountdownText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  buildFab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buildFabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  placeBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  placeInfo: { flex: 1 },
  placeName: { color: TEXT, fontSize: 14, fontWeight: '800' },
  placeCost: { color: ACCENT, fontSize: 12, fontWeight: '700', marginTop: 2 },
  placeHint: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '600', marginTop: 2 },
  placeBlocked: { color: DANGER, fontSize: 11, fontWeight: '700', marginTop: 2 },
  placeCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DANGER,
  },
  placeCancelText: { color: DANGER, fontSize: 13, fontWeight: '800' },
  placeConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: GOOD,
  },
  placeConfirmDisabled: { backgroundColor: BORDER },
  placeConfirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  infoCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoName: { color: TEXT, fontSize: 17, fontWeight: '800', flex: 1 },
  infoMeta: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '700', marginTop: 6 },
  infoEffect: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 18, marginTop: 8 },
  infoActions: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  infoActionUpgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
  },
  infoActionTrain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AMBER,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
  },
  infoActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  infoActionDemolish: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DANGER,
  },
  infoActionDemolishText: { color: DANGER, fontSize: 14, fontWeight: '800' },

  // Training sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '80%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { color: TEXT, fontSize: 18, fontWeight: '800' },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  sheetCloseText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '700' },
  balanceRow: { flexDirection: 'row', gap: 16, marginBottom: 12, paddingHorizontal: 4 },
  balanceInline: { color: ACCENT, fontSize: 13, fontWeight: '700' },
  trainList: { flexGrow: 0 },
  trainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  trainRowLocked: { opacity: 0.6 },
  trainEmoji: { fontSize: 26, width: 34, textAlign: 'center' },
  trainInfo: { flex: 1, gap: 3 },
  trainName: { color: TEXT, fontSize: 14, fontWeight: '700' },
  trainStats: { color: TEXT_SECONDARY, fontSize: 11 },
  trainLocked: { color: DANGER, fontSize: 11, fontWeight: '700' },
  trainRight: { alignItems: 'flex-end', gap: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepValue: { color: TEXT, fontSize: 14, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  trainBtn: { backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 },
  trainBtnDisabled: { backgroundColor: BORDER },
  trainBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
