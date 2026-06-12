// ============================================================
// Profile tab — username, level, XP progress, territory count, logout.
// Uses only fields present in GET /users/me (no invented endpoints).
// ============================================================

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function ProfilePanel() {
  const me = useAuthStore((s) => s.me);
  const user = useAuthStore((s) => s.user);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const display = me ?? user;
  if (!display) {
    return <div className="center-fill">Loading profile…</div>;
  }

  const xpIn = me?.xp_in_level ?? 0;
  const xpNeed = me?.xp_to_next_level ?? 0;
  const pct = xpNeed > 0 ? Math.min(100, Math.round((xpIn / xpNeed) * 100)) : 0;
  const territories = me?.stats?.territories;

  return (
    <div className="list-pane">
      <div className="profile-card">
        <h2>{display.username}</h2>
        <div className="muted">Level {display.level}</div>

        {xpNeed > 0 && (
          <>
            <div className="xp-bar">
              <div style={{ width: `${pct}%` }} />
            </div>
            <div className="muted">
              {xpIn.toLocaleString()} / {xpNeed.toLocaleString()} XP to next level
            </div>
          </>
        )}

        <div style={{ marginTop: 18 }}>
          <div className="meta-row">
            <span className="k">Total XP</span>
            <span className="v">{(display.xp ?? 0).toLocaleString()}</span>
          </div>
          {territories !== undefined && (
            <div className="meta-row">
              <span className="k">Territories</span>
              <span className="v">{territories}</span>
            </div>
          )}
          {me?.stats?.total_distance_km !== undefined && (
            <div className="meta-row">
              <span className="k">Distance walked</span>
              <span className="v">{me.stats.total_distance_km.toLocaleString()} km</span>
            </div>
          )}
          {display.email && (
            <div className="meta-row">
              <span className="k">Email</span>
              <span className="v">{display.email}</span>
            </div>
          )}
        </div>

        <button className="btn-logout" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
