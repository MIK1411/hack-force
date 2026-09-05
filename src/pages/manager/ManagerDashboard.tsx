import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Home, ClipboardList, ShieldAlert, FileCheck, HardHat, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'production' | 'incidents' | 'inspections' | 'gear'>('dashboard');
  const [mineUsers, setMineUsers] = useState<any[]>([]);
  const [mineIncidents, setMineIncidents] = useState<any[]>([]);

  useEffect(() => {
    if (user?.mineId) {
      if (activeTab === 'gear') fetchMineUsers();
      if (activeTab === 'incidents') fetchMineIncidents();
    }
  }, [activeTab, user?.mineId]);

  const [telemetry, setTelemetry] = useState({ dust: 45, vehicles: 2, temp: 32 });
  const [detection, setDetection] = useState<{box: {x:number, y:number, w:number, h:number}, label: string} | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry({
        dust: Math.floor(Math.random() * 20) + 40,
        vehicles: Math.floor(Math.random() * 4) + 1,
        temp: Math.floor(Math.random() * 5) + 30
      });
      
      if (Math.random() > 0.3) {
        setDetection({
          box: {
            x: Math.floor(Math.random() * 60) + 10,
            y: Math.floor(Math.random() * 60) + 10,
            w: Math.floor(Math.random() * 20) + 10,
            h: Math.floor(Math.random() * 20) + 10
          },
          label: Math.random() > 0.5 ? 'Worker (PPE OK)' : 'Haul Truck'
        });
      } else {
        setDetection(null);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchMineUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('mineId', '==', user?.mineId));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMineUsers(users);
    } catch (error) {
      console.error("Error fetching mine users", error);
    }
  };

  const fetchMineIncidents = async () => {
    try {
      const q = query(collection(db, 'incidents'), where('mineId', '==', user?.mineId));
      const snapshot = await getDocs(q);
      const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMineIncidents(incidents);
    } catch (error) {
      console.error("Error fetching mine incidents", error);
    }
  };

  const handleIncidentStatus = async (incidentId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'incidents', incidentId), { status });
      setMineIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status } : inc));
    } catch (error) {
      console.error("Error updating incident status", error);
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
            <HardHat className="w-4 h-4 text-[#141414]" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-tight leading-none uppercase">{t('MineManager')}</h1>
            <p className="text-[9px] font-mono opacity-60">{t('Operations Panel')}</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-4 text-[9px] font-bold opacity-40 uppercase tracking-widest">Controls</div>
          <ul className="space-y-1">
            <li>
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <Home className="w-4 h-4" /> <span>{activeTab === 'dashboard' ? '■' : '□'} {t('Dashboard')}</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('production')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'production' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <ClipboardList className="w-4 h-4" /> <span>{activeTab === 'production' ? '■' : '□'} Daily Production</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('incidents')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'incidents' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <ShieldAlert className="w-4 h-4" /> <span>{activeTab === 'incidents' ? '■' : '□'} Incidents</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('inspections')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'inspections' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <FileCheck className="w-4 h-4" /> <span>{activeTab === 'inspections' ? '■' : '□'} Inspections</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('gear')} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'gear' ? 'bg-[#141414] text-white' : 'hover:bg-[#D9D8D5] text-[#141414]'}`}>
                <HardHat className="w-4 h-4" /> <span>{activeTab === 'gear' ? '■' : '□'} Gear & Permits</span>
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
              <p className="text-[9px] font-mono opacity-70 truncate">MINE_ID: {user?.mineId}</p>
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
          <h2 className="text-[11px] font-bold tracking-widest uppercase">Gevra Coal Mine {t('Overview')}</h2>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <span className="px-2 py-0.5 bg-[#00FF00] bg-opacity-20 text-[#141414] border border-[#141414] text-[9px] font-bold tracking-widest uppercase">Operational</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {activeTab === 'dashboard' && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <span className="text-[10px] font-mono opacity-50 uppercase mb-1">{t('Active Miners')}</span>
                    <span className="text-3xl font-mono font-bold leading-none">450</span>
                  </div>
                  <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <span className="text-[10px] font-mono opacity-50 uppercase mb-1">{t("Today's Production")}</span>
                    <span className="text-3xl font-mono font-bold leading-none flex items-baseline gap-2">
                      4,800 <span className="text-[9px] font-normal font-sans opacity-50">MT</span>
                    </span>
                    <div className="w-full bg-[#E4E3E0] h-1 border border-[#141414] mt-3 overflow-hidden">
                      <div className="bg-[#141414] h-full w-[96%]"></div>
                    </div>
                  </div>
                  <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <span className="text-[10px] font-mono opacity-50 uppercase mb-1">{t('Open Incidents')}</span>
                    <span className="text-3xl font-mono font-bold leading-none text-[#D93025]">{mineIncidents.filter(i => i.status === 'Open').length}</span>
                  </div>
                  <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <span className="text-[10px] font-mono opacity-50 uppercase mb-1">{t('Inspections Due')}</span>
                    <span className="text-3xl font-mono font-bold leading-none text-[#F27D26]">1</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <div className="px-3 py-2 border-b border-[#141414] bg-[#F5F4F1]">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest">{t('Recent Hazard Reports')}</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {mineIncidents.slice(0, 3).map(inc => (
                        <div key={inc.id} className={`p-3 border-l-4 ${inc.severity === 'High' ? 'border-[#D93025]' : 'border-[#F27D26]'} bg-[#F5F4F1] border-y border-r border-y-[#141414] border-r-[#141414] flex justify-between items-center`}>
                          <div>
                            <h4 className="text-xs font-bold uppercase">{t(inc.title)}</h4>
                            <p className="text-[9px] font-mono opacity-70">SEVERITY: {t(inc.severity)} • REP: {inc.reportedBy}</p>
                          </div>
                          <button onClick={() => setActiveTab('incidents')} className="px-3 py-1 bg-[#141414] text-white border border-[#141414] text-[8px] font-bold hover:bg-neutral-800 uppercase">{t('Investigate')}</button>
                        </div>
                      ))}
                      {mineIncidents.length === 0 && (
                        <p className="text-[10px] font-mono opacity-50">{t('No recent hazards reported.')}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col">
                    <div className="px-3 py-2 border-b border-[#141414] bg-[#F5F4F1] flex justify-between items-center">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest">{t('CCTV Feed (Zone A)')}</h3>
                      <span className="text-[8px] font-mono text-[#D93025] animate-pulse">● LIVE</span>
                    </div>
                    <div className="flex-1 bg-[#141414] p-0 flex flex-col justify-between min-h-[200px] relative overflow-hidden group m-4 border border-[#141414]">
                      
                      {/* Telemetry Overlay */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 text-[9px] font-mono font-bold">
                        <div className="flex items-center gap-2 bg-[#141414] border border-[#E4E3E0] px-2 py-0.5 text-[#E4E3E0]">
                          <div className="w-1.5 h-1.5 bg-[#D93025] animate-pulse"></div> REC
                        </div>
                        <div className="bg-[#141414] border border-[#E4E3E0] px-2 py-0.5 text-white">DUST: {telemetry.dust} ppm</div>
                        <div className="bg-[#141414] border border-[#E4E3E0] px-2 py-0.5 text-white">TEMP: {telemetry.temp} °C</div>
                        <div className="bg-[#141414] border border-[#E4E3E0] px-2 py-0.5 text-white">VEHICLES: {telemetry.vehicles}</div>
                      </div>

                      {/* Video Area (Simulated pattern) */}
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBMMCA4TDggOEw4IDBaIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMEw4IDhaIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]"></div>

                      {/* AI Detection Overlay */}
                      {detection && (
                        <div 
                          className="absolute border-2 border-[#00FF00] bg-[#00FF00]/10 transition-all duration-300"
                          style={{
                            left: `${detection.box.x}%`,
                            top: `${detection.box.y}%`,
                            width: `${detection.box.w}%`,
                            height: `${detection.box.h}%`
                          }}
                        >
                          <div className="absolute -top-4 left-0 bg-[#00FF00] text-[#141414] text-[8px] font-bold px-1 whitespace-nowrap">
                            {t(detection.label)}
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/80 transition-opacity z-20 cursor-pointer">
                        <span className="text-white text-[10px] font-mono font-bold tracking-widest">{t('[VIEW FULL MATRIX]')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'production' && (
              <div className="bg-[#F5F4F1] border border-[#141414] border-dashed p-12 text-center shadow-[4px_4px_0px_#141414]">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold uppercase tracking-widest mb-2">{t('Daily Production Logs')}</h3>
                <p className="text-xs font-mono opacity-60 max-w-md mx-auto">{t('Integration with weighbridge and conveyor sensors pending. Manual entry module will be enabled in next patch.')}</p>
              </div>
            )}

            {activeTab === 'incidents' && (
              <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414]">
                <div className="px-4 py-3 border-b border-[#141414] bg-[#D93025] text-white flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest">{t('Mine Safety Incidents')}</h3>
                </div>
                <div className="p-4 space-y-4">
                  {mineIncidents.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono opacity-50 uppercase tracking-widest">{t('No Incidents Reported')}</div>
                  ) : (
                    mineIncidents.map(inc => (
                      <div key={inc.id} className="border border-[#141414] p-4 flex justify-between items-center bg-[#F5F4F1]">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#141414] text-white uppercase">{t(inc.severity)}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">{t(inc.title)}</span>
                          </div>
                          <p className="text-[9px] font-mono opacity-70">REPORTED BY: {inc.reportedBy} | DATE: {new Date(inc.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-bold px-2 py-1 uppercase border border-[#141414] ${inc.status === 'Open' ? 'bg-[#D93025] text-white' : 'bg-[#00FF00] bg-opacity-20'}`}>
                            {t(inc.status)}
                          </span>
                          {inc.status === 'Open' && (
                            <button onClick={() => handleIncidentStatus(inc.id, 'Resolved')} className="text-[9px] font-bold px-3 py-1 bg-[#141414] text-white hover:bg-neutral-800 uppercase border border-[#141414]">{t('Mark Resolved')}</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'inspections' && (
              <div className="bg-[#F5F4F1] border border-[#141414] border-dashed p-12 text-center shadow-[4px_4px_0px_#141414]">
                <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold uppercase tracking-widest mb-2">{t('Inspection Scheduling')}</h3>
                <p className="text-xs font-mono opacity-60 max-w-md mx-auto">{t('This module connects to the national compliance registry. Data sync in progress.')}</p>
              </div>
            )}

            {activeTab === 'gear' && (
              <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414]">
                <div className="px-4 py-3 border-b border-[#141414] bg-[#141414] text-white flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest">{t('Mine Worker Roster & Gear')}</h3>
                  <span className="text-[10px] font-mono">TOTAL WORKERS: {mineUsers.filter(u => u.role === 'worker').length}</span>
                </div>
                <div className="p-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#141414] text-[10px] font-bold uppercase tracking-widest">
                        <th className="py-2 px-4">{t('Worker Details')}</th>
                        <th className="py-2 px-4">{t('Designation')}</th>
                        <th className="py-2 px-4">{t('Status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mineUsers.filter(u => u.role === 'worker').map((u) => (
                        <tr key={u.id} className="border-b border-[#141414] hover:bg-[#F5F4F1] transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-xs font-bold">{u.name}</p>
                            <p className="text-[9px] font-mono opacity-60">{u.email}</p>
                          </td>
                          <td className="py-3 px-4 text-[10px] font-mono uppercase">{t(u.designation || 'Miner')}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-bold px-2 py-1 uppercase tracking-widest border border-[#141414] ${u.status === 'approved' ? 'bg-[#00FF00] bg-opacity-20' : 'bg-[#F27D26] text-white'}`}>
                              {t(u.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {mineUsers.filter(u => u.role === 'worker').length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-[10px] font-mono opacity-50 uppercase tracking-widest">{t('No workers assigned to this mine.')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
