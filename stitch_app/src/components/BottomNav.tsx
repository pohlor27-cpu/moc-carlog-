import React from 'react';
import { ScreenType } from '../types';

interface BottomNavProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)] no-print">
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {/* Tab 1: หน้าหลัก */}
        <button
          type="button"
          onClick={() => onNavigate('home-log')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-14 transition-all group ${
            currentScreen === 'home-log' ? 'text-civic-navy font-bold' : 'text-slate-500 hover:text-civic-navy'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 relative overflow-hidden ${
              currentScreen === 'home-log'
                ? 'text-white'
                : 'bg-gradient-to-b from-white to-slate-100 text-slate-600 border border-slate-200/80 shadow-xs'
            }`}
            style={
              currentScreen === 'home-log'
                ? {
                    background:
                      'radial-gradient(circle at 30% 25%, #2a68a5 0%, #0d3b66 65%, #051d33 100%)',
                    boxShadow:
                      '0 4px 10px rgba(13,59,102,0.35), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(147, 197, 253, 0.3)',
                  }
                : undefined
            }
          >
            {currentScreen === 'home-log' && (
              <div className="absolute top-0.5 left-1 w-4 h-2 bg-white/35 rounded-full blur-[0.4px]"></div>
            )}
            <span
              className="material-symbols-outlined text-[19px]"
              style={
                currentScreen === 'home-log'
                  ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }
                  : undefined
              }
            >
              assignment
            </span>
          </div>
          <span className="text-[11px] font-label">หน้าหลัก</span>
        </button>

        {/* Tab 2: ประวัติการเดินทาง */}
        <button
          type="button"
          onClick={() => onNavigate('trip-history')}
          className={`flex flex-col items-center justify-center gap-1 w-20 h-14 transition-all group ${
            currentScreen === 'trip-history' ? 'text-civic-navy font-bold' : 'text-slate-500 hover:text-civic-navy'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 relative overflow-hidden ${
              currentScreen === 'trip-history'
                ? 'text-white'
                : 'bg-gradient-to-b from-white to-slate-100 text-slate-600 border border-slate-200/80 shadow-xs'
            }`}
            style={
              currentScreen === 'trip-history'
                ? {
                    background:
                      'radial-gradient(circle at 30% 25%, #2a68a5 0%, #0d3b66 65%, #051d33 100%)',
                    boxShadow:
                      '0 4px 10px rgba(13,59,102,0.35), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(147, 197, 253, 0.3)',
                  }
                : undefined
            }
          >
            {currentScreen === 'trip-history' && (
              <div className="absolute top-0.5 left-1 w-4 h-2 bg-white/35 rounded-full blur-[0.4px]"></div>
            )}
            <span
              className="material-symbols-outlined text-[19px]"
              style={
                currentScreen === 'trip-history'
                  ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }
                  : undefined
              }
            >
              history_edu
            </span>
          </div>
          <span className="text-[11px] font-label">ประวัติการเดินทาง</span>
        </button>

        {/* Tab 3: แจ้งซ่อม */}
        <button
          type="button"
          onClick={() => onNavigate('maintenance-report')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-14 transition-all group ${
            currentScreen === 'maintenance-report' ? 'text-civic-navy font-bold' : 'text-slate-500 hover:text-civic-navy'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 relative overflow-hidden ${
              currentScreen === 'maintenance-report'
                ? 'text-white'
                : 'bg-gradient-to-b from-white to-slate-100 text-slate-600 border border-slate-200/80 shadow-xs'
            }`}
            style={
              currentScreen === 'maintenance-report'
                ? {
                    background:
                      'radial-gradient(circle at 30% 25%, #2a68a5 0%, #0d3b66 65%, #051d33 100%)',
                    boxShadow:
                      '0 4px 10px rgba(13,59,102,0.35), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(147, 197, 253, 0.3)',
                  }
                : undefined
            }
          >
            {currentScreen === 'maintenance-report' && (
              <div className="absolute top-0.5 left-1 w-4 h-2 bg-white/35 rounded-full blur-[0.4px]"></div>
            )}
            <span
              className="material-symbols-outlined text-[19px]"
              style={
                currentScreen === 'maintenance-report'
                  ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }
                  : undefined
              }
            >
              build_circle
            </span>
          </div>
          <span className="text-[11px] font-label">แจ้งซ่อม</span>
        </button>

        {/* Tab 4: แดชบอร์ด / ตั้งค่า */}
        <button
          type="button"
          onClick={() => onNavigate('officer-dashboard')}
          className={`flex flex-col items-center justify-center gap-1 w-20 h-14 transition-all group ${
            currentScreen === 'officer-dashboard' ? 'text-civic-navy font-bold' : 'text-slate-500 hover:text-civic-navy'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 relative overflow-hidden ${
              currentScreen === 'officer-dashboard'
                ? 'text-white'
                : 'bg-gradient-to-b from-white to-slate-100 text-slate-600 border border-slate-200/80 shadow-xs'
            }`}
            style={
              currentScreen === 'officer-dashboard'
                ? {
                    background:
                      'radial-gradient(circle at 30% 25%, #2a68a5 0%, #0d3b66 65%, #051d33 100%)',
                    boxShadow:
                      '0 4px 10px rgba(13,59,102,0.35), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(147, 197, 253, 0.3)',
                  }
                : undefined
            }
          >
            {currentScreen === 'officer-dashboard' && (
              <div className="absolute top-0.5 left-1 w-4 h-2 bg-white/35 rounded-full blur-[0.4px]"></div>
            )}
            <span
              className="material-symbols-outlined text-[19px]"
              style={
                currentScreen === 'officer-dashboard'
                  ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }
                  : undefined
              }
            >
              dashboard_customize
            </span>
          </div>
          <span className="text-[11px] font-label">แดชบอร์ด / ตั้งค่า</span>
        </button>
      </div>
    </nav>
  );
};
