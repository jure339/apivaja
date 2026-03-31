import crypto from "crypto";
import { readDb, writeDb } from "./db";

const TOKEN_BYTES = 32;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLEL = 1;
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLEL,
  });
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, storedHash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !storedHash) {
    return false;
  }
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLEL,
  });
  return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), hash);
}

export function extractBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export async function getUserFromToken(token: string | null) {
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) return null;
  const user = db.users.find((entry) => entry.id === session.userId);
  return user ?? null;
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const db = await readDb();
  db.sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
  });
  await writeDb(db);
  return token;
}
