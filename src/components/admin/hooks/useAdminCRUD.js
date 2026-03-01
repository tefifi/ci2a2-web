import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase'; // src/lib/supabase.js
import { useMensaje } from './useMensaje';

/**
 * Hook genérico para operaciones CRUD con Supabase.
 * Elimina la duplicación de fetchDatos/handleSubmit/handleDelete en cada Admin.
 *
 * @param {string} tabla          - Nombre de la tabla en Supabase (ej: 'agenda')
 * @param {object} formInicial    - Objeto con los campos vacíos del formulario
 * @param {object} opciones       - Configuración adicional:
 *   ordenarPor       - Campo para ordenar (default: 'created_at')
 *   ordenAscendente  - Dirección del orden (default: false)
 *   campoId          - Nombre del campo ID (default: 'id')
 *   mensajeCreado    - Texto al crear exitosamente
 *   mensajeEditado   - Texto al editar exitosamente
 *   mensajeEliminado - Texto al eliminar exitosamente
 *   transformarAntes - Función para transformar datos antes de enviar a Supabase
 *
 * Uso básico:
 *   const crud = useAdminCRUD('agenda', { titulo: '', descripcion: '' });
 *
 * Con transformación (ej: fechas):
 *   const crud = useAdminCRUD('agenda', formInicial, {
 *     transformarAntes: (datos) => ({
 *       ...datos,
 *       fecha_evento: combineDateTime(datos.fecha_inicio, datos.hora_inicio),
 *     })
 *   });
 */
export function useAdminCRUD(tabla, formInicial, opciones = {}) {
  const {
    ordenarPor = 'created_at',
    ordenAscendente = false,
    campoId = 'id',
    mensajeCreado = '¡Registro creado correctamente!',
    mensajeEditado = '¡Registro actualizado correctamente!',
    mensajeEliminado = 'Registro eliminado correctamente.',
    transformarAntes = null,
  } = opciones;

  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [idEdicion, setIdEdicion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const { mensaje, mostrarMensaje, limpiarMensaje } = useMensaje();

  useEffect(() => {
    fetchDatos();
  }, []);

  // ─── FETCH ────────────────────────────────────────────────────────────────
  const fetchDatos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tabla)
        .select('*')
        .order(ordenarPor, { ascending: ordenAscendente });
      if (error) throw error;
      setLista(data || []);
    } catch (error) {
      console.error(`[useAdminCRUD] Error al cargar ${tabla}:`, error);
      mostrarMensaje('danger', 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  // ─── FORM HANDLERS ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Para actualizar un campo directamente (rich text, dropzone, selects custom, etc.)
  const setField = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // ─── SUBMIT (CREATE / UPDATE) ─────────────────────────────────────────────
  const handleSubmit = async (e, datosExtra = {}) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);

    try {
      let datos = { ...form, ...datosExtra };
      if (transformarAntes) datos = transformarAntes(datos);

      if (idEdicion) {
        const { error } = await supabase.from(tabla).update(datos).eq(campoId, idEdicion);
        if (error) throw error;
        mostrarMensaje('success', mensajeEditado);
      } else {
        const { error } = await supabase.from(tabla).insert([datos]);
        if (error) throw error;
        mostrarMensaje('success', mensajeCreado);
      }

      resetForm();
      await fetchDatos();
    } catch (error) {
      console.error(`[useAdminCRUD] Error al guardar en ${tabla}:`, error);
      mostrarMensaje('danger', error.message || 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  // ─── EDIT ─────────────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setForm({ ...formInicial, ...item });
    setIdEdicion(item[campoId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── DELETE ───────────────────────────────────────────────────────────────
  const handleDelete = async (id, confirmMsg = '¿Estás seguro de eliminar este registro?') => {
    if (!window.confirm(confirmMsg)) return;
    try {
      const { error } = await supabase.from(tabla).delete().eq(campoId, id);
      if (error) throw error;
      mostrarMensaje('success', mensajeEliminado);
      await fetchDatos();
    } catch (error) {
      console.error(`[useAdminCRUD] Error al eliminar en ${tabla}:`, error);
      mostrarMensaje('danger', 'Error al eliminar.');
    }
  };

  // ─── RESET ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(formInicial);
    setIdEdicion(null);
  };

  return {
    lista, form, idEdicion, loading, subiendo,
    setSubiendo, mensaje, limpiarMensaje,
    fetchDatos, handleChange, setField,
    handleSubmit, handleEdit, handleDelete,
    resetForm, setForm, setIdEdicion,
  };
}