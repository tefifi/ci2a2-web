import { useState } from 'react';
import { useAdminCRUD }   from './hooks/useAdminCRUD';
import { useImageUpload } from './hooks/useImageUpload';
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard, ImageUploadZone,
  ModalConfirmar,
} from './components/AdminUI';

const TIPOS_ROL = [
  'Investigador',
  'Investigador Asociado',
  'Científico',
  'Profesional',
  'Postdoc',
  'Profesor Distinguido',
  'Investigador Visitante',
  'Staff',
];

const FORM_INICIAL = {
  nombre: '', cargo: '', tipo_rol: 'Staff',
  profesion: '', facultad: '', institucion: '',
  jerarquia: '', area_investigacion: '', grupos_trabajo: '',
  titulo_academico: '',
  email: '', telefono: '', oficina: '',
  bio: '', foto_url: '',
  linkedin: '', github: '', orcid: '',
  google_scholar: '', researchgate: '',
  orden: '',
};

export default function AdminColaboradores() {
  const [tabActiva, setTabActiva] = useState('basico');

  const crud = useAdminCRUD('colaboradores', FORM_INICIAL, {
    ordenarPor: 'orden',
    ordenAscendente: true,
    mensajeCreado:    '¡Colaborador añadido con éxito!',
    mensajeEditado:   '¡Colaborador actualizado correctamente!',
    mensajeEliminado: 'Colaborador eliminado.',
    transformarAntes: (datos) => ({
      ...datos,
      linkedin:       datos.linkedin       || null,
      email:          datos.email          || null,
      telefono:       datos.telefono       || null,
      github:         datos.github         || null,
      orcid:          datos.orcid          || null,
      google_scholar: datos.google_scholar || null,
      researchgate:   datos.researchgate   || null,
      orden:          datos.orden ? parseInt(datos.orden) : 99,
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

        <div className="row g-4 align-items-start">
          {/* ── FORMULARIO ── */}
          <div className="col-lg-8">
            <div className="card shadow-sm border-0 bg-white" id="form-top">
              <div className="card-body p-4">
                <FormHeader
                  idEdicion={crud.idEdicion}
                  labelNuevo="Nuevo Integrante"
                  labelEditar="Editar Integrante"
                />

                <form onSubmit={crud.handleSubmit}>

                  {/* Foto + nombre + tipo arriba */}
                  <div className="row g-4 mb-4">
                    <div className="col-md-3 d-flex align-items-center justify-content-center">
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
                    <div className="col-md-9">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label small fw-bold text-secondary">
                            Nombre Completo <span className="text-danger">*</span>
                          </label>
                          <input type="text" className="form-control fw-bold" name="nombre" required
                            placeholder="Ej. Dra. Ana Pérez"
                            value={crud.form.nombre} onChange={crud.handleChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">
                            Tipo / Categoría <span className="text-danger">*</span>
                          </label>
                          <select className="form-select" name="tipo_rol" required
                            value={crud.form.tipo_rol} onChange={crud.handleChange}>
                            {TIPOS_ROL.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">Cargo / Título interno</label>
                          <input type="text" className="form-control" name="cargo"
                            placeholder="Ej. Director, Investigador Principal"
                            value={crud.form.cargo} onChange={crud.handleChange} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-secondary">Orden de aparición</label>
                          <input type="number" className="form-control" name="orden" min="1"
                            placeholder="1, 2, 3..."
                            value={crud.form.orden} onChange={crud.handleChange} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <ul className="nav nav-tabs mb-3 flex-wrap">
                    {[
                      { id: 'basico',    label: 'Básico',     icon: 'bi-person' },
                      { id: 'academico', label: 'Académico',  icon: 'bi-mortarboard' },
                      { id: 'bio',       label: 'Biografía',  icon: 'bi-file-text' },
                      { id: 'contacto',  label: 'Contacto',   icon: 'bi-link-45deg' },
                    ].map(tab => (
                      <li className="nav-item" key={tab.id}>
                        <button type="button"
                          className={`nav-link ${tabActiva === tab.id ? 'active fw-bold' : 'text-muted'}`}
                          onClick={() => setTabActiva(tab.id)}>
                          <i className={`bi ${tab.icon} me-1`}></i>{tab.label}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Tab Básico */}
                  {tabActiva === 'basico' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Carrera / Profesión</label>
                        <input type="text" className="form-control" name="profesion"
                          placeholder="Ej. Ing. Civil Informática"
                          value={crud.form.profesion} onChange={crud.handleChange} />
                        <div className="form-text" style={{ fontSize: '0.7rem' }}>Usado para los gráficos del centro.</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Facultad / Departamento</label>
                        <input type="text" className="form-control" name="facultad"
                          placeholder="Ej. Fac. de Ingeniería"
                          value={crud.form.facultad} onChange={crud.handleChange} />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary">Institución</label>
                        <input type="text" className="form-control" name="institucion"
                          placeholder="Ej. Universidad de La Frontera"
                          value={crud.form.institucion} onChange={crud.handleChange} />
                      </div>
                    </div>
                  )}

                  {/* Tab Académico */}
                  {tabActiva === 'academico' && (
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary">Título Académico / Formación</label>
                        <textarea className="form-control" name="titulo_academico" rows={3}
                          placeholder={"PhD in Applied Mathematics, Université Paris (2010)\nIngeniero Civil en Computación, UFRO (2005)"}
                          value={crud.form.titulo_academico} onChange={crud.handleChange} />
                        <div className="form-text" style={{ fontSize: '0.7rem' }}>Un título por línea.</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Jerarquía Académica</label>
                        <input type="text" className="form-control" name="jerarquia"
                          placeholder="Ej. Profesor Titular"
                          value={crud.form.jerarquia} onChange={crud.handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Área de Investigación</label>
                        <textarea className="form-control" name="area_investigacion" rows={3}
                          placeholder={"Una área por línea:\nCriptografía\nMatemáticas Discretas\nSeguridad de la Información"}
                          value={crud.form.area_investigacion} onChange={crud.handleChange} />
                        <div className="form-text">Una área por línea (Enter para separar)</div>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary">Grupos de Trabajo / Labs</label>
                        <textarea className="form-control" name="grupos_trabajo" rows={3}
                          placeholder={"Un grupo por línea:\nCI²A² Digital Health\nCI²A² Networks"}
                          value={crud.form.grupos_trabajo} onChange={crud.handleChange} />
                        <div className="form-text">Un grupo por línea (Enter para separar)</div>
                      </div>
                    </div>
                  )}

                  {/* Tab Biografía */}
                  {tabActiva === 'bio' && (
                    <div>
                      <label className="form-label small fw-bold text-secondary">
                        Biografía / Intereses de Investigación
                      </label>
                      <textarea className="form-control" name="bio" rows={10}
                        placeholder="Describe el perfil académico, intereses de investigación, proyectos, etc."
                        value={crud.form.bio} onChange={crud.handleChange} />
                      <div className="form-text" style={{ fontSize: '0.7rem' }}>
                        Se mostrará en el perfil público. Puede incluir HTML básico ({`<p>, <strong>, <em>`}).
                      </div>
                    </div>
                  )}

                  {/* Tab Contacto & Links */}
                  {tabActiva === 'contacto' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Email</label>
                        <input type="email" className="form-control" name="email"
                          placeholder="correo@ufro.cl"
                          value={crud.form.email} onChange={crud.handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">Teléfono</label>
                        <input type="text" className="form-control" name="telefono"
                          placeholder="+56 2 xxxx xxxx"
                          value={crud.form.telefono} onChange={crud.handleChange} />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-bold text-secondary">Oficina</label>
                        <input type="text" className="form-control" name="oficina"
                          placeholder="525"
                          value={crud.form.oficina} onChange={crud.handleChange} />
                      </div>
                      <div className="col-12">
                        <hr className="my-1" />
                        <p className="small fw-bold text-secondary mb-2">Perfiles Académicos</p>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          <i className="bi bi-github me-1"></i>GitHub
                        </label>
                        <input type="url" className="form-control" name="github"
                          placeholder="https://github.com/usuario" value={crud.form.github} onChange={crud.handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          <i className="bi bi-linkedin me-1"></i>LinkedIn
                        </label>
                        <input type="url" className="form-control" name="linkedin"
                          placeholder="https://linkedin.com/in/..." value={crud.form.linkedin} onChange={crud.handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">
                          <i className="bi bi-mortarboard me-1"></i>Google Scholar
                        </label>
                        <input type="url" className="form-control" name="google_scholar"
                          placeholder="https://scholar.google.com/..." value={crud.form.google_scholar} onChange={crud.handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">
                          <i className="bi bi-person-badge me-1"></i>ORCID (solo ID)
                        </label>
                        <input type="text" className="form-control" name="orcid"
                          placeholder="0000-0000-0000-0000" value={crud.form.orcid} onChange={crud.handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">
                          <i className="bi bi-graph-up me-1"></i>ResearchGate
                        </label>
                        <input type="url" className="form-control" name="researchgate"
                          placeholder="https://researchgate.net/profile/..." value={crud.form.researchgate} onChange={crud.handleChange} />
                      </div>
                    </div>
                  )}

                  <FormActions
                    idEdicion={crud.idEdicion}
                    loading={crud.loading || subiendo}
                    onCancel={() => { crud.resetForm(); setTabActiva('basico'); }}
                    labelGuardar="Añadir al Equipo"
                    labelEditar="Guardar Cambios"
                  />
                </form>
              </div>
            </div>
          </div>

          {/* ── LISTA LATERAL ── */}
          <div className="col-lg-4">
            <SidebarCard titulo="Equipo Actual" count={crud.lista.length} maxHeight="700px">
              {crud.lista.map(c => (
                <div key={c.id}
                  className={`list-group-item d-flex align-items-center gap-3 p-3
                    ${crud.idEdicion === c.id ? 'bg-primary bg-opacity-10' : ''}`}
                  style={crud.idEdicion === c.id ? { borderLeft: '4px solid #0d6efd' } : {}}
                >
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
                    <small className="text-muted d-block" style={{ fontSize: '0.78rem' }}>
                      <span className="badge rounded-pill me-1"
                        style={{ fontSize: '0.65rem', background: 'var(--ufro-blue-soft)', color: 'var(--ufro-blue)' }}>
                        {c.tipo_rol || 'Staff'}
                      </span>
                      <span className="text-truncate">{c.cargo}</span>
                    </small>
                  </div>
                  <ListaAcciones
                    onEdit={() => { crud.handleEdit(c); setTabActiva('basico'); }}
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