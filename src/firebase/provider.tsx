'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, doc, getDoc, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { Auth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Loader2 } from 'lucide-react';

const BarberPoleIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`${className} animate-barber-spin`}
  >
    <path d="M10 2h4M10 22h4" />
    <rect x="8" y="4" width="8" height="16" rx="1" />
    <path d="M8 7l8 3M8 11l8 3M8 15l8 3" />
  </svg>
);

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        signInAnonymously(auth)
          .then(() => setIsAuthReady(true))
          .catch(() => setIsAuthReady(true));
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

  if (!mounted || !isAuthReady) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
            <BarberPoleIcon className="h-10 w-10 text-black" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Barbearia Skull's</p>
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
      if (u) {
        setUser({
          uid: u.uid,
          displayName: u.displayName || u.email?.split('@')[0] || 'Usuário',
          email: u.email
        });

        // 1. Tenta encontrar se o usuário é o DONO (Admin)
        const ownerDoc = await getDoc(doc(firestore, 'barberProfiles', u.uid));
        if (ownerDoc.exists()) {
          setUserData({ role: 'ADMIN', barberProfileId: u.uid });
        } else {
          // 2. Tenta encontrar se o usuário é um FUNCIONÁRIO (Staff)
          // Busca em todos os staffs pelo UID (SaaS lookup)
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
            // 3. Caso contrário, é um CLIENTE
            setUserData({ role: 'CLIENT', barberProfileId: 'master-barbershop' });
          }
        }
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