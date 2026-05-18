import { createClient } from "@/lib/supabase/server";

export async function getServerSideProps(context) {
  const { req, res, query } = context;
  const { code } = query;

  if (code) {
    const supabase = createClient(req, res);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
}

export default function AuthCallback() {
  return null;
}