"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MatchesManager } from "@/components/matches-manager";

type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
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

export default function Page() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const isLoggedIn = useMemo(() => Boolean(token && user), [token, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem(STORAGE_TOKEN);
    const storedUser = readStoredUser();
    setToken(storedToken);
    setUser(storedUser);
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!isLoggedIn) {
      router.replace("/auth");
    }
  }, [checked, isLoggedIn, router]);

  if (!checked) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-10 text-sm text-slate-500">
        Preverjam prijavo...
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-10 text-sm text-slate-500">
        Preusmerjam na prijavo...
      </main>
    );
  }

  return <MatchesManager />;
}
