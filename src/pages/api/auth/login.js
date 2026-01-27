import { supabase } from "../../../lib/supabase";

export const POST = async ({ request, cookies }) => {
  const formData = await request.json();
  const { email, password } = formData;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 401 });
  }

  const { access_token, refresh_token } = data.session;

  // 2. Guardar la sesión en cookies (funciona en tu PC y en el servidor)
  cookies.set("sb-access-token", access_token, { path: "/", httpOnly: true, secure: false });
  cookies.set("sb-refresh-token", refresh_token, { path: "/", httpOnly: true, secure: true });

  return new Response(JSON.stringify({ message: "Login exitoso" }), { status: 200 });
};