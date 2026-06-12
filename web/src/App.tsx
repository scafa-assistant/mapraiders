// ============================================================
// App shell — restore session, load feature flags, then render either the
// login screen or the tabbed cockpit (Map / Inventory / Profile).
// ============================================================

import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useFeatureStore } from './store/featureStore';
import { useResourceStore } from './store/resourceStore';
import { useMapStore } from './store/mapStore';
import LoginScreen from './components/LoginScreen';
import ResourceHud from './components/ResourceHud';
import TabBar, { TabKey } from './components/TabBar';
import MapView from './components/MapView';
import TerritoryPanel from './components/TerritoryPanel';
import InventoryList from './components/InventoryList';
import ProfilePanel from './components/ProfilePanel';

export default function App() {
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);

  const loadFlags = useFeatureStore((s) => s.load);
  const flagsLoaded = useFeatureStore((s) => s.loaded);
  const resourcesEnabled = useFeatureStore((s) => s.isEnabled('resources'));
  const refreshResources = useResourceStore((s) => s.refresh);

  const selectedId = useMapStore((s) => s.selectedId);
  const select = useMapStore((s) => s.select);

  const [tab, setTab] = useState<TabKey>('map');

  // Boot: load public feature flags, then validate any stored token.
  useEffect(() => {
    void loadFlags();
    void restore();
  }, [loadFlags, restore]);

  // Pull resources once authenticated and flags are known.
  useEffect(() => {
    if (status === 'authenticated' && flagsLoaded && resourcesEnabled) {
      void refreshResources();
    }
  }, [status, flagsLoaded, resourcesEnabled, refreshResources]);

  // Refresh resources on every tab switch (cheap, keeps the HUD fresh).
  useEffect(() => {
    if (status === 'authenticated' && resourcesEnabled) {
      void refreshResources();
    }
  }, [tab, status, resourcesEnabled, refreshResources]);

  if (status === 'idle' || status === 'restoring') {
    return <div className="center-fill">Loading…</div>;
  }

  if (status !== 'authenticated') {
    return <LoginScreen />;
  }

  return (
    <div className="app-shell">
      <ResourceHud />

      <div className="app-body">
        {/* Map stays mounted so Leaflet keeps its state across tab switches. */}
        <div className="tab-pane" style={{ display: tab === 'map' ? 'block' : 'none' }}>
          <MapView />
          {selectedId && (
            <TerritoryPanel territoryId={selectedId} onClose={() => select(null)} />
          )}
        </div>

        {tab === 'inventory' && (
          <div className="tab-pane">
            <InventoryList />
          </div>
        )}

        {tab === 'profile' && (
          <div className="tab-pane">
            <ProfilePanel />
          </div>
        )}
      </div>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
