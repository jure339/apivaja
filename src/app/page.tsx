import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12 sm:px-10 sm:py-16">
      <section className="grid gap-8 overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="grid gap-6">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-cyan-700">
            SportMonks Demo
          </p>
          <div className="grid gap-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Clean football fixture browsing with a simple Next.js app.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Landing page first, match calendar second. Open the fixtures view to
              browse Superliga matchdays without getting stuck in one long page.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/tekme"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(8,145,178,0.28)] transition hover:translate-y-[-1px]"
            >
              Open Fixtures
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white px-6 py-3 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-50"
            >
              See Features
            </a>
          </div>
        </div>

        <div className="grid gap-4 rounded-[2rem] bg-[linear-gradient(135deg,#0b132b_0%,#124e78_48%,#6ee7f9_100%)] p-6 text-white shadow-[0_20px_60px_rgba(18,78,120,0.32)]">
          <div className="grid gap-2 rounded-[1.5rem] bg-white/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">
              Match Calendar
            </p>
            <h2 className="text-3xl font-semibold">Superliga</h2>
            <p className="text-sm leading-7 text-cyan-50/85">
              Daily groups, selectable matchdays, and a lighter interface that is
              easier to scan.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/75">
                Daily View
              </p>
              <p className="mt-2 text-lg font-semibold">One day at a time</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/75">
                Backend
              </p>
              <p className="mt-2 text-lg font-semibold">Next API route</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/75">
                Provider
              </p>
              <p className="mt-2 text-lg font-semibold">SportMonks</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mt-8 grid gap-4 sm:grid-cols-3"
      >
        <article className="rounded-[1.75rem] border border-cyan-100 bg-white/70 p-5 shadow-[0_12px_30px_rgba(8,145,178,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Better Flow
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The homepage now introduces the app instead of dropping users
            straight into the fixture list.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-cyan-100 bg-white/70 p-5 shadow-[0_12px_30px_rgba(8,145,178,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Cleaner Matches
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Fixtures live on their own page, grouped by day with less scrolling
            and clearer focus.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-cyan-100 bg-white/70 p-5 shadow-[0_12px_30px_rgba(8,145,178,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Easy Next Step
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            From here we can add teams, leagues, logos, or a richer dashboard
            without changing the overall structure.
          </p>
        </article>
      </section>
    </main>
  );
}
