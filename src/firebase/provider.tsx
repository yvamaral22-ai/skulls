
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Loader2, Scissors } from 'lucide-react';

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Inicia a escuta da autenticação imediatamente
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Se não houver usuário, realiza o login anônimo silencioso
        signInAnonymously(auth)
          .then(() => {
            setIsAuthReady(true);
          })
          .catch(err => {
            console.error("Auth Error:", err);
            setIsAuthReady(true); // Evita travar a UI em caso de erro, permitindo fallback
          });
      } else {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: true,
    firebaseApp,
    firestore,
    auth,
  }), [firebaseApp, firestore, auth]);

  // FIX DE HIDRATAÇÃO E PERMISSÃO: 
  // 1. O servidor e o cliente rendenrizam o mesmo fallback inicial (mounted === false).
  // 2. Só exibimos o conteúdo real após 'isAuthReady', evitando requisições sem permissão.
  if (!mounted || !isAuthReady) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
            <Scissors className="h-10 w-10 text-white" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Skull Barber</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return context;
};

export const useFirestore = () => useFirebase().firestore!;
export const useAuth = () => useFirebase().auth!;

export const useUser = () => {
  const { auth } = useFirebase();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({
          uid: u.uid,
          displayName: u.displayName || 'Barbeiro Mestre',
          email: u.email
        });
      }
      setLoading(false);
    });
  }, [auth]);

  return {
    user,
    role: 'ADMIN' as const,
    isUserLoading: loading,
    userError: null,
    logout: () => auth?.signOut(),
  };
};

type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}
