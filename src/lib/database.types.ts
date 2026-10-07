// src/lib/database.types.ts
//
// PLACEHOLDER — este archivo se sobrescribe automáticamente al correr:
//   npm run types:generate
//
// Ese comando llama a `supabase gen types typescript` contra tu proyecto
// real (rspelkakwtivrnmboyhh) y reemplaza este contenido con los tipos
// exactos de tus tablas, columnas y sus tipos (uuid, bigint, text, etc.).
//
// Requiere estar logueado en la CLI de Supabase una vez:
//   npx supabase login
// (o exportar SUPABASE_ACCESS_TOKEN si prefieres no loguearte interactivo)
//
// Mientras no lo corras, este placeholder usa `any` para que el sitio
// siga compilando, pero SIN el beneficio real de autocompletado/chequeo
// de tipos — es temporal, no un reemplazo definitivo.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
