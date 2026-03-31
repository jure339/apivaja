import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, getUserFromToken } from "@/lib/auth";
import { getNextId, readDb, writeDb } from "@/lib/db";

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

export async function GET(request: NextRequest) {
  const db = await readDb();
  const mine = request.nextUrl.searchParams.get("mine") === "true";

  if (!mine) {
    return NextResponse.json({ data: db.matches.map((match) => withAuthor(db, match)) });
  }

  const token = extractBearerToken(request);
  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const matches = db.matches.filter((match) => match.userId === user.id);
  return NextResponse.json({ data: matches.map((match) => withAuthor(db, match)) });
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  const user = await getUserFromToken(token);

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
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

  if (!isNonEmptyString(homeTeam) || !isNonEmptyString(awayTeam)) {
    return NextResponse.json(
      { error: "Home and away team are required." },
      { status: 400 }
    );
  }

  const normalizedDate = normalizeDate(matchDate);
  if (!normalizedDate) {
    return NextResponse.json({ error: "Valid match date is required." }, { status: 400 });
  }

  const db = await readDb();
  const now = new Date().toISOString();
  const match = {
    id: getNextId(db, "match"),
    homeTeam: homeTeam.trim(),
    awayTeam: awayTeam.trim(),
    matchDate: normalizedDate,
    location: isNonEmptyString(location) ? location.trim() : null,
    userId: user.id,
    createdAt: now,
    updatedAt: now,
  };

  db.matches.push(match);
  await writeDb(db);

  return NextResponse.json({ data: withAuthor(db, match) }, { status: 201 });
}
