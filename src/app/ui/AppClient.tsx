"use client";

import { useEffect, useMemo, useState } from "react";

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  location: string | null;
  authorName?: string;
};

type Fixture = {
  id: number;
  date: string;
  status: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
};

type ApiError = {
  error?: string;
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("sl-SI");
  } catch {
    return value;
  }
}

async function apiCall<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T & ApiError) : ({} as T & ApiError);

  if (!res.ok) {
    const message = (data as ApiError).error || res.statusText || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export default function AppClient() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [matchForm, setMatchForm] = useState({
    homeTeam: "",
    awayTeam: "",
    matchDate: "",
    location: "",
  });
  const [startDate, setStartDate] = useState(today);

  const [publicMatches, setPublicMatches] = useState<Match[]>([]);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    loadPublic();
  }, []);

  useEffect(() => {
    if (token) {
      window.localStorage.setItem("token", token);
      loadMine();
    } else {
      window.localStorage.removeItem("token");
      setMyMatches([]);
    }
  }, [token]);

  async function loadPublic() {
    try {
      const data = await apiCall<{ data: Match[] }>("/api/matches");
      setPublicMatches(data.data);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function loadMine() {
    try {
      const data = await apiCall<{ data: Match[] }>("/api/matches?mine=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyMatches(data.data);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function loadFixtures() {
    setLoading(true);
    try {
      const data = await apiCall<{ fixtures: Fixture[] }>(
        `/api/football?start=${encodeURIComponent(startDate)}`
      );
      setFixtures(data.fixtures);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setMessage(null);
    try {
      await apiCall("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      setMessage("Registration OK. Now login.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleLogin() {
    setMessage(null);
    try {
      const data = await apiCall<{ token: string }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      setToken(data.token);
      setMessage("Login OK.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleCreateMatch() {
    setMessage(null);
    try {
      await apiCall("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...matchForm,
          matchDate: matchForm.matchDate,
          location: matchForm.location || null,
        }),
      });
      setMatchForm({ homeTeam: "", awayTeam: "", matchDate: "", location: "" });
      await loadPublic();
      await loadMine();
      setMessage("Match created.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleDeleteMatch(id: number) {
    setMessage(null);
    try {
      await apiCall(`/api/matches/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadPublic();
      await loadMine();
      setMessage("Match deleted.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Auth</h2>
        <div className="row">
          <div>
            <label>Email</label>
            <input
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, email: event.target.value })
              }
              placeholder="tina.kovac@example.com"
            />
          </div>
          <div>
            <label>Ime (opcijsko)</label>
            <input
              value={registerForm.name}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, name: event.target.value })
              }
              placeholder="Tina Kovac"
            />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Geslo</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, password: event.target.value })
              }
              placeholder="ZelenaSoba123!"
            />
          </div>
          <div className="actions">
            <button onClick={handleRegister}>Register</button>
          </div>
        </div>
        <div className="row">
          <div>
            <label>Login Email</label>
            <input
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm({ ...loginForm, email: event.target.value })
              }
              placeholder="tina.kovac@example.com"
            />
          </div>
          <div>
            <label>Login Geslo</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm({ ...loginForm, password: event.target.value })
              }
              placeholder="ZelenaSoba123!"
            />
          </div>
        </div>
        <div className="actions">
          <button className="secondary" onClick={handleLogin}>
            Login
          </button>
          <button className="ghost" onClick={() => setToken("")}>
            Logout
          </button>
        </div>
        <p className="status">Token: {token ? "OK" : "none"}</p>
      </section>

      <section className="card">
        <h2>New Match</h2>
        <div className="row">
          <div>
            <label>Home Team</label>
            <input
              value={matchForm.homeTeam}
              onChange={(event) =>
                setMatchForm({ ...matchForm, homeTeam: event.target.value })
              }
              placeholder="Maribor"
            />
          </div>
          <div>
            <label>Away Team</label>
            <input
              value={matchForm.awayTeam}
              onChange={(event) =>
                setMatchForm({ ...matchForm, awayTeam: event.target.value })
              }
              placeholder="Olimpija"
            />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Match Date (ISO)</label>
            <input
              value={matchForm.matchDate}
              onChange={(event) =>
                setMatchForm({ ...matchForm, matchDate: event.target.value })
              }
              placeholder="2026-05-01T18:00:00.000Z"
            />
          </div>
          <div>
            <label>Location</label>
            <input
              value={matchForm.location}
              onChange={(event) =>
                setMatchForm({ ...matchForm, location: event.target.value })
              }
              placeholder="Ljudski vrt"
            />
          </div>
        </div>
        <div className="actions">
          <button onClick={handleCreateMatch} disabled={!token}>
            Create Match
          </button>
          <button className="secondary" onClick={loadMine} disabled={!token}>
            Refresh Mine
          </button>
        </div>
        <p className="status">Create requires login.</p>
      </section>

      <section className="card">
        <h2>Public Matches</h2>
        <div className="actions">
          <button className="secondary" onClick={loadPublic}>
            Refresh
          </button>
        </div>
        <ul className="list">
          {publicMatches.map((match) => (
            <li className="list-item" key={match.id}>
              <strong>
                {match.homeTeam} vs {match.awayTeam}
              </strong>
              <div>{formatDate(match.matchDate)}</div>
              <div>{match.location || "-"}</div>
              <div className="status">Author: {match.authorName || "-"}</div>
            </li>
          ))}
          {publicMatches.length === 0 ? (
            <li className="list-item">No matches yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="card">
        <h2>My Matches</h2>
        <ul className="list">
          {myMatches.map((match) => (
            <li className="list-item" key={match.id}>
              <strong>
                {match.homeTeam} vs {match.awayTeam}
              </strong>
              <div>{formatDate(match.matchDate)}</div>
              <div>{match.location || "-"}</div>
              <div className="actions">
                <button className="secondary" onClick={() => handleDeleteMatch(match.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
          {myMatches.length === 0 ? (
            <li className="list-item">No matches for this user.</li>
          ) : null}
        </ul>
      </section>

      <section className="card">
        <h2>Football Fixtures</h2>
        <div className="row">
          <div>
            <label>Start date (YYYY-MM-DD)</label>
            <input
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="actions">
            <button onClick={loadFixtures} disabled={loading}>
              {loading ? "Loading..." : "Load"}
            </button>
          </div>
        </div>
        <ul className="list">
          {fixtures.map((fixture) => (
            <li className="list-item" key={fixture.id}>
              <strong>
                {fixture.homeTeam} vs {fixture.awayTeam}
              </strong>
              <div>{formatDate(fixture.date)}</div>
              <div className="status">{fixture.status}</div>
            </li>
          ))}
          {fixtures.length === 0 ? (
            <li className="list-item">No fixtures loaded.</li>
          ) : null}
        </ul>
      </section>

      {message ? <div className="message">{message}</div> : null}
    </div>
  );
}
