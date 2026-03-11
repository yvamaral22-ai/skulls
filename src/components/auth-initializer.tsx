'use client';

import { useEffect } from 'react';
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';

/**
 * Componente responsável por garantir que o usuário esteja autenticado
 * (mesmo que anonimamente) para evitar erros de permissão do Firestore.
 */
export function AuthInitializer() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      // Se não houver usuário, inicia o login anônimo
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  return null;
}