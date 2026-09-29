import { auth } from "../firebase/config";

async function authedFetch(url, options = {}) {
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, ...options.headers },
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    // Most likely cause: the dev server has no /api routes (plain `npm run
    // dev` instead of `vercel dev`), so this got index.html back instead.
    throw new Error("Couldn't reach the server. If you're running `npm run dev`, use `vercel dev` instead — /api routes need it.");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const listAdmins = () => authedFetch("/api/admin/list-admins");
export const promoteByEmail = (email, makeAdmin) =>
  authedFetch("/api/admin/promote-by-email", { method: "POST", body: JSON.stringify({ email, makeAdmin }) });
