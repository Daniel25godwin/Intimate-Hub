import { SOCIAL } from "../../utils/authHelpers";
import { GoogleIcon, AppleIcon, FacebookIcon } from "./SocialIcons";

export default function SocialButtons({ handlers, disabled }) {
  if (!SOCIAL.google && !SOCIAL.facebook && !SOCIAL.apple) return null;
  return (
    <>
      <div className="auth-divider"><span>Or continue with</span></div>
      <div className="auth-social">
        {SOCIAL.google && (
          <button onClick={handlers.handleGoogleSignIn} disabled={disabled} type="button" aria-label="Continue with Google"><GoogleIcon /></button>
        )}
        {SOCIAL.apple && (
          <button onClick={handlers.handleAppleSignIn} disabled={disabled} type="button" aria-label="Continue with Apple"><AppleIcon /></button>
        )}
        {SOCIAL.facebook && (
          <button onClick={handlers.handleFacebookSignIn} disabled={disabled} type="button" aria-label="Continue with Facebook"><FacebookIcon /></button>
        )}
      </div>
    </>
  );
}
