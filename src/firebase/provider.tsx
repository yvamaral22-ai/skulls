
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

const MASTER_ADMIN_EMAILS = [
  'guinho2v2@gmail.com',
];

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

      setUserState(prev => ({ ...prev, isUserLoading: true }));

      try {
        const emailNormalized = firebaseUser.email?.toLowerCase().trim() || '';
        
        // 1. Localiza a barbearia principal
        const barbersRef = collection(firestore, 'barbers');
        const barbersSnap = await getDocs(query(barbersRef, limit(1)));
        
        let mainBarberId = '';
        let mainBarberOwnerEmail = '';

        if (!barbersSnap.empty) {
          mainBarberId = barbersSnap.docs[0].id;
          mainBarberOwnerEmail = barbersSnap.docs[0].data().ownerEmail?.toLowerCase().trim() || '';
        } else {
          // Se não houver barbearia e o usuário não for anônimo, cria a primeira
          if (!firebaseUser.isAnonymous) {
            mainBarberId = firebaseUser.uid;
            mainBarberOwnerEmail = emailNormalized;
            await setDoc(doc(firestore, 'barbers', mainBarberId), {
              id: mainBarberId,
              name: "Barbearia Skull's",
              ownerEmail: emailNormalized,
              createdAt: serverTimestamp()
            });
          }
        }

        // Se for anônimo e já existir uma barbearia, apenas define o ID mas papel nulo
        if (firebaseUser.isAnonymous) {
          setUserState({
            user: firebaseUser,
            role: null,
            staffId: null,
            barberProfileId: mainBarberId,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 2. Verifica se é Admin Mestre
        if (MASTER_ADMIN_EMAILS.includes(emailNormalized) || (mainBarberOwnerEmail && emailNormalized === mainBarberOwnerEmail)) {
          setUserState({
            user: firebaseUser,
            role: 'ADMIN',
            staffId: null,
            barberProfileId: mainBarberId,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 3. Verifica Staff existente
        const staffQuery = query(
          collectionGroup(firestore, 'staff'), 
          where('email', '==', emailNormalized)
        );
        const staffSnap = await getDocs(staffQuery);
        
        if (!staffSnap.empty) {
          const staffDoc = staffSnap.docs[0];
          const staffData = staffDoc.data();
          const barberId = staffDoc.ref.parent.parent?.id || mainBarberId;
          
          setUserState({
            user: firebaseUser,
            role: (staffData.role as UserRole) || 'STAFF',
            staffId: staffDoc.id,
            barberProfileId: barberId,
            isUserLoading: false,
            userError: null
          });
          return;
        }

        // 4. Se for usuário logado mas não staff, registra como STAFF por padrão na barbearia principal
        if (mainBarberId) {
          const newStaffId = firebaseUser.uid;
          const newStaffRef = doc(firestore, 'barbers', mainBarberId, 'staff', newStaffId);
          
          await setDoc(newStaffRef, {
            id: newStaffId,
            barberProfileId: mainBarberId,
            name: firebaseUser.displayName || emailNormalized.split('@')[0],
            email: emailNormalized,
            role: 'STAFF',
            isActive: true,
            createdAt: serverTimestamp()
          }, { merge: true });

          setUserState({
            user: firebaseUser,
            role: 'STAFF',
            staffId: newStaffId,
            barberProfileId: mainBarberId,
            isUserLoading: false,
            userError: null
          });
        }

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
