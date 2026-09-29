import { auth } from "../firebase/config";

// Images live on Cloudinary (free tier, no card) because Firebase Storage now
// requires the Blaze plan. Uploads are signed by /api/uploads/sign (admin only).
export async function uploadImage(file, folder = "products") {
  const idToken = await auth.currentUser.getIdToken();

  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ folder }),
  });
  const contentType = signRes.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Couldn't reach the server. If you're running `npm run dev`, use `vercel dev` instead — /api routes need it.");
  }
  if (!signRes.ok) throw new Error((await signRes.json()).message || "Could not authorize upload");
  const { signature, timestamp, folder: fullFolder, apiKey, cloudName } = await signRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", fullFolder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
}

// Serve smaller, auto-format images on the storefront (faster on mobile).
export function optimizedUrl(url, width = 600) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}
