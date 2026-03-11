import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useMensaje } from './useMensaje';

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

  const [lista, setLista]       = useState([]);
  const [form, setForm]         = useState(formInicial);
  const [idEdicion, setIdEdicion] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  // ── Modal de confirmación (estado interno, sin useConfirmar externo) ────────
  const [modalEstado, setModalEstado] = useState(null);
  const callbackRef = useRef(null);

  const modalProps = {
    estado: modalEstado,
    onConfirmar: () => {
      setModalEstado(null);
      callbackRef.current?.();
      callbackRef.current = null;
    },
    onCancelar: () => {
      setModalEstado(null);
      callbackRef.current = null;
    },
  };

  const { mensaje, mostrarMensaje, limpiarMensaje } = useMensaje();

  const fetchDatos = useCallback(async () => {
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
  }, [tabla, ordenarPor, ordenAscendente]);

  useEffect(() => { fetchDatos(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const setField = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

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
        // Limpiar id y created_at antes de insertar
        const { id, created_at, ...sinMeta } = datos;
        const { error } = await supabase.from(tabla).insert([sinMeta]);
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

  const handleEdit = (item) => {
    setForm({ ...formInicial, ...item });
    setIdEdicion(item[campoId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── handleDelete abre el modal y ejecuta el callback al confirmar ───────────
  const handleDelete = (id, mensaje = '¿Eliminar este registro?') => {
    callbackRef.current = async () => {
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
    setModalEstado({
      titulo: mensaje,
      descripcion: 'Esta acción no se puede deshacer.',
      labelConfirmar: 'Sí, eliminar',
    });
  };

  const resetForm = () => {
    setForm(formInicial);
    setIdEdicion(null);
  };

  return {
    lista, form, idEdicion, loading, subiendo,
    setSubiendo, mensaje, limpiarMensaje, mostrarMensaje,
    fetchDatos, handleChange, setField,
    handleSubmit, handleEdit, handleDelete,
    resetForm, setForm, setIdEdicion,
    modalProps,
  };
}