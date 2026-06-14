// ============================================================
// Side panel — territory details + building management.
// Buildings only appear when the `resources` flag is on AND the territory
// belongs to the signed-in user (the only GPS-free actions in v1).
// Phase F.1: extraction buildings (sawmill/quarry/farm/fishery) gated by
// BOTH `resources` AND `economy` flags. Stockpile display added.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { buildingApi, errorMessage, territoryApi } from '../api/client';
import { readableBuildingError } from '../api/buildingErrors';
import { useAuthStore } from '../store/authStore';
import { useFeatureStore } from '../store/featureStore';
import { useResourceStore } from '../store/resourceStore';
import { buildingLabel, countdownTo, formatArea, tierNumeral, upgradeCost } from '../utils';
import type { Building, BuildingType, ExtractionBuildingType, StockpileEntry, TerritoryDetail } from '../api/types';

interface Props {
  territoryId: string;
  onClose: () => void;
}

// ---- Standard military buildings ----
const MILITARY_TYPES = [
  'shield_generator',
  'refinery',
  'radar',
  'garrison',
  'silo',
  'teleporter',
] as const satisfies BuildingType[];

const BUILD_COSTS: Record<BuildingType, { energy: number; tech: number }> = {
  shield_generator: { energy: 200, tech: 100 },
  refinery: { energy: 150, tech: 80 },
  radar: { energy: 180, tech: 120 },
  garrison: { energy: 250, tech: 150 },
  silo: { energy: 400, tech: 250 },
  teleporter: { energy: 300, tech: 200 },
  // Extraction buildings (Phase F.1)
  sawmill: { energy: 120, tech: 40 },
  quarry: { energy: 150, tech: 60 },
  farm: { energy: 120, tech: 30 },
  fishery: { energy: 130, tech: 40 },
};

const BUILDING_ICONS: Record<BuildingType, string> = {
  shield_generator: '🛡',
  refinery: '⚗',
  radar: '📡',
  garrison: '🏰',
  silo: '☄',
  teleporter: '🌀',
  // Extraction
  sawmill: '🪓',
  quarry: '⛏',
  farm: '🌾',
  fishery: '🐟',
};

// ---- Extraction building metadata ----
interface ExtractionMeta {
  type: ExtractionBuildingType;
  label: string;
  biomeHint: string;
  resource: string;
}

const EXTRACTION_BUILDINGS: ExtractionMeta[] = [
  { type: 'sawmill',  label: 'Sawmill',  biomeHint: 'needs forest terrain',    resource: 'wood' },
  { type: 'quarry',   label: 'Quarry',   biomeHint: 'needs industrial terrain', resource: 'stone' },
  { type: 'farm',     label: 'Farm',     biomeHint: 'needs farmland terrain',   resource: 'food' },
  { type: 'fishery',  label: 'Fishery',  biomeHint: 'needs water terrain',      resource: 'food' },
];

// Friendly BIOME_MISMATCH hints per extractor type (shown instead of generic error).
const BIOME_MISMATCH_HINTS: Record<ExtractionBuildingType, string> = {
  sawmill:  "This territory isn't forest — a sawmill needs forest terrain.",
  quarry:   "This territory isn't industrial — a quarry needs industrial terrain.",
  farm:     "This territory isn't farmland — a farm needs farmland terrain.",
  fishery:  "This territory isn't water — a fishery needs water terrain.",
};

// Stockpile resource colours
const STOCKPILE_COLORS: Record<string, string> = {
  wood:  '#A06A3C',
  stone: '#9CA3AF',
  food:  '#6FBF5B',
};

const STOCKPILE_ICONS: Record<string, string> = {
  wood:  '🪵',
  stone: '🪨',
  food:  '🌾',
};

// Re-render countdowns once a second so "building" timers tick down live.
function useTick(active: boolean): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setN((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return n;
}

export default function TerritoryPanel({ territoryId, onClose }: Props) {
  const userId = useAuthStore((s) => s.user?.id);
  const resourcesEnabled = useFeatureStore((s) => s.isEnabled('resources'));
  const economyEnabled = useFeatureStore((s) => s.isEnabled('economy'));
  const refreshResources = useResourceStore((s) => s.refresh);

  const [territory, setTerritory] = useState<TerritoryDetail | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [stockpile, setStockpile] = useState<StockpileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isOwn = Boolean(territory && userId && territory.owner_id === userId);
  const showBuildings = resourcesEnabled && isOwn;
  const showExtraction = showBuildings && economyEnabled;

  const hasBuildingInProgress = buildings.some((b) => b.status === 'building');
  useTick(hasBuildingInProgress);

  const loadBuildings = useCallback(async () => {
    if (!resourcesEnabled) return;
    try {
      const result = await buildingApi.list(territoryId);
      setBuildings(result.buildings);
      setStockpile(result.stockpile);
    } catch {
      setBuildings([]);
      setStockpile([]);
    }
  }, [territoryId, resourcesEnabled]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActionError(null);
    setBuildings([]);

    (async () => {
      try {
        const detail = await territoryApi.getById(territoryId);
        if (cancelled) return;
        setTerritory(detail);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Failed to load territory'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    void loadBuildings();
    return () => {
      cancelled = true;
    };
  }, [territoryId, loadBuildings]);

  function reportActionError(err: unknown, attemptedType?: BuildingType) {
    // The buildings route returns message = machine code on domain failure.
    if (axios.isAxiosError(err)) {
      const code = (err.response?.data as { message?: string } | undefined)?.message;
      // For BIOME_MISMATCH show a type-specific friendly message when available.
      if (code === 'BIOME_MISMATCH' && attemptedType && attemptedType in BIOME_MISMATCH_HINTS) {
        setActionError(BIOME_MISMATCH_HINTS[attemptedType as ExtractionBuildingType]);
      } else {
        setActionError(readableBuildingError(code, errorMessage(err, 'Action failed')));
      }
    } else {
      setActionError(errorMessage(err, 'Action failed'));
    }
  }

  async function onBuild(type: BuildingType) {
    setBusy(true);
    setActionError(null);
    try {
      await buildingApi.build(territoryId, type);
      await Promise.all([loadBuildings(), refreshResources()]);
    } catch (err) {
      reportActionError(err, type);
    } finally {
      setBusy(false);
    }
  }

  async function onDemolish(building: Building) {
    if (!window.confirm(`Demolish ${buildingLabel(building.type)}? You get 50% of the cost back.`)) {
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await buildingApi.demolish(building.id);
      await Promise.all([loadBuildings(), refreshResources()]);
    } catch (err) {
      reportActionError(err, undefined);
    } finally {
      setBusy(false);
    }
  }

  async function onUpgrade(building: Building) {
    setBusy(true);
    setActionError(null);
    try {
      await buildingApi.upgrade(building.id);
      await Promise.all([loadBuildings(), refreshResources()]);
    } catch (err) {
      reportActionError(err, undefined);
    } finally {
      setBusy(false);
    }
  }

  const existingTypes = new Set(
    buildings.filter((b) => b.status !== 'destroyed').map((b) => b.type),
  );

  return (
    <aside className="side-panel">
      <button className="panel-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      {loading && <div className="muted">Loading territory…</div>}
      {error && <div className="panel-error">{error}</div>}

      {territory && (
        <>
          <h2>{territory.owner_username ?? 'Unclaimed territory'}</h2>
          <div className="muted" style={{ marginBottom: 12 }}>
            {isOwn ? 'Your territory' : 'Foreign territory'}
          </div>

          <div className="meta-row">
            <span className="k">Owner</span>
            <span className="v">{territory.owner_username ?? '—'}</span>
          </div>
          {territory.owner_level != null && (
            <div className="meta-row">
              <span className="k">Owner level</span>
              <span className="v">{territory.owner_level}</span>
            </div>
          )}
          <div className="meta-row">
            <span className="k">Claim value</span>
            <span className="v">{territory.claim_value ?? '—'}</span>
          </div>
          <div className="meta-row">
            <span className="k">Decay</span>
            <span className="v">{Math.round((territory.decay_level ?? 0) * 100)}%</span>
          </div>
          <div className="meta-row">
            <span className="k">Area</span>
            <span className="v">{formatArea(territory.area_m2)}</span>
          </div>
          {territory.has_defense && (
            <div className="meta-row">
              <span className="k">Defense</span>
              <span className="v">{territory.defense_game_type ?? 'active'}</span>
            </div>
          )}

          {showBuildings && (
            <>
              <div className="section-title">Buildings</div>

              {actionError && <div className="panel-error">{actionError}</div>}

              {buildings.length === 0 && (
                <div className="muted" style={{ marginBottom: 8 }}>
                  No buildings yet.
                </div>
              )}

              {buildings.map((b) => {
                const tierLabel = b.tier > 0 ? tierNumeral(b.tier) : '';
                const canUpgrade = b.status === 'active' && b.tier < 3;
                // New builds also sit in status 'building' with tier 1 — the
                // upgrade marker is config.upgrading_to, never the tier.
                const upgrading = b.status === 'building' &&
                  Boolean((b.config as Record<string, unknown> | undefined)?.upgrading_to);
                const upCost = canUpgrade ? upgradeCost(BUILD_COSTS[b.type as BuildingType] ?? { energy: 0, tech: 0 }, b.tier) : null;
                return (
                  <div className="building-card" key={b.id}>
                    <div className="row">
                      <span className="building-name">
                        {BUILDING_ICONS[b.type as BuildingType] ?? '🏗'} {buildingLabel(b.type)}
                        {tierLabel && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, opacity: 0.75 }}>
                            Tier {tierLabel}
                          </span>
                        )}
                      </span>
                      <span className={`badge ${b.status === 'active' ? 'active' : b.status === 'building' ? 'building' : 'neutral'}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="row" style={{ marginTop: 6 }}>
                      {b.status === 'building' && b.completes_at ? (
                        <span className="countdown">
                          {upgrading ? `Upgrading → Tier ${tierNumeral(b.tier + 1)} — ` : 'Ready in '}
                          {countdownTo(b.completes_at)}
                        </span>
                      ) : (
                        <span className="muted">HP {b.hp}</span>
                      )}
                      {(b.status === 'building' || b.status === 'active') && (
                        <button
                          className="btn-demolish"
                          disabled={busy}
                          onClick={() => void onDemolish(b)}
                        >
                          Demolish
                        </button>
                      )}
                    </div>
                    {canUpgrade && upCost && (
                      <div className="row" style={{ marginTop: 4 }}>
                        <button
                          className="build-btn"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          disabled={busy}
                          onClick={() => void onUpgrade(b)}
                        >
                          Upgrade → Tier {tierNumeral(b.tier + 1)} ({upCost.energy}⚡ {upCost.tech}⚙)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ---- Military build picker ---- */}
              <div className="section-title" style={{ marginTop: 14 }}>Build (Military)</div>
              <div className="build-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {MILITARY_TYPES.map((type) => {
                  const cost = BUILD_COSTS[type];
                  const already = existingTypes.has(type);
                  return (
                    <button
                      key={type}
                      className="build-btn"
                      disabled={busy || already}
                      onClick={() => void onBuild(type)}
                      title={already ? 'Already built here' : undefined}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '7px 8px' }}
                    >
                      <span style={{ fontSize: 13 }}>
                        {BUILDING_ICONS[type]} {already ? `${buildingLabel(type)} ✓` : `Build ${buildingLabel(type)}`}
                      </span>
                      <span className="cost" style={{ fontSize: 10 }}>
                        {cost.energy}⚡ {cost.tech}⚙
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ---- Extraction build picker (economy flag) ---- */}
              {showExtraction && (
                <>
                  <div className="section-title" style={{ marginTop: 14 }}>Build (Extraction)</div>
                  <div
                    className="build-options"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}
                  >
                    {EXTRACTION_BUILDINGS.map(({ type, label, biomeHint, resource }) => {
                      const cost = BUILD_COSTS[type];
                      const already = existingTypes.has(type);
                      return (
                        <button
                          key={type}
                          className="build-btn"
                          disabled={busy || already}
                          onClick={() => void onBuild(type)}
                          title={already ? 'Already built here' : biomeHint}
                          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '7px 8px' }}
                        >
                          <span style={{ fontSize: 13 }}>
                            {BUILDING_ICONS[type]}{' '}
                            {already ? `${label} ✓` : `Build ${label}`}
                          </span>
                          <span className="cost" style={{ fontSize: 10 }}>
                            {cost.energy}⚡ {cost.tech}⚙
                          </span>
                          <span style={{ fontSize: 10, opacity: 0.65 }}>
                            {biomeHint} → {resource}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ---- Stockpile display ---- */}
              {showExtraction && stockpile.length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: 18 }}>Production / Stockpile</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {stockpile.map((entry) => {
                      const color = STOCKPILE_COLORS[entry.resource] ?? '#7A7470';
                      const icon = STOCKPILE_ICONS[entry.resource] ?? '📦';
                      const pct = entry.cap > 0 ? Math.min(100, (entry.amount / entry.cap) * 100) : 0;
                      return (
                        <div
                          key={entry.resource}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 12,
                          }}
                        >
                          <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
                          <span style={{ color, fontWeight: 600, minWidth: 44, textTransform: 'capitalize' }}>
                            {entry.resource}
                          </span>
                          {/* progress bar */}
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              background: 'var(--border)',
                              borderRadius: 3,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: color,
                                borderRadius: 3,
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                          <span style={{ color, whiteSpace: 'nowrap' }}>
                            {Math.round(entry.amount).toLocaleString()} / {Math.round(entry.cap).toLocaleString()}
                          </span>
                          <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap', fontSize: 11 }}>
                            +{entry.rate_per_hour}/h
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </aside>
  );
}
