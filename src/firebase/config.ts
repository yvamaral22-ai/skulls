/**
 * @fileOverview Configuração Oficial do Firebase para o projeto Skull Barber.
 * Utiliza variáveis de ambiente para produção e fallback para as chaves fornecidas.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD9j4VsnukwV1iZpo_2IYiLdKI7m4w_FO4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-4701647119-91ed7.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-4701647119-91ed7",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-4701647119-91ed7.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1099033271656",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1099033271656:web:a415f0afd6003a5c9d8add"
};
