// ============================================================
// Top fixed HUD — brand + energy/tech/intel balances.
// Resource values are only shown when the `resources` flag is enabled.
// Wood/stone/food are additionally gated by the `economy` flag.
// ============================================================

import { useFeatureStore } from '../store/featureStore';
import { useResourceStore } from '../store/resourceStore';

export default function ResourceHud() {
  const resourcesEnabled = useFeatureStore((s) => s.isEnabled('resources'));
  const economyEnabled = useFeatureStore((s) => s.isEnabled('economy'));
  const balances = useResourceStore((s) => s.balances);
  const loaded = useResourceStore((s) => s.loaded);

  const fmt = (n: number) => (loaded ? Math.round(n).toLocaleString() : '—');

  return (
    <header className="hud">
      <span className="hud-brand">MapRaiders</span>
      {resourcesEnabled && (
        <>
          <span className="hud-res energy" title="Energy">
            <span className="glyph">⚡</span>
            {fmt(balances.energy)}
          </span>
          <span className="hud-res tech" title="Tech">
            <span className="glyph">⚙</span>
            {fmt(balances.tech)}
          </span>
          <span className="hud-res intel" title="Intel">
            <span className="glyph">◆</span>
            {fmt(balances.intel)}
          </span>
          {economyEnabled && (
            <>
              <span
                className="hud-res"
                style={{ color: '#A06A3C' }}
                title="Wood"
              >
                <span className="glyph">🪵</span>
                {fmt(balances.wood)}
              </span>
              <span
                className="hud-res"
                style={{ color: '#9CA3AF' }}
                title="Stone"
              >
                <span className="glyph">🪨</span>
                {fmt(balances.stone)}
              </span>
              <span
                className="hud-res"
                style={{ color: '#6FBF5B' }}
                title="Food"
              >
                <span className="glyph">🌾</span>
                {fmt(balances.food)}
              </span>
            </>
          )}
        </>
      )}
    </header>
  );
}
