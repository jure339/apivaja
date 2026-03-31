import type { Metadata } from "next";
import Link from "next/link";
import { AuthNavLink } from "@/components/auth-nav-link";
import "./globals.css";

export const metadata: Metadata = {
  title: "apivaja",
  description: "Simple Next.js app with an API route",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-10">
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
              ApiVaja
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
              <Link
                href="/tekme"
                className="rounded-full border border-cyan-100 bg-white px-4 py-2 transition hover:border-cyan-200 hover:bg-cyan-50"
              >
                Tekme
              </Link>
              <Link
                href="/moje-tekme"
                className="rounded-full border border-cyan-100 bg-white px-4 py-2 transition hover:border-cyan-200 hover:bg-cyan-50"
              >
                Moje tekme
              </Link>
              <AuthNavLink />
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
