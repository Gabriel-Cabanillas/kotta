import Image from 'next/image'

/**
 * HeroSection — Landing page hero para KOTTA
 *
 * Composición:
 *   z-10  Título "Welcome / To Kotta" (asimétrico, el laptop lo solapa levemente)
 *   z-20  Iconos flotantes 3D (mensaje izq, folder der)
 *   z-30  Mano + MacBook al frente de todo
 *
 * Assets requeridos en /public:
 *   /mano-macbook.png   — mano sosteniendo MacBook abierta
 *   /icono-mensaje.png  — burbuja de chat 3D grafito
 *   /icono-folder.png   — carpeta 3D grafito
 *
 * Dependencias: next/image, tailwind.config.ts (tokens de KOTTA), globals.css
 * Fuente: --font-gotham inyectada desde layout.tsx via next/font/local
 */
export default function HeroSection() {
  return (
    <>
      {/* ── Keyframes self-contained ─────────────────────────── */}
      <style>{`
        @keyframes float-icon {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-12px); }
        }
        @keyframes float-icon-delayed {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-8px); }
        }
        .animate-float-icon {
          animation: float-icon 5s ease-in-out infinite;
        }
        .animate-float-icon-delayed {
          animation: float-icon-delayed 6s ease-in-out infinite;
          animation-delay: 1.2s;
        }
      `}</style>

      {/* ── Sección Hero ─────────────────────────────────────── */}
      <section
        id="inicio"
        className="relative min-h-[720px] w-full overflow-hidden bg-white sm:min-h-screen"
        aria-label="Hero — Welcome To Kotta"
      >
        <h1 className="sr-only">Kotta, software para la administración de condominios</h1>

        {/* ════════════════════════════════════════════════════
            TÍTULO PRINCIPAL  z-10
            Línea 1 "Welcome"   → centrado, ligeramente a la izquierda
            Línea 2 "To Kotta"  → desplazado a la derecha
        ════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-x-0 z-10 pointer-events-none select-none"
          data-parallax-speed="-0.035"
          style={{ top: '10vh' }}
          aria-hidden="true"
        >
          {/* Línea 1: "Welcome" */}
          <p
            className="hero-title-line font-gotham font-normal text-black leading-none tracking-tight"
            style={{
              fontSize: 'clamp(3.75rem, 13vw, 13rem)',
              letterSpacing: '-0.03em',
              textAlign: 'center',
              marginLeft: '-4vw',           /* leve sesgo izquierda */
              filter: 'drop-shadow(4px 6px 14px rgba(0,0,0,0.14))',
            }}
          >
            Welcome
          </p>

          {/* Línea 2: "To Kotta" */}
          <p
            className="hero-title-line font-gotham font-normal text-black leading-none tracking-tight"
            style={{
              fontSize: 'clamp(3.75rem, 13vw, 13rem)',
              letterSpacing: '-0.03em',
              textAlign: 'right',
              paddingRight: '2vw',          /* desplazado hacia la derecha */
              marginTop: '-0.5rem',
              filter: 'drop-shadow(4px 6px 14px rgba(0,0,0,0.14))',
            }}
          >
            To Kotta
          </p>
        </div>

        {/* ════════════════════════════════════════════════════
            ICONO FLOTANTE IZQUIERDO — burbuja de mensaje  z-20
            Cuadrante medio-izquierdo, altura de "Welcome"
        ════════════════════════════════════════════════════ */}
        <div
          className="hero-object-left absolute z-20"
          data-parallax-speed="-0.075"
          style={{
            top: 'clamp(14rem, 25vh, 22rem)',
            left: 'clamp(2rem, 7vw, 8rem)',
          }}
          aria-hidden="true"
        >
          {/* Capa exterior: rotación estática */}
          <div style={{ transform: 'rotate(12deg)' }}>
            {/* Capa interior: animación float */}
            <div className="animate-float-icon motion-reduce:animate-none">
              <Image
                src="/icono-mensaje2.png"
                alt=""
                width={120}
                height={120}
                className="h-auto w-[clamp(72px,9vw,130px)]"
                style={{
                  filter:
                    'drop-shadow(-4px 8px 16px rgba(0,0,0,0.28))',
                }}
              />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            ICONO FLOTANTE DERECHO — carpeta  z-20
            Cuadrante inferior-derecho, altura base del laptop
        ════════════════════════════════════════════════════ */}
        <div
          className="hero-object-right absolute z-20"
          data-parallax-speed="-0.045"
          style={{
            bottom: 'clamp(6rem, 18vh, 14rem)',
            right: 'clamp(2rem, 7vw, 8rem)',
          }}
          aria-hidden="true"
        >
          {/* Capa exterior: rotación estática */}
          <div style={{ transform: 'rotate(-10deg)' }}>
            {/* Capa interior: animación float con delay */}
            <div className="animate-float-icon-delayed motion-reduce:animate-none">
              <Image
                src="/icono-folder2.png"
                alt=""
                width={130}
                height={130}
                className="h-auto w-[clamp(110px,10vw,145px)]"
                style={{
                  filter:
                    'drop-shadow(4px 10px 18px rgba(0,0,0,0.3))',
                }}
              />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            MANO + MACBOOK (elemento central)  z-30
            Centrado horizontalmente, brota del borde inferior
        ════════════════════════════════════════════════════ */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30"
          data-parallax-speed="-0.02"
          aria-hidden="true"
        >
          <div className="hero-device-enter">
            <Image
              src="/mano-macbook.png"
              alt="Dashboard de KOTTA en una MacBook"
              width={860}
              height={760}
              className="w-[clamp(360px,58vw,860px)] h-auto"
              style={{ filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.18))', display: 'block', verticalAlign: 'bottom' }}
              priority
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            FRASE INFERIOR IZQUIERDA
            Itálica ligera, cuadrante inferior-izquierdo
        ════════════════════════════════════════════════════ */}
        <div
          className="hero-quote-enter absolute z-20"
          data-parallax-speed="-0.018"
          style={{
            bottom: 'clamp(5rem, 14vh, 11rem)',
            left: 'clamp(2rem, 6vw, 7rem)',
            maxWidth: 'clamp(220px, 26vw, 380px)',
          }}
          aria-label='Kotta no solo digitaliza condominios; ordena su operación diaria.'
        >
          <p
            className="font-gotham text-black leading-snug"
            style={{
              fontSize: 'clamp(0.85rem, 1.5vw, 1.15rem)',
              fontStyle: 'italic',
              fontWeight: 300,
            }}
          >
            {/* Comillas de apertura */}
            <span aria-hidden="true">"</span>
            {/* "Kotta" con mayor peso visual */}
            <span style={{ fontWeight: 500, fontStyle: 'italic' }}>Kotta</span>
            {' '}no solo digitaliza condominios;{' '}
            {/* Énfasis en la segunda parte */}
            <span style={{ fontWeight: 500, fontStyle: 'italic' }}>
              ordena su operación diaria.
            </span>
            <span aria-hidden="true">"</span>
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-40 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" aria-hidden="true" />

      </section>
    </>
  )
}
