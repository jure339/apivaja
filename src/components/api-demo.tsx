"use client";

import { useEffect, useMemo, useState } from "react";

type Fixture = {
  id: number;
  date: string;
  status: string;
  round: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
};

type ApiResponse = {
  provider?: string;
  league: string;
  season: number;
  from: string;
  to: string;
  fixtures: Fixture[];
  error?: string;
};

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  location: string | null;
  authorName: string;
};

type MatchesResponse = {
  data?: Match[];
  error?: string;
};

type FixtureGroup = {
  dayKey: string;
  dayLabel: string;
  shortLabel: string;
  fixtures: Fixture[];
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDayLabel(date: string) {
  return new Date(date).toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatShortLabel(date: string) {
  return new Date(date).toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatKickoff(date: string) {
  return new Date(date).toLocaleTimeString("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addMonthsDateKey(dateKey: string, months: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  const base = new Date(year, month - 1, day);
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  const yyyy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function filterFixturesByDay(fixtures: Fixture[], dayKey: string) {
  return fixtures.filter((fixture) => fixture.date.slice(0, 10) === dayKey);
}

function groupFixturesByDay(fixtures: Fixture[]) {
  const groups = new Map<string, Fixture[]>();

  for (const fixture of fixtures) {
    const dayKey = fixture.date.slice(0, 10);
    const current = groups.get(dayKey) ?? [];
    current.push(fixture);
    groups.set(dayKey, current);
  }

  return Array.from(groups.entries()).map(([dayKey, dayFixtures]) => ({
    dayKey,
    dayLabel: formatDayLabel(dayFixtures[0].date),
    shortLabel: formatShortLabel(dayFixtures[0].date),
    fixtures: dayFixtures,
  })) satisfies FixtureGroup[];
}

function filterMatches(matches: Match[], from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  return matches.filter((match) => {
    const date = new Date(match.matchDate);
    return date >= fromDate && date <= toDate;
  });
}

export function ApiDemo() {
  const [startDate, setStartDate] = useState(getToday);
  const [upcomingDay, setUpcomingDay] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFixtures() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ start: startDate });
        const response = await fetch(`/api/football?${params.toString()}`);
        const json = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(json.error ?? "Failed to load football data.");
        }

        let combinedFixtures = json.fixtures;

        try {
          const matchesResponse = await fetch("/api/matches");
          const matchesJson = (await matchesResponse.json()) as MatchesResponse;
          const matches = Array.isArray(matchesJson.data) ? matchesJson.data : [];
          const filteredMatches = filterMatches(matches, json.from, json.to);

          const userFixtures: Fixture[] = filteredMatches.map((match) => ({
            id: 1000000000 + match.id,
            date: match.matchDate,
            status: match.authorName,
            round: "Dodano",
            league: "Uporabniske tekme",
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
          }));

          combinedFixtures = [...json.fixtures, ...userFixtures];
        } catch {
          combinedFixtures = json.fixtures;
        }

        setData({ ...json, fixtures: combinedFixtures });
      } catch (err) {
        setData(null);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    void loadFixtures();
  }, [startDate]);

  const selectedFixtures = useMemo(() => {
    if (!data) return [];
    return filterFixturesByDay(data.fixtures, startDate);
  }, [data, startDate]);

  const monthEndDate = useMemo(() => addMonthsDateKey(startDate, 1), [startDate]);

  const upcomingGroups = useMemo(() => {
    if (!data) return [];
    const upcoming = data.fixtures.filter((fixture) => {
      const dayKey = fixture.date.slice(0, 10);
      return dayKey >= startDate && dayKey <= monthEndDate;
    });
    return groupFixturesByDay(upcoming).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  }, [data, startDate, monthEndDate]);

  useEffect(() => {
    if (!upcomingGroups.length) {
      setUpcomingDay(null);
      return;
    }

    if (!upcomingDay || !upcomingGroups.some((group) => group.dayKey === upcomingDay)) {
      setUpcomingDay(upcomingGroups[0].dayKey);
    }
  }, [upcomingDay, upcomingGroups]);

  const selectedUpcomingGroup = upcomingGroups.find((group) => group.dayKey === upcomingDay);

  return (
    <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-7">
      <div className="grid gap-4 rounded-[1.75rem] bg-[linear-gradient(135deg,#0b132b_0%,#124e78_48%,#6ee7f9_100%)] p-6 text-white shadow-[0_20px_60px_rgba(18,78,120,0.32)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
              Superliga Calendar
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {data?.league ?? "Superliga"}
            </h2>
          </div>
          <div className="rounded-2xl bg-white/12 px-4 py-3 text-right backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/75">
              Provider
            </p>
            <p className="mt-1 text-lg font-semibold">
              {data?.provider ?? "SportMonks"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-[1.5rem] border border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.95),rgba(255,255,255,0.92))] p-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Izberi datum
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-[linear-gradient(180deg,#fff7ed_0%,#fffef5_100%)] px-4 py-4 text-sm leading-6 text-amber-900">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white/70 px-5 py-8 text-sm text-slate-500">
          Loading fixtures...
        </div>
      ) : selectedFixtures.length ? (
        <section className="grid gap-4 rounded-[1.6rem] border border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.85),rgba(255,255,255,0.92))] p-4 shadow-[0_12px_30px_rgba(14,116,144,0.08)]">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] text-white shadow-md">
              <span className="text-base font-semibold tracking-wide">
                {formatShortLabel(startDate)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-cyan-800">
                {formatDayLabel(startDate)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedFixtures.length} {selectedFixtures.length === 1 ? "tekma" : "tekme"} na izbran dan
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {selectedFixtures.map((fixture) => (
              <article
                key={fixture.id}
                className="grid gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">
                      {fixture.round}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-lg font-semibold text-slate-900 sm:text-xl">
                      <span>{fixture.homeTeam}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                        vs
                      </span>
                      <span>{fixture.awayTeam}</span>
                    </div>
                  </div>
                  <div className="rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-900">
                    {formatKickoff(fixture.date)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
                  <span>{fixture.league}</span>
                  <span>{fixture.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-[linear-gradient(180deg,#f0f9ff_0%,#ffffff_100%)] px-5 py-8 text-sm text-slate-600">
          Ni tekem za izbran datum.
        </div>
      )}

      {!loading ? (
        <section className="grid gap-4 rounded-[1.6rem] border border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.85),rgba(255,255,255,0.92))] p-4 shadow-[0_12px_30px_rgba(14,116,144,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Naslednji mesec
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Tekme od {formatShortLabel(startDate)} do {formatShortLabel(monthEndDate)}.
              </p>
            </div>
            <div className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-900">
              {upcomingGroups.reduce((sum, group) => sum + group.fixtures.length, 0)} tekem
            </div>
          </div>

          {upcomingGroups.length ? (
            <>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {upcomingGroups.map((group) => {
                  const isActive = group.dayKey === upcomingDay;

                  return (
                    <button
                      key={group.dayKey}
                      type="button"
                      onClick={() => setUpcomingDay(group.dayKey)}
                      className={
                        isActive
                          ? "grid min-w-28 gap-1 rounded-[1.4rem] bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] px-4 py-4 text-left text-white shadow-md"
                          : "grid min-w-28 gap-1 rounded-[1.4rem] border border-cyan-100 bg-white px-4 py-4 text-left text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                      }
                    >
                      <span
                        className={
                          isActive
                            ? "text-xs uppercase tracking-[0.22em] text-cyan-100/80"
                            : "text-xs uppercase tracking-[0.22em] text-cyan-600"
                        }
                      >
                        {group.shortLabel}
                      </span>
                      <span className="text-sm font-semibold">{group.dayLabel}</span>
                      <span className={isActive ? "text-xs text-cyan-100/80" : "text-xs text-slate-500"}>
                        {group.fixtures.length} {group.fixtures.length === 1 ? "tekma" : "tekme"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedUpcomingGroup ? (
                <div className="grid gap-3">
                  {selectedUpcomingGroup.fixtures.map((fixture) => (
                    <article
                      key={fixture.id}
                      className="grid gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="grid gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">
                            {fixture.round}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900">
                            <span>{fixture.homeTeam}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                              vs
                            </span>
                            <span>{fixture.awayTeam}</span>
                          </div>
                        </div>
                        <div className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                          {formatKickoff(fixture.date)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                        <span>{fixture.league}</span>
                        <span>{fixture.status}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">Ni tekem v naslednjem mesecu.</p>
          )}
        </section>
      ) : null}
    </section>
  );
}
