import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Cliente para el panel de administración (mantiene sesión activa)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente para páginas públicas (sin persistencia de sesión)
// Evita el error "Refresh token is not valid" en páginas que no requieren login
export const supabasePublic = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:   false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export const uploadImage = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
        .from('evento')
        .upload(filePath, file, {
            upsert: true 
        });

    if (error) {
        console.error("Error subiendo:", error);
        throw error;
    }

    const { data: publicUrlData } = supabase.storage
        .from('evento')
        .getPublicUrl(filePath);

    console.log("URL Generada:", publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
};