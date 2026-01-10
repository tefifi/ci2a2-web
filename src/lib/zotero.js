import { supabase } from './supabase';

const GROUP_ID = import.meta.env.PUBLIC_ZOTERO_GROUP_ID;
const API_KEY = import.meta.env.PUBLIC_ZOTERO_API_KEY;

//  Función de Limpieza 
function cleanText(text) {
    if (!text) return '';
    let cleaned = text;

    const specificFixes = {
        'Ã\\copyright': 'é', 'Ã\\pm': 'ñ', 'Ã!': 'á', 'Ã`': 'á',
        '\\&': '&', 'â€“': '-', '{': '', '}': ''
    };

    Object.keys(specificFixes).forEach(bad => {
        cleaned = cleaned.replaceAll(bad, specificFixes[bad]);
    });

    try {
        if (cleaned.includes('Ã')) {
             cleaned = decodeURIComponent(escape(cleaned));
        }
    } catch (e) {}

    cleaned = cleaned.replaceAll('`', ''); 
    return cleaned;
}

//  Función para formatear autores 
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

  // Solicitamos campos extra a Zotero
  const url = `https://api.zotero.org/groups/${GROUP_ID}/items/top?format=json&limit=100&sort=date`;
  
  try {
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    if (!response.ok) throw new Error("Error conectando con Zotero");
    
    const zoteroItems = await response.json();

    const itemsToUpsert = zoteroItems.map(item => {
        const rawTitle = item.data.title || 'Sin título';
        
        return {
            zotero_id: item.key,
            title: cleanText(rawTitle),
            year: item.data.date ? item.data.date.substring(0, 4) : 'S/F',
            type: item.data.itemType,
            url: item.data.url || '',
            resumen: item.data.abstractNote ? cleanText(item.data.abstractNote) : '',
            autores: formatAuthors(item.data.creators),
            zotero_data: item.data,
            created_at: new Date().toISOString()
        };
    });

    const { error } = await supabase
      .from('publicaciones')
      .upsert(itemsToUpsert, { onConflict: 'zotero_id' });

    if (error) throw error;

    return { success: true, count: itemsToUpsert.length };

  } catch (error) {
    console.error("Error:", error);
    return { success: false, error };
  }
}
