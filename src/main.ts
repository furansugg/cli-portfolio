/* CLI Portfolio — interactive terminal logic (Vite + TypeScript). */

import "./style.css";
import { profile, sections, files } from "./data";
import type { Command, SectionName, Theme } from "./types";
import {
  fetchNowPlaying,
  isConfigured as isNowPlayingConfigured,
  getUsername as getNowPlayingUsername,
  type NowPlaying,
} from "./nowplaying";

const VALID_THEMES: readonly Theme[] = ["green", "amber", "blue", "white"];

// ----------------------------- DOM ----------------------------------------
function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

const screen = $<HTMLElement>("screen");
const output = $<HTMLElement>("output");
const promptEl = $<HTMLElement>("prompt");
const input = $<HTMLInputElement>("cmdInput");
const caret = $<HTMLElement>("caret");
const nowplayingEl = $<HTMLElement>("nowplaying");
const nowplayingLink = $<HTMLAnchorElement>("nowplayingLink");
const nowplayingArtist = $<HTMLElement>("nowplayingArtist");
const nowplayingTitle = $<HTMLElement>("nowplayingTitle");

// Last "now playing" snapshot, kept in module scope so the `nowplaying`
// command can print whatever the badge is currently showing without doing
// an extra network round-trip.
let lastNowPlaying: NowPlaying = { isPlaying: false };

// ----------------------------- STATE --------------------------------------
type State = {
  history: string[];
  historyIndex: number | null;
  draft: string;
  theme: Theme;
};

const state: State = {
  history: loadHistory(),
  historyIndex: null,
  draft: "",
  theme: loadTheme(),
};

applyTheme(state.theme);

// ----------------------------- HELPERS ------------------------------------
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makeEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function print(node: Node): void {
  output.appendChild(node);
  scrollToBottom();
}

function printLine(text: string, cls?: string): void {
  const div = makeEl("div", "line" + (cls ? " " + cls : ""));
  div.textContent = text;
  print(div);
}

function printHTML(html: string, cls?: string): void {
  const div = makeEl("div", "line" + (cls ? " " + cls : ""));
  div.innerHTML = html;
  print(div);
}

function scrollToBottom(): void {
  requestAnimationFrame(() => {
    screen.scrollTop = screen.scrollHeight;
  });
}

function renderPrompt(): void {
  promptEl.innerHTML =
    `<span class="user">visitor</span>` +
    `<span class="sigil">@</span>` +
    `<span class="host">furansugg</span>` +
    `<span class="sigil">:</span>` +
    `<span class="path">~</span>` +
    `<span class="sigil">$</span>`;
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem("cli-history");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string").slice(-200);
  } catch {
    return [];
  }
}

function saveHistory(): void {
  try {
    localStorage.setItem(
      "cli-history",
      JSON.stringify(state.history.slice(-200))
    );
  } catch {
    /* noop */
  }
}

function loadTheme(): Theme {
  const stored = localStorage.getItem("cli-theme");
  if (stored && (VALID_THEMES as readonly string[]).includes(stored)) {
    return stored as Theme;
  }
  return "green";
}

function applyTheme(theme: Theme): void {
  state.theme = theme;
  if (theme === "green") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  try {
    localStorage.setItem("cli-theme", theme);
  } catch {
    /* noop */
  }
}

function isTheme(value: string): value is Theme {
  return (VALID_THEMES as readonly string[]).includes(value);
}

function focusInput(): void {
  input.focus({ preventScroll: true });
}

// ----------------------------- NOW PLAYING --------------------------------
// Poll every 15s so track changes show up reasonably quickly. Last.fm's
// rate limit (5 req/s per IP) is well above this and the response is
// tiny, so we don't need to be conservative here.
const NOW_PLAYING_POLL_MS = 15_000;
// Don't refire for tiny window-focus / input-focus bursts: only refresh
// on activity if it has been at least this long since the last fetch.
const NOW_PLAYING_MIN_REFRESH_MS = 5_000;

let nowPlayingTimer: number | null = null;
let nowPlayingInFlight = false;
let nowPlayingLastFetched = 0;

function renderNowPlaying(np: NowPlaying): void {
  lastNowPlaying = np;
  if (!np.isPlaying) {
    nowplayingEl.hidden = true;
    return;
  }
  nowplayingArtist.textContent = np.artist || "unknown artist";
  nowplayingTitle.textContent = np.title || "unknown track";
  if (np.url) {
    nowplayingLink.href = np.url;
  } else {
    nowplayingLink.removeAttribute("href");
  }
  nowplayingEl.hidden = false;
}

async function pollNowPlaying(): Promise<void> {
  if (!isNowPlayingConfigured()) return;
  if (nowPlayingInFlight) return;
  nowPlayingInFlight = true;
  try {
    const np = await fetchNowPlaying();
    renderNowPlaying(np);
    nowPlayingLastFetched = Date.now();
  } finally {
    nowPlayingInFlight = false;
  }
}

function maybeRefreshNowPlaying(): void {
  if (!isNowPlayingConfigured()) return;
  if (Date.now() - nowPlayingLastFetched < NOW_PLAYING_MIN_REFRESH_MS) return;
  pollNowPlaying();
}

function startNowPlayingPoll(): void {
  if (!isNowPlayingConfigured()) return;
  pollNowPlaying();
  if (nowPlayingTimer !== null) return;
  nowPlayingTimer = window.setInterval(pollNowPlaying, NOW_PLAYING_POLL_MS);
  // Refresh whenever the user is clearly back at the page so the badge
  // catches up to whatever is playing right now (instead of waiting up
  // to a full poll cycle).
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    maybeRefreshNowPlaying();
  });
  window.addEventListener("focus", maybeRefreshNowPlaying);
}

function syncCaret(): void {
  // Size the input to its current content (in `ch` units) so the chunky
  // block caret rendered after it sits right next to the cursor instead
  // of floating to the far right edge.
  const len = Math.max(1, input.value.length + 1);
  input.style.width = `${len}ch`;
  caret.classList.remove("hidden");
  // Re-trigger the blink animation so the caret restarts in the visible
  // half of the cycle (instead of resuming wherever it happened to be
  // when the input lost/regained focus).
  caret.style.animation = "none";
  // Force layout recompute, then restore the animation.
  void caret.offsetWidth;
  caret.style.animation = "";
}

// ----------------------------- RENDER SECTIONS ----------------------------
function renderSection(name: SectionName): void {
  const blocks = sections[name];
  for (const b of blocks) {
    if (b.type === "title") {
      printHTML(escapeHtml(b.text), "section-title");
    } else if (b.type === "subtitle") {
      printHTML(`<span class="line-dim">${escapeHtml(b.text)}</span>`);
    } else if (b.type === "p") {
      printLine(b.text);
    } else if (b.type === "tags") {
      const wrap = makeEl("div", "line");
      for (const t of b.items) {
        const tag = makeEl("span", "tag");
        tag.textContent = t;
        wrap.appendChild(tag);
      }
      print(wrap);
    } else if (b.type === "kv") {
      const v = b.link
        ? `<a href="${escapeHtml(b.link)}" target="_blank" rel="noopener">${escapeHtml(
            b.v
          )}</a>`
        : escapeHtml(b.v);
      printHTML(
        `<span class="kv"><span class="k">${escapeHtml(b.k)}</span> ${v}</span>`
      );
    } else if (b.type === "project") {
      const stack = b.stack
        .map((s) => `<span class="tag">${escapeHtml(s)}</span>`)
        .join("");
      const link = b.url
        ? ` — <a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${escapeHtml(
            b.url
          )}</a>`
        : "";
      printHTML(`<span class="cmd-name">${escapeHtml(b.name)}</span>${link}`);
      printHTML(`<span class="line-dim">${escapeHtml(b.desc)}</span>`);
      printHTML(stack);
      printLine(" ");
    }
  }
}

// ----------------------------- COMMANDS -----------------------------------
const commands: Record<string, Command> = {
  help: {
    desc: "show available commands",
    run: () => {
      const order = [
        "help",
        "about",
        "whoami",
        "skills",
        "experience",
        "projects",
        "education",
        "contact",
        "social",
        "ls",
        "cat",
        "echo",
        "date",
        "history",
        "banner",
        "theme",
        "clear",
        "sudo",
        "exit",
      ];
      const rows = order
        .map((name) => {
          const c = commands[name];
          if (!c) return "";
          return `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(c.desc)}</td></tr>`;
        })
        .join("");
      printHTML(
        `<div class="line-dim">Available commands — type a name and hit enter.</div>` +
          `<table class="help-table">${rows}</table>` +
          `<div class="line-dim">Tips: TAB autocompletes, ↑/↓ browse history, Ctrl+L clears.</div>`
      );
    },
  },
  about: { desc: "who is this person?", run: () => renderSection("about") },
  whoami: {
    desc: "current user",
    run: () => {
      printHTML(
        `<span class="line-accent">visitor</span> <span class="line-dim">— guest on ${escapeHtml(
          profile.handle
        )}'s machine.</span>`
      );
    },
  },
  skills: {
    desc: "languages, frameworks, and tools",
    run: () => renderSection("skills"),
  },
  experience: {
    desc: "work experience",
    run: () => renderSection("experience"),
  },
  projects: { desc: "selected projects", run: () => renderSection("projects") },
  education: { desc: "education", run: () => renderSection("education") },
  contact: { desc: "how to reach me", run: () => renderSection("contact") },
  social: { desc: "social profiles", run: () => renderSection("social") },
  ls: {
    desc: "list available 'files'",
    run: () => {
      const names = Object.keys(files);
      const cols = makeEl("div", "line");
      cols.innerHTML = names
        .map((n) => `<span class="cmd-name">${escapeHtml(n)}</span>`)
        .join("&nbsp;&nbsp;");
      print(cols);
    },
  },
  cat: {
    desc: "print a file (try `cat about.txt`)",
    run: (args) => {
      if (!args.length) {
        printLine("usage: cat <file>", "line-error");
        return;
      }
      const target = args[0];
      const sectionKey = files[target];
      if (!sectionKey) {
        printLine(`cat: ${target}: No such file or directory`, "line-error");
        return;
      }
      renderSection(sectionKey);
    },
  },
  echo: {
    desc: "print arguments",
    run: (args) => {
      printLine(args.join(" "));
    },
  },
  date: {
    desc: "current date and time",
    run: () => {
      printLine(new Date().toString());
    },
  },
  history: {
    desc: "show command history",
    run: () => {
      const lines = state.history
        .map(
          (h, i) =>
            `<span class="line-dim">${String(i + 1).padStart(
              3,
              " "
            )}</span>  ${escapeHtml(h)}`
        )
        .join("\n");
      if (!lines) {
        printLine("(empty)", "line-dim");
        return;
      }
      printHTML(`<pre class="line">${lines}</pre>`);
    },
  },
  banner: { desc: "show the welcome banner", run: () => printBanner() },
  theme: {
    desc: "change theme: green | amber | blue | white",
    run: (args) => {
      if (!args.length) {
        printLine(`current theme: ${state.theme}`);
        printLine("usage: theme <green|amber|blue|white>", "line-dim");
        return;
      }
      const t = args[0].toLowerCase();
      if (!isTheme(t)) {
        printLine(`unknown theme: ${t}`, "line-error");
        return;
      }
      applyTheme(t);
      printLine(`theme set to ${t}`, "line-accent");
    },
  },
  clear: {
    desc: "clear the screen",
    run: () => {
      output.innerHTML = "";
    },
  },
  sudo: {
    desc: "make a sandwich",
    run: (args) => {
      if (
        args[0] === "make" &&
        args[1] === "me" &&
        args[2] === "a" &&
        args[3] === "sandwich"
      ) {
        printLine("Okay.", "line-accent");
        return;
      }
      printLine("Permission denied: nice try.", "line-error");
    },
  },
  exit: {
    desc: "leave the terminal",
    run: () => {
      printLine("There's no escape. Try `clear` instead.", "line-warn");
    },
  },
  nowplaying: {
    desc: "what I'm listening to right now (Last.fm)",
    run: () => {
      if (!isNowPlayingConfigured()) {
        printLine(
          "now-playing widget is not configured for this site.",
          "line-dim",
        );
        return;
      }
      // Render whatever the polling background task last saw, then
      // refresh in the background so the next prompt has fresh data.
      if (lastNowPlaying.isPlaying) {
        const safeArtist = escapeHtml(lastNowPlaying.artist || "unknown artist");
        const safeTitle = escapeHtml(lastNowPlaying.title || "unknown track");
        const url = lastNowPlaying.url;
        const link = url
          ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${safeArtist} — ${safeTitle}</a>`
          : `${safeArtist} — ${safeTitle}`;
        printHTML(
          `<span class="line-accent">♫</span> <span class="line-dim">now playing:</span> ${link}`,
        );
      } else {
        const user = escapeHtml(getNowPlayingUsername());
        printLine(
          `not currently scrobbling on Last.fm (${user}). play something on Spotify and try again in ~30s.`,
          "line-dim",
        );
      }
      pollNowPlaying();
    },
  },
};

// aliases
commands.quit = commands.exit;
commands.man = { desc: "manual — same as help", run: commands.help.run };
commands.cls = { desc: "clear (alias)", run: commands.clear.run };
commands.np = {
  desc: "now playing (alias)",
  run: commands.nowplaying.run,
};

// ----------------------------- BANNER -------------------------------------
function printBanner(): void {
  const banner = [
    "   _____                                          ",
    "  |  ___|   _ _ __ __ _ _ __  ___ _   _  __ _  __ _ ",
    "  | |_ | | | | '__/ _` | '_ \\/ __| | | |/ _` |/ _` |",
    "  |  _|| |_| | | | (_| | | | \\__ \\ |_| | (_| | (_| |",
    "  |_|   \\__,_|_|  \\__,_|_| |_|___/\\__,_|\\__, |\\__, |",
    "                                        |___/ |___/ ",
  ].join("\n");
  const wrap = makeEl("div", "banner");
  wrap.textContent = banner;
  print(wrap);
  printHTML(
    `<div class="banner-sub">${escapeHtml(profile.role)} · ${escapeHtml(
      profile.location
    )}</div>`
  );
  printHTML(
    `<div class="line-dim">Type <span class="cmd-name">help</span> to see commands. Try <span class="cmd-name">about</span>, <span class="cmd-name">projects</span>, or <span class="cmd-name">contact</span>.</div>`
  );
  printLine(" ");
}

// ----------------------------- INPUT HANDLING -----------------------------
function echoCommand(cmd: string): void {
  const line = makeEl("div", "line");
  line.innerHTML =
    `<span class="prompt">${promptEl.innerHTML}</span> ` +
    `<span class="history-cmd">${escapeHtml(cmd)}</span>`;
  print(line);
}

function runCommand(raw: string): void {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    echoCommand("");
    return;
  }
  echoCommand(trimmed);

  if (state.history[state.history.length - 1] !== trimmed) {
    state.history.push(trimmed);
    saveHistory();
  }
  state.historyIndex = null;
  state.draft = "";

  const tokens = trimmed.split(/\s+/);
  const name = tokens[0].toLowerCase();
  const args = tokens.slice(1);
  const cmd = commands[name];

  if (!cmd) {
    printHTML(
      `<span class="line-error">command not found: ${escapeHtml(name)}</span>` +
        ` <span class="line-dim">— type <span class="cmd-name">help</span> for a list.</span>`
    );
    return;
  }
  try {
    cmd.run(args);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    printLine(`error: ${msg}`, "line-error");
  }
}

function longestCommonPrefix(arr: string[]): string {
  if (arr.length === 0) return "";
  let prefix = arr[0];
  for (let i = 1; i < arr.length; i++) {
    while (arr[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  return prefix;
}

function finishComplete(stem: string, matches: string[], prefix: string): void {
  if (matches.length === 0) return;
  if (matches.length === 1) {
    input.value = prefix + matches[0];
  } else {
    const common = longestCommonPrefix(matches);
    if (common.length > stem.length) {
      input.value = prefix + common;
    } else {
      echoCommand(input.value);
      printHTML(
        matches
          .map((m) => `<span class="cmd-name">${escapeHtml(m)}</span>`)
          .join("&nbsp;&nbsp;")
      );
    }
  }
  syncCaret();
}

function tabComplete(): void {
  const value = input.value;
  const parts = value.split(/\s+/);
  if (parts.length <= 1) {
    const stem = parts[0] || "";
    const matches = Object.keys(commands).filter((c) =>
      c.startsWith(stem.toLowerCase())
    );
    finishComplete(stem, matches, "");
  } else if (parts[0].toLowerCase() === "cat") {
    const stem = parts[parts.length - 1];
    const matches = Object.keys(files).filter((f) => f.startsWith(stem));
    finishComplete(stem, matches, parts.slice(0, -1).join(" ") + " ");
  } else if (parts[0].toLowerCase() === "theme") {
    const stem = parts[parts.length - 1];
    const matches = (VALID_THEMES as readonly string[]).filter((t) =>
      t.startsWith(stem)
    );
    finishComplete(stem, matches, parts.slice(0, -1).join(" ") + " ");
  }
}

function browseHistory(direction: -1 | 1): void {
  if (state.history.length === 0) return;
  if (state.historyIndex === null) {
    state.draft = input.value;
    state.historyIndex = state.history.length;
  }
  state.historyIndex += direction;
  if (state.historyIndex < 0) state.historyIndex = 0;
  if (state.historyIndex >= state.history.length) {
    state.historyIndex = state.history.length;
    input.value = state.draft || "";
  } else {
    input.value = state.history[state.historyIndex];
  }
  requestAnimationFrame(() => {
    input.selectionStart = input.selectionEnd = input.value.length;
  });
  syncCaret();
}

// ----------------------------- EVENTS -------------------------------------
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const value = input.value;
    input.value = "";
    syncCaret();
    runCommand(value);
  } else if (e.key === "Tab") {
    e.preventDefault();
    tabComplete();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    browseHistory(-1);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    browseHistory(1);
  } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    output.innerHTML = "";
  } else if (e.key === "c" && e.ctrlKey) {
    const sel = window.getSelection?.()?.toString();
    if (sel) return;
    e.preventDefault();
    echoCommand(input.value);
    printLine("^C", "line-dim");
    input.value = "";
    state.historyIndex = null;
    state.draft = "";
    syncCaret();
  }
});

input.addEventListener("input", syncCaret);
input.addEventListener("focus", () => {
  syncCaret();
  // Treat any prompt activity as "the user is interacting now" and
  // give the now-playing badge a chance to refresh promptly.
  maybeRefreshNowPlaying();
});
// Note: we deliberately do NOT hide the caret on blur. Hiding it caused
// the blink to stop permanently after a command ran, because the user
// could lose focus (clicking output, scrolling) without us reliably
// restoring the caret on the next focus.

screen.addEventListener("click", (e) => {
  if (window.getSelection?.()?.toString()) return;
  if (e.target instanceof HTMLAnchorElement) return;
  focusInput();
});

document.addEventListener("keydown", (e) => {
  if (
    document.activeElement !== input &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    e.key.length === 1
  ) {
    focusInput();
  }
});

// ----------------------------- BOOT ---------------------------------------
function boot(): void {
  renderPrompt();
  printBanner();
  focusInput();
  syncCaret();
  startNowPlayingPoll();
}

boot();
