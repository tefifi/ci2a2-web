import { useRef } from 'react';
import { useAdminCRUD }   from './hooks/useAdminCRUD';
import { useImageUpload } from './hooks/useImageUpload';
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard, ImageUploadZone,
} from './components/AdminUI';
import { RichEditor } from './components/RichEditor';

const FORM_INICIAL = {
  title: '', resumen: '', description: '', area: '', status: '',
  image_url: '', fecha_inicio: '', fecha_termino: '',
  link_externo: '', socios: [], financiamiento: [],
};

// ─── MiniUpload — logo/ícono pequeño para socios y financiamiento ─────────────
function MiniUpload({ image, onUpload, onDelete }) {
  const ref = useRef(null);
  return (
    <div className="flex-shrink-0 position-relative" style={{ width: 40, height: 40 }}>
      <input type="file" hidden ref={ref} accept="image/*"
        onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
      {image ? (
        <>
          <img src={image} className="w-100 h-100 rounded object-fit-contain border bg-white" alt="Logo" />
          <button type="button" onClick={onDelete}
            className="btn btn-danger p-0 rounded-circle position-absolute top-0 end-0 translate-middle shadow-sm"
            style={{ width: 16, height: 16, fontSize: 8 }}>✕</button>
        </>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="btn btn-light border w-100 h-100 p-0 d-flex align-items-center justify-content-center text-muted">
          <i className="bi bi-plus"></i>
        </button>
      )}
    </div>
  );
}

export default function AdminProyectos() {
  const crud = useAdminCRUD('proyectos', FORM_INICIAL, {
    ordenarPor: 'id',
    mensajeCreado:    '¡Proyecto creado correctamente!',
    mensajeEditado:   '¡Proyecto actualizado correctamente!',
    mensajeEliminado: 'Proyecto eliminado correctamente.',
    transformarAntes: (datos) => ({
      ...datos,
      fecha_inicio:  datos.fecha_inicio  || null,
      fecha_termino: datos.fecha_termino || null,
      link_externo:  datos.link_externo  || null,
    }),
  });

  const { subiendo, uploadImage } = useImageUpload('proyectos', 'proy_');

  const handleUploadPortada = async (file) => {
    const url = await uploadImage(file);
    if (url) crud.setField('image_url', url);
    else crud.mostrarMensaje?.('danger', 'Error al subir imagen');
  };

  const handleUploadItem = async (campo, index, file) => {
    const url = await uploadImage(file);
    if (!url) return;
    const nueva = [...crud.form[campo]];
    nueva[index].imagen = url;
    crud.setField(campo, nueva);
  };

  // ─── Socios / Financiamiento helpers ──────────────────────────────────────
  const agregarItem = (campo) =>
    crud.setField(campo, [...crud.form[campo], { nombre: '', imagen: '', url: '' }]);

  const eliminarItem = (campo, index) =>
    crud.setField(campo, crud.form[campo].filter((_, i) => i !== index));

  const updateItem = (campo, index, key, value) => {
    const nueva = [...crud.form[campo]];
    nueva[index][key] = value;
    crud.setField(campo, nueva);
  };

  const renderItemList = (campo, labelBtn) => (
    <div className="bg-light p-3 rounded border h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="fw-bold text-dark small mb-0">{labelBtn}</label>
        <button type="button" className="btn btn-sm btn-link p-0 fw-bold"
          onClick={() => agregarItem(campo)}>+ Añadir</button>
      </div>
      <div className="d-flex flex-column gap-2">
        {crud.form[campo].map((item, i) => (
          <div key={i} className="bg-white p-2 rounded border shadow-sm position-relative">
            <button type="button"
              className="btn btn-sm text-danger position-absolute top-0 end-0 m-1 p-0"
              style={{ lineHeight: 1 }} onClick={() => eliminarItem(campo, i)}>×</button>
            <div className="d-flex align-items-center gap-2 mb-2">
              <MiniUpload
                image={item.imagen}
                onUpload={(file) => handleUploadItem(campo, i, file)}
                onDelete={() => updateItem(campo, i, 'imagen', '')}
              />
              <input type="text" className="form-control form-control-sm border-0 bg-light"
                placeholder="Nombre" value={item.nombre}
                onChange={(e) => updateItem(campo, i, 'nombre', e.target.value)} />
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-0">
                <i className="bi bi-link-45deg"></i>
              </span>
              <input type="text" className="form-control form-control-sm border-0 bg-light text-secondary"
                placeholder="URL opcional" value={item.url || ''}
                onChange={(e) => updateItem(campo, i, 'url', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <AdminPageHeader
        titulo="Gestión de Proyectos"
        mensaje={crud.mensaje}
        onClose={crud.limpiarMensaje}
      />

      <div className="row g-4">
        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <form onSubmit={crud.handleSubmit} className="card p-4 shadow-sm border-0" id="form-top">
            <FormHeader
              idEdicion={crud.idEdicion}
              labelNuevo="Nuevo Proyecto"
              labelEditar="Editar Proyecto"
            />

            <div className="row mb-3">
              {/* Portada */}
              <div className="col-md-5 mb-3 mb-md-0">
                <ImageUploadZone
                  image={crud.form.image_url}
                  onUpload={handleUploadPortada}
                  onRemove={() => crud.setField('image_url', '')}
                  subiendo={subiendo}
                  variante="cuadrado"
                  label="Portada"
                  required
                />
              </div>

              {/* Datos principales */}
              <div className="col-md-7">
                <div className="mb-2">
                  <label className="form-label fw-bold small text-secondary">
                    Título <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control fw-bold" name="title" required
                    placeholder="Nombre del proyecto"
                    value={crud.form.title} onChange={crud.handleChange} />
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label fw-bold small text-secondary">
                      Área <span className="text-danger">*</span>
                    </label>
                    <input list="areas-options" className="form-control" name="area" required
                      placeholder="Seleccionar..." value={crud.form.area} onChange={crud.handleChange} />
                    <datalist id="areas-options">
                      <option value="Energía" /><option value="Tecnología" />
                      <option value="Medio Ambiente" /><option value="Educación" />
                    </datalist>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small text-secondary">
                      Estado <span className="text-danger">*</span>
                    </label>
                    <input list="status-options" className="form-control" name="status" required
                      placeholder="Seleccionar..." value={crud.form.status} onChange={crud.handleChange} />
                    <datalist id="status-options">
                      <option value="En curso" /><option value="Finalizado" />
                      <option value="En planificación" />
                    </datalist>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label fw-bold small text-secondary">Inicio</label>
                    <input type="date" className="form-control" name="fecha_inicio"
                      value={crud.form.fecha_inicio || ''} onChange={crud.handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small text-secondary">Término</label>
                    <input type="date" className="form-control" name="fecha_termino"
                      value={crud.form.fecha_termino || ''} onChange={crud.handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="mb-3">
              <label className="form-label fw-bold small text-secondary">Resumen (Tarjeta)</label>
              <textarea className="form-control small" name="resumen" rows="2" maxLength={150}
                placeholder="Máx 150 caracteres..."
                value={crud.form.resumen} onChange={crud.handleChange} />
            </div>

            {/* Link externo */}
            <div className="mb-3">
              <div className="card bg-light border-0">
                <div className="card-body py-2">
                  <label className="form-label fw-bold text-secondary small mb-1">
                    <i className="bi bi-link-45deg me-1"></i>Enlace del Proyecto (Opcional)
                  </label>
                  <input type="url" className="form-control form-control-sm" name="link_externo"
                    placeholder="https://..." value={crud.form.link_externo || ''}
                    onChange={crud.handleChange} />
                </div>
              </div>
            </div>

            {/* Editor */}
            <RichEditor
              value={crud.form.description}
              onChange={(html) => crud.setField('description', html)}
              bucket="proyectos"
              label="Descripción Detallada"
              required
              minHeight="300px"
              onMensaje={crud.mostrarMensaje}
            />

            {/* Socios y Financiamiento */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">{renderItemList('socios', 'Socios')}</div>
              <div className="col-md-6">{renderItemList('financiamiento', 'Financiamiento')}</div>
            </div>

            <FormActions
              idEdicion={crud.idEdicion}
              loading={crud.loading || subiendo}
              onCancel={crud.resetForm}
              labelGuardar="Crear Proyecto"
              labelEditar="Guardar Cambios"
            />
          </form>
        </div>

        {/* ── LISTA LATERAL ── */}
        <div className="col-lg-4">
          <SidebarCard titulo="Historial" count={crud.lista.length} maxHeight="600px">
            {crud.lista.map(p => (
              <div key={p.id}
                className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all
                  ${crud.idEdicion === p.id ? 'bg-primary bg-opacity-10' : ''}`}
                style={crud.idEdicion === p.id ? { borderLeft: '4px solid #0d6efd' } : {}}
              >
                <div style={{ width: 80, height: 50 }}
                  className="rounded overflow-hidden bg-light flex-shrink-0">
                  {p.image_url && <img src={p.image_url} className="w-100 h-100 object-fit-cover" alt="" />}
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className={`mb-0 fw-bold text-truncate small ${crud.idEdicion === p.id ? 'text-primary' : ''}`}>
                    {p.title}
                  </h6>
                  <small className="text-muted">{p.fecha_inicio || 'Sin fecha'}</small>
                </div>
                <ListaAcciones
                  onEdit={() => crud.handleEdit(p)}
                  onDelete={() => crud.handleDelete(p.id, '¿Borrar este proyecto?')}
                />
              </div>
            ))}
            {crud.lista.length === 0 && <ListaVacia texto="No hay proyectos registrados." />}
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}