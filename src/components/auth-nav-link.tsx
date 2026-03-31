"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_TOKEN = "auth_token";
const STORAGE_USER = "auth_user";

function isAuthenticated() {
  if (typeof window === "undefined") return false;
  const token = window.localStorage.getItem(STORAGE_TOKEN);
  const user = window.localStorage.getItem(STORAGE_USER);
  return Boolean(token && user);
}

export function AuthNavLink() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    function syncAuthState() {
      setIsLoggedIn(isAuthenticated());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_TOKEN || event.key === STORAGE_USER) {
        syncAuthState();
      }
    }

    syncAuthState();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("auth-change", syncAuthState as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth-change", syncAuthState as EventListener);
    };
  }, []);

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_TOKEN);
      window.localStorage.removeItem(STORAGE_USER);
      window.dispatchEvent(new Event("auth-change"));
    }
    setIsLoggedIn(false);
    router.replace("/auth");
  }

  if (isLoggedIn) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-cyan-100 bg-white px-4 py-2 transition hover:border-cyan-200 hover:bg-cyan-50"
      >
        Odjava
      </button>
    );
  }

  return (
    <Link
      href="/auth"
      className="rounded-full border border-cyan-100 bg-white px-4 py-2 transition hover:border-cyan-200 hover:bg-cyan-50"
    >
      Prijava
    </Link>
  );
}
