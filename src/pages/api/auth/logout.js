export const POST = async ({ cookies, redirect }) => {
  // Borramos las credenciales
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });
  
  // Lo mandamos al login
  return redirect("/login");
};