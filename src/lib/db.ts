import { promises as fs } from "fs";
import path from "path";

export type UserRecord = {
  id: number;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: string;
};

export type SessionRecord = {
  token: string;
  userId: number;
  createdAt: string;
};

export type MatchRecord = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  location: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export type DbState = {
  users: UserRecord[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
  nextIds: {
    user: number;
    match: number;
  };
};

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const EMPTY_DB: DbState = {
  users: [],
  sessions: [],
  matches: [],
  nextIds: {
    user: 1,
    match: 1,
  },
};

async function ensureDbExists() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf8");
}

function normalizeDb(data: Partial<DbState> | null | undefined): DbState {
  const safe = data ?? {};
  return {
    users: Array.isArray(safe.users) ? safe.users : [],
    sessions: Array.isArray(safe.sessions) ? safe.sessions : [],
    matches: Array.isArray(safe.matches) ? safe.matches : [],
    nextIds: {
      user: safe.nextIds?.user ?? 1,
      match: safe.nextIds?.match ?? 1,
    },
  };
}

export async function readDb(): Promise<DbState> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return normalizeDb(JSON.parse(raw) as Partial<DbState>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await ensureDbExists();
      return { ...EMPTY_DB };
    }
    throw error;
  }
}

export async function writeDb(db: DbState) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function getNextId(db: DbState, key: keyof DbState["nextIds"]) {
  const next = db.nextIds[key];
  db.nextIds[key] += 1;
  return next;
}
