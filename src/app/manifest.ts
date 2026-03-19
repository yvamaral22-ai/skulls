import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barbearia Skull's",
    short_name: "Skulls",
    description: "Gestão Profissional para Barbearia Skull's",
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: "/apple-touch-icon.png.png",
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: "/apple-touch-icon.png.png",
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  }
}
