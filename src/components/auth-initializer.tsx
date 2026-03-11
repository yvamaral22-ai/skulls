'use client';

import { useEffect } from 'react';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

/**
 * Garante que o usuário seja autenticado anonimamente de forma silenciosa.
 * Isso permite que as regras de segurança do Firestore funcionem sem exigir uma tela de login.
 */
export function AuthInitializer() {
  const auth = useAuth();

  useEffect(() => {
    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch(console.error);
    }
  }, [auth]);
  
  return null;
}