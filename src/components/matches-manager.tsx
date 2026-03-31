"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
};

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  location: string | null;
  userId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

type MatchResponse = {
  data?: Match | Match[];
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

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function toTimeInput(value: string) {
  return value.slice(11, 16);
}

function toIsoString(date: string, time: string) {
  if (!date) return "";
  const safeTime = time || "00:00";
  const combined = new Date(`${date}T${safeTime}:00`);
  if (Number.isNaN(combined.getTime())) return "";
  return combined.toISOString();
}

export function MatchesManager() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [mode, setMode] = useState<"all" | "mine">("all");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editHome, setEditHome] = useState("");
  const [editAway, setEditAway] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isLoggedIn = Boolean(token && user);
  const ownerId = user?.id ?? null;

  const orderedMatches = useMemo(() => {
    return matches
      .slice()
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }, [matches]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setToken(window.localStorage.getItem(STORAGE_TOKEN));
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [mode, token]);

  async function loadMatches() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (mode === "mine") {
        params.set("mine", "true");
      }

      const response = await fetch(`/api/matches?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = (await response.json()) as MatchResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load matches.");
      }

      const data = Array.isArray(payload.data) ? payload.data : [];
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Za dodajanje moras biti prijavljen.");
      return;
    }

    const iso = toIsoString(matchDate, matchTime);
    if (!iso) {
      setError("Datum ali ura nista veljavna.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          matchDate: iso,
          location: location || undefined,
        }),
      });

      const payload = (await response.json()) as MatchResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create match.");
      }

      setHomeTeam("");
      setAwayTeam("");
      setMatchDate("");
      setMatchTime("18:00");
      setLocation("");
      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create match.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!token || editingId === null) return;

    const iso = toIsoString(editDate, editTime);
    if (!iso) {
      setError("Datum ali ura nista veljavna.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          homeTeam: editHome,
          awayTeam: editAway,
          matchDate: iso,
          location: editLocation || null,
        }),
      });

      const payload = (await response.json()) as MatchResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update match.");
      }

      stopEditing();
      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update match.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(matchId: number) {
    if (!token) {
      setError("Za brisanje moras biti prijavljen.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as MatchResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete match.");
      }

      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete match.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(match: Match) {
    setEditingId(match.id);
    setEditHome(match.homeTeam);
    setEditAway(match.awayTeam);
    setEditDate(toDateInput(match.matchDate));
    setEditTime(toTimeInput(match.matchDate));
    setEditLocation(match.location ?? "");
  }

  function stopEditing() {
    setEditingId(null);
    setEditHome("");
    setEditAway("");
    setEditDate("");
    setEditTime("");
    setEditLocation("");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
            Tekme
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Dodajanje in urejanje tekem
          </h1>
        </div>
        <Link
          href="/auth"
          className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-50"
        >
          Prijava / registracija
        </Link>
      </div>

      <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
        <div className="grid gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Trenutni uporabnik</h2>
          {isLoggedIn ? (
            <p className="text-sm text-slate-600">
              Prijavljen kot <span className="font-semibold">{user?.name ?? user?.email}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Za dodajanje, urejanje in brisanje moras biti prijavljen.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">          <button
            type="button"
            onClick={() => setMode("mine")}
            className={
              mode === "mine"
                ? "rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] px-5 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-cyan-200 bg-white px-5 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-50"
            }
          >
            Moje tekme
          </button>
        </div>

        {error ? (
          <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={handleCreate}
          className="grid gap-3 rounded-[1.5rem] border border-cyan-100 bg-white/90 px-5 py-6"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nova tekma</h3>
            <p className="text-sm text-slate-500">Dodaj tekmo, ki jo bos lahko urejal samo ti.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Domaci
              <input
                type="text"
                value={homeTeam}
                onChange={(event) => setHomeTeam(event.target.value)}
                required
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Gosti
              <input
                type="text"
                value={awayTeam}
                onChange={(event) => setAwayTeam(event.target.value)}
                required
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Datum
              <input
                type="date"
                value={matchDate}
                onChange={(event) => setMatchDate(event.target.value)}
                required
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Ura
              <input
                type="time"
                value={matchTime}
                onChange={(event) => setMatchTime(event.target.value)}
                required
                className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Lokacija (neobvezno)
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </label>
          <button
            type="submit"
            disabled={saving || !isLoggedIn}
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(8,145,178,0.28)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Shranjujem..." : "Dodaj tekmo"}
          </button>
        </form>

        {loading ? (
          <div className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white/70 px-5 py-8 text-sm text-slate-500">
            Nalagam tekme...
          </div>
        ) : (
          <div className="grid gap-4">
            {orderedMatches.map((match) => {
              const isOwner = ownerId === match.userId;
              const isEditing = editingId === match.id;

              return (
                <article
                  key={match.id}
                  className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">
                        Tekma #{match.id}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {match.homeTeam} vs {match.awayTeam}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {new Date(match.matchDate).toLocaleString("sl-SI")}
                        {match.location ? ` - ${match.location}` : ""}
                      </p>
                    </div>
                    <div className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                      {match.authorName}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span>Ustvarjeno: {new Date(match.createdAt).toLocaleString("sl-SI")}</span>
                    <span>Posodobljeno: {new Date(match.updatedAt).toLocaleString("sl-SI")}</span>
                  </div>

                  {isOwner ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(match)}
                        className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-50"
                      >
                        Uredi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(match.id)}
                        disabled={saving}
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-70"
                      >
                        Brisi
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Urejanje in brisanje je dovoljeno samo avtorju.
                    </p>
                  )}

                  {isEditing ? (
                    <form
                      onSubmit={handleUpdate}
                      className="grid gap-3 rounded-[1.25rem] border border-cyan-100 bg-cyan-50/60 px-4 py-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-2 text-xs font-semibold text-cyan-900">
                          Domaci
                          <input
                            type="text"
                            value={editHome}
                            onChange={(event) => setEditHome(event.target.value)}
                            required
                            className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                          />
                        </label>
                        <label className="grid gap-2 text-xs font-semibold text-cyan-900">
                          Gosti
                          <input
                            type="text"
                            value={editAway}
                            onChange={(event) => setEditAway(event.target.value)}
                            required
                            className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                          />
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-2 text-xs font-semibold text-cyan-900">
                          Datum
                          <input
                            type="date"
                            value={editDate}
                            onChange={(event) => setEditDate(event.target.value)}
                            required
                            className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                          />
                        </label>
                        <label className="grid gap-2 text-xs font-semibold text-cyan-900">
                          Ura
                          <input
                            type="time"
                            value={editTime}
                            onChange={(event) => setEditTime(event.target.value)}
                            required
                            className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                          />
                        </label>
                      </div>
                      <label className="grid gap-2 text-xs font-semibold text-cyan-900">
                        Lokacija
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(event) => setEditLocation(event.target.value)}
                          className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-70"
                        >
                          Shrani
                        </button>
                        <button
                          type="button"
                          onClick={stopEditing}
                          className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold text-cyan-900"
                        >
                          Preklici
                        </button>
                      </div>
                    </form>
                  ) : null}
                </article>
              );
            })}

            {!orderedMatches.length ? (
              <div className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white/70 px-5 py-8 text-sm text-slate-500">
                Trenutno ni tekem.
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}


