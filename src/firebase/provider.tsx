'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

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
    // Monitora o estado de autenticação sem forçar login anônimo automático
    const unsubscribe = onAuthStateChanged(auth, () => {
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: true,
    firebaseApp,
    firestore,
    auth,
  }), [firebaseApp, firestore, auth]);

  if (!mounted || !isAuthReady) {
    return null; // O layout.tsx cuida do loading screen agora
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

export const useFirestore = () => {
  const context = useFirebase();
  return context.firestore!;
};

export const useAuth = () => {
  const context = useFirebase();
  return context.auth!;
};

export const useUser = () => {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<{
    role: 'ADMIN' | 'STAFF' | 'CLIENT';
    barberProfileId: string;
    staffId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firestore) return;
    return onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      if (u && !u.isAnonymous) {
        setUser({
          uid: u.uid,
          displayName: u.displayName || u.email?.split('@')[0] || 'Usuário',
          email: u.email
        });

        try {
          // 1. Tenta encontrar se o usuário é o DONO (Admin)
          const ownerDoc = await getDoc(doc(firestore, 'barberProfiles', u.uid));
          if (ownerDoc.exists()) {
            setUserData({ role: 'ADMIN', barberProfileId: u.uid });
          } else {
            // 2. Tenta encontrar se o usuário é um FUNCIONÁRIO (Staff) via e-mail ou id
            // Buscamos em todas as coleções 'staff' o documento que represente este usuário
            const staffQuery = query(collectionGroup(firestore, 'staff'), where('id', '==', u.uid));
            const staffSnap = await getDocs(staffQuery);
            
            if (!staffSnap.empty) {
              const staffDoc = staffSnap.docs[0];
              const profileId = staffDoc.ref.parent.parent?.id || 'master-barbershop';
              setUserData({ 
                role: 'STAFF', 
                barberProfileId: profileId,
                staffId: staffDoc.id
              });
            } else {
              setUserData({ role: 'CLIENT', barberProfileId: 'master-barbershop' });
            }
          }
        } catch (e) {
          console.error("Erro ao buscar papel do usuário:", e);
          setUserData({ role: 'CLIENT', barberProfileId: 'master-barbershop' });
        }
      } else if (u && u.isAnonymous) {
        // Usuário anônimo é tratado como visitante/cliente sem perfil
        setUser(u);
        setUserData({ role: 'CLIENT', barberProfileId: 'master-barbershop' });
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
  }, [auth, firestore]);

  return {
    user,
    role: userData?.role || 'CLIENT',
    barberProfileId: userData?.barberProfileId || 'master-barbershop',
    staffId: userData?.staffId,
    isUserLoading: loading,
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
