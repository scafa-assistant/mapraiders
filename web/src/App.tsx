// ============================================================
// App shell — restore session, load feature flags, then render either the
// login screen or the tabbed cockpit (Map / Inventory / Profile / Commander).
// Commander tab is only shown when the 'commander' feature flag is enabled.
// ============================================================

import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useFeatureStore } from './store/featureStore';
import { useResourceStore } from './store/resourceStore';
import { useMapStore } from './store/mapStore';
import { useTerminalStore } from './store/terminalStore';
import LoginScreen from './components/LoginScreen';
import ResourceHud from './components/ResourceHud';
import TabBar, { TabKey } from './components/TabBar';
import MapView from './components/MapView';
import MyTerritoriesPanel from './components/MyTerritoriesPanel';
import TerritoryPanel from './components/TerritoryPanel';
import TerminalPanel from './components/TerminalPanel';
import InventoryList from './components/InventoryList';
import ProfilePanel from './components/ProfilePanel';
import CommanderView from './components/CommanderView';

export default function App() {
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);

  const loadFlags = useFeatureStore((s) => s.load);
  const flagsLoaded = useFeatureStore((s) => s.loaded);
  const resourcesEnabled = useFeatureStore((s) => s.isEnabled('resources'));
  const commanderEnabled = useFeatureStore((s) => s.isEnabled('commander'));
  const refreshResources = useResourceStore((s) => s.refresh);

  const selectedId = useMapStore((s) => s.selectedId);
  const select = useMapStore((s) => s.select);
  const selectedSpawnId = useMapStore((s) => s.selectedSpawnId);
  const selectSpawn = useMapStore((s) => s.selectSpawn);

  const terminalsEnabled = useFeatureStore((s) => s.isEnabled('terminals'));
  const selectedTerminalSpawn = useTerminalStore((s) => s.selectedSpawn);
  const terminalSelectSpawn = useTerminalStore((s) => s.selectSpawn);

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

  // If the commander tab is active but the flag gets disabled, fall back to map.
  useEffect(() => {
    if (tab === 'commander' && !commanderEnabled) {
      setTab('map');
    }
  }, [tab, commanderEnabled]);

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
          <MyTerritoriesPanel />
          {selectedId && (
            <TerritoryPanel territoryId={selectedId} onClose={() => select(null)} />
          )}
          {terminalsEnabled && selectedSpawnId && selectedTerminalSpawn && (
            <TerminalPanel
              spawn={selectedTerminalSpawn}
              onClose={() => {
                selectSpawn(null);
                terminalSelectSpawn(null);
              }}
            />
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

        {/* Commander tab — only rendered when the flag is on */}
        {commanderEnabled && tab === 'commander' && (
          <div className="tab-pane">
            <CommanderView />
          </div>
        )}
      </div>

      <TabBar
        active={tab}
        onChange={setTab}
        showCommander={commanderEnabled}
      />
    </div>
  );
}
