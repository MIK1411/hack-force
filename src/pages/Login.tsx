import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import LanguageSelector from '../components/LanguageSelector';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateUserContext } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let emailToUse = identifier;
      
      // Ministry Admin specific intercept
      if (identifier === 'ADMIN1411') {
        emailToUse = 'admin1411@coal.gov.in';
      } else if (!identifier.includes('@')) {
        // Dummy conversion if phone number is used
        emailToUse = `${identifier}@coal.gov.in`;
      }

      let role = 'worker';
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        if (emailToUse === 'admin1411@coal.gov.in') {
          role = 'admin';
        } else {
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.status !== 'approved') {
              await auth.signOut();
              throw new Error('Account pending verification by Ministry.');
            }
            role = data.role;
          } else {
            await auth.signOut();
            throw new Error('User data not found.');
          }
        }
      } catch (authError: any) {
        // Fallback if Email/Password Auth is not enabled in Firebase project
        if (authError.code === 'auth/operation-not-allowed') {
          console.log('Firebase Auth disabled. Falling back to DB Auth.');
          const q = query(collection(db, 'users'), where('email', '==', emailToUse), where('password', '==', password));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const data = userDoc.data();
            
            if (data.status !== 'approved') {
              throw new Error('Account pending verification by Ministry.');
            }
            role = data.role;
            // Manually set user context since Firebase Auth didn't run
            updateUserContext({ id: userDoc.id, ...data } as any);
          } else {
            throw new Error('Invalid credentials or Auth disabled. If using Firebase, please enable Email/Password provider.');
          }
        } else {
          throw authError; // Re-throw other errors
        }
      }
      
      navigate(`/${role}`);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex flex-col p-4 font-sans text-[#141414] selection:bg-[#F27D26] selection:text-white">
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white p-8 border border-[#141414] shadow-[4px_4px_0px_#141414] w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#141414] flex items-center justify-center mb-4">
              <HardHat className="w-8 h-8 text-[#E4E3E0]" />
            </div>
            <h1 className="text-2xl font-bold text-center tracking-tight leading-none uppercase">CoalGrid</h1>
            <p className="text-[10px] font-mono opacity-60 mt-2 uppercase tracking-widest">{t('Ministry of Coal')} Governance System</p>
          </div>
          
          {error && <div className="bg-[#141414] text-white p-3 mb-6 text-xs font-mono">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase mb-1">{t('Email Address')} / ID / Phone</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full bg-[#F5F4F1] border border-[#141414] px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase mb-1">{t('Password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#F5F4F1] border border-[#141414] px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                required
              />
            </div>
            
            <div className="text-[10px] font-mono text-opacity-80 p-3 bg-[#D9D8D5] border border-[#141414] mt-2">
              <p className="font-bold mb-1">Demo Accounts:</p>
              <ul className="space-y-1">
                <li>Admin: ADMIN1411 / 141124admin</li>
                <li>Manager: manager@coal.gov.in / pass123</li>
                <li>Worker: 9876543210 / pass123</li>
              </ul>
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-[#141414] hover:bg-neutral-800 text-white font-bold py-2.5 transition-colors mt-4 text-xs tracking-widest uppercase disabled:opacity-50">
              {loading ? '...' : t('Sign In')}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs font-mono opacity-80">
            New personnel? <Link to="/register" className="text-[#F27D26] hover:underline font-bold">Request Access</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
