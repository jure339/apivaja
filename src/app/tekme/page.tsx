import Link from "next/link";
import { ApiDemo } from "@/components/api-demo";

export default function MatchesPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
            Fixtures
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Superliga match calendar
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/moje-tekme"
            className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-50"
          >
            Urejaj moje tekme
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-50"
          >
            Back To Landing Page
          </Link>
        </div>
      </div>

      <ApiDemo />
    </main>
  );
}


