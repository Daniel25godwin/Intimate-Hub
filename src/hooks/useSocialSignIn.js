import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { ensureUserProfile } from "../services/authService";

// Shared by Login and Sign-up. Provider accounts are already verified, so
// there's no "check your email" step — create/sign in via popup, make sure a
// Firestore profile exists, then hand off to routeUser.
export function useSocialSignIn({ setError, setLoading, routeUser }) {
  const run = async (provider) => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      await ensureUserProfile(auth.currentUser);
      routeUser(auth.currentUser);
    } catch (err) {
      if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email using a different sign-in method.");
      } else if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        // Popup-closed-by-user isn't a real error — they just backed out.
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    handleGoogleSignIn: () => run(new GoogleAuthProvider()),
    handleFacebookSignIn: () => run(new FacebookAuthProvider()),
    handleAppleSignIn: () => run(new OAuthProvider("apple.com")),
  };
}
