import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skulls Barber",
    short_name: "Skulls",
    description: "Gestão Profissional para Skulls Barber",
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
