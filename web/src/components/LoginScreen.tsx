// ============================================================
// Login screen — email/password against POST /auth/login.
// ============================================================

import { FormEvent, useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const pending = useAuthStore((s) => s.loginPending);
  const error = useAuthStore((s) => s.loginError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    void login(email.trim(), password);
  }

  return (
    <div className="login-root">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>MapRaiders</h1>
        <p className="sub">Web Cockpit — sign in to your account.</p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="walker@test.com"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <div className="panel-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
