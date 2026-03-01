import { useRef, Suspense, lazy } from 'react';
import { supabase } from '../../../lib/supabase'; // src/lib/supabase.js

const Editor = lazy(() =>
  import('react-simple-wysiwyg').then(m => ({ default: m.default || m }))
);

/**
 * RichEditor — Editor de texto enriquecido con toolbar completa.
 *
 * Unifica las toolbars idénticas de AdminNoticias y AdminProyectos,
 * y puede usarse en cualquier Admin que necesite texto con formato.
 *
 * Incluye:
 *   - Deshacer / Rehacer
 *   - Tamaño de texto (Párrafo, Título Grande, Medio, Pequeño)
 *   - Negrita, Itálica, Subrayado, Quitar formato
 *   - Lista de puntos, Lista numérica, Insertar enlace
 *   - Alineación (izquierda, centro, derecha, justificado)
 *   - Insertar imagen (click o pegar Ctrl+V)
 *   - Ajuste de imagen (flotar izquierda / derecha)
 *
 * Props:
 *   value         - HTML actual del campo (string)
 *   onChange      - función(nuevoHTML) llamada al editar
 *   bucket        - bucket de Supabase Storage para imágenes (ej: 'noticias-img')
 *   minHeight     - altura mínima del área de texto (default: '300px')
 *   label         - etiqueta sobre el editor (default: 'Contenido')
 *   required      - boolean
 *   onMensaje     - función(tipo, texto) para mostrar alertas del Admin padre
 *
 * Uso:
 *   <RichEditor
 *     value={form.cuerpo}
 *     onChange={(html) => setField('cuerpo', html)}
 *     bucket="noticias-img"
 *     label="Cuerpo de la Noticia"
 *     onMensaje={mostrarMensaje}
 *   />
 */
export function RichEditor({
  value,
  onChange,
  bucket,
  minHeight = '300px',
  label = 'Contenido',
  required = false,
  onMensaje,
}) {
  const imageInputRef = useRef(null);
  // Ref al contenedor del editor de ESTA instancia específica,
  // evita el bug de document.querySelector('.rsw-ce') que afectaba
  // a todos los editores del panel al mismo tiempo.
  const editorContainerRef = useRef(null);

  // Obtiene el elemento editable SOLO dentro de este editor
  const getEditorEl = () => editorContainerRef.current?.querySelector('.rsw-ce') ?? null;

  // ─── Helpers internos ──────────────────────────────────────────────────────
  const execCmd = (command, val = null) => {
    document.execCommand(command, false, val);
    getEditorEl()?.focus();
  };

  const createLink = () => {
    const url = prompt('Ingresa la URL del enlace:');
    if (url) execCmd('createLink', url);
  };

  const floatImage = (side) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const node = selection.anchorNode;
    const img = node?.nodeName === 'IMG' ? node
      : node?.querySelector?.('img') ?? null;

    if (img) {
      img.style.float = side;
      img.style.margin = side === 'left' ? '0 15px 15px 0' : '0 0 15px 15px';
      // Sincronizar HTML usando la ref de ESTA instancia, no querySelector global
      const editorEl = getEditorEl();
      if (editorEl) onChange(editorEl.innerHTML);
    } else {
      onMensaje?.('info', 'Selecciona una imagen primero.');
    }
  };

  const insertImage = (url) => {
    const tag = `<img src="${url}" alt="imagen" style="max-width:100%;border-radius:8px;margin:10px 0;" /><br/>`;
    onChange((value || '') + tag);
  };

  // ─── Subida de imagen al bucket ────────────────────────────────────────────
  const uploadImageToBucket = async (file) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageFile = async (file) => {
    if (!file || !bucket) return;
    onMensaje?.('info', 'Subiendo imagen...');
    try {
      const url = await uploadImageToBucket(file);
      insertImage(url);
      onMensaje?.('success', 'Imagen insertada.');
    } catch {
      onMensaje?.('danger', 'Error al subir la imagen.');
    }
  };

  // ─── Pegar imagen con Ctrl+V ───────────────────────────────────────────────
  const handlePaste = async (e) => {
    if (!bucket) return;
    for (const item of e.clipboardData?.items ?? []) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        await handleImageFile(item.getAsFile());
        return;
      }
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mb-3">
      {/* Ocultar toolbar nativa del editor */}
      <style>{`.rsw-toolbar { display: none !important; }`}</style>

      {label && (
        <label className="form-label fw-bold small text-secondary">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {/* ── TOOLBAR PERSONALIZADA ── */}
      <div className="d-flex flex-wrap align-items-center gap-1 p-1 bg-light border rounded-top border-bottom-0">

        {/* Deshacer / Rehacer */}
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }} title="Deshacer">
          <i className="bi bi-arrow-counterclockwise"></i>
        </button>
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }} title="Rehacer">
          <i className="bi bi-arrow-clockwise"></i>
        </button>

        <div className="vr mx-1"></div>

        {/* Tamaño de texto */}
        <select
          className="form-select form-select-sm border text-secondary"
          style={{ width: 'auto' }}
          defaultValue=""
          onChange={(e) => { execCmd('formatBlock', e.target.value); e.target.value = ''; }}
          title="Formato de párrafo"
        >
          <option value="" disabled hidden>Formato...</option>
          <option value="p">Normal</option>
          <option value="h2">Título grande</option>
          <option value="h3">Título medio</option>
          <option value="h4">Título pequeño</option>
          <option value="blockquote">Cita</option>
        </select>

        <div className="vr mx-1"></div>

        {/* Negrita / Itálica / Subrayado / Limpiar */}
        <button type="button" className="btn btn-sm btn-light border fw-bold"
          onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} title="Negrita (Ctrl+B)">B</button>
        <button type="button" className="btn btn-sm btn-light border fst-italic"
          onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} title="Itálica (Ctrl+I)">I</button>
        <button type="button" className="btn btn-sm btn-light border text-decoration-underline"
          onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} title="Subrayado (Ctrl+U)">U</button>
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }} title="Quitar formato">
          <i className="bi bi-eraser"></i>
        </button>

        <div className="vr mx-1"></div>

        {/* Listas y enlace */}
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} title="Lista de puntos">
          <i className="bi bi-list-ul"></i>
        </button>
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} title="Lista numerada">
          <i className="bi bi-list-ol"></i>
        </button>
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); createLink(); }} title="Insertar enlace">
          <i className="bi bi-link"></i>
        </button>

        <div className="vr mx-1"></div>

        {/* Alineación */}
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} title="Alinear izquierda">
          <i className="bi bi-text-left"></i>
        </button>
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} title="Centrar">
          <i className="bi bi-text-center"></i>
        </button>
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} title="Alinear derecha">
          <i className="bi bi-text-right"></i>
        </button>
        <button type="button" className="btn btn-sm btn-light border"
          onMouseDown={(e) => { e.preventDefault(); execCmd('justifyFull'); }} title="Justificar">
          <i className="bi bi-justify"></i>
        </button>

        {/* Imágenes (solo si hay bucket) */}
        {bucket && (
          <>
            <div className="vr mx-1"></div>
            <input
              type="file"
              hidden
              ref={imageInputRef}
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) handleImageFile(e.target.files[0]);
                e.target.value = null;
              }}
            />
            <button type="button" className="btn btn-sm btn-light border"
              onClick={() => imageInputRef.current?.click()} title="Insertar imagen">
              <i className="bi bi-image text-primary"></i>
            </button>
            <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Ajuste:</span>
            <button type="button" className="btn btn-sm btn-light border"
              onMouseDown={(e) => { e.preventDefault(); floatImage('left'); }} title="Imagen izquierda">
              <i className="bi bi-layout-text-window-reverse"></i>
            </button>
            <button type="button" className="btn btn-sm btn-light border"
              onMouseDown={(e) => { e.preventDefault(); floatImage('right'); }} title="Imagen derecha">
              <i className="bi bi-layout-text-window"></i>
            </button>
          </>
        )}
      </div>

      {/* ── ÁREA DE TEXTO — ref específica de esta instancia ── */}
      <div
        ref={editorContainerRef}
        className="border rounded-bottom bg-white overflow-hidden"
        onPaste={handlePaste}
      >
        <Suspense fallback={<div className="p-3 text-center text-muted">Cargando editor...</div>}>
          <Editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            containerProps={{ style: { minHeight } }}
          />
        </Suspense>
      </div>

      <div className="form-text" style={{ fontSize: '0.7rem' }}>
        Puedes pegar imágenes directamente con Ctrl+V dentro del editor.
      </div>
    </div>
  );
}