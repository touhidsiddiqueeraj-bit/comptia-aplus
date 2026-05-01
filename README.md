# CompTIA A+ Zero to Hero — 90-Day Study App

A self-contained, single-file progressive web app for studying the CompTIA A+ certification (220-1101 Core 1 & 220-1102 Core 2).

🔗 **Live:** https://touhidsiddiqueeraj-bit.github.io/comptia-aplus/

## Features
- 90-day structured study plan with Professor Messer video embeds
- Practice quizzes with full explanations (Core 1 + Core 2 sets)
- XP, levels, streaks, and achievements
- Searchable notes reference library
- Cloud sync via Google Apps Script (optional — guest mode available)
- Dark mode, mobile-friendly

## Deployment
This is a **single HTML file** — just drop `index.html` on any static host.

Netlify: connect the repo, build command is blank, publish directory is `/`.

## Backend (Google Apps Script)
Progress sync is powered by `gas_backend.gs`. 

**Setup:**
1. Go to [script.google.com](https://script.google.com) → New Project
2. Paste `gas_backend.gs` contents
3. Update `SHEET_ID` with your Google Sheet ID
4. Deploy → Web App (Execute as: Me, Access: Anyone)
5. The deployed URL is already wired into `index.html`

## Local Use
Just open `index.html` in any browser — no server needed. Login is optional; click **"Continue without account"** to use guest mode with local storage.

## Stack
- Vanilla HTML/CSS/JS (zero dependencies, zero build step)
- Google Apps Script + Google Sheets (backend)
- YouTube nocookie embeds (Prof. Messer videos)
