
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const ICON_BASE64 = "data:image/png;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODAgMTgwIj48cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgcng9IjQwIiBmaWxsPSIjZmFjYzE1Ii8+PHBhdGggZD0iTTc1IDUwaDMwTTc1IDEzMGgzMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxyZWN0IHg9IjgwIiB5PSI1OCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjY0IiByeD0iNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNODAgNzBsMjAgOE04MCA4NWwyMCA4TTgwIDEwMGwyMCA4IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+";

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
        src: ICON_BASE64,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: ICON_BASE64,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  }
}
