import { createClient } from "@/lib/supabase/client";

export default function LoginButton() {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button onClick={signInWithGoogle} className="login-btn">
      Sign in with Google
    </button>
  );
}
