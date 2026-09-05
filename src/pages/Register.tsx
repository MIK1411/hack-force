import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import LanguageSelector from '../components/LanguageSelector';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker',
    designation: 'Miner',
    mineId: '101'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let uid = '';
      try {
        // 1. Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        uid = userCredential.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/operation-not-allowed') {
          console.log('Firebase Auth disabled. Falling back to DB-only registration.');
          // Generate a pseudo-random ID for DB-only auth
          uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        } else {
          throw authErr;
        }
      }
      
      // 2. Set user document in firestore with 'pending' status
      await setDoc(doc(db, 'users', uid), {
        email: formData.email,
        password: formData.password, // Only storing for demo fallback purposes
        name: formData.name,
        role: formData.role,
        designation: formData.role === 'worker' ? formData.designation : null,
        mineId: formData.mineId,
        status: 'pending' // Ministry must approve
      });
      
      setSuccess('Request submitted successfully! Awaiting Ministry approval.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#141414] flex items-center justify-center mb-3">
              <HardHat className="w-6 h-6 text-[#E4E3E0]" />
            </div>
            <h1 className="text-xl font-bold text-center uppercase tracking-tight">Request Access</h1>
            <p className="text-[10px] font-mono opacity-60 mt-1 tracking-widest uppercase">{t('Ministry of Coal')} Governance System</p>
          </div>
          
          {error && <div className="bg-[#141414] text-white p-3 mb-4 text-xs font-mono">{error}</div>}
          {success && <div className="bg-[#00FF00] bg-opacity-20 text-[#141414] border border-[#141414] p-3 mb-4 text-xs font-mono font-bold">{success}</div>}
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[#F5F4F1] border border-[#141414] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase mb-1">{t('Email Address')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#F5F4F1] border border-[#141414] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase mb-1">{t('Password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#F5F4F1] border border-[#141414] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-[#F5F4F1] border border-[#141414] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                >
                  <option value="worker">Worker</option>
                  <option value="manager">Mine Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase mb-1">Mine ID</label>
                <input
                  type="text"
                  value={formData.mineId}
                  onChange={e => setFormData({...formData, mineId: e.target.value})}
                  className="w-full bg-[#F5F4F1] border border-[#141414] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  placeholder="e.g. 101"
                  required
                />
              </div>
            </div>
            
            {formData.role === 'worker' && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase mb-1">Designation</label>
                <select
                  value={formData.designation}
                  onChange={e => setFormData({...formData, designation: e.target.value})}
                  className="w-full bg-[#F5F4F1] border border-[#141414] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                >
                  <option value="Miner">Miner</option>
                  <option value="Driver">Driver</option>
                  <option value="Helper">Helper</option>
                  <option value="Technician">Technician</option>
                  <option value="Blaster">Blaster</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full bg-[#D9D8D5] hover:bg-[#141414] hover:text-white border border-[#141414] font-bold py-2.5 transition-colors mt-4 text-xs tracking-widest uppercase disabled:opacity-50">
              {loading ? '...' : 'Submit Request'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs font-mono opacity-80">
            Already verified? <Link to="/login" className="text-[#F27D26] hover:underline font-bold">{t('Sign In')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
