import { waitUntil } from "@vercel/functions";

// Run slow work (like sending an email) after the response has gone out, so the
// customer isn't kept waiting. waitUntil keeps the serverless function alive until it finishes.
export function runInBackground(label, fn) {
  const task = Promise.resolve()
    .then(fn)
    .catch((err) => console.error(`${label} failed`, err));
  try { waitUntil(task); } catch { /* not on Vercel (plain local run): the task just runs on its own */ }
}
