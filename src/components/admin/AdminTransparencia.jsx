import { useAdminCRUD } from './hooks/useAdminCRUD';
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard,
} from './components/AdminUI';

const FORM_INICIAL = {
  anio: new Date().getFullYear(),
  concurso: '', titulo: '', descripcion: '',
  director: '', participantes: '', monto: '', link_resolucion: '',
};

export default function AdminTransparencia() {
  const crud = useAdminCRUD('proyectos_adjudicados', FORM_INICIAL, {
    mensajeCreado:    '¡Proyecto creado correctamente!',
    mensajeEditado:   '¡Proyecto actualizado correctamente!',
    mensajeEliminado: 'Proyecto eliminado correctamente.',
  });

  return (
    <>
      <AdminPageHeader
        titulo="Gestión de Transparencia"
        mensaje={crud.mensaje}
        onClose={crud.limpiarMensaje}
      />

      <div className="row g-4 align-items-start">
        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4 sticky-top" style={{ top: '2rem', zIndex: 10 }}>
            <FormHeader
              idEdicion={crud.idEdicion}
              labelNuevo="Nuevo Proyecto"
              labelEditar="Editar Proyecto"
            />

            <form onSubmit={crud.handleSubmit} className="d-flex flex-column gap-3">
              <div className="row g-2">
                <div className="col-4">
                  <label className="small fw-bold text-secondary">Año</label>
                  <input type="number" className="form-control" name="anio" required
                    value={crud.form.anio} onChange={crud.handleChange} />
                </div>
                <div className="col-8">
                  <label className="small fw-bold text-secondary">Concurso / Fuente</label>
                  <input type="text" className="form-control" name="concurso" required
                    placeholder="Ej: Fondequip Mayor 2025"
                    value={crud.form.concurso} onChange={crud.handleChange} />
                </div>
              </div>

              <div>
                <label className="small fw-bold text-secondary">Título del Proyecto</label>
                <input type="text" className="form-control" name="titulo" required
                  value={crud.form.titulo} onChange={crud.handleChange} />
              </div>

              <div>
                <label className="small fw-bold text-secondary">Descripción Detallada</label>
                <textarea className="form-control" rows="5" name="descripcion" required
                  value={crud.form.descripcion} onChange={crud.handleChange} />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="small fw-bold text-secondary">Director(a)</label>
                  <input type="text" className="form-control" name="director" required
                    value={crud.form.director} onChange={crud.handleChange} />
                </div>
                <div className="col-6">
                  <label className="small fw-bold text-secondary">Monto Subsidio</label>
                  <input type="text" className="form-control" name="monto"
                    placeholder="$0.000.000"
                    value={crud.form.monto} onChange={crud.handleChange} />
                </div>
              </div>

              <div>
                <label className="small fw-bold text-secondary">Participantes (separados por coma)</label>
                <textarea className="form-control" rows="2" name="participantes"
                  value={crud.form.participantes} onChange={crud.handleChange} />
              </div>

              <div>
                <label className="small fw-bold text-secondary">Link Documentación (URL PDF)</label>
                <input type="url" className="form-control" name="link_resolucion"
                  value={crud.form.link_resolucion} onChange={crud.handleChange} />
              </div>

              <FormActions
                idEdicion={crud.idEdicion}
                loading={crud.loading}
                onCancel={crud.resetForm}
                labelGuardar="Publicar en Transparencia"
                labelEditar="Guardar Cambios"
              />
            </form>
          </div>
        </div>

        {/* ── LISTA LATERAL ── */}
        <div className="col-lg-4">
          <SidebarCard titulo="Historial" count={crud.lista.length} maxHeight="800px">
            {crud.lista.map(p => (
              <div key={p.id}
                className={`list-group-item p-3 border-bottom transition-all
                  ${crud.idEdicion === p.id ? 'bg-primary bg-opacity-10' : ''}`}
                style={crud.idEdicion === p.id ? { borderLeft: '5px solid #003767' } : { borderLeft: '5px solid transparent' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="me-2 overflow-hidden">
                    <small className="fw-bold text-uppercase d-block mb-1 text-truncate"
                      style={{ color: '#d63384', fontSize: '0.7rem' }}>
                      {p.concurso || 'Sin concurso'}
                    </small>
                    <h6 className="mb-0 fw-bold text-dark text-truncate"
                      style={{ fontSize: '0.9rem' }} title={p.titulo}>
                      {p.titulo}
                    </h6>
                  </div>
                  <ListaAcciones
                    onEdit={() => crud.handleEdit(p)}
                    onDelete={() => crud.handleDelete(p.id, '¿Eliminar este proyecto?')}
                  />
                </div>
              </div>
            ))}
            {crud.lista.length === 0 && <ListaVacia texto="No hay proyectos registrados." />}
          </SidebarCard>
        </div>
      </div>
    </>
  );
}