import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

const breakpoints = {
    320: { slidesPerView: 1, spaceBetween: 20 },
    768: { slidesPerView: 2, spaceBetween: 20 },
    1024: { slidesPerView: 3, spaceBetween: 24 },
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=800&auto=format&fit=crop";

// Texto que acompaña a la flecha en el pie de cada tarjeta.
// Para cambiarlo, edita solo estas dos líneas.
const ETIQUETA_PROYECTO = 'Ver ficha';
const ETIQUETA_NOTICIA = 'Leer noticia';

// Píldora de estado del proyecto: mismas clases que la tarjeta de la vista
// /proyectos (getStatusStyle en src/pages/proyectos/index.astro), para que se
// vea igual en la portada.
const getEstadoPildora = (status) => {
    if (!status) return { className: 'bg-light text-secondary border-secondary' };
    const s = status.toLowerCase();
    if (s.includes('curso') || s.includes('activo') || s.includes('desarrollo'))
        return { className: 'bg-success bg-opacity-10 text-success border-success' };
    if (s.includes('finalizado') || s.includes('terminado'))
        return { className: 'bg-secondary bg-opacity-10 text-secondary border-secondary' };
    if (s.includes('plan') || s.includes('diseño'))
        return { className: 'bg-warning bg-opacity-10 text-dark border-warning' };
    return {
        className: '',
        style: {
            backgroundColor: 'rgba(0, 55, 103, 0.1)',
            color: 'var(--ufro-blue)',
            border: '1px solid var(--ufro-blue)',
        },
    };
};

/**
 * @param {{ datos?: any[], banners?: any[], tipo?: string }} props
 */
export default function Carrusel({ datos = [], banners = [], tipo = "generico" }) {
    const items = datos.length > 0 ? datos : banners;
    if (!items || items.length === 0) return null;

    return (
        <div className="w-100">
            <Swiper
                modules={[Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                loop={items.length > 1}
                grabCursor={true}
                breakpoints={breakpoints}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                style={{ paddingBottom: '20px' }}
            >
                {items.map((item, index) => (
                    <SwiperSlide key={index} className="h-auto d-flex align-items-stretch">
                        <CardSelector item={item} tipo={tipo} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}

// Pie de la tarjeta: etiqueta + flecha circular (igual que la vista /proyectos).
function PieTarjeta({ etiqueta, isHovered }) {
    return (
        <div className="mt-auto pt-2 border-top border-light w-100 d-flex justify-content-end align-items-center gap-2">
            <span
                className="fw-bold"
                style={{
                    fontSize: '0.75rem',
                    color: isHovered ? 'var(--ufro-pink)' : '#6c757d',
                    transition: 'color 0.3s ease',
                }}
            >
                {etiqueta}
            </span>
            <span
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                    width: '32px',
                    height: '32px',
                    border: '1.5px solid var(--ufro-pink)',
                    color: isHovered ? '#fff' : 'var(--ufro-pink)',
                    backgroundColor: isHovered ? 'var(--ufro-pink)' : 'transparent',
                    boxShadow: isHovered ? '0 4px 10px rgba(214, 51, 132, 0.3)' : 'none',
                    transition: 'all 0.3s ease',
                }}
            >
                <i
                    className="bi bi-arrow-right"
                    style={{
                        fontSize: '1rem',
                        display: 'inline-block',
                        transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease',
                    }}
                ></i>
            </span>
        </div>
    );
}

function CardSelector({ item, tipo }) {
    const [isHovered, setIsHovered] = useState(false);

    if (tipo !== 'proyectos' && tipo !== 'noticias') return null;

    const esProyecto = tipo === 'proyectos';
    const href = esProyecto ? `/proyectos/${item.id}` : `/noticias/${item.id}`;
    const estado = esProyecto ? getEstadoPildora(item.status) : null;

    return (
        <article
            className="card h-100 border-0 shadow-sm w-100 bg-white rounded-4 overflow-hidden hover-lift"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* IMAGEN 16:9 — en proyectos, la píldora de área va sobre la imagen */}
            <div className="position-relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img
                    src={item.image_url || FALLBACK_IMG}
                    className="w-100 h-100 object-fit-cover"
                    style={{
                        objectPosition: esProyecto ? `50% ${item.image_position ?? 50}%` : undefined,
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                        transition: '0.6s ease-in-out',
                    }}
                    alt={item.title}
                    onError={(e) => { e.target.src = FALLBACK_IMG }}
                />
                {esProyecto && item.area && (
                    <div className="position-absolute top-0 end-0 m-2">
                        {/* Misma píldora que la tarjeta de la vista /proyectos */}
                        <span
                            className="badge bg-white text-dark shadow-sm fw-bold px-2 py-1 rounded-2 small"
                            style={{ fontSize: '0.65rem', opacity: 0.95 }}
                        >
                            {item.area}
                        </span>
                    </div>
                )}
            </div>

            <div className="card-body p-3 d-flex flex-column">
                {/* FILA: fecha (solo si existe) a la izquierda, estado a la derecha */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                    {item.fecha && (
                        <div
                            className="text-muted small fw-bold text-uppercase d-flex align-items-center gap-2"
                            style={{ fontSize: '0.7rem' }}
                        >
                            <i className="bi bi-calendar3 text-pink"></i>
                            {item.fecha}
                        </div>
                    )}
                    {esProyecto && (
                        <span
                            className={`badge ms-auto border border-opacity-25 rounded-pill fw-bold ${estado.className}`}
                            style={{ fontSize: '0.6rem', letterSpacing: '0.5px', ...estado.style }}
                        >
                            {item.status || 'Proyecto'}
                        </span>
                    )}
                </div>

                <h5
                    className="fw-bold mb-2 lh-sm line-clamp-3"
                    style={{
                        fontSize: '1.1rem',
                        color: isHovered ? 'var(--ufro-blue)' : '#212529',
                        transition: 'color 0.3s ease',
                    }}
                >
                    <a href={href} className="text-decoration-none stretched-link" style={{ color: 'inherit' }}>
                        {item.title}
                    </a>
                </h5>

                <p
                    className="text-secondary small line-clamp-3 mb-3 flex-grow-1"
                    style={{ lineHeight: '1.5', fontSize: '0.85rem' }}
                >
                    {item.resumen}
                </p>

                <PieTarjeta etiqueta={esProyecto ? ETIQUETA_PROYECTO : ETIQUETA_NOTICIA} isHovered={isHovered} />
            </div>
        </article>
    );
}