// ============================================================
// Inventory tab — item instances, rarity-coloured, with status badge.
// ============================================================

import { useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { colorForRarity } from '../theme';
import { itemDisplayName, titleCase } from '../utils';
import type { InventoryItem } from '../api/types';

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
    case 'deployed':
    case 'equipped':
      return 'active';
    case 'burned':
      return 'damaged';
    default:
      return 'neutral';
  }
}

function ItemRow({ item }: { item: InventoryItem }) {
  const color = colorForRarity(item.rarity);
  return (
    <div className="inv-item" style={{ borderLeftColor: color }}>
      <div>
        <div className="inv-name">{itemDisplayName(item)}</div>
        <div className="inv-sub">
          {titleCase(item.category)} · <span style={{ color }}>{titleCase(item.rarity)}</span>
        </div>
      </div>
      <span className={`badge ${statusBadgeClass(item.status)} spacer`}>{item.status}</span>
    </div>
  );
}

export default function InventoryList() {
  const { items, loading, loaded, error, refresh } = useInventoryStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (error) {
    return (
      <div className="list-pane">
        <div className="panel-error">{error}</div>
      </div>
    );
  }

  if (loading && !loaded) {
    return <div className="center-fill">Loading inventory…</div>;
  }

  if (loaded && items.length === 0) {
    return (
      <div className="empty-state">
        <div className="big">🎒</div>
        <div>Your inventory is empty.</div>
        <div className="muted">Dice, units, cards and relics you collect will appear here.</div>
      </div>
    );
  }

  return (
    <div className="list-pane">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}
