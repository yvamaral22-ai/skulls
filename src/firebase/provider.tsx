'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
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
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
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
        // 1. Verifica se é ADMIN (Dono da Barbearia)
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

        // 2. Verifica se é STAFF (Funcionário)
        const staffQuery = query(collectionGroup(firestore, 'staff'), where('id', '==', firebaseUser.uid));
        const staffSnap = await getDocs(staffQuery);
        
        if (!staffSnap.empty) {
          const staffDoc = staffSnap.docs[0];
          // O barberId é o ID do documento pai (a barbearia)
          const barberId = staffDoc.ref.parent.parent?.id || '';
          setUserState({
            user: firebaseUser,
            role: 'STAFF',
            staffId: firebaseUser.uid,
            barberProfileId: barberId,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 3. Caso contrário, é um CLIENT ou novo usuário
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

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useUser = () => {
  const { user, role, staffId, barberProfileId, isUserLoading, userError } = useFirebase();
  return { user, role, staffId, barberProfileId, isUserLoading, userError };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps) as any;
  if(memoized && typeof memoized === 'object') memoized.__memo = true;
  return memoized;
}

export const logout = async (auth: Auth) => {
  await auth.signOut();
};
