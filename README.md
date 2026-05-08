# cli-portfolio

A simple command-line styled portfolio website. The whole UI is a terminal —
the visitor types commands to navigate the content. Built with **Vite + TypeScript**
(vanilla, no framework) and includes an optional Last.fm "now playing" badge
above the prompt.

Live: <https://commandline-portfolio-website-3pq76nzi.devinapps.com>

## Quick start

Requires Node 18+ (developed against Node 22).

```bash
npm install
npm run dev        # http://127.0.0.1:5173 with HMR
npm run build      # tsc --noEmit && vite build -> ./dist
npm run preview    # serve ./dist locally
npm run typecheck  # tsc --noEmit (used as the lint step)
```

The build output in `dist/` is fully static and can be served from any host
(GitHub Pages, Netlify, S3, `python3 -m http.server`, etc.). `vite.config.ts`
sets `base: "./"` so the build also works under a subpath like
`furansugg.github.io/cli-portfolio/`.

## Commands

- `help` — list all commands
- `about` — short bio
- `skills` — languages, frameworks, and tools
- `experience` — work experience
- `projects` — selected projects
- `education` — education
- `contact` / `social` — how to reach me
- `ls` / `cat <file>` — explore "files" on disk
- `theme <green|amber|blue|white>` — change color theme
- `nowplaying` (alias `np`) — what's currently playing on Last.fm
- `clear` (or `Ctrl+L`) — clear the screen

Tab completes commands, file names, and themes. The up/down arrows browse
command history (persisted to `localStorage`). `Ctrl+C` cancels the current
input.

## Now-playing badge (Last.fm)

When configured, a small badge above the prompt shows whatever the portfolio
owner is currently scrobbling on Last.fm:

```
♫ now playing: Artist — Track Title
```

The badge auto-hides when nothing is playing. Polling runs every 15 seconds
while the tab is active and refreshes immediately when the tab regains focus.
The same data is available from the terminal via the `nowplaying` / `np`
command.

To enable it for a build, copy `.env.example` to `.env` and fill in:

```
VITE_LASTFM_API_KEY=<your Last.fm API key>
VITE_LASTFM_USERNAME=<your Last.fm username>
```

Get a key (free) at <https://www.last.fm/api/account/create>. To make the
badge useful, link Spotify → Last.fm at
<https://www.last.fm/settings/applications> so your Spotify plays scrobble
automatically.

These `VITE_*` variables are inlined into the static bundle at build time,
which is intentional: the Last.fm read API uses the API key only for
rate-limiting (no authentication, no write access), so shipping it in the
client is the documented usage pattern. Rotate it from your Last.fm app
dashboard if abuse becomes an issue.

If the env vars are missing, the badge stays hidden and `np` prints a
"not configured" notice — the rest of the site still works.

## Stack

- [Vite 5](https://vitejs.dev/) for dev server, HMR, and bundling
- TypeScript (`strict`, `noUnusedLocals`, `noUnusedParameters`)
- Vanilla DOM — no React/Vue/Svelte; the entire UI is a single terminal
- Last.fm `user.getRecentTracks` API, called directly from the browser
- No CI configured; deploys are manual

Bundle size at the time of writing: `~14 kB JS` + `~6 kB CSS` (uncompressed),
~7 kB gzipped total.

## Structure

```
.
├── index.html              # markup, banner, prompt, now-playing slot
├── src/
│   ├── main.ts             # DOM, command parser, history, tab-completion
│   ├── data.ts             # profile, sections, "files" map
│   ├── nowplaying.ts       # Last.fm fetch + types
│   ├── types.ts            # Theme, SectionBlock, SectionName, Command
│   ├── style.css           # terminal styling, themes, badge styles
│   └── vite-env.d.ts       # ImportMetaEnv typing for VITE_LASTFM_*
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```
