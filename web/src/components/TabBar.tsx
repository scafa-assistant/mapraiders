// ============================================================
// Bottom tab bar — Map / Inventory / Profile / Commander.
// Commander tab only renders when the 'commander' feature flag is enabled.
// ============================================================

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  showCommander?: boolean;
}

export type TabKey = 'map' | 'inventory' | 'profile' | 'commander';

const BASE_TABS: { key: TabKey; label: string }[] = [
  { key: 'map', label: 'Map' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'profile', label: 'Profile' },
];

const COMMANDER_TAB: { key: TabKey; label: string } = {
  key: 'commander',
  label: '◈ Commander',
};

export default function TabBar({ active, onChange, showCommander = false }: Props) {
  const tabs = showCommander ? [...BASE_TABS, COMMANDER_TAB] : BASE_TABS;

  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={active === t.key ? 'active' : ''}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
