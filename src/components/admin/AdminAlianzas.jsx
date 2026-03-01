import { useMemo } from 'react';
import { useAdminCRUD }   from './hooks/useAdminCRUD';
import { useImageUpload } from './hooks/useImageUpload';
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard, ImageUploadZone,
} from './components/AdminUI';

const FORM_INICIAL = {
  nombre: '', tipo_entidad: '', estado_convenio: '',
  pais: '', link_web: '', logo_url: '', fecha_firma: '',
};

export default function AdminAlianzas() {
  const crud = useAdminCRUD('alianzas', FORM_INICIAL, {
    ordenarPor: 'nombre',
    ordenAscendente: true,
    mensajeCreado:    'Registro creado exitosamente.',
    mensajeEditado:   'Registro actualizado correctamente.',
    mensajeEliminado: 'Registro eliminado correctamente.',
  });

  const { subiendo, uploadImage } = useImageUpload('contrapartes', 'logo_');

  const handleUploadLogo = async (file) => {
    const url = await uploadImage(file);
    if (url) crud.setField('logo_url', url);
    else crud.mostrarMensaje?.('danger', 'Error al subir el logo.');
  };

  const sugerencias = useMemo(() => {
    const tipos   = new Set(['Clientes', 'Alianzas', 'Ecosistema', 'Universidades Socias']);
    const estados = new Set(['Acuerdo de Cooperación', 'Contrato de Servicios']);
    const paises  = new Set(['Chile', 'Perú', 'México', 'Estados Unidos', 'España', 'China']);
    crud.lista.forEach(a => {
      if (a.tipo_entidad)    tipos.add(a.tipo_entidad);
      if (a.estado_convenio) estados.add(a.estado_convenio);
      if (a.pais)            paises.add(a.pais);
    });
    return { tipos: [...tipos].sort(), estados: [...estados].sort(), paises: [...paises].sort() };
  }, [crud.lista]);

  return (
    <div className="container-fluid p-0">
      <AdminPageHeader
        titulo="Gestión de Alianzas y Clientes"
        mensaje={crud.mensaje}
        onClose={crud.limpiarMensaje}
      />

      <div className="row g-4">
        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <form onSubmit={crud.handleSubmit} className="card p-4 shadow-sm border-0 h-100" id="form-top">
            <FormHeader
              idEdicion={crud.idEdicion}
              labelNuevo="Nuevo Registro"
              labelEditar="Editar Registro"
            />

            <div className="row g-4">
              {/* Logo */}
              <div className="col-md-3">
                <ImageUploadZone
                  image={crud.form.logo_url}
                  onUpload={handleUploadLogo}
                  onRemove={() => crud.setField('logo_url', '')}
                  subiendo={subiendo}
                  variante="cuadrado"
                  label="Logo"
                  required
                />
              </div>

              {/* Campos */}
              <div className="col-md-9">
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">
                    Nombre de la Entidad <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control fw-bold" name="nombre" required
                    placeholder="Ej: Microsoft, Universidad de Chile..."
                    value={crud.form.nombre} onChange={crud.handleChange} />
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Categoría</label>
                    <input className="form-control" list="listTipos" name="tipo_entidad"
                      placeholder="Seleccionar..." value={crud.form.tipo_entidad} onChange={crud.handleChange} />
                    <datalist id="listTipos">
                      {sugerencias.tipos.map((t, i) => <option key={i} value={t} />)}
                    </datalist>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Tipo de Convenio</label>
                    <input className="form-control" list="listEstados" name="estado_convenio"
                      placeholder="Ej: Acuerdo Marco" value={crud.form.estado_convenio} onChange={crud.handleChange} />
                    <datalist id="listEstados">
                      {sugerencias.estados.map((e, i) => <option key={i} value={e} />)}
                    </datalist>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">País</label>
                    <input className="form-control" list="listPaises" name="pais"
                      placeholder="Ej: Chile" value={crud.form.pais} onChange={crud.handleChange} />
                    <datalist id="listPaises">
                      {sugerencias.paises.map((p, i) => <option key={i} value={p} />)}
                    </datalist>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Fecha de Firma</label>
                    <input type="date" className="form-control" name="fecha_firma"
                      value={crud.form.fecha_firma} onChange={crud.handleChange} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Sitio Web</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white text-muted">https://</span>
                      <input type="text" className="form-control" name="link_web"
                        placeholder="www.susitio.com" value={crud.form.link_web} onChange={crud.handleChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <FormActions
              idEdicion={crud.idEdicion}
              loading={crud.loading || subiendo}
              onCancel={crud.resetForm}
              labelGuardar="Registrar Entidad"
              labelEditar="Guardar Cambios"
            />
          </form>
        </div>

        {/* ── LISTA LATERAL ── */}
        <div className="col-lg-4">
          <SidebarCard titulo="Historial" count={crud.lista.length} maxHeight="85vh">
            {crud.lista.map(item => (
              <div key={item.id}
                className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all
                  ${crud.idEdicion === item.id ? 'bg-primary bg-opacity-10' : ''}`}
                style={{
                  cursor: 'pointer',
                  borderLeft: crud.idEdicion === item.id ? '4px solid #003767' : '4px solid transparent',
                }}
                onClick={() => crud.handleEdit(item)}
              >
                <div className="rounded bg-white border d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 50, height: 50 }}>
                  {item.logo_url
                    ? <img src={item.logo_url} className="w-100 h-100 object-fit-contain p-1" alt="" />
                    : <span className="fw-bold text-muted">{item.nombre.charAt(0)}</span>
                  }
                </div>

                <div className="flex-grow-1 overflow-hidden">
                  <h6 className={`mb-0 fw-bold text-truncate ${crud.idEdicion === item.id ? 'text-primary' : 'text-dark'}`}>
                    {item.nombre}
                  </h6>
                  <small className="text-muted text-truncate d-block">
                    {item.tipo_entidad || 'Sin Clasificar'}
                  </small>
                </div>

                <ListaAcciones
                  onEdit={() => crud.handleEdit(item)}
                  onDelete={(e) => { e?.stopPropagation?.(); crud.handleDelete(item.id, '¿Eliminar este registro?'); }}
                />
              </div>
            ))}
            {crud.lista.length === 0 && <ListaVacia texto="Sin registros aún." />}
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}