
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, collection, collectionGroup, query, where, getDocs, setDoc, limit, serverTimestamp } from 'firebase/firestore';
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

// E-mails que sempre serão administradores da barbearia principal
const MASTER_ADMIN_EMAILS = [
  'guinho2v2@gmail.com',
];

// ID da barbearia principal para garantir sincronização de todos os usuários
const MAIN_BARBER_ID = 'Mw6X0t1P1RdaWMljIGUZpYSg0293';

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
      try {
        if (!firebaseUser) {
          setUserState({ 
            user: null, 
            role: null, 
            staffId: null, 
            isUserLoading: false, 
            barberProfileId: '', 
            userError: null 
          });
          return;
        }

        const emailNormalized = firebaseUser.email?.toLowerCase().trim() || '';
        
        // Localiza ou cria a barbearia principal
        const barbersRef = collection(firestore, 'barbers');
        const barbersSnap = await getDocs(query(barbersRef, limit(1)));
        
        let currentBarberId = MAIN_BARBER_ID;
        let mainBarberOwnerEmail = '';

        if (!barbersSnap.empty) {
          currentBarberId = barbersSnap.docs[0].id;
          mainBarberOwnerEmail = barbersSnap.docs[0].data().ownerEmail?.toLowerCase().trim() || '';
        } else {
          // Se for o primeiro acesso histórico do sistema
          if (!firebaseUser.isAnonymous) {
            currentBarberId = MAIN_BARBER_ID; // Forçamos o ID padrão
            mainBarberOwnerEmail = emailNormalized;
            await setDoc(doc(firestore, 'barbers', currentBarberId), {
              id: currentBarberId,
              name: "Barbearia Skull's",
              ownerEmail: emailNormalized,
              createdAt: serverTimestamp()
            });
          }
        }

        // 1. Verifica se é Admin Mestre (Guinho ou Dono Original)
        if (MASTER_ADMIN_EMAILS.includes(emailNormalized) || (mainBarberOwnerEmail && emailNormalized === mainBarberOwnerEmail)) {
          setUserState({
            user: firebaseUser,
            role: 'ADMIN',
            staffId: null,
            barberProfileId: currentBarberId,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 2. Verifica se é um Staff já cadastrado (Murilo, Gusthavo, etc)
        const staffQuery = query(
          collection(firestore, 'barbers', currentBarberId, 'staff'), 
          where('email', '==', emailNormalized)
        );
        const staffSnap = await getDocs(staffQuery);
        
        if (!staffSnap.empty) {
          const staffDoc = staffSnap.docs[0];
          const staffData = staffDoc.data();
          
          setUserState({
            user: firebaseUser,
            role: (staffData.role as UserRole) || 'STAFF',
            staffId: staffDoc.id,
            barberProfileId: currentBarberId,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 3. Se for um novo usuário (não admin e não staff), cadastra como STAFF padrão
        if (!firebaseUser.isAnonymous) {
          const newStaffId = firebaseUser.uid;
          const newStaffRef = doc(firestore, 'barbers', currentBarberId, 'staff', newStaffId);
          
          // Verifica se já existe para não sobrepor createdAt
          const existingStaff = await getDoc(newStaffRef);
          if (!existingStaff.exists()) {
            await setDoc(newStaffRef, {
              id: newStaffId,
              barberProfileId: currentBarberId,
              name: firebaseUser.displayName || emailNormalized.split('@')[0],
              email: emailNormalized,
              role: 'STAFF',
              isActive: true,
              createdAt: serverTimestamp()
            });
          }

          setUserState({
            user: firebaseUser,
            role: 'STAFF',
            staffId: newStaffId,
            barberProfileId: currentBarberId,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // Caso de usuários anônimos (Landing Page)
        setUserState({
          user: firebaseUser,
          role: null,
          staffId: null,
          barberProfileId: currentBarberId,
          isUserLoading: false,
          userError: null
        });

      } catch (error: any) {
        console.error("Auth initialization error:", error);
        setUserState(prev => ({ 
          ...prev,
          isUserLoading: false, 
          userError: error 
        }));
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
