import { useState, useRef, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useConfirmar — hook para modal de confirmación
// Uso: const { confirmar, modalProps } = useConfirmar();
//      <ModalConfirmar {...modalProps} />
//      const ok = await confirmar({ titulo, descripcion });
// ─────────────────────────────────────────────────────────────────────────────
export function useConfirmar() {
  const [estado, setEstado] = useState(null);

  const confirmar = useCallback((opciones = {}) => {
    return new Promise((resolve) => {
      setEstado({
        titulo:         opciones.titulo         ?? '¿Eliminar registro?',
        descripcion:    opciones.descripcion    ?? 'Esta acción no se puede deshacer.',
        labelConfirmar: opciones.labelConfirmar ?? 'Sí, eliminar',
        resolve,
      });
    });
  }, []);

  const responder = (valor) => {
    estado?.resolve(valor);
    setEstado(null);
  };

  return {
    confirmar,
    modalProps: {
      estado,
      onConfirmar: () => responder(true),
      onCancelar:  () => responder(false),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ModalConfirmar — ventana de confirmación antes de eliminar
// ─────────────────────────────────────────────────────────────────────────────
export function ModalConfirmar({ estado, onConfirmar, onCancelar }) {
  useEffect(() => {
    if (!estado) return;
    const handler = (e) => { if (e.key === 'Escape') onCancelar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [estado, onCancelar]);

  if (!estado) return null;

  return (
    <>
      <div
        onClick={onCancelar}
        style={{
          position: 'fixed', inset: 0, zIndex: 1055,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeInBackdrop 0.18s ease',
        }}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1056,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          maxWidth: '420px', width: '100%',
          animation: 'slideUpModal 0.2s ease', overflow: 'hidden',
        }}>
          <div style={{ height: '5px', background: 'linear-gradient(90deg, #dc3545, #e85d6a)' }} />
          <div style={{ padding: '2rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#fff0f0', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '1.25rem',
            }}>
              <i className="bi bi-trash3-fill" style={{ fontSize: '1.5rem', color: '#dc3545' }}></i>
            </div>
            <h5 style={{ fontWeight: 700, color: '#212529', marginBottom: '0.5rem' }}>
              {estado.titulo}
            </h5>
            <p style={{ color: '#6c757d', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              {estado.descripcion}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onCancelar}
                style={{
                  flex: 1, padding: '0.6rem 1rem', borderRadius: '8px',
                  border: '1.5px solid #dee2e6', background: '#fff',
                  fontWeight: 600, color: '#495057', cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirmar}
                style={{
                  flex: 1, padding: '0.6rem 1rem', borderRadius: '8px',
                  border: 'none', background: 'linear-gradient(135deg, #dc3545, #c82333)',
                  fontWeight: 600, color: '#fff', cursor: 'pointer',
                  fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(220,53,69,0.35)',
                }}
              >
                <i className="bi bi-trash3 me-2"></i>
                {estado.labelConfirmar}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInBackdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUpModal   { from { opacity: 0; transform: translateY(20px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// AdminAlert
// Reemplaza el bloque {mensaje && <div className="alert...">} en cada Admin
//
// Uso: <AdminAlert mensaje={mensaje} onClose={limpiarMensaje} />
// ─────────────────────────────────────────────────────────────────────────────
export function AdminAlert({ mensaje, onClose }) {
  if (!mensaje) return null;

  const icono =
    mensaje.tipo === 'success' ? 'bi-check-circle-fill' :
      mensaje.tipo === 'info' ? 'bi-info-circle-fill' :
        'bi-exclamation-triangle-fill';

  return (
    <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show shadow-sm border-0 mb-4`}>
      <i className={`bi ${icono} me-2`}></i>
      {mensaje.texto}
      <button type="button" className="btn-close" onClick={onClose}></button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminSpinner
// Reemplaza el spinner de carga copiado en cada Admin
//
// Uso: {loading && <AdminSpinner texto="Cargando datos..." />}
// ─────────────────────────────────────────────────────────────────────────────
export function AdminSpinner({ texto = 'Cargando...' }) {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-2 text-muted small">{texto}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminPageHeader
// Título de página + alerta, patrón que se repite en todos los Admin
//
// Uso:
//   <AdminPageHeader titulo="Gestión de Agenda"
//     mensaje={mensaje} onClose={limpiarMensaje} />
// ─────────────────────────────────────────────────────────────────────────────
export function AdminPageHeader({ titulo, mensaje, onClose }) {
  return (
    <div className="mb-4">
      <h2 className="fw-bold" style={{ color: '#003767' }}>{titulo}</h2>
      <AdminAlert mensaje={mensaje} onClose={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FormHeader
// Encabezado del card formulario (Nuevo / Editar) con ícono
//
// Uso:
//   <FormHeader idEdicion={idEdicion}
//     labelNuevo="Nuevo Evento" labelEditar="Editar Evento" />
// ─────────────────────────────────────────────────────────────────────────────
export function FormHeader({
  idEdicion,
  labelNuevo = 'Nuevo Registro',
  labelEditar = 'Editar Registro',
}) {
  return (
    <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
      <i
        className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}
        style={{ color: '#003767' }}
      ></i>
      {idEdicion ? labelEditar : labelNuevo}
    </h5>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FormActions
// Botones Guardar / Cancelar del formulario
//
// Uso:
//   <FormActions idEdicion={idEdicion} loading={loading} onCancel={resetForm}
//     labelGuardar="Agendar Evento" labelEditar="Guardar Cambios" />
// ─────────────────────────────────────────────────────────────────────────────
export function FormActions({
  idEdicion,
  loading = false,
  onCancel,
  labelGuardar = 'Crear Registro',
  labelEditar = 'Guardar Cambios',
}) {
  return (
    <div className="d-flex gap-2 mt-4 pt-3 border-top">
      <button
        type="submit"
        className="btn btn-primary fw-bold px-4 flex-grow-1"
        style={{ background: '#003767', border: 'none' }}
        disabled={loading}
      >
        {loading ? (
          <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
        ) : (
          idEdicion ? labelEditar : labelGuardar
        )}
      </button>
      {idEdicion && (
        <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>
          Cancelar
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ListaAcciones
// Par de botones Editar / Eliminar en cada fila de la lista lateral
//
// Uso:
//   <ListaAcciones
//     onEdit={() => handleEdit(item)}
//     onDelete={() => handleDelete(item.id)} />
// ─────────────────────────────────────────────────────────────────────────────
export function ListaAcciones({ onEdit, onDelete, orientacion = 'row' }) {
  const claseContenedor =
    orientacion === 'column' ? 'd-flex flex-column gap-1' : 'd-flex gap-1';

  return (
    <div className={claseContenedor}>
      <button
        onClick={onEdit}
        className="btn btn-sm btn-light text-primary border-0"
        title="Editar"
      >
        <i className="bi bi-pencil"></i>
      </button>
      <button
        onClick={onDelete}
        className="btn btn-sm btn-light text-danger border-0"
        title="Eliminar"
      >
        <i className="bi bi-trash"></i>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ListaVacia
// Mensaje cuando no hay registros en la lista
//
// Uso: {lista.length === 0 && <ListaVacia texto="No hay eventos." />}
// ─────────────────────────────────────────────────────────────────────────────
export function ListaVacia({ texto = 'No hay registros.' }) {
  return (
    <div className="p-4 text-center text-muted small">{texto}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SidebarCard
// Wrapper del panel lateral derecho (Historial / lista)
//
// Uso:
//   <SidebarCard titulo="Historial" count={lista.length} maxHeight="600px">
//     {lista.map(...)}
//   </SidebarCard>
// ─────────────────────────────────────────────────────────────────────────────
export function SidebarCard({
  titulo = 'Historial',
  count,
  maxHeight = '600px',
  children,
}) {
  return (
    <div
      className="card shadow-sm border-0 bg-white h-100 d-flex flex-column"
      style={{ minHeight: 0 }}
    >
      <div className="card-header bg-white border-bottom py-3">
        <h6 className="mb-0 fw-bold text-secondary">
          {titulo} {count !== undefined && `(${count})`}
        </h6>
      </div>
      <div className="card-body p-0" style={{ maxHeight, overflowY: 'auto' }}>
        <div className="list-group list-group-flush">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageUploadZone
// Zona drag & drop / paste / click para subir imágenes.
// Unifica los distintos UploadZone y AvatarUpload que existían en cada Admin.
//
// Props:
//   image    - URL actual de la imagen
//   onUpload - función(file) llamada al seleccionar imagen
//   onRemove - función llamada al hacer clic en eliminar
//   subiendo - boolean, muestra spinner mientras sube
//   variante - 'banner' (horizontal 21/9) | 'avatar' (círculo) | 'cuadrado' (1/1)
//   label    - texto del label (default: 'Imagen')
//   required - boolean
//   hint     - texto de ayuda (ej: 'Recomendado: 1280×600 px')
//
// Uso:
//   // Portada horizontal
//   <ImageUploadZone image={form.imagen_url} onUpload={handleUpload}
//     onRemove={() => setField('imagen_url', '')} subiendo={subiendo}
//     variante="banner" label="Portada del Evento" hint="1280×600 px" />
//
//   // Avatar circular
//   <ImageUploadZone image={form.foto_url} onUpload={handleUpload}
//     onRemove={() => setField('foto_url', '')} subiendo={subiendo}
//     variante="avatar" label="Foto de perfil" />
// ─────────────────────────────────────────────────────────────────────────────
export function ImageUploadZone({
  image,
  onUpload,
  onRemove,
  subiendo = false,
  variante = 'banner',
  label = 'Imagen',
  required = false,
  hint = '',
  mostrarBotonX = true,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const esAvatar = variante === 'avatar';



  // Soporte para pegar imagen desde portapapeles (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (
        ['INPUT', 'TEXTAREA'].includes(e.target.tagName) ||
        e.target.isContentEditable
      ) return;

      for (const item of e.clipboardData.items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          onUpload(item.getAsFile());
          return;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onUpload]);



  const estiloContenedor = esAvatar
    ? { width: '160px', height: '160px', borderRadius: '50%' }
    : {
      width: '100%',
      aspectRatio: variante === 'cuadrado' ? '1/1' : '21/9',
      maxHeight: '300px',
      borderRadius: '12px',
    };

  const estiloBorde = {
    ...estiloContenedor,
    borderStyle: image ? 'solid' : 'dashed',
    borderWidth: '2px',
    cursor: image ? 'default' : 'pointer',
    borderColor: isDragging ? '#0d6efd' : '#dee2e6',
  };

return (
    <div className={`d-flex flex-column ${esAvatar ? 'align-items-center' : ''} mb-3`}>
      {label && (
        <label className="form-label fw-bold small text-secondary">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div
        className={`position-relative overflow-hidden d-flex align-items-center justify-content-center
          ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
        style={estiloBorde}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file?.type.startsWith('image/')) onUpload(file);
        }}
        onClick={() => !image && fileInputRef.current?.click()}
      >
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])}
        />

        {subiendo ? (
          <div className="d-flex flex-column align-items-center text-primary">
            <div className="spinner-border spinner-border-sm mb-2"></div>
            <p className="small fw-bold mb-0">Subiendo...</p>
          </div>
        ) : image ? (
          <>
            <img
              src={image}
              className="w-100 h-100 object-fit-cover"
              alt="Preview"
              style={esAvatar ? { borderRadius: '50%' } : {}}
            />

            {/* El botón ahora está DENTRO del condicional de 'image' y usa position-absolute */}
            {mostrarBotonX && (
              <button
                type="button"
                className="btn btn-danger btn-sm position-absolute border-0 shadow-sm"
                style={{ 
                  top: '10px', 
                  right: '10px', 
                  width: '32px', 
                  height: '32px', 
                  zIndex: 10,
                  borderRadius: esAvatar ? '50%' : '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onRemove(); 
                }}
                title="Eliminar imagen"
              >
                <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
              </button>
            )}
          </>
        ) : (
          <div className="d-flex flex-column align-items-center text-muted text-center p-3">
            <i className={`bi ${isDragging ? 'bi-cloud-upload-fill text-primary' : esAvatar ? 'bi-camera-fill' : 'bi-card-image'} display-4 mb-2 opacity-50`}></i>
            <p className="small mb-0 fw-bold">{isDragging ? 'Suelta aquí' : 'Arrastra, pega o haz clic'}</p>
            {hint && <p className="small mb-0 opacity-75">{hint}</p>}
          </div>
        )}
      </div>

      {/* Botón de texto inferior (Solo si es avatar y no quieres la X encima) */}
      {esAvatar && image && !mostrarBotonX && (
        <button
          type="button"
          className="btn btn-link text-danger text-decoration-none btn-sm fw-bold p-0 mt-2"
          onClick={onRemove}
        >
          <i className="bi bi-trash me-1"></i>Eliminar foto
        </button>
      )}
    </div>
  );
}