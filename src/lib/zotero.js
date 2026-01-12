import { supabase } from './supabase';

const GROUP_ID = import.meta.env.PUBLIC_ZOTERO_GROUP_ID;
const API_KEY = import.meta.env.PUBLIC_ZOTERO_API_KEY;

// --- FUNCIÓN DE LIMPIEZA DE TEXTO ---
function cleanText(text) {
    if (!text) return '';
    let cleaned = text;
    const specificFixes = {
        'Ã\\copyright': 'é', 'Ã\\pm': 'ñ', 'Ã!': 'á', 'Ã`': 'á',
        '\\&': '&', 'â€“': '-', '{': '', '}': '',
        '\\"': '', "\\'": '', '\\`': '',
        'Á\\-': 'í', 'Áp': 'ñ', 'Ã.': 'Á.', 'Ã,': 'Á,'
    };
    Object.keys(specificFixes).forEach(bad => {
        cleaned = cleaned.replaceAll(bad, specificFixes[bad]);
    });
    try {
        if (cleaned.includes('Ã') || cleaned.includes('Â')) {
             cleaned = decodeURIComponent(escape(cleaned));
        }
    } catch (e) {}
    return cleaned.replaceAll('`', '');
}

// --- FORMATEO DE AUTORES ---
function formatAuthors(creators) {
    if (!creators || !Array.isArray(creators)) return '';
    return creators.map(c => {
        if (c.firstName && c.lastName) {
            return `${c.lastName}, ${c.firstName.charAt(0)}.`;
        }
        return c.name || '';
    }).join('; ');
}

export async function syncZoteroToSupabase() {
  console.log("🔄 Iniciando sincronización con Zotero...");
  
  // Pedimos los items ordenados por fecha
  const url = `https://api.zotero.org/groups/${GROUP_ID}/items/top?format=json&limit=100&sort=date`;
  
  try {
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    if (!response.ok) throw new Error("Error conectando con Zotero API");
    
    const zoteroItems = await response.json();

    // 1. Preparamos los datos nuevos
    const itemsToUpsert = zoteroItems.map(item => {
        const rawTitle = item.data.title || 'Sin título';
        const rawAbstract = item.data.abstractNote || item.data.abstract || item.data.description || '';

        return {
            zotero_id: item.key,
            title: cleanText(rawTitle),
            year: item.data.date ? item.data.date.substring(0, 4) : 'S/F',
            type: item.data.itemType,
            url: item.data.url || '',
            resumen: cleanText(rawAbstract),
            autores: cleanText(formatAuthors(item.data.creators)),
            zotero_data: item.data,
            is_visible: true,
            created_at: new Date().toISOString()
        };
    });

    // 2. Insertamos o Actualizamos (Upsert)
    const { error: upsertError } = await supabase
      .from('publicaciones')
      .upsert(itemsToUpsert, { onConflict: 'zotero_id' });

    if (upsertError) throw upsertError;

    // 3. LIMPIEZA (NUEVO): Borrar de Supabase lo que ya no existe en Zotero
    // Obtenemos la lista de IDs que acabamos de guardar (los que SÍ existen)
    const validZoteroIds = itemsToUpsert.map(i => i.zotero_id);

    if (validZoteroIds.length > 0) {
        // Borramos todo lo que NO esté en la lista de IDs válidos
        const { error: deleteError } = await supabase
            .from('publicaciones')
            .delete()
            .not('zotero_id', 'in', `(${validZoteroIds.map(id => `"${id}"`).join(',')})`); // Sintaxis especial para arrays de strings
        
        if (deleteError) console.error("Error limpiando publicaciones antiguas:", deleteError);
    }

    console.log(`Sincronización completada. ${itemsToUpsert.length} items procesados.`);
    return { success: true, count: itemsToUpsert.length };

  } catch (error) {
    console.error("Error en sincronización:", error);
    return { success: false, error };
  }
}