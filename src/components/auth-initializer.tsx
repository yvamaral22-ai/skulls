'use client';

import { useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';

/**
 * Monitora o estado de autenticação.
 * O login agora é gerenciado pela página /login.
 */
export function AuthInitializer() {
  const { user, isUserLoading } = useUser();

  // Não forçamos login anônimo automaticamente aqui para dar lugar à tela de login formal.
  
  return null;
}
