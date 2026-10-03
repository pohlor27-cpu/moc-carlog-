import React, { useState } from 'react';
import { ScreenType } from '../types';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenPinModal: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenPinModal,
  unreadCount = 2,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe no-print">
        <div className="h-28 px-4 flex flex-col justify-center gap-1.5 max-w-lg mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-on-primary flex-shrink-0 relative overflow-hidden"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, #2a68a5 0%, #0d3b66 65%, #051d33 100%)',
                  boxShadow:
                    '0 6px 14px -2px rgba(13,59,102,0.45), inset 0 2px 3px rgba(255,255,255,0.45), inset 0 -3px 4px rgba(0,0,0,0.35)',
                }}
              >
                <div className="absolute top-1 left-1.5 w-4 h-2 rounded-full bg-white/35 blur-[1px] pointer-events-none"></div>
                <span
                  className="material-symbols-outlined text-[24px] relative z-10"
                  style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}
                >
                  directions_car
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[16px] leading-tight text-civic-navy truncate font-headline">
                    บันทึกการใช้รถราชการ
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-lg text-civic-navy font-bold text-[10px] flex-shrink-0"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #e2ecfd 100%)',
                      boxShadow:
                        '0 2px 4px rgba(13,59,102,0.1), inset 0 1px 1px #ffffff, inset 0 -1px 2px rgba(13,59,102,0.15)',
                    }}
                  >
                    แบบ 4
                  </span>
                </div>
                <span className="text-[11px] text-slate-muted truncate font-medium">
                  สนง.พาณิชย์จังหวัดเพชรบุรี
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Button */}
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all relative"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #eef3fb 100%)',
                  boxShadow:
                    '0 4px 10px rgba(13,59,102,0.08), inset 0 1.5px 2px #ffffff, inset 0 -2px 3px rgba(0,0,0,0.08)',
                }}
                aria-label="แจ้งเตือน"
              >
                <span
                  className="material-symbols-outlined text-[21px] text-civic-navy"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(13,59,102,0.25))' }}
                >
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 35% 35%, #ff758c 0%, #ff375f 70%, #b80028 100%)',
                      boxShadow: '0 2px 4px rgba(255,55,95,0.5)',
                    }}
                  ></span>
                )}
              </button>

              {/* Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white transition-all relative overflow-hidden"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, #2a68a5 0%, #002546 70%, #001224 100%)',
                  boxShadow:
                    '0 4px 10px rgba(0,37,70,0.35), inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -2px 3px rgba(0,0,0,0.4)',
                }}
                aria-label="เมนูหลัก"
              >
                <div className="absolute top-1 left-1.5 w-3.5 h-1.5 rounded-full bg-white/30 blur-[0.5px] pointer-events-none"></div>
                <span
                  className="material-symbols-outlined text-[20px] text-white relative z-10"
                  style={{ filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.35))' }}
                >
                  menu
                </span>
              </button>
            </div>
          </div>

          {/* Subheader Switcher: Driver Home vs Officer Dashboard */}
          <div
            className="flex p-1 bg-surface-container-low/90 rounded-2xl"
            style={{
              boxShadow:
                'rgba(0, 0, 0, 0.06) 0px 2px 4px inset, rgba(255, 255, 255, 0.8) 0px -1px 2px inset',
            }}
          >
            <button
              type="button"
              onClick={() => onNavigate('home-log')}
              className={`flex-1 py-2 rounded-xl text-center text-[12px] transition-all flex items-center justify-center gap-1.5 ${
                currentScreen === 'home-log'
                  ? 'text-civic-navy font-bold'
                  : 'text-on-surface-variant hover:text-civic-navy font-medium'
              }`}
              style={
                currentScreen === 'home-log'
                  ? {
                      background: 'linear-gradient(180deg, #ffffff 0%, #f4f7fc 100%)',
                      boxShadow:
                        '0 4px 8px -1px rgba(13,59,102,0.12), 0 2px 4px rgba(0,0,0,0.04), inset 0 1.5px 1.5px #ffffff, inset 0 -1px 2px rgba(13,59,102,0.08)',
                    }
                  : undefined
              }
            >
              <span
                className={`w-5 h-5 rounded-lg flex items-center justify-center text-[13px] ${
                  currentScreen === 'home-log'
                    ? 'text-white'
                    : 'text-slate-muted bg-white/70 shadow-sm'
                }`}
                style={
                  currentScreen === 'home-log'
                    ? {
                        background: 'radial-gradient(circle at 30% 25%, #3a75b3 0%, #0d3b66 80%)',
                        boxShadow:
                          '0 2px 4px rgba(13,59,102,0.3), inset 0 1px 1px rgba(255,255,255,0.4)',
                      }
                    : undefined
                }
              >
                <span className="material-symbols-outlined text-[14px]">person_pin</span>
              </span>
              <span>หน้าหลัก (ผขร.)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('officer-dashboard')}
              className={`flex-1 py-2 rounded-xl text-center text-[12px] transition-all flex items-center justify-center gap-1.5 ${
                currentScreen === 'officer-dashboard'
                  ? 'text-civic-navy font-bold'
                  : 'text-on-surface-variant hover:text-civic-navy font-medium'
              }`}
              style={
                currentScreen === 'officer-dashboard'
                  ? {
                      background: 'linear-gradient(180deg, #ffffff 0%, #f4f7fc 100%)',
                      boxShadow:
                        '0 4px 8px -1px rgba(13,59,102,0.12), 0 2px 4px rgba(0,0,0,0.04), inset 0 1.5px 1.5px #ffffff, inset 0 -1px 2px rgba(13,59,102,0.08)',
                    }
                  : undefined
              }
            >
              <span
                className={`w-5 h-5 rounded-lg flex items-center justify-center text-[13px] ${
                  currentScreen === 'officer-dashboard'
                    ? 'text-white'
                    : 'text-slate-muted bg-white/70 shadow-sm'
                }`}
                style={
                  currentScreen === 'officer-dashboard'
                    ? {
                        background: 'radial-gradient(circle at 30% 25%, #3a75b3 0%, #0d3b66 80%)',
                        boxShadow:
                          '0 2px 4px rgba(13,59,102,0.3), inset 0 1px 1px rgba(255,255,255,0.4)',
                      }
                    : undefined
                }
              >
                <span className="material-symbols-outlined text-[14px]">monitoring</span>
              </span>
              <span>แดชบอร์ดเจ้าหน้าที่</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Dropdown Panel */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex justify-end p-4 pt-20"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-3 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-civic-navy text-[20px]">notifications_active</span>
                <span className="font-bold text-[14px] text-civic-navy font-headline">การแจ้งเตือนระบบ</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-[18px] flex-shrink-0 mt-0.5">oil_barrel</span>
                <div>
                  <div className="font-bold text-amber-900">รถยนต์ กอ 409 เพชรบุรี</div>
                  <div className="text-amber-800">ถึงรอบเปลี่ยนถ่ายน้ำมันเครื่อง (วิ่งเกินกำหนด 450 กม.)</div>
                  <div className="text-[10px] text-amber-600 mt-1">วันนี้ 08:30 น.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-civic-navy text-[18px] flex-shrink-0 mt-0.5">verified</span>
                <div>
                  <div className="font-bold text-civic-navy">รถยนต์ นจ 4648 เพชรบุรี</div>
                  <div className="text-slate-600">นัดหมายตรวจสภาพรถยนต์ประจำปีวันที่ 5 พ.ย. 2569</div>
                  <div className="text-[10px] text-slate-400 mt-1">เมื่อวานนี้ 16:45 น.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px] flex-shrink-0 mt-0.5">check_circle</span>
                <div>
                  <div className="font-bold text-emerald-900">ซิงค์ Google Sheets สำเร็จ</div>
                  <div className="text-emerald-800">บันทึกข้อมูลเที่ยววิ่ง #18 ซิงค์เข้า Google Drive เรียบร้อย</div>
                  <div className="text-[10px] text-emerald-600 mt-1">28 ต.ค. 2569</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hamburger Drawer Menu */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-all"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-surface-container-lowest shadow-2xl flex flex-col p-4 gap-3 pt-safe animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#1b4b7a] to-civic-navy text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px]">menu_open</span>
                </div>
                <span className="font-headline text-[16px] text-civic-navy font-bold">
                  เมนูระบบ
                </span>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-surface-container"
                onClick={() => setDrawerOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
              <button
                type="button"
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  currentScreen === 'home-log'
                    ? 'bg-civic-navy-light text-civic-navy font-bold border border-civic-navy/20'
                    : 'text-on-surface hover:bg-slate-50'
                }`}
                onClick={() => {
                  onNavigate('home-log');
                  setDrawerOpen(false);
                }}
              >
                <span className="material-symbols-outlined text-[22px] text-civic-navy">
                  assignment
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">หน้าบันทึกการใช้รถ (แบบ 4)</span>
                  <span className="text-[11px] text-slate-muted">หน้าหลักสำหรับพนักงานขับรถ</span>
                </div>
              </button>

              <button
                type="button"
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  currentScreen === 'trip-history'
                    ? 'bg-civic-navy-light text-civic-navy font-bold border border-civic-navy/20'
                    : 'text-on-surface hover:bg-slate-50'
                }`}
                onClick={() => {
                  onNavigate('trip-history');
                  setDrawerOpen(false);
                }}
              >
                <span className="material-symbols-outlined text-[22px] text-civic-navy">
                  history_edu
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">ประวัติการเดินทาง & รายงานแบบ 4</span>
                  <span className="text-[11px] text-slate-muted">สมุดบันทึกย้อนหลัง & พิมพ์ PDF</span>
                </div>
              </button>

              <button
                type="button"
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  currentScreen === 'maintenance-report'
                    ? 'bg-civic-navy-light text-civic-navy font-bold border border-civic-navy/20'
                    : 'text-on-surface hover:bg-slate-50'
                }`}
                onClick={() => {
                  onNavigate('maintenance-report');
                  setDrawerOpen(false);
                }}
              >
                <span className="material-symbols-outlined text-[22px] text-civic-navy">
                  build_circle
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">แจ้งซ่อมบำรุง / เข้าศูนย์ (Fleet Care)</span>
                  <span className="text-[11px] text-slate-muted">บันทึกเปลี่ยนถ่ายน้ำมัน & ซ่อมบำรุง</span>
                </div>
              </button>

              <button
                type="button"
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  currentScreen === 'officer-dashboard'
                    ? 'bg-civic-navy-light text-civic-navy font-bold border border-civic-navy/20'
                    : 'text-on-surface hover:bg-slate-50'
                }`}
                onClick={() => {
                  onNavigate('officer-dashboard');
                  setDrawerOpen(false);
                }}
              >
                <span className="material-symbols-outlined text-[22px] text-civic-navy">
                  monitoring
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">แดชบอร์ดเจ้าหน้าที่</span>
                  <span className="text-[11px] text-slate-muted">สรุปไมล์รวม & ตรวจสอบงาน</span>
                </div>
              </button>

              <div className="pt-2 border-t border-slate-200 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenPinModal();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-slate-50 text-civic-navy font-semibold transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                  <span className="text-[13px]">จัดการ PIN เจ้าหน้าที่</span>
                </button>
              </div>
            </div>

            {/* Profile footer in drawer */}
            <div className="mt-auto p-3 bg-slate-100 rounded-xl flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-civic-navy text-white flex items-center justify-center font-bold text-[14px]">
                ก
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-on-surface truncate">
                  นายกฤษณพัฒน์ แสงหล้า
                </span>
                <span className="text-[10px] text-slate-muted">
                  พนักงานขับรถ สนง.พาณิชย์ จ.เพชรบุรี
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
