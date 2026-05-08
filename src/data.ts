import type { Sections } from "./types";

export const profile = {
  name: "Furansu",
  handle: "furansugg",
  role: "Full-Stack Web Developer",
  location: "Indonesia",
  email: "ekbcpc@phonk.my.id",
  tagline:
    "I build web apps with TypeScript, React, Next.js, and a sprinkle of Postgres.",
} as const;

export const sections: Sections = {
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
    {
      type: "tags",
      items: ["TypeScript", "JavaScript", "Kotlin", "SQL", "HTML", "CSS"],
    },
    { type: "subtitle", text: "Frontend" },
    {
      type: "tags",
      items: ["React", "Next.js", "Vite", "Tailwind CSS", "Bootstrap"],
    },
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
      stack: ["TypeScript", "Vite", "HTML", "CSS"],
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
    {
      type: "kv",
      k: "email",
      v: profile.email,
      link: `mailto:${profile.email}`,
    },
    {
      type: "kv",
      k: "github",
      v: "github.com/furansugg",
      link: "https://github.com/furansugg",
    },
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

export const files: Record<string, keyof Sections> = {
  "about.txt": "about",
  "skills.txt": "skills",
  "experience.txt": "experience",
  "projects.txt": "projects",
  "education.txt": "education",
  "contact.txt": "contact",
  "social.txt": "social",
  "README.md": "about",
};
