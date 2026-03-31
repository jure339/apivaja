import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { getNextId, readDb, writeDb } from "@/lib/db";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password, name } = payload as Record<string, unknown>;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const db = await readDb();
  const normalizedEmail = email.trim().toLowerCase();

  if (db.users.some((user) => user.email === normalizedEmail)) {
    return NextResponse.json(
      { error: "User with this email already exists." },
      { status: 409 }
    );
  }

  const userId = getNextId(db, "user");
  const now = new Date().toISOString();

  db.users.push({
    id: userId,
    email: normalizedEmail,
    name: isNonEmptyString(name) ? name.trim() : null,
    passwordHash: hashPassword(password),
    createdAt: now,
  });

  await writeDb(db);

  const token = await createSession(userId);

  return NextResponse.json({
    token,
    user: {
      id: userId,
      email: normalizedEmail,
      name: isNonEmptyString(name) ? name.trim() : null,
      createdAt: now,
    },
  });
}
