import { supabase } from './supabase';

const GROUP_ID = import.meta.env.PUBLIC_ZOTERO_GROUP_ID;
const API_KEY = import.meta.env.PUBLIC_ZOTERO_API_KEY;

// --- FUNCIÓN DE LIMPIEZA MAESTRA ---
function cleanText(text) {
    if (!text) return '';
    let cleaned = text;

    const specificFixes = {
        // Errores clásicos de Zotero/LaTeX
        'Ã\\copyright': 'é', 'Ã\\pm': 'ñ', 'Ã!': 'á', 'Ã`': 'á',
        '\\&': '&', 'â€“': '-', '{': '', '}': '',
        '\\"': '', "\\'": '', '\\`': '',
        'Á\\-': 'í',    
        'Áp': 'ñ',     
        'Ã.': 'Á.',     
        'Ã,': 'Á,'      
    };

    // Aplicar correcciones manuales
    Object.keys(specificFixes).forEach(bad => {
        cleaned = cleaned.replaceAll(bad, specificFixes[bad]);
    });

    // Intentar arreglar UTF-8 roto automáticamente (Ã± -> ñ)
    try {
        if (cleaned.includes('Ã') || cleaned.includes('Â')) {
             cleaned = decodeURIComponent(escape(cleaned));
        }
    } catch (e) {}

    cleaned = cleaned.replaceAll('`', ''); 
    return cleaned;
}

// --- FORMATEO DE AUTORES ---
function formatAuthors(creators) {
    if (!creators || !Array.isArray(creators)) return '';
    return creators.map(c => {
        if (c.firstName && c.lastName) {
            // Formato: Apellido, Inicial.
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

    const itemsToUpsert = zoteroItems.map(item => {
        const rawTitle = item.data.title || 'Sin título';
        // Buscamos el resumen en varios lugares posibles para asegurar que guardamos algo
        const rawAbstract = item.data.abstractNote || item.data.abstract || item.data.description || '';

        return {
            zotero_id: item.key,
            title: cleanText(rawTitle), // ¡Título limpio al guardar!
            year: item.data.date ? item.data.date.substring(0, 4) : 'S/F',
            type: item.data.itemType,
            url: item.data.url || '',
            resumen: cleanText(rawAbstract), // ¡Resumen limpio al guardar!
            autores: cleanText(formatAuthors(item.data.creators)), // ¡Autores limpios y formateados!
            zotero_data: item.data, // Guardamos la data cruda por seguridad
            is_visible: true, // Asumimos visible por defecto
            created_at: new Date().toISOString()
        };
    });

    const { error } = await supabase
      .from('publicaciones')
      .upsert(itemsToUpsert, { onConflict: 'zotero_id' });

    if (error) throw error;

    console.log(`✅ Sincronización completada. ${itemsToUpsert.length} items procesados.`);
    return { success: true, count: itemsToUpsert.length };

  } catch (error) {
    console.error("❌ Error en sincronización:", error);
    return { success: false, error };
  }
}