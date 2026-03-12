
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  // Ícone Barber Pole em SVG para uso no PWA
  const BARBER_POLE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23facc15' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 2h4M10 22h4'/%3E%3Crect x='8' y='4' width='8' height='16' rx='1'/%3E%3Cpath d='M8 7l8 3M8 11l8 3M8 15l8 3'/%3E%3C/svg%3E";

  return {
    name: "Barbearia Skull's",
    short_name: "Skull's",
    description: "Gestão Profissional para Barbearia Skull's",
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    icons: [
      {
        src: BARBER_POLE_SVG,
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: BARBER_POLE_SVG,
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}
