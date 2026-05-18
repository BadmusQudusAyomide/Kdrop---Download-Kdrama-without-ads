import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "./supabase/client";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  supabase: null,
});

function sanitizeUsername(input, fallbackId) {
  const cleaned = (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);

  if (cleaned.length >= 3) return cleaned;
  return `user_${fallbackId.slice(0, 8)}`;
}

async function buildAvailableUsername(supabase, preferred, userId) {
  const base = sanitizeUsername(preferred, userId);

  for (let i = 0; i < 7; i += 1) {
    const candidate = i === 0 ? base : `${base.slice(0, 20)}_${i}`;
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    if (error) continue;
    if (!data || data.id === userId) return candidate;
  }

  return `user_${userId.slice(0, 8)}`;
}

async function ensureProfile(supabase, user) {
  if (!user?.id) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,bio")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.username) {
    const nextAvatar = user.user_metadata?.avatar_url ?? null;
    if (nextAvatar && existing.avatar_url !== nextAvatar) {
      await supabase
        .from("profiles")
        .update({ avatar_url: nextAvatar })
        .eq("id", user.id);
      return { ...existing, avatar_url: nextAvatar };
    }
    return existing;
  }

  const preferred =
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    user.user_metadata?.name ||
    user.email?.split("@")[0];

  const username = await buildAvailableUsername(supabase, preferred, user.id);
  const payload = {
    id: user.id,
    username,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  };

  await supabase.from("profiles").upsert(payload, { onConflict: "id" });

  const { data: saved } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,bio")
    .eq("id", user.id)
    .maybeSingle();

  return saved ?? payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      if (!active) return;

      setUser(currentUser);

      if (currentUser) {
        const resolvedProfile = await ensureProfile(supabase, currentUser);
        if (active) setProfile(resolvedProfile ?? null);
      } else {
        setProfile(null);
      }

      if (active) setLoading(false);
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const resolvedProfile = await ensureProfile(supabase, currentUser);
        if (active) setProfile(resolvedProfile ?? null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);