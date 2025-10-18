import React from 'react';
import { User } from '../types';

interface SidebarProps {
  agents: string[];
  currentView: string;
  onSelectView: (view: string) => void;
  analysisLoaded: boolean;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ agents, currentView, onSelectView, analysisLoaded, user, onLogout }) => {
  const baseItemClass = "w-full text-right px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-3";
  const activeItemClass = "bg-cyan-600 text-white font-bold";
  const inactiveItemClass = "text-gray-300 hover:bg-gray-700 hover:text-white";

  const getButtonClass = (view: string) => `${baseItemClass} ${currentView === view ? activeItemClass : inactiveItemClass}`;

  const initialView = user.role === 'admin' ? 'management' : (analysisLoaded ? 'overview' : 'uploader');

  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col h-screen sticky top-0">
      <div className="text-center mb-8 px-2">
        <h1 
            className="text-2xl font-bold text-white interactive-text-glow cursor-pointer"
            onClick={() => onSelectView(initialView)}
        >
            شركة السحابة
        </h1>
      </div>
      <nav className="flex-grow overflow-y-auto space-y-2 pr-2">
        <ul>
          <li className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            القائمة الرئيسية
          </li>
           {user.role === 'admin' && (
             <>
              <li>
                <button onClick={() => onSelectView('management')} className={getButtonClass('management')}>
                    <CogIcon /> إدارة الوكلاء
                </button>
              </li>
             </>
           )}
          <li>
            <button onClick={() => onSelectView('map')} className={getButtonClass('map')}>
                <MapIcon /> الخريطة التفاعلية
            </button>
          </li>
          <li>
            <button onClick={() => onSelectView('uploader')} className={getButtonClass('uploader')}>
              <UploadIcon /> رفع ملف
            </button>
          </li>

          <li className={`px-4 py-2 mt-4 text-xs font-semibold uppercase tracking-wider ${analysisLoaded ? 'text-gray-400' : 'text-gray-600'}`}>
            التحليلات
          </li>
          <li>
            <button
              onClick={() => onSelectView('overview')}
              disabled={!analysisLoaded}
              className={`${getButtonClass('overview')} ${!analysisLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChartBarIcon /> نظرة عامة
            </button>
          </li>
          {analysisLoaded && (
            <>
              <li className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                عرض فردي
              </li>
              {agents.map(agent => (
                <li key={agent}>
                  <button
                    onClick={() => onSelectView(agent)}
                    className={getButtonClass(agent)}
                  >
                    {agent}
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-700">
         <div className="p-3 bg-gray-900/50 rounded-lg text-center">
            <p className="text-sm font-semibold text-white">مرحباً، {user.username}</p>
            <p className="text-xs text-cyan-400">{user.role === 'admin' ? 'مسؤول' : 'موظف'}</p>
         </div>
         <button onClick={onLogout} className="w-full mt-3 text-right px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors duration-200 flex items-center gap-3">
            <LogoutIcon /> تسجيل الخروج
         </button>
      </div>
    </aside>
  );
};


// Icons
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;
const MapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293A1 1 0 0016 6v10a1 1 0 00.293.707L20 20.414V7.586L17.707 5.293z" clipRule="evenodd" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;

export default Sidebar;