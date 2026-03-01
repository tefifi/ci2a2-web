import { useState } from 'react';
import { supabase } from '../../../lib/supabase'; // src/lib/supabase.js

/**
 * Hook para subir imágenes a Supabase Storage.
 * Reemplaza las funciones handleUpload/uploadImage duplicadas en cada Admin.
 *
 * @param {string} bucket  - Nombre del bucket en Supabase Storage (ej: 'agenda', 'fotos')
 * @param {string} prefijo - Prefijo para el nombre del archivo  (ej: 'agenda_', 'colab_')
 *
 * Uso:
 *   const { subiendo, uploadImage } = useImageUpload('agenda', 'agenda_');
 *
 *   const handleUpload = async (file) => {
 *     const url = await uploadImage(file);
 *     if (url) crud.setField('imagen_url', url);
 *     else      crud.mostrarMensaje('danger', 'Error al subir imagen');
 *   };
 */
export function useImageUpload(bucket, prefijo = '') {
  const [subiendo, setSubiendo] = useState(false);

  const uploadImage = async (file) => {
    if (!file) return null;
    setSubiendo(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${prefijo}${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error(`[useImageUpload] Error subiendo a bucket "${bucket}":`, error);
      return null;
    } finally {
      setSubiendo(false);
    }
  };

  return { subiendo, uploadImage };
}