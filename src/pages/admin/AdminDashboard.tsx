import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, LayoutDashboard, Users, AlertTriangle, FileText, CheckSquare, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'verification' | 'incidents' | 'notices' | 'compliance'>('dashboard');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingUsers();
    if (activeTab === 'verification') fetchAllUsers();
    if (activeTab === 'incidents') fetchAllIncidents();
  }, [activeTab]);

  const fetchPendingUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(users);
    } catch (error) {
      console.error("Error fetching pending users", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(users);
    } catch (error) {
      console.error("Error fetching all users", error);
    }
  };

  const fetchAllIncidents = async () => {
    try {
      const q = query(collection(db, 'incidents'));
      const snapshot = await getDocs(q);
      const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllIncidents(incidents);
    } catch (error) {
      console.error("Error fetching incidents", error);
    }
  };

  const handleVerification = async (userId: string, action: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: action });
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error updating user status", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#E4E3E0] font-sans text-[#141414] selection:bg-[#F27D26] selection:text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#141414] bg-[#F5F4F1] flex flex-col">
        <div className="px-6 py-4 border-b border-[#141414] bg-[#141414] text-white flex items-center gap-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-[#141414] rotate-45"></div>
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-tight leading-none uppercase">{t('Ministry of Coal')}</h1>
            <p className="text-[9px] font-mono opacity-60">{t('Admin Sentinel')} v2.4</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-4 text-[9px] font-bold opacity-40 uppercase tracking-widest">Main Governance</div>
          <ul className="space-y-1">
            <li>
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <LayoutDashboard className="w-4 h-4" /> <span>{activeTab === 'dashboard' ? '■' : '□'} {t('Dashboard')}</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('verification')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'verification' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <Users className="w-4 h-4" /> <span>{activeTab === 'verification' ? '■' : '□'} User Verification</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('incidents')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'incidents' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <AlertTriangle className="w-4 h-4" /> <span>{activeTab === 'incidents' ? '■' : '□'} Safety Incidents</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('notices')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'notices' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <FileText className="w-4 h-4" /> <span>{activeTab === 'notices' ? '■' : '□'} Show Cause Notices</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('compliance')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'compliance' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <CheckSquare className="w-4 h-4" /> <span>{activeTab === 'compliance' ? '■' : '□'} Compliance Tracker</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-[#141414] bg-[#D9D8D5]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-neutral-300 border border-[#141414] flex items-center justify-center text-[10px] font-bold overflow-hidden relative">
              <div className="absolute inset-0 bg-[#141414] opacity-10"></div>
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold leading-none uppercase truncate">{user?.name}</p>
              <p className="text-[9px] font-mono opacity-70 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors uppercase tracking-widest"
          >
            <LogOut className="w-3 h-3" /> {t('Sign Out')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 bg-[#F5F4F1] border-b border-[#141414] flex items-center justify-between px-6 z-10">
          <h2 className="text-[11px] font-bold tracking-widest uppercase">{t('Overview')}</h2>
          <div className="flex items-center gap-4">
             <LanguageSelector />
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-[#00FF00] rounded-full shadow-[0_0_8px_#00FF00]"></span>
               <span className="text-[9px] font-mono uppercase tracking-widest">System Sync: Optimal</span>
             </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {activeTab === 'dashboard' && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <span className="text-[10px] font-mono opacity-50 uppercase mb-1">{t('Active Mines')}</span>
                    <span className="text-3xl font-mono font-bold leading-none">42</span>
                  </div>
                  <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <span className="text-[10px] font-mono opacity-50 uppercase mb-1">{t('Total Workforce')}</span>
                    <span className="text-3xl font-mono font-bold leading-none">12,450</span>
                  </div>
                  <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#D93025] text-white text-[8px] font-bold px-2 py-1">URGENT</div>
                    <span className="text-[10px] font-mono opacity-50 uppercase mb-1">{t('Open Incidents')}</span>
                    <span className="text-3xl font-mono font-bold leading-none text-[#D93025] flex items-baseline gap-2">
                      18 <span className="text-[9px] font-normal text-[#D93025] animate-pulse">+3 TODAY</span>
                    </span>
                  </div>
                  <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <span className="text-[10px] font-mono opacity-50 uppercase mb-1">{t('Avg Compliance')}</span>
                    <span className="text-3xl font-mono font-bold leading-none text-green-700">84%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-2 bg-[#F5F4F1] border border-[#141414] flex flex-col">
                    <div className="px-3 py-2 border-b border-[#141414] bg-[#141414] text-white flex justify-between items-center">
                      <h3 className="text-[10px] font-mono uppercase tracking-widest">Production Trend (National)</h3>
                      <span className="text-[9px] font-mono opacity-50">UNIT: MT</span>
                    </div>
                    <div className="flex-1 min-h-[400px] p-4 flex items-center justify-center">
                      <div className="w-full h-full border border-[#141414] border-dashed flex items-center justify-center text-[10px] font-mono opacity-50">
                        [INTERACTIVE CHART RENDER PORT]
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col max-h-[450px]">
                    <div className="px-3 py-2 border-b border-[#141414] bg-[#F27D26] text-white">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest">Pending Verifications</h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto">
                      {pendingUsers.length === 0 ? (
                        <p className="text-xs font-mono opacity-50">No pending users.</p>
                      ) : pendingUsers.map(u => (
                        <div key={u.id} className="border-l-2 border-[#141414] pl-3 py-1">
                          <p className="text-[10px] font-bold leading-none uppercase truncate">{u.name} <span className="text-[9px] font-normal opacity-50 ml-1">({u.email})</span></p>
                          <p className="text-[9px] font-mono opacity-70 mt-1">ROLE: {u.role.toUpperCase()} • MINE_{u.mineId}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleVerification(u.id, 'approved')} className="text-[8px] font-bold px-2 py-1 bg-[#141414] text-white rounded-sm hover:opacity-80 transition-opacity uppercase">Approve</button>
                            <button onClick={() => handleVerification(u.id, 'rejected')} className="text-[8px] font-bold px-2 py-1 border border-[#141414] rounded-sm hover:bg-[#D9D8D5] transition-colors uppercase">Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'verification' && (
              <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414]">
                <div className="px-4 py-3 border-b border-[#141414] bg-[#141414] text-white flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest">User Management Directory</h3>
                  <span className="text-[10px] font-mono">TOTAL: {allUsers.length}</span>
                </div>
                <div className="p-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#141414] text-[10px] font-bold uppercase tracking-widest">
                        <th className="py-2 px-4">Name</th>
                        <th className="py-2 px-4">Role</th>
                        <th className="py-2 px-4">Status</th>
                        <th className="py-2 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} className="border-b border-[#141414] hover:bg-[#F5F4F1] transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-xs font-bold">{u.name}</p>
                            <p className="text-[9px] font-mono opacity-60">{u.email}</p>
                          </td>
                          <td className="py-3 px-4 text-[10px] font-mono uppercase">{u.role}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-bold px-2 py-1 uppercase tracking-widest border border-[#141414] ${u.status === 'approved' ? 'bg-[#00FF00] bg-opacity-20' : u.status === 'rejected' ? 'bg-[#D93025] text-white' : 'bg-[#F27D26] text-white'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {u.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleVerification(u.id, 'approved')} className="text-[9px] font-bold px-2 py-1 bg-[#141414] text-white hover:opacity-80 transition-opacity uppercase">Approve</button>
                                <button onClick={() => handleVerification(u.id, 'rejected')} className="text-[9px] font-bold px-2 py-1 border border-[#141414] hover:bg-[#D9D8D5] transition-colors uppercase">Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'incidents' && (
              <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414]">
                <div className="px-4 py-3 border-b border-[#141414] bg-[#D93025] text-white flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Global Safety Incidents</h3>
                </div>
                <div className="p-4">
                  {allIncidents.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono opacity-50 uppercase tracking-widest">No Incidents Reported</div>
                  ) : (
                    <div className="space-y-4">
                      {allIncidents.map(inc => (
                        <div key={inc.id} className="border border-[#141414] p-4 flex justify-between items-center bg-[#F5F4F1]">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#141414] text-white uppercase">{inc.severity}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest">{inc.title}</span>
                            </div>
                            <p className="text-[9px] font-mono opacity-70">MINE: {inc.mineId} | REPORTED BY: {inc.reportedBy} | DATE: {new Date(inc.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-1 uppercase border border-[#141414] ${inc.status === 'Open' ? 'bg-[#D93025] text-white' : 'bg-[#00FF00] bg-opacity-20'}`}>
                              {inc.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notices' && (
              <div className="bg-[#F5F4F1] border border-[#141414] border-dashed p-12 text-center shadow-[4px_4px_0px_#141414]">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Show Cause Notices</h3>
                <p className="text-xs font-mono opacity-60 max-w-md mx-auto">This module is currently pending integration with the central legal registry. Notices will be displayed here once connected.</p>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414]">
                <div className="px-4 py-3 border-b border-[#141414] bg-[#141414] text-white">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Compliance Tracking</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-[#141414] p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4">Environmental Clearances</h4>
                      <div className="w-full bg-[#E4E3E0] h-4 border border-[#141414]">
                        <div className="bg-[#00FF00] h-full" style={{ width: '92%' }}></div>
                      </div>
                      <p className="text-right mt-1 text-[9px] font-mono">92% COMPLIANT</p>
                    </div>
                    <div className="border border-[#141414] p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4">Safety Audits</h4>
                      <div className="w-full bg-[#E4E3E0] h-4 border border-[#141414]">
                        <div className="bg-[#F27D26] h-full" style={{ width: '78%' }}></div>
                      </div>
                      <p className="text-right mt-1 text-[9px] font-mono">78% COMPLIANT</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
