'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Papéis disponíveis no sistema
export type UserRole = 'CLIENT' | 'BARBER' | 'ADMIN';

// Estado interno de autenticação e perfil
interface UserAuthState {
  user: User | null;
  role: UserRole | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Estado combinado do contexto
export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

// Retorno do hook useUser
export interface UserHookResult {
  user: User | null;
  role: UserRole | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider: Gerencia Auth e sincroniza o Role do usuário vindo do Firestore.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [authState, setAuthState] = useState<UserAuthState>({
    user: null,
    role: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userRef = doc(firestore, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            let role: UserRole = 'CLIENT';

            if (!userSnap.exists()) {
              // Se for o primeiro login, cria o perfil como CLIENT por padrão
              await setDoc(userRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: 'CLIENT',
                createdAt: serverTimestamp(),
              });
            } else {
              role = userSnap.data().role as UserRole;
            }

            setAuthState({
              user: firebaseUser,
              role: role,
              isUserLoading: false,
              userError: null,
            });
          } catch (error) {
            console.error("Erro ao carregar perfil do usuário:", error);
            setAuthState(prev => ({ ...prev, isUserLoading: false, userError: error as Error }));
          }
        } else {
          setAuthState({ user: null, role: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        setAuthState({ user: null, role: null, isUserLoading: false, userError: error });
      }
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...authState,
    };
  }, [firebaseApp, firestore, auth, authState]);

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

export const useAuth = () => useFirebase().auth!;
export const useFirestore = () => useFirebase().firestore!;
export const useUser = (): UserHookResult => {
  const { user, role, isUserLoading, userError } = useFirebase();
  return { user, role, isUserLoading, userError };
};

type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}
