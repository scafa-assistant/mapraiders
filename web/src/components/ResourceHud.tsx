// ============================================================
// Top fixed HUD — brand + energy/tech/intel balances.
// Resource values are only shown when the `resources` flag is enabled.
// ============================================================

import { useFeatureStore } from '../store/featureStore';
import { useResourceStore } from '../store/resourceStore';

export default function ResourceHud() {
  const resourcesEnabled = useFeatureStore((s) => s.isEnabled('resources'));
  const balances = useResourceStore((s) => s.balances);
  const loaded = useResourceStore((s) => s.loaded);

  return (
    <header className="hud">
      <span className="hud-brand">MapRaiders</span>
      {resourcesEnabled && (
        <>
          <span className="hud-res energy" title="Energy">
            <span className="glyph">⚡</span>
            {loaded ? Math.round(balances.energy).toLocaleString() : '—'}
          </span>
          <span className="hud-res tech" title="Tech">
            <span className="glyph">⚙</span>
            {loaded ? Math.round(balances.tech).toLocaleString() : '—'}
          </span>
          <span className="hud-res intel" title="Intel">
            <span className="glyph">◆</span>
            {loaded ? Math.round(balances.intel).toLocaleString() : '—'}
          </span>
        </>
      )}
    </header>
  );
}
