// Turn on a provider only after it's enabled in Firebase Console →
// Authentication → Sign-in method. Google is free/easy; Facebook needs a Meta
// developer app; Apple needs a paid Apple Developer account.
export const SOCIAL = { google: true, facebook: false, apple: false };

// Email validation — a real format check (aaa@bbb.ccc), not just "has an @".
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (value) => EMAIL_REGEX.test(value.trim());

export function validatePassword(pwd) {
  if (pwd.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pwd)) return "Password must include an uppercase letter";
  if (!/[0-9]/.test(pwd)) return "Password must include a number";
  return "";
}

export function strengthMeta(password) {
  if (!password) return null;
  const hasUpper = /[A-Z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  if (password.length < 8) return { level: 1, label: "Weak" };
  if (!hasUpper || !hasNum) return { level: 2, label: "Medium" };
  return { level: 3, label: "Strong" };
}
