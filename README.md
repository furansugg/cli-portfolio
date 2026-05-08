# cli-portfolio

A simple command-line styled portfolio website. The whole UI is a terminal —
the visitor types commands to navigate the content.

## Try it

Open `index.html` in a browser, or serve the folder statically:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

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
- `clear` (or `Ctrl+L`) — clear the screen

Tab completes commands, file names, and themes. Use the up/down arrows to
browse command history.

## Stack

Plain HTML, CSS, and vanilla JavaScript. No build step, no dependencies.

## Structure

```
.
├── index.html   # markup + terminal scaffold
├── style.css    # terminal styling and themes
├── script.js    # command parser, history, autocomplete
└── README.md
```
