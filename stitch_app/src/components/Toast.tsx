import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 inset-x-4 z-50 flex justify-center pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className="p-3.5 rounded-2xl bg-civic-navy text-on-primary shadow-2xl flex items-center gap-3 border border-white/20 max-w-sm w-full">
        <div className="w-8 h-8 rounded-full bg-emerald-active text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">check</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-headline text-[13px] font-bold leading-tight">{message}</div>
          <div className="text-on-primary-container text-[10px] mt-0.5">
            อัปเดตระบบและส่งประวัติลงฐานข้อมูลเรียบร้อย
          </div>
        </div>
      </div>
    </div>
  );
};
