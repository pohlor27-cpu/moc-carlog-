import React, { useState } from 'react';
import { Vehicle } from '../types';

interface EditMileageModalProps {
  isOpen: boolean;
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (newMileage: number) => void;
}

export const EditMileageModal: React.FC<EditMileageModalProps> = ({
  isOpen,
  vehicle,
  onClose,
  onSave,
}) => {
  const [val, setVal] = useState<number>(vehicle.currentKm);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-5 flex flex-col gap-4 shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h3 className="font-headline text-[16px] text-civic-navy font-bold">
              กำหนดเลขไมล์ของรถ ({vehicle.plate})
            </h3>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-surface-container"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-[12px] text-slate-muted">
          ยอดยกมาจากสิ้นเดือนก่อน หรือปรับแก้ไขเลขไมล์ล่าสุดของรถยนต์ราชการคันนี้
        </p>

        <div className="relative">
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(parseInt(e.target.value) || 0)}
            className="w-full h-13 px-3.5 rounded-2xl bg-surface-container-low text-civic-navy font-headline text-[18px] font-bold focus:outline-none focus:ring-2 focus:ring-civic-navy"
          />
          <span className="absolute right-4 top-3.5 text-slate-400 text-[12px] font-bold">
            กม.
          </span>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-[13px] hover:bg-slate-200 transition-all"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className="flex-1 h-12 rounded-xl bg-civic-navy text-white font-bold text-[13px] shadow-md hover:bg-civic-navy-dark active:scale-95 transition-all flex items-center justify-center gap-1.5"
            onClick={() => {
              onSave(val);
              onClose();
            }}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>บันทึกเลขไมล์</span>
          </button>
        </div>
      </div>
    </div>
  );
};
