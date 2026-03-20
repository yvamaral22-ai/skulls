'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, collectionGroup, query, where, getDocs, collection, limit } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT' | null;

interface UserAuthState {
  user: User | null;
  role: UserRole;
  staffId: string | null;
  barberProfileId: string;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  logout: (auth: Auth) => Promise<void>;
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  logout: (auth: Auth) => Promise<void>;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userState, setUserState] = useState<UserAuthState>({
    user: null,
    role: null,
    staffId: null,
    barberProfileId: '', 
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUserState({ user: null, role: null, staffId: null, isUserLoading: false, barberProfileId: '', userError: null });
        return;
      }

      try {
        // 1. Tenta identificar como ADMIN (Dono da Barbearia) pelo UID
        const barberDoc = await getDoc(doc(firestore, 'barbers', firebaseUser.uid));
        if (barberDoc.exists()) {
          setUserState({
            user: firebaseUser,
            role: 'ADMIN',
            staffId: null,
            barberProfileId: firebaseUser.uid,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 2. Tenta identificar como STAFF (Funcionário) via e-mail ou UID
        const staffQuery = query(
          collectionGroup(firestore, 'staff'), 
          where('email', '==', firebaseUser.email)
        );
        const staffSnap = await getDocs(staffQuery);
        
        if (!staffSnap.empty) {
          const staffDoc = staffSnap.docs[0];
          const staffData = staffDoc.data();
          // Caminho esperado: /barbers/{barberId}/staff/{staffId}
          const barberId = staffDoc.ref.parent.parent?.id || '';
          
          setUserState({
            user: firebaseUser,
            role: 'STAFF',
            staffId: staffDoc.id,
            barberProfileId: barberId,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 3. Fallback: Se não for Staff nem Admin da sua própria barbearia, 
        // tenta encontrar a barbearia principal (SaaS Root)
        const fallbackQuery = query(collection(firestore, 'barbers'), limit(1));
        const fallbackSnap = await getDocs(fallbackQuery);
        
        if (!fallbackSnap.empty) {
           setUserState({
            user: firebaseUser,
            role: 'ADMIN',
            staffId: null,
            barberProfileId: fallbackSnap.docs[0].id,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 4. Default como Cliente
        setUserState({
          user: firebaseUser,
          role: 'CLIENT',
          staffId: null,
          barberProfileId: '',
          isUserLoading: false,
          userError: null
        });

      } catch (error: any) {
        console.error("Erro na identificação do perfil:", error);
        setUserState({ 
          user: firebaseUser, 
          role: 'CLIENT', 
          staffId: null, 
          barberProfileId: '', 
          isUserLoading: false, 
          userError: error 
        });
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      logout: async (authInstance: Auth) => {
        await signOut(authInstance);
      },
      ...userState
    };
  }, [firebaseApp, firestore, auth, userState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available.');
  }
  return context as FirebaseServicesAndUser;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  return context?.auth || null;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  return context?.firestore || null;
};

export const useUser = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    return {
      user: null,
      role: null,
      staffId: null,
      barberProfileId: '',
      isUserLoading: true,
      userError: null,
      logout: async () => {},
      auth: null
    };
  }
  return { 
    user: context.user, 
    role: context.role, 
    staffId: context.staffId, 
    barberProfileId: context.barberProfileId, 
    isUserLoading: context.isUserLoading, 
    userError: context.userError,
    logout: context.logout,
    auth: context.auth
  };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps) as any;
  if(memoized && typeof memoized === 'object') memoized.__memo = true;
  return memoized;
}
