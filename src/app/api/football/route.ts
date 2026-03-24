import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api.sportmonks.com/v3/football";
const SUPERLIGA_ID = 271;
const DAYS_AHEAD = 30;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type SportMonksFixture = {
  id: number;
  league_id: number;
  name: string;
  starting_at: string;
  result_info: string | null;
};

type SportMonksResponse = {
  data?: SportMonksFixture[];
  message?: string;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseStartDate(value: string | null) {
  if (!value || !DATE_PATTERN.test(value)) {
    return new Date();
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function getSeasonForDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  return month >= 7 ? year : year - 1;
}

function getDateRange(start: Date) {
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + DAYS_AHEAD);

  return {
    from: formatDate(start),
    to: formatDate(end),
  };
}

export async function GET(request: NextRequest) {
  const apiToken = process.env.SPORTMONKS_API_TOKEN;

  if (!apiToken) {
    return NextResponse.json(
      { error: "Missing SPORTMONKS_API_TOKEN environment variable." },
      { status: 500 }
    );
  }

  const startDate = parseStartDate(request.nextUrl.searchParams.get("start"));
  const season = getSeasonForDate(startDate);
  const { from, to } = getDateRange(startDate);
  const url = new URL(`${API_BASE_URL}/fixtures/between/${from}/${to}`);

  url.searchParams.set("api_token", apiToken);
  url.searchParams.set("filters", `fixtureLeagues:${SUPERLIGA_ID}`);
  url.searchParams.set("per_page", "100");

  const response = await fetch(url.toString(), {
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "SportMonks request failed." },
      { status: response.status }
    );
  }

  const payload = (await response.json()) as SportMonksResponse;

  if (payload.message) {
    return NextResponse.json(
      {
        error: `SportMonks error: ${payload.message}`,
        provider: "SportMonks",
        league: "Superliga",
        season,
        from,
        to,
        fixtures: [],
      },
      { status: 403 }
    );
  }

  const fixtures =
    payload.data?.map((fixture) => {
      const [homeTeam, awayTeam] = fixture.name.split(" vs ");

      return {
        id: fixture.id,
        date: fixture.starting_at,
        status: fixture.result_info ?? "Scheduled",
        round: "Superliga",
        league: "Superliga",
        homeTeam: homeTeam ?? fixture.name,
        awayTeam: awayTeam ?? "",
      };
    }) ?? [];

  return NextResponse.json({
    provider: "SportMonks",
    league: "Superliga",
    season,
    from,
    to,
    fixtures,
  });
}
