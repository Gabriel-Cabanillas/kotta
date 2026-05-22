/**
 * Configura PostCSS para procesar los estilos de Kotta.
 * Se relaciona con Tailwind CSS y con las hojas de estilo usadas por Next.js.
 * Existe para habilitar el pipeline de transformacion CSS del proyecto.
 */

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
