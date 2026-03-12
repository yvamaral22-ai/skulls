import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  /**
   * Ícone Barber Pole otimizado para manifest.
   * Utiliza fundo sólido para evitar que o sistema gere um ícone genérico baseado na letra inicial.
   */
  const BARBER_POLE_APP_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23facc15'/%3E%3Cg transform='translate(128, 128) scale(10.6)' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 2h4M10 22h4'/%3E%3Crect x='8' y='4' width='8' height='16' rx='1'/%3E%3Cpath d='M8 7l8 3M8 11l8 3M8 15l8 3'/%3E%3C/g%3E%3C/svg%3E";

  return {
    name: "Barbearia Skull's",
    short_name: "Barbearia Skull's",
    description: "Gestão Profissional para Barbearia Skull's",
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#facc15',
    icons: [
      {
        src: BARBER_POLE_APP_ICON,
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: BARBER_POLE_APP_ICON,
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
    ],
  }
}
