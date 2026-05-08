export type Theme = "green" | "amber" | "blue" | "white";

export type SectionBlock =
  | { type: "title"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "p"; text: string }
  | { type: "tags"; items: readonly string[] }
  | { type: "kv"; k: string; v: string; link?: string }
  | {
      type: "project";
      name: string;
      desc: string;
      stack: readonly string[];
      url?: string;
    };

export type SectionName =
  | "about"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "contact"
  | "social";

export type Sections = Record<SectionName, readonly SectionBlock[]>;

export type Command = {
  desc: string;
  run: (args: string[]) => void;
};
