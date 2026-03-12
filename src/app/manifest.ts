
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  /**
   * Versão Base64 para garantir que o manifesto não falhe ao carregar o ícone.
   */
  const BARBER_POLE_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iI2ZhY2MxNSIvPjxnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDEyOCwgMTI4KSBzY2FsZSgxMC42KScgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMCAyaDRNMTAgMjJoNCcvPjxyZWN0IHg9IjgiIHk9IjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjE2IiByeD0iMSIvPjxwYXRoIGQ9Ik04IDdsOCAzTTggMTFsOCAzTTggMTVscDggMyIvPjwvZz48L3N2Zz4=";

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
        src: BARBER_POLE_BASE64,
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: BARBER_POLE_BASE64,
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
    ],
  }
}
