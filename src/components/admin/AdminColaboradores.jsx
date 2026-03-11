import { useAdminCRUD }   from './hooks/useAdminCRUD';
import { useImageUpload } from './hooks/useImageUpload';
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard, ImageUploadZone,
  ModalConfirmar,
} from './components/AdminUI';

const FORM_INICIAL = {
  nombre: '', cargo: '', profesion: '', facultad: '',
  email: '', bio: '', foto_url: '', linkedin: '',
};

export default function AdminColaboradores() {
  const crud = useAdminCRUD('colaboradores', FORM_INICIAL, {
    ordenarPor: 'id',
    ordenAscendente: true,
    mensajeCreado:    '¡Colaborador añadido con éxito!',
    mensajeEditado:   '¡Colaborador actualizado correctamente!',
    mensajeEliminado: 'Colaborador eliminado.',
    transformarAntes: (datos) => ({
      ...datos,
      linkedin: datos.linkedin || null,
      email:    datos.email    || null,
    }),
  });

  const { subiendo, uploadImage } = useImageUpload('fotos', 'colab_');

  const handleUploadFoto = async (file) => {
    const url = await uploadImage(file);
    if (url) crud.setField('foto_url', url);
    else crud.mostrarMensaje?.('danger', 'Error al subir la foto.');
  };

  return (
    <>
      <ModalConfirmar {...crud.modalProps} />
      <div className="container py-4">
      <AdminPageHeader
        titulo="Gestión de Colaboradores"
        mensaje={crud.mensaje}
        onClose={crud.limpiarMensaje}
      />

      <div className="row g-4 align-items-stretch">
        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 bg-white h-100" id="form-top">
            <div className="card-body p-4">
              <FormHeader
                idEdicion={crud.idEdicion}
                labelNuevo="Nuevo Integrante"
                labelEditar="Editar Integrante"
              />

              <form onSubmit={crud.handleSubmit}>
                <div className="row g-4">
                  {/* Avatar */}
                  <div className="col-md-4 d-flex align-items-center justify-content-center">
                    <ImageUploadZone
                      image={crud.form.foto_url}
                      onUpload={handleUploadFoto}
                      onRemove={() => crud.setField('foto_url', '')}
                      subiendo={subiendo}
                      variante="avatar"
                      label="Foto de perfil"
                      mostrarBotonX={false}   
                    />
                  </div>

                  {/* Campos */}
                  <div className="col-md-8">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary">
                          Nombre Completo <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" name="nombre" required
                          placeholder="Ej. Dra. Ana Pérez"
                          value={crud.form.nombre} onChange={crud.handleChange} />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary">
                          Cargo / Rol <span className="text-danger">*</span>
                        </label>
                        <input type="text" className="form-control" name="cargo" required
                          placeholder="Ej. Investigadora Principal"
                          value={crud.form.cargo} onChange={crud.handleChange} />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Carrera / Profesión</label>
                        <input type="text" className="form-control" name="profesion"
                          placeholder="Ej. Ing. Civil Informática"
                          value={crud.form.profesion} onChange={crud.handleChange} />
                        <div className="form-text" style={{ fontSize: '0.7rem' }}>Clave para los gráficos.</div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Facultad</label>
                        <input type="text" className="form-control" name="facultad"
                          placeholder="Ej. Fac. de Ingeniería"
                          value={crud.form.facultad} onChange={crud.handleChange} />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Email</label>
                        <input type="email" className="form-control" name="email"
                          placeholder="correo@institucion.cl"
                          value={crud.form.email} onChange={crud.handleChange} />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">LinkedIn (URL)</label>
                        <input type="url" className="form-control" name="linkedin"
                          placeholder="https://linkedin.com/in/..."
                          value={crud.form.linkedin} onChange={crud.handleChange} />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary">Breve Biografía</label>
                        <textarea className="form-control" name="bio" rows="3"
                          placeholder="Descripción corta del perfil profesional..."
                          value={crud.form.bio} onChange={crud.handleChange}></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <FormActions
                  idEdicion={crud.idEdicion}
                  loading={crud.loading || subiendo}
                  onCancel={crud.resetForm}
                  labelGuardar="Añadir al Equipo"
                  labelEditar="Guardar Cambios"
                />
              </form>
            </div>
          </div>
        </div>

        {/* ── LISTA LATERAL ── */}
        <div className="col-lg-4">
          <SidebarCard titulo="Equipo Actual" count={crud.lista.length} maxHeight="600px">
            {crud.lista.map(c => (
              <div key={c.id}
                className={`list-group-item d-flex align-items-center gap-3 p-3 transition-all
                  ${crud.idEdicion === c.id ? 'bg-primary bg-opacity-10' : ''}`}
                style={crud.idEdicion === c.id ? { borderLeft: '4px solid #0d6efd' } : {}}
              >
                {/* Avatar miniatura */}
                <div style={{ width: 40, height: 40 }} className="flex-shrink-0">
                  {c.foto_url
                    ? <img src={c.foto_url} className="w-100 h-100 rounded-circle object-fit-cover border" alt={c.nombre} />
                    : <div className="w-100 h-100 rounded-circle bg-light border d-flex align-items-center justify-content-center text-secondary fw-bold small">
                        {c.nombre?.charAt(0)}
                      </div>
                  }
                </div>

                <div className="flex-grow-1 lh-1 overflow-hidden">
                  <h6 className={`mb-1 fs-6 fw-bold ${crud.idEdicion === c.id ? 'text-primary' : 'text-dark'}`}>
                    {c.nombre}
                  </h6>
                  <small className="text-muted d-block text-truncate" style={{ fontSize: '0.8rem', maxWidth: 180 }}>
                    {c.cargo}
                    {c.profesion && <span className="text-primary opacity-75"> • {c.profesion}</span>}
                  </small>
                </div>

                <ListaAcciones
                  onEdit={() => crud.handleEdit(c)}
                  onDelete={() => crud.handleDelete(c.id, '¿Eliminar colaborador?')}
                />
              </div>
            ))}
            {crud.lista.length === 0 && <ListaVacia texto="No hay integrantes registrados." />}
          </SidebarCard>
        </div>
      </div>
      </div>
    </>
  );
}