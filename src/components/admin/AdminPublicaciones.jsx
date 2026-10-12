import { useAdminCRUD } from './hooks/useAdminCRUD';
import {
  ModalConfirmar, AdminPageHeader, FormHeader, FormActions,
  SidebarCard, ListaAcciones, ListaVacia,
} from './components/AdminUI';

const FORM_INICIAL = {
  title: '', year: '', autores: '', url: '', type: '', area: '', is_visible: true,
};

export default function AdminPublicaciones() {
  // Antes esta pantalla solo listaba lo que traía Zotero (y luego el
  // scraping de ORCID/OpenAlex) — no existía forma de agregar una
  // publicación a mano. Con useAdminCRUD (igual que el resto de los
  // paneles) ahora sí se puede: crear, editar y eliminar directamente,
  // además de lo que sigue llegando vía la bandeja de Revisión.
  const crud = useAdminCRUD('publicaciones', FORM_INICIAL, {
    ordenarPor: 'year',
    ordenAscendente: false,
    mensajeCreado: 'Publicación creada correctamente.',
    mensajeEditado: 'Publicación actualizada correctamente.',
    mensajeEliminado: 'Publicación eliminada correctamente.',
  });
  const {
    lista, form, idEdicion, loading,
    mensaje, limpiarMensaje,
    handleChange, setField, handleSubmit, handleEdit, handleDelete, resetForm, modalProps,
  } = crud;

  return (
    <div className="container-fluid p-0 mb-5">
      <ModalConfirmar {...modalProps} />
      <AdminPageHeader titulo="Gestión de Publicaciones" mensaje={mensaje} onClose={limpiarMensaje} />

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div className="card-body p-4">
              <FormHeader idEdicion={idEdicion} labelNuevo="Nueva Publicación" labelEditar="Editar Publicación" />
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Título <span className="text-danger">*</span></label>
                    <input type="text" name="title" className="form-control bg-light border-0"
                      placeholder="Título de la publicación" value={form.title} onChange={handleChange} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-secondary">Año</label>
                    <input type="number" name="year" className="form-control bg-light border-0"
                      placeholder="2026" value={form.year} onChange={handleChange} />
                  </div>
                  <div className="col-md-9">
                    <label className="form-label fw-bold small text-secondary">Autores</label>
                    <input type="text" name="autores" className="form-control bg-light border-0"
                      placeholder="Apellido, N.; Apellido, N." value={form.autores} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Enlace (DOI, repositorio, etc.)</label>
                    <input type="url" name="url" className="form-control bg-light border-0"
                      placeholder="https://doi.org/..." value={form.url} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Tipo</label>
                    <input list="datalist-categorias" name="type" className="form-control bg-light border-0"
                      placeholder="Elegir..." value={form.type} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Área Temática</label>
                    <input list="datalist-areas" name="area" className="form-control bg-light border-0"
                      placeholder="Elegir..." value={form.area} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="is_visible"
                        checked={form.is_visible} onChange={(e) => setField('is_visible', e.target.checked)} />
                      <label className="form-check-label small fw-bold text-secondary" htmlFor="is_visible">Visible en el sitio</label>
                    </div>
                  </div>
                </div>

                <FormActions
                  idEdicion={idEdicion}
                  loading={loading}
                  onCancel={resetForm}
                  labelGuardar="Crear Publicación"
                  labelEditar="Guardar Cambios"
                />
              </form>

              {/* Listas invisibles para autocompletado */}
              <datalist id="datalist-categorias">
                <option value="Revista (Journal)" />
                <option value="Congreso (Conference)" />
                <option value="Libro" />
                <option value="Capítulo de Libro" />
                <option value="Tesis" />
              </datalist>
              <datalist id="datalist-areas">
                <option value="Inteligencia Artificial" />
                <option value="Educación" />
                <option value="Salud Digital" />
                <option value="Ciencia de Datos" />
                <option value="Industria 4.0" />
              </datalist>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <SidebarCard titulo="Publicaciones" count={lista.length} maxHeight="800px">
            {lista.map((paper) => (
              <div key={paper.id}
                className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all
                  ${idEdicion === paper.id ? 'bg-primary bg-opacity-10' : ''}`}
                style={idEdicion === paper.id ? { borderLeft: '4px solid #0d6efd' } : {}}
              >
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className={`mb-0 fw-bold text-truncate small ${idEdicion === paper.id ? 'text-primary' : ''}`}>
                    {paper.title}
                  </h6>
                  <small className="text-muted d-block text-truncate">{paper.autores}</small>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '0.65rem' }}>
                      {paper.year || 's/f'}
                    </span>
                    {!paper.is_visible && (
                      <span className="badge bg-secondary-subtle text-secondary fw-normal" style={{ fontSize: '0.65rem' }}>
                        <i className="bi bi-eye-slash me-1"></i>Oculta
                      </span>
                    )}
                  </div>
                </div>
                <ListaAcciones
                  onEdit={() => handleEdit(paper)}
                  onDelete={() => handleDelete(paper.id, '¿Eliminar esta publicación?')}
                />
              </div>
            ))}
            {lista.length === 0 && <ListaVacia texto="No hay publicaciones registradas." />}
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}
