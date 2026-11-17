# Voorukonda Sathwik's Monthly Income Analysis — Vercel Edition

A static responsive personal income and expense tracker.

## Files
- `index.html` — application page
- `styles.css` — complete responsive styling
- `app.js` — dashboard, salary, expenses, charts, reports and browser storage
- `vercel.json` — Vercel static-site configuration

## Deploy to Vercel
1. Upload this project to a GitHub repository.
2. Import the repository in Vercel.
3. Framework Preset: Other.
4. Build Command: leave empty.
5. Output Directory: `.` (project root).
6. Click Deploy.

## Important data limitation
This Vercel edition stores data in the browser's localStorage. Data does not automatically synchronize between devices or browsers. Use Yearly Reports → Backup & Restore to export/import JSON backups. To get secure cross-device sync, add a real cloud database/backend; a static Vercel deployment alone does not provide shared storage.
