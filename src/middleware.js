// src/middleware.js
import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(async ({ cookies, request, redirect }, next) => {
  // 1. Obtener la ruta actual
  const url = new URL(request.url);
  console.log("--> Intentando entrar a:", url.pathname); // CHIVATO 1

  // 2. Definir rutas protegidas
  const rutasPrivadas = ["/admin", "/dashboard"];
  
  // Verificamos si la ruta actual empieza con alguna de las privadas
  const esRutaPrivada = rutasPrivadas.some((ruta) => url.pathname.startsWith(ruta));

  // 3. Verificar si tiene la cookie
  const accessToken = cookies.get("sb-access-token");
  console.log("¿Tiene token?", accessToken ? "SÍ" : "NO"); // CHIVATO 2

  // 4. LA REGLA DE ORO
  if (esRutaPrivada && !accessToken) {
    console.log("¡ALTO! Usuario no autorizado. Redirigiendo a /login..."); // CHIVATO 3
    return redirect("/login");
  }

  // Si pasa, adelante
  return next();
});