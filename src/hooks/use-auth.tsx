
// src/hooks/use-auth.tsx
'use client';
import type { User } from 'firebase/auth';
import { auth, isFirebaseEnabled as firebaseEnabled } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isFirebaseEnabled: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isFirebaseEnabled: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (auth && firebaseEnabled) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isFirebaseEnabled: firebaseEnabled }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
