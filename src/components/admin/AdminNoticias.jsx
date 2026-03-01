import { useAdminCRUD }   from './hooks/useAdminCRUD';
import { useImageUpload } from './hooks/useImageUpload';
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard, ImageUploadZone,
} from './components/AdminUI';
import { RichEditor } from './components/RichEditor';

const FORM_INICIAL = { titulo: '', bajada: '', cuerpo: '', fecha: '', image_url: '' };

export default function AdminNoticias() {
  const crud = useAdminCRUD('noticias', FORM_INICIAL, {
    ordenarPor: 'fecha',
    mensajeCreado:    '¡Noticia creada correctamente!',
    mensajeEditado:   '¡Noticia actualizada correctamente!',
    mensajeEliminado: 'Noticia eliminada correctamente.',
  });

  const { subiendo, uploadImage } = useImageUpload('noticias-img', 'noticia_');

  const handleUploadPortada = async (file) => {
    const url = await uploadImage(file);
    if (url) crud.setField('image_url', url);
    else crud.mostrarMensaje?.('danger', 'Error al subir imagen');
  };

  return (
    <div>
      <AdminPageHeader
        titulo="Gestión de Noticias"
        mensaje={crud.mensaje}
        onClose={crud.limpiarMensaje}
      />

      <div className="row g-4">
        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <form onSubmit={crud.handleSubmit} className="card p-4 shadow-sm border-0" id="form-top">
            <FormHeader
              idEdicion={crud.idEdicion}
              labelNuevo="Nueva Noticia"
              labelEditar="Editar Noticia"
            />

            <ImageUploadZone
              image={crud.form.image_url}
              onUpload={handleUploadPortada}
              onRemove={() => crud.setField('image_url', '')}
              subiendo={subiendo}
              variante="banner"
              label="Imagen Portada"
              required
            />

            <div className="mb-3">
              <label className="form-label fw-bold small text-secondary">
                Título <span className="text-danger">*</span>
              </label>
              <input className="form-control fw-bold" name="titulo" required
                placeholder="Ingrese título de la noticia"
                value={crud.form.titulo} onChange={crud.handleChange} />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small text-secondary">
                Bajada o Resumen (Máx. 300 caracteres)
              </label>
              <textarea className="form-control small" name="bajada" rows="2" maxLength="300"
                placeholder="Breve resumen..."
                value={crud.form.bajada} onChange={crud.handleChange} />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small text-secondary">
                Fecha de Publicación <span className="text-danger">*</span>
              </label>
              <input type="date" className="form-control" name="fecha" required
                value={crud.form.fecha} onChange={crud.handleChange} />
            </div>

            <RichEditor
              value={crud.form.cuerpo}
              onChange={(html) => crud.setField('cuerpo', html)}
              bucket="noticias-img"
              label="Cuerpo de la Noticia"
              required
              minHeight="400px"
              onMensaje={crud.mostrarMensaje}
            />

            <FormActions
              idEdicion={crud.idEdicion}
              loading={crud.loading || subiendo}
              onCancel={crud.resetForm}
              labelGuardar="Publicar Noticia"
              labelEditar="Guardar Cambios"
            />
          </form>
        </div>

        {/* ── LISTA LATERAL ── */}
        <div className="col-lg-4">
          <SidebarCard titulo="Historial" count={crud.lista.length} maxHeight="600px">
            {crud.lista.map(n => (
              <div key={n.id}
                className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all
                  ${crud.idEdicion === n.id ? 'bg-primary bg-opacity-10' : ''}`}
                style={crud.idEdicion === n.id ? { borderLeft: '4px solid #0d6efd' } : {}}
              >
                <div style={{ width: 80, height: 50 }}
                  className="rounded overflow-hidden bg-light flex-shrink-0">
                  {n.image_url && <img src={n.image_url} className="w-100 h-100 object-fit-cover" alt="" />}
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className={`mb-0 fw-bold text-truncate small ${crud.idEdicion === n.id ? 'text-primary' : ''}`}>
                    {n.titulo}
                  </h6>
                  <small className="text-muted">{n.fecha}</small>
                </div>
                <ListaAcciones
                  onEdit={() => crud.handleEdit(n)}
                  onDelete={() => crud.handleDelete(n.id, '¿Eliminar esta noticia?')}
                />
              </div>
            ))}
            {crud.lista.length === 0 && <ListaVacia texto="No hay noticias registradas." />}
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}