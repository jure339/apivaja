This is a simple [Next.js](https://nextjs.org) app that fetches football data from [SportMonks](https://my.sportmonks.com/api/tester) through a local server route.

## Setup

Create a local environment file if you do not already have one:

```bash
cp .env.example .env.local
```

Then set:

```env
SPORTMONKS_API_TOKEN=your_sportmonks_api_token_here
```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend calls `/api/football`, and that route securely talks to the SportMonks football API.

## Notes

The current free token appears to expose Superliga fixtures. La Liga was not returned by the accessible league/date checks I tested.
