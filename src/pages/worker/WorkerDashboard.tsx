import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, AlertTriangle, Book, HeartPulse, Bell, Home, User, Truck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hazard' | 'safety' | 'welfare' | 'notifications' | 'identity' | 'vehicles'>('dashboard');
  const [sosActive, setSosActive] = useState(false);
  const [sosStatus, setSosStatus] = useState<'idle' | 'holding' | 'triggered'>('idle');
  let holdTimer: NodeJS.Timeout;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSosStart = () => {
    setSosStatus('holding');
    holdTimer = setTimeout(async () => {
      setSosStatus('triggered');
      try {
        await addDoc(collection(db, 'incidents'), {
          mineId: user?.mineId || 101,
          title: 'SOS TRIGGERED',
          severity: 'High',
          status: 'Open',
          date: new Date().toISOString(),
          reportedBy: user?.name
        });
        setSosActive(true);
      } catch (e) {
        console.error(e);
      }
    }, 3000);
  };

  const handleSosEnd = () => {
    clearTimeout(holdTimer);
    if (sosStatus !== 'triggered') {
      setSosStatus('idle');
    }
  };

  const handleHazardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'incidents'), {
        mineId: user?.mineId || 101,
        title: formData.get('title'),
        description: formData.get('description'),
        severity: formData.get('severity'),
        status: 'Open',
        date: new Date().toISOString(),
        reportedBy: user?.name
      });
      alert('Hazard reported successfully');
      e.currentTarget.reset();
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'hazard', label: 'Report Hazard', icon: AlertTriangle },
    { id: 'identity', label: 'Identity Form', icon: User },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'safety', label: 'Safety Info', icon: Book },
    { id: 'welfare', label: 'My Welfare', icon: HeartPulse },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-[#E4E3E0] font-sans text-[#141414] selection:bg-[#F27D26] selection:text-white">
      {/* Header */}
      <header className="bg-[#141414] text-white p-6 relative z-10 border-b-4 border-[#F27D26] shrink-0">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white text-[#141414] border-2 border-[#141414] flex items-center justify-center text-xl font-bold font-mono">
              {user?.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">{user?.name}</h1>
              <p className="text-[10px] font-mono text-[#E4E3E0] opacity-80 uppercase tracking-widest mt-1">{t('Miner')} • Korba Mine (101)</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LanguageSelector />
            <button onClick={handleLogout} className="text-[#E4E3E0] hover:text-white hover:bg-[#F27D26] p-2 transition-colors border border-transparent hover:border-[#E4E3E0]">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Menu Bar */}
      <nav className="bg-[#141414] overflow-x-auto whitespace-nowrap border-b border-[#E4E3E0] shrink-0">
        <ul className="flex p-2 gap-2 max-w-4xl mx-auto">
          {menuItems.map(tab => (
            <li key={tab.id}>
              <button onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${activeTab === tab.id ? 'bg-[#F27D26] text-white border-[#F27D26]' : 'bg-[#141414] text-[#E4E3E0] border-[#E4E3E0] hover:bg-[#2A2A2A]'}`}>
                <tab.icon className="w-4 h-4" />
                <span>{t(tab.label)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 w-full">
        <div className="max-w-4xl mx-auto h-full">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#141414] p-4 flex justify-between items-center shadow-[4px_4px_0px_#141414]">
                <div>
                  <p className="text-[10px] font-mono text-[#141414] opacity-70 uppercase tracking-widest mb-1">{t('Total Attendance')}</p>
                  <p className="text-2xl font-mono font-bold text-green-700">24 <span className="text-[10px] font-sans font-normal text-[#141414] opacity-50 uppercase">{t('days this month')}</span></p>
                </div>
                <div className="h-10 w-px bg-[#141414] opacity-20 mx-4"></div>
                <div>
                  <p className="text-[10px] font-mono text-[#141414] opacity-70 uppercase tracking-widest mb-1">{t('Next Health Check')}</p>
                  <p className="text-md font-mono font-bold text-[#F27D26] uppercase">Oct 12</p>
                </div>
              </div>

              {/* SOS Button Area */}
              <div className="mt-8 mb-8 flex flex-col items-center justify-center border border-[#141414] bg-white p-8 shadow-[8px_8px_0px_#141414] relative">
                <div className="absolute top-0 left-0 bg-[#D93025] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">{t('Emergency Only')}</div>
                {sosActive ? (
                  <div className="bg-[#D93025] border-4 border-[#141414] p-6 text-center w-full animate-pulse shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <h3 className="text-white font-mono font-bold text-2xl mb-2 uppercase">{t('SOS TRIGGERED')}</h3>
                    <p className="text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest">Emergency services & Manager notified.<br/>Location captured.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-mono font-bold text-[#141414] opacity-70 mb-6 text-center uppercase tracking-widest mt-4">{t('Hold 3 seconds to trigger')}</p>
                    <button 
                      onMouseDown={handleSosStart}
                      onMouseUp={handleSosEnd}
                      onMouseLeave={handleSosEnd}
                      onTouchStart={handleSosStart}
                      onTouchEnd={handleSosEnd}
                      className={`w-32 h-32 flex items-center justify-center text-white font-mono font-black text-4xl border-4 border-[#141414] transition-all duration-300 ${sosStatus === 'holding' ? 'bg-[#D93025] scale-95 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]' : 'bg-[#D93025] shadow-[8px_8px_0px_#141414] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_#141414]'}`}
                    >
                      SOS
                    </button>
                    {sosStatus === 'holding' && (
                      <div className="w-48 h-3 bg-[#E4E3E0] border border-[#141414] mt-8 overflow-hidden relative">
                        <div className="h-full bg-[#141414] animate-[fill_3s_linear_forwards]" style={{ animationName: 'fill' }}></div>
                      </div>
                    )}
                    <style>{`
                      @keyframes fill {
                        0% { width: 0%; }
                        100% { width: 100%; }
                      }
                    `}</style>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hazard' && (
            <div className="bg-white border border-[#141414] shadow-[8px_8px_0px_#141414] p-6">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b-2 border-[#141414] pb-2">{t('Report Hazard')}</h2>
              <form onSubmit={handleHazardSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1">{t('Title')}</label>
                  <input name="title" required className="w-full bg-[#E4E3E0] border-2 border-[#141414] p-3 text-sm font-mono focus:outline-none focus:bg-white transition-colors" placeholder="e.g. Broken Conveyor" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1">{t('Description')}</label>
                  <textarea name="description" required rows={4} className="w-full bg-[#E4E3E0] border-2 border-[#141414] p-3 text-sm font-mono focus:outline-none focus:bg-white transition-colors" placeholder="Details of the hazard..."></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1">{t('Severity')}</label>
                  <select name="severity" className="w-full bg-[#E4E3E0] border-2 border-[#141414] p-3 text-sm font-mono focus:outline-none focus:bg-white transition-colors">
                    <option value="Low">{t('Low')}</option>
                    <option value="Medium">{t('Medium')}</option>
                    <option value="High">{t('High')}</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#141414] text-white font-bold uppercase tracking-widest py-4 border-2 border-transparent hover:bg-[#F27D26] hover:border-[#141414] transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                  {t('Submit')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="bg-white border border-[#141414] shadow-[8px_8px_0px_#141414] p-6">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b-2 border-[#141414] pb-2">{t('Identity Form')}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border-2 border-[#141414] bg-[#F5F4F1]">
                    <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{t('Full Name')}</p>
                    <p className="font-bold">{user?.name}</p>
                  </div>
                  <div className="p-3 border-2 border-[#141414] bg-[#F5F4F1]">
                    <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{t('Worker ID')}</p>
                    <p className="font-bold font-mono">W-10492</p>
                  </div>
                  <div className="p-3 border-2 border-[#141414] bg-[#F5F4F1]">
                    <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{t('Blood Group')}</p>
                    <p className="font-bold text-[#D93025]">O+</p>
                  </div>
                  <div className="p-3 border-2 border-[#141414] bg-[#F5F4F1]">
                    <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{t('Mine Assignment')}</p>
                    <p className="font-bold">Korba (101)</p>
                  </div>
                </div>
                <div className="p-4 border-2 border-[#141414] bg-[#141414] text-white">
                  <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{t('Emergency Contact')}</p>
                  <p className="font-bold text-lg mt-1">+91 98765 43210</p>
                  <p className="text-sm opacity-80">({t('Spouse')})</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="bg-white border border-[#141414] shadow-[8px_8px_0px_#141414] p-6">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b-2 border-[#141414] pb-2">{t('Vehicles')} - HEMM</h2>
              <div className="space-y-4">
                <div className="border-2 border-[#141414] p-4 bg-[#F5F4F1] flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#141414] text-white flex items-center justify-center shrink-0">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase">{t('Haul Dumper (Class A)')}</h3>
                    <p className="text-[10px] font-mono opacity-70">{t('Capacity: 100T | Keep 50m distance')}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#D93025] text-white text-[9px] font-bold uppercase">{t('Restricted Zone')}</span>
                  </div>
                </div>
                <div className="border-2 border-[#141414] p-4 bg-[#F5F4F1] flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#141414] text-white flex items-center justify-center shrink-0">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase">{t('Excavator (Class B)')}</h3>
                    <p className="text-[10px] font-mono opacity-70">{t('Bucket: 10m³ | Keep 30m distance')}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#F27D26] text-white text-[9px] font-bold uppercase">{t('Caution Zone')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'safety' || activeTab === 'welfare' || activeTab === 'notifications') && (
            <div className="bg-[#F5F4F1] border-2 border-[#141414] border-dashed p-12 text-center shadow-[4px_4px_0px_#141414]">
              <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">{t(menuItems.find(i => i.id === activeTab)?.label || 'Module')}</h3>
              <p className="text-xs font-mono opacity-60 max-w-md mx-auto">This module is currently pending synchronization with the central directory. Content will be available shortly.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
