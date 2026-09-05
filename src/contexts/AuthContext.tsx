import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  name: string;
  status: string;
  mineId?: number | string;
  designation?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserContext: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a fallback session
    const fallbackSession = sessionStorage.getItem('coalgrid_fallback_session');
    if (fallbackSession) {
      setUser(JSON.parse(fallbackSession));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Check if it's the special ADMIN1411 via email trick
            if (firebaseUser.email === 'admin1411@coal.gov.in') {
              const adminData: Omit<User, 'id'> = {
                email: 'admin1411@coal.gov.in',
                name: 'Ministry Admin',
                role: 'admin',
                status: 'approved'
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), adminData);
              setUser({ id: firebaseUser.uid, ...adminData } as User);
            } else {
              setUser(null);
            }
          }
        } catch (e) {
          console.error("Error fetching user data:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    sessionStorage.removeItem('coalgrid_fallback_session');
    try {
      await signOut(auth);
    } catch (e) {
      // Ignored
    }
    setUser(null);
  };

  const updateUserContext = (u: User) => {
    sessionStorage.setItem('coalgrid_fallback_session', JSON.stringify(u));
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
