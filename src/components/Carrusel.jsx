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

function CardSelector({ item, tipo }) {
    const [isHovered, setIsHovered] = useState(false);

    const UFRO_BLUE = "#003767";
    const UFRO_PINK = "#d63384";
    const UFRO_PINK_LIGHT = "#fff0f5";

    // --- DISEÑO PROYECTOS ---
    if (tipo === 'proyectos') {
        return (
            <article
                className="card h-100 border-0 shadow-sm w-100 overflow-hidden hover-lift"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="position-relative" style={{ height: '220px' }}>
                    <img
                        src={item.image_url || FALLBACK_IMG}
                        className="w-100 h-100 object-fit-cover transition-all"
                        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)', transition: '0.6s ease-in-out' }}
                        alt={item.title}
                        onError={(e) => { e.target.src = FALLBACK_IMG }}
                    />
                    {/* ÁREA EN PROYECTOS: Estilo "Píldora" Minimalista */}
                    <div className="position-absolute top-0 end-0 m-3">
                        <span style={{
                            backgroundColor: '#fff0f5', // El rosa sutil que te gustó
                            color: '#d63384',           // El rosa fuerte institucional
                            fontSize: '0.65rem',        // Texto bien pequeño y fino
                            fontWeight: '700',
                            padding: '3px 10px',        // Menos relleno para que sea delgado
                            borderRadius: '20px',       // Forma de píldora
                            letterSpacing: '0.5px',
                            display: 'inline-block',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.08)', // Sombra casi imperceptible
                            border: '1px solid rgba(214, 51, 132, 0.1)' // Borde muy suave
                        }}>
                            {item.area}
                        </span>
                    </div>                </div>
                <div className="card-body p-4 d-flex flex-column">
                    <h5 className="fw-bold fs-5 line-clamp-3 mb-1" // mb-1 para pegar el resumen
                        style={{
                            minHeight: '2rem', // Bajamos de 4.5 a 3.8 (suficiente para 3 líneas compactas)
                            color: isHovered ? UFRO_BLUE : '#212529',
                            transition: '0.3s',
                            lineHeight: '1.2' // Interlineado más apretado
                        }}>
                        {item.title}
                    </h5>
                    <p className="text-muted small line-clamp-3 mb-4">{item.resumen}</p>

                    <div className="mt-auto border-top pt-3 d-flex justify-content-between align-items-center">
                        <small className="text-success fw-bold">
                            <i className="bi bi-circle-fill small me-1"></i> {item.status}
                        </small>

                        {/* ENLACE INTERACTIVO: VER FICHA */}
                        <a href={`/proyectos/${item.id}`}
                            className="text-pink text-decoration-none fw-bold small stretched-link d-flex align-items-center"
                            style={{ transition: 'all 0.3s ease' }}>
                            <span style={{ transform: isHovered ? 'translateX(-3px)' : 'translateX(0)', transition: '0.3s' }}>
                                Ver ficha
                            </span>
                            <i className="bi bi-arrow-right ms-2"
                                style={{
                                    transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                                    transition: '0.3s'
                                }}></i>
                        </a>
                    </div>
                </div>

            </article>
        );
    }

    // --- DISEÑO NOTICIAS ---
    if (tipo === 'noticias') {
        return (
            <div
                className="card border-0 shadow-sm h-100 w-100 bg-white overflow-hidden hover-lift"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div style={{ height: '220px', overflow: 'hidden' }}>
                    <img
                        src={item.image_url || FALLBACK_IMG}
                        className="w-100 h-100 object-fit-cover transition-all"
                        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)', transition: '0.6s ease-in-out' }}
                        alt={item.title}
                        onError={(e) => { e.target.src = FALLBACK_IMG }}
                    />
                </div>
                <div className="card-body p-4 d-flex flex-column">
                    <div className="mb-2">
                        <small className="text-muted d-flex align-items-center" style={{ fontSize: '0.8rem' }}>
                            <i className="bi bi-calendar3 me-2 text-pink"></i>
                            {item.fecha}
                        </small>
                    </div>

                    <h5 className="fw-bold mb-3 line-clamp-3"
                        style={{ minHeight: '4.5rem', color: isHovered ? UFRO_BLUE : '#212529', transition: '0.3s', lineHeight: '1.4' }}>
                        <a href={`/noticias/${item.id}`} className="text-decoration-none stretched-link" style={{ color: 'inherit' }}>
                            {item.title}
                        </a>
                    </h5>

                    <p className="text-muted small line-clamp-3 mb-4 flex-grow-1">
                        {item.resumen}
                    </p>

                    <div className="mt-auto">
                        {/* ENLACE INTERACTIVO: LEER NOTICIA */}
                        <span className="text-pink fw-bold d-inline-flex align-items-center"
                            style={{ fontSize: '0.9rem', transition: '0.3s' }}>
                            <span style={{ transform: isHovered ? 'translateX(-3px)' : 'translateX(0)', transition: '0.3s' }}>
                                Leer noticia
                            </span>
                            <i className="bi bi-arrow-right ms-2"
                                style={{
                                    transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                                    transition: '0.3s'
                                }}></i>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}