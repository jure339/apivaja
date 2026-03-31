"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
};

type AuthResponse = {
  token?: string;
  user?: AuthUser;
  error?: string;
};

const STORAGE_TOKEN = "auth_token";
const STORAGE_USER = "auth_user";

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shortToken = useMemo(() => {
    if (!token) return "";
    return `${token.slice(0, 8)}...${token.slice(-6)}`;
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem(STORAGE_TOKEN);
    const storedUser = readStoredUser();
    setToken(storedToken);
    setUser(storedUser);
  }, []);

  function saveAuth(nextToken: string, nextUser: AuthUser) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_TOKEN, nextToken);
      window.localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser));
      window.dispatchEvent(new Event("auth-change"));
    }
    setToken(nextToken);
    setUser(nextUser);
  }

  function clearAuth() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_TOKEN);
      window.localStorage.removeItem(STORAGE_USER);
      window.dispatchEvent(new Event("auth-change"));
    }
    setToken(null);
    setUser(null);
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const payload = (await response.json()) as AuthResponse;

      if (!response.ok || !payload.token || !payload.user) {
        throw new Error(payload.error ?? "Login failed.");
      }

      saveAuth(payload.token, payload.user);
      setLoginPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName || undefined,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const payload = (await response.json()) as AuthResponse;

      if (!response.ok || !payload.token || !payload.user) {
        throw new Error(payload.error ?? "Registration failed.");
      }

      saveAuth(payload.token, payload.user);
      setRegisterPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
            Auth
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Prijava in registracija
          </h1>
        </div>
        <Link
          href="/moje-tekme"
          className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-50"
        >
          Odpri moje tekme
        </Link>
      </div>

      <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-slate-900">Aktivna seja</h2>
          {user ? (
            <div className="grid gap-2 rounded-[1.25rem] border border-cyan-100 bg-cyan-50/60 px-4 py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-cyan-900">{user.name ?? user.email}</p>
                  <p className="text-xs text-cyan-700">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={clearAuth}
                  className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-50"
                >
                  Odjava
                </button>
              </div>
              <div className="text-xs text-cyan-700">
                Token: <span className="font-mono">{shortToken}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Trenutno nisi prijavljen. Uporabi obrazec spodaj.
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleLogin}
            className="grid gap-4 rounded-[1.5rem] border border-cyan-100 bg-white/90 px-5 py-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Prijava</h3>
              <p className="text-sm text-slate-500">
                Vnesi email in geslo za pridobitev tokena.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Geslo
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(8,145,178,0.28)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Prijavljam..." : "Prijava"}
            </button>
          </form>

          <form
            onSubmit={handleRegister}
            className="grid gap-4 rounded-[1.5rem] border border-cyan-100 bg-white/90 px-5 py-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Registracija</h3>
              <p className="text-sm text-slate-500">
                Ustvari novega uporabnika in prejmi token.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Ime (neobvezno)
              <input
                type="text"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                required
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Geslo
              <input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                required
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(8,145,178,0.28)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Registriram..." : "Registracija"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}





