import React from 'react';
import { MaintenanceRecord } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  record: MaintenanceRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  record,
  onClose,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-civic-navy text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
            <div>
              <h3 className="font-headline text-[15px] text-civic-navy font-bold">
                เอกสารใบเสร็จ / ใบกำกับภาษี
              </h3>
              <p className="text-[11px] text-slate-muted">{record.receiptNumber || 'INV-OFFICIAL.jpg'}</p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Realistic Receipt Preview */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col gap-2.5 text-xs text-slate-800">
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <div className="font-bold text-[14px] text-civic-navy">{record.garage}</div>
            <div className="text-[11px] text-slate-500">ใบเสร็จรับเงิน / ใบส่งของบำรุงรักษารถราชการ</div>
            <div className="text-[10px] text-slate-400 mt-0.5">วันที่: {record.date}</div>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">หมายเลขทะเบียน:</span>
            <span className="font-bold text-civic-navy">{record.carPlate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">พนักงานขับรถ:</span>
            <span className="font-semibold">{record.driverName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">เลขไมล์เข้าซ่อม:</span>
            <span className="font-bold tabular-nums">{record.entryKm.toLocaleString()} กม.</span>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-semibold">รายการบริการ:</span>
            <p className="text-slate-800 mt-1 leading-relaxed bg-white p-2 rounded-xl border border-slate-200">
              {record.details}
            </p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t-2 border-slate-400 text-sm">
            <span className="font-bold text-slate-700">ยอดเงินสุทธิ:</span>
            <span className="font-bold text-civic-navy text-[16px]">
              ฿ {record.cost.toLocaleString()}
            </span>
          </div>

          {record.warranty && (
            <div className="text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-lg mt-1 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>{record.warranty}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-civic-navy text-white text-[13px] font-bold shadow-md hover:bg-civic-navy-dark active:scale-95 transition-all"
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
};
