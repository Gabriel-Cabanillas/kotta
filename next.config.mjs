/**
 * Configura el comportamiento general de Next.js para Kotta.
 * Se relaciona con la compilacion de la app en src/app y los componentes de src.
 * Existe para centralizar ajustes de build, TypeScript y ESLint del proyecto.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig