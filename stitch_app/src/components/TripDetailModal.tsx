import React from 'react';
import { TripRecord } from '../types';

interface TripDetailModalProps {
  isOpen: boolean;
  trip: TripRecord | null;
  onClose: () => void;
  onOpenPdf: () => void;
}

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
  isOpen,
  trip,
  onClose,
  onOpenPdf,
}) => {
  if (!isOpen || !trip) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-civic-navy text-white flex items-center justify-center font-bold text-xs">
              #{trip.id}
            </div>
            <div>
              <h3 className="font-headline text-[15px] text-civic-navy font-bold">
                รายละเอียดการใช้รถราชการ
              </h3>
              <p className="text-[11px] text-slate-muted">แบบ 4 • {trip.date}</p>
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

        {/* Content */}
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">หมายเลขทะเบียน:</span>
              <span className="font-bold text-civic-navy text-[13px]">{trip.carPlate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">พนักงานขับรถ:</span>
              <span className="font-semibold text-slate-800">{trip.driverName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">เวลาออก - กลับ:</span>
              <span className="font-medium text-slate-800">
                {trip.timeDepart} - {trip.timeReturn}
              </span>
            </div>
          </div>

          {/* Odometer specs */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
              <div className="text-[10px] text-slate-500">ไมล์ออก</div>
              <div className="font-bold text-civic-navy mt-0.5">
                {trip.odoDepart.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
              <div className="text-[10px] text-slate-500">ไมล์กลับ</div>
              <div className="font-bold text-civic-navy mt-0.5">
                {trip.odoReturn.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-[10px] text-emerald-700">ระยะทาง</div>
              <div className="font-extrabold text-emerald-800 mt-0.5">
                {trip.distance} กม.
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
            <span className="text-slate-500 font-semibold">สถานที่ไป / ภารกิจปฏิบัติราชการ:</span>
            <p className="text-slate-800 font-medium leading-relaxed">{trip.places}</p>
          </div>

          {/* Approver & Fuel */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">ผู้ขอใช้ / รับรอง:</span>
              <span className="font-semibold text-slate-800">{trip.approver}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">น้ำมันเชื้อเพลิงที่เบิก:</span>
              <span className="font-bold text-amber-700">
                {trip.fuelLiters > 0 ? `${trip.fuelLiters} ลิตร` : '- ไม่ได้เบิก -'}
              </span>
            </div>
            {trip.signedBy && (
              <div className="pt-1.5 border-t border-slate-200 text-emerald-700 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  ลงนามรับรองแล้ว
                </span>
                <span className="text-slate-500">{trip.signedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-[12px]"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPdf();
            }}
            className="flex-1 h-11 rounded-xl bg-civic-navy text-white font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-md hover:bg-civic-navy-dark active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>ดูแบบฟอร์มพิมพ์</span>
          </button>
        </div>
      </div>
    </div>
  );
};
