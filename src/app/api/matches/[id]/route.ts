import { NextResponse } from "next/server";
import { extractBearerToken, getUserFromToken } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

function parseId(value: string | undefined) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeDate(value: unknown) {
  if (!isNonEmptyString(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function getAuthorName(db: Awaited<ReturnType<typeof readDb>>, userId: number) {
  const user = db.users.find((entry) => entry.id === userId);
  return user?.name ?? user?.email ?? "Unknown";
}

function withAuthor(db: Awaited<ReturnType<typeof readDb>>, match: (Awaited<ReturnType<typeof readDb>>)["matches"][number]) {
  return {
    ...match,
    authorName: getAuthorName(db, match.userId),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = parseId(params?.id);

  if (!id) {
    return NextResponse.json({ error: "Invalid match id." }, { status: 400 });
  }

  const db = await readDb();
  const match = db.matches.find((entry) => entry.id === id);

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  return NextResponse.json({ data: withAuthor(db, match) });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  return updateMatch(request, context, "PUT");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  return updateMatch(request, context, "PATCH");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const token = extractBearerToken(request);
  const user = await getUserFromToken(token);

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const params = await context.params;
  const id = parseId(params?.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid match id." }, { status: 400 });
  }

  const db = await readDb();
  const index = db.matches.findIndex((entry) => entry.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (db.matches[index].userId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [removed] = db.matches.splice(index, 1);
  await writeDb(db);

  return NextResponse.json({ data: withAuthor(db, removed) });
}

async function updateMatch(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
  method: "PUT" | "PATCH"
) {
  const token = extractBearerToken(request);
  const user = await getUserFromToken(token);

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const params = await context.params;
  const id = parseId(params?.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid match id." }, { status: 400 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { homeTeam, awayTeam, matchDate, location } = payload as Record<string, unknown>;

  if (method === "PUT") {
    if (!isNonEmptyString(homeTeam) || !isNonEmptyString(awayTeam)) {
      return NextResponse.json(
        { error: "Home and away team are required for PUT." },
        { status: 400 }
      );
    }
    if (!normalizeDate(matchDate)) {
      return NextResponse.json(
        { error: "Valid match date is required for PUT." },
        { status: 400 }
      );
    }
  }

  if (homeTeam !== undefined && !isNonEmptyString(homeTeam)) {
    return NextResponse.json({ error: "Home team must be a string." }, { status: 400 });
  }

  if (awayTeam !== undefined && !isNonEmptyString(awayTeam)) {
    return NextResponse.json({ error: "Away team must be a string." }, { status: 400 });
  }

  if (matchDate !== undefined && !normalizeDate(matchDate)) {
    return NextResponse.json({ error: "Match date is invalid." }, { status: 400 });
  }

  if (location !== undefined && location !== null && !isNonEmptyString(location)) {
    return NextResponse.json({ error: "Location must be a string." }, { status: 400 });
  }

  const db = await readDb();
  const match = db.matches.find((entry) => entry.id === id);

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (match.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (isNonEmptyString(homeTeam)) {
    match.homeTeam = homeTeam.trim();
  }

  if (isNonEmptyString(awayTeam)) {
    match.awayTeam = awayTeam.trim();
  }

  if (matchDate !== undefined) {
    const normalized = normalizeDate(matchDate);
    if (normalized) {
      match.matchDate = normalized;
    }
  }

  if (location !== undefined) {
    match.location = isNonEmptyString(location) ? location.trim() : null;
  }

  match.updatedAt = new Date().toISOString();
  await writeDb(db);

  return NextResponse.json({ data: withAuthor(db, match) });
}
