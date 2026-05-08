/* CLI Portfolio — interactive terminal logic */
(function () {
  "use strict";

  // ----------------------------- DATA ---------------------------------------
  const profile = {
    name: "Furansu",
    handle: "furansugg",
    role: "Full-Stack Web Developer",
    location: "Indonesia",
    email: "ekbcpc@phonk.my.id",
    tagline:
      "I build web apps with TypeScript, React, Next.js, and a sprinkle of Postgres.",
  };

  const sections = {
    about: [
      { type: "title", text: "// about" },
      {
        type: "p",
        text: `Hi, I'm ${profile.name} — a ${profile.role} based in ${profile.location}.`,
      },
      { type: "p", text: profile.tagline },
      {
        type: "p",
        text:
          "I enjoy crafting clean, fast, and pragmatic interfaces, and I love taking ideas from sketch to production.",
      },
    ],
    skills: [
      { type: "title", text: "// skills" },
      { type: "subtitle", text: "Languages" },
      { type: "tags", items: ["TypeScript", "JavaScript", "Kotlin", "SQL", "HTML", "CSS"] },
      { type: "subtitle", text: "Frontend" },
      { type: "tags", items: ["React", "Next.js", "Vite", "Tailwind CSS", "Bootstrap"] },
      { type: "subtitle", text: "Backend" },
      { type: "tags", items: ["Node.js", "Express", "Prisma", "Supabase"] },
      { type: "subtitle", text: "Databases" },
      { type: "tags", items: ["PostgreSQL", "MySQL", "SQLite"] },
      { type: "subtitle", text: "Tools" },
      { type: "tags", items: ["Git", "Linux", "Docker", "Vercel", "Figma"] },
    ],
    experience: [
      { type: "title", text: "// experience" },
      {
        type: "kv",
        k: "2024 — now",
        v: "Independent Developer · building side projects and learning in public",
      },
      {
        type: "kv",
        k: "2023 — 2024",
        v: "Web Developer · maintaining and shipping features for client web apps",
      },
      {
        type: "kv",
        k: "2022 — 2023",
        v: "Junior Developer · started professional career building React + Node apps",
      },
      {
        type: "p",
        text: "Run `projects` to see a list of selected work.",
      },
    ],
    projects: [
      { type: "title", text: "// projects" },
      {
        type: "project",
        name: "myDuwit",
        desc: "Personal finance tracker — keep tabs on spending and saving.",
        stack: ["TypeScript", "Next.js", "Prisma", "PostgreSQL"],
        url: "https://github.com/furansugg/myduwit",
      },
      {
        type: "project",
        name: "posan-android",
        desc: "Android POS application written in Kotlin.",
        stack: ["Kotlin", "Android"],
        url: "https://github.com/furansugg/posan-android",
      },
      {
        type: "project",
        name: "jules-realtime-chat",
        desc: "Realtime chat experiment.",
        stack: ["TypeScript", "WebSockets"],
        url: "https://github.com/furansugg/jules-realtime-chat",
      },
      {
        type: "project",
        name: "cli-portfolio",
        desc: "This site — a command-line styled portfolio.",
        stack: ["HTML", "CSS", "JavaScript"],
        url: "https://github.com/furansugg/cli-portfolio",
      },
    ],
    education: [
      { type: "title", text: "// education" },
      {
        type: "kv",
        k: "Self-taught",
        v: "Web development, software engineering — books, docs, and a lot of trial-and-error.",
      },
    ],
    contact: [
      { type: "title", text: "// contact" },
      { type: "kv", k: "email", v: profile.email, link: `mailto:${profile.email}` },
      { type: "kv", k: "github", v: "github.com/furansugg", link: "https://github.com/furansugg" },
      { type: "p", text: "Or run `social` for more links." },
    ],
    social: [
      { type: "title", text: "// social" },
      {
        type: "kv",
        k: "github",
        v: "github.com/furansugg",
        link: "https://github.com/furansugg",
      },
      {
        type: "kv",
        k: "email",
        v: profile.email,
        link: `mailto:${profile.email}`,
      },
    ],
  };

  // Files visible via `ls` / `cat`
  const files = {
    "about.txt": "about",
    "skills.txt": "skills",
    "experience.txt": "experience",
    "projects.txt": "projects",
    "education.txt": "education",
    "contact.txt": "contact",
    "social.txt": "social",
    "README.md": "about",
  };

  // ----------------------------- DOM ----------------------------------------
  const screen = document.getElementById("screen");
  const output = document.getElementById("output");
  const promptLine = document.getElementById("promptLine");
  const promptEl = document.getElementById("prompt");
  const input = document.getElementById("cmdInput");
  const caret = document.getElementById("caret");

  // ----------------------------- STATE --------------------------------------
  const state = {
    history: loadHistory(),
    historyIndex: null,
    draft: "",
    theme: localStorage.getItem("cli-theme") || "green",
  };

  applyTheme(state.theme);

  // ----------------------------- HELPERS ------------------------------------
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const key in attrs) {
        if (key === "class") node.className = attrs[key];
        else if (key === "html") node.innerHTML = attrs[key];
        else if (key.startsWith("on") && typeof attrs[key] === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else if (attrs[key] != null) node.setAttribute(key, attrs[key]);
      }
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.appendChild(
        typeof child === "string" ? document.createTextNode(child) : child
      );
    }
    return node;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function print(node) {
    output.appendChild(node);
    scrollToBottom();
  }

  function printLine(text, cls) {
    const div = el("div", { class: "line" + (cls ? " " + cls : "") });
    div.textContent = text;
    print(div);
  }

  function printHTML(html, cls) {
    const div = el("div", { class: "line" + (cls ? " " + cls : "") });
    div.innerHTML = html;
    print(div);
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      screen.scrollTop = screen.scrollHeight;
    });
  }

  function getPromptText() {
    return "visitor@furansugg:~$ ";
  }

  function renderPrompt() {
    promptEl.innerHTML =
      `<span class="user">visitor</span>` +
      `<span class="sigil">@</span>` +
      `<span class="host">furansugg</span>` +
      `<span class="sigil">:</span>` +
      `<span class="path">~</span>` +
      `<span class="sigil">$</span>`;
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem("cli-history");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(-200) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(
        "cli-history",
        JSON.stringify(state.history.slice(-200))
      );
    } catch (_) {}
  }

  function applyTheme(theme) {
    const valid = ["green", "amber", "blue", "white"];
    if (!valid.includes(theme)) theme = "green";
    state.theme = theme;
    if (theme === "green") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    try {
      localStorage.setItem("cli-theme", theme);
    } catch (_) {}
  }

  function focusInput() {
    input.focus({ preventScroll: true });
  }

  function syncCaret() {
    // Approximate caret follow: hide blinking caret while typing
    const hasText = input.value.length > 0;
    caret.classList.toggle("hidden", hasText);
  }

  // ----------------------------- RENDER SECTIONS ----------------------------
  function renderSection(name) {
    const blocks = sections[name];
    if (!blocks) {
      printLine(`No section: ${name}`, "line-error");
      return;
    }
    for (const b of blocks) {
      if (b.type === "title") {
        printHTML(escapeHtml(b.text), "section-title");
      } else if (b.type === "subtitle") {
        printHTML(`<span class="line-dim">${escapeHtml(b.text)}</span>`);
      } else if (b.type === "p") {
        printLine(b.text);
      } else if (b.type === "tags") {
        const wrap = el("div", { class: "line" });
        for (const t of b.items) {
          wrap.appendChild(el("span", { class: "tag" }, t));
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
        printHTML(
          `<span class="cmd-name">${escapeHtml(b.name)}</span>${link}`
        );
        printHTML(`<span class="line-dim">${escapeHtml(b.desc)}</span>`);
        printHTML(stack);
        printLine(" ");
      }
    }
  }

  // ----------------------------- COMMANDS -----------------------------------
  const commands = {
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
            return `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(
              c.desc
            )}</td></tr>`;
          })
          .join("");
        printHTML(
          `<div class="line-dim">Available commands — type a name and hit enter.</div>` +
            `<table class="help-table">${rows}</table>` +
            `<div class="line-dim">Tips: TAB autocompletes, ↑/↓ browse history, Ctrl+L clears.</div>`
        );
      },
    },
    about: {
      desc: "who is this person?",
      run: () => renderSection("about"),
    },
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
    projects: {
      desc: "selected projects",
      run: () => renderSection("projects"),
    },
    education: {
      desc: "education",
      run: () => renderSection("education"),
    },
    contact: {
      desc: "how to reach me",
      run: () => renderSection("contact"),
    },
    social: {
      desc: "social profiles",
      run: () => renderSection("social"),
    },
    ls: {
      desc: "list available 'files'",
      run: () => {
        const names = Object.keys(files);
        const cols = el("div", { class: "line" });
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
    banner: {
      desc: "show the welcome banner",
      run: () => printBanner(),
    },
    theme: {
      desc: "change theme: green | amber | blue | white",
      run: (args) => {
        if (!args.length) {
          printLine(`current theme: ${state.theme}`);
          printLine("usage: theme <green|amber|blue|white>", "line-dim");
          return;
        }
        const t = args[0].toLowerCase();
        const valid = ["green", "amber", "blue", "white"];
        if (!valid.includes(t)) {
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
        if (args[0] === "make" && args[1] === "me" && args[2] === "a" && args[3] === "sandwich") {
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
  };

  // aliases
  commands.quit = commands.exit;
  commands.man = {
    desc: "manual — same as help",
    run: commands.help.run,
  };
  commands.cls = {
    desc: "clear (alias)",
    run: commands.clear.run,
  };

  // ----------------------------- BANNER -------------------------------------
  function printBanner() {
    const banner = String.raw`
   _____                                          
  |  ___|   _ _ __ __ _ _ __  ___ _   _  __ _  __ _ 
  | |_ | | | | '__/ _` + "`" + ` | '_ \/ __| | | |/ _` + "`" + ` |/ _` + "`" + ` |
  |  _|| |_| | | | (_| | | | \__ \ |_| | (_| | (_| |
  |_|   \__,_|_|  \__,_|_| |_|___/\__,_|\__, |\__, |
                                        |___/ |___/ 
`;
    const wrap = el("div", { class: "banner" });
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
  function echoCommand(cmd) {
    const line = el("div", { class: "line" });
    line.innerHTML =
      `<span class="prompt">${promptEl.innerHTML}</span> ` +
      `<span class="history-cmd">${escapeHtml(cmd)}</span>`;
    print(line);
  }

  function runCommand(raw) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      echoCommand("");
      return;
    }
    echoCommand(trimmed);

    // push history
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
    } catch (err) {
      printLine(`error: ${err && err.message ? err.message : err}`, "line-error");
    }
  }

  function tabComplete() {
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
      const themes = ["green", "amber", "blue", "white"];
      const stem = parts[parts.length - 1];
      const matches = themes.filter((t) => t.startsWith(stem));
      finishComplete(stem, matches, parts.slice(0, -1).join(" ") + " ");
    }
  }

  function finishComplete(stem, matches, prefix) {
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

  function longestCommonPrefix(arr) {
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

  function browseHistory(direction) {
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
    // move caret to end
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
      // Don't interfere with copy when there's a selection
      const sel = window.getSelection && window.getSelection().toString();
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
  input.addEventListener("focus", syncCaret);
  input.addEventListener("blur", () => caret.classList.add("hidden"));

  // Keep input focused when clicking anywhere on the terminal,
  // unless the user is selecting text or clicking a link.
  screen.addEventListener("click", (e) => {
    if (window.getSelection && window.getSelection().toString()) return;
    if (e.target instanceof HTMLAnchorElement) return;
    focusInput();
  });

  document.addEventListener("keydown", (e) => {
    // global shortcut: focus input on any printable key
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
  function boot() {
    renderPrompt();
    printBanner();
    focusInput();
    syncCaret();
  }

  boot();
})();
