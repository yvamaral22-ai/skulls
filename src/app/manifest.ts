import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
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
        src: "/apple-touch-icon.png",
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: "/apple-touch-icon.png",
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: "/apple-touch-icon.png",
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  }
}
