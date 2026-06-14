// ============================================================
// "My Territories" — collapsible list panel on the Map tab.
// Solves "I can't find my territories": each row recenters the live
// Leaflet map on that territory's centroid via flyToTerritory().
// Data comes from GET /territories/mine (centroid lat/lng, newest first).
// ============================================================

import { useEffect, useState } from 'react';
import { flyToTerritory, useMapStore } from '../store/mapStore';
import type { MyTerritory } from '../api/types';

/** Compact area: <1000 → "950 m²", else "1.1k m²". */
function compactArea(m2: number): string {
  if (!m2 || m2 <= 0) return '0 m²';
  if (m2 < 1000) return `${Math.round(m2)} m²`;
  return `${(m2 / 1000).toFixed(1)}k m²`;
}

/** "walker" → "Walker"; null → "Territory". */
function classLabel(cls: string | null): string {
  if (!cls) return 'Territory';
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function rowLabel(t: MyTerritory): string {
  return `${classLabel(t.class)} · ${compactArea(t.area_m2)}`;
}

export default function MyTerritoriesPanel() {
  const myTerritories = useMapStore((s) => s.myTerritories);
  const myLoading = useMapStore((s) => s.myLoading);
  const loadMine = useMapStore((s) => s.loadMine);
  const select = useMapStore((s) => s.select);

  const [collapsed, setCollapsed] = useState(false);

  // Fetch once on mount (Map tab).
  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  function onRowClick(t: MyTerritory) {
    flyToTerritory(t.lat, t.lng, 16);
    select(t.id); // also opens the detail side panel for that territory
  }

  return (
    <aside className={`myterr-panel${collapsed ? ' collapsed' : ''}`}>
      <header className="myterr-head">
        <button
          className="myterr-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▸' : '▾'}
        </button>
        <span className="myterr-title">My Territories ({myTerritories.length})</span>
        <button
          className="myterr-refresh"
          onClick={() => void loadMine()}
          disabled={myLoading}
          aria-label="Refresh"
          title="Refresh"
        >
          {myLoading ? '…' : '⟳'}
        </button>
      </header>

      {!collapsed && (
        <div className="myterr-body">
          {myLoading && myTerritories.length === 0 && (
            <div className="muted myterr-empty">Loading…</div>
          )}
          {!myLoading && myTerritories.length === 0 && (
            <div className="muted myterr-empty">
              No territories yet — walk a route to claim one.
            </div>
          )}
          {myTerritories.map((t) => (
            <button key={t.id} className="myterr-row" onClick={() => onRowClick(t)}>
              <div className="myterr-row-main">
                <span className="myterr-row-label">{rowLabel(t)}</span>
                <span className="myterr-row-meta">
                  {t.is_protected && <span title="Protected">🛡</span>}
                  {t.claim_value != null && (
                    <span className="myterr-cv">cv {t.claim_value}</span>
                  )}
                </span>
              </div>
              <span className="myterr-coords">
                {t.lat.toFixed(2)}, {t.lng.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
