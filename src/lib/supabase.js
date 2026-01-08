// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yhnnzadftabqcmenraug.supabase.co'; // Pega aquí tu URL de Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlobm56YWRmdGFicWNtZW5yYXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTU5NjksImV4cCI6MjA4MzI3MTk2OX0.wLAix8OoRgN-K2H0xX_HtCkRnyHPnSUjapbYOzjBA-I'; // Pega aquí tu clave ANON

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImage = async (file) => {
    if (!file) return null;

    // LIMPIEZA DE NOMBRE: Quitamos espacios y caracteres raros
    // "Mi Foto.jpg" se convierte en "123456-Mi_Foto.jpg"
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. Subir la imagen
    const { data, error } = await supabase.storage
        .from('fotos')
        .upload(filePath, file, {
            upsert: true 
        });

    if (error) {
        console.error("Error subiendo:", error);
        throw error;
    }

    // 2. Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
        .from('fotos')
        .getPublicUrl(filePath);

    // DEBUG: Ver en consola qué URL generó
    console.log("URL Generada:", publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
};