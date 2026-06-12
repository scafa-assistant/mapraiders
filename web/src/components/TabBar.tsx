// ============================================================
// Bottom tab bar — Map / Inventory / Profile.
// ============================================================

export type TabKey = 'map' | 'inventory' | 'profile';

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'map', label: 'Map' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'profile', label: 'Profile' },
];

export default function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
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
