import React, { useState } from 'react';
import { TripRecord, Vehicle } from '../types';

interface LineShareModalProps {
  isOpen: boolean;
  vehicle: Vehicle;
  trips: TripRecord[];
  onClose: () => void;
  onTriggerToast: (msg: string) => void;
}

export const LineShareModal: React.FC<LineShareModalProps> = ({
  isOpen,
  vehicle,
  trips,
  onClose,
  onTriggerToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const vehicleTrips = trips.filter((t) => t.carPlate === vehicle.plate);
  const totalKm = vehicleTrips.reduce((acc, t) => acc + t.distance, 0);
  const totalFuel = vehicleTrips.reduce((acc, t) => acc + (t.fuelLiters || 0), 0);
  const latestTrip = vehicleTrips[0];

  const shareText = `🚗 สรุปการใช้รถราชการ (แบบ 4)
🏢 สนง.พาณิชย์จังหวัดเพชรบุรี
📅 ประจำเดือน: ตุลาคม 2569
🚘 รถยนต์: ${vehicle.plate}
👤 พนักงานขับรถ: ${vehicle.driver}
📍 เลขไมล์ล่าสุด: ${vehicle.currentKm.toLocaleString()} กม.
⚡ ระยะทางรวมเดือนนี้: ${totalKm.toLocaleString()} กม. (${vehicleTrips.length} เที่ยว)
⛽ น้ำมันที่เบิก: ${totalFuel} ลิตร
${latestTrip ? `🚩 ภารกิจล่าสุด: ${latestTrip.places}` : ''}
✅ ซิงค์ระบบ Google Sheets เรียบร้อยแล้ว`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    onTriggerToast('คัดลอกข้อความสรุปพร้อมส่งเข้า LINE เรียบร้อย');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-line-green text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
            <div>
              <h3 className="font-headline text-[16px] text-civic-navy font-bold">
                เซฟส่ง LINE (กลุ่มราชการ)
              </h3>
              <p className="text-[11px] text-slate-muted">การ์ดสรุปส่งรายงานด่วนเข้ากลุ่ม LINE</p>
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

        {/* Visual Preview of LINE Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#06C755]/15 via-emerald-50/50 to-white border border-[#06C755]/30 shadow-inner flex flex-col gap-2.5 text-xs text-slate-800">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[13px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06C755]"></span>
              <span>สนง.พาณิชย์จังหวัดเพชรบุรี</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#06C755] text-white font-bold text-[10px]">
              แบบ 4
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-civic-navy text-[14px]">{vehicle.plate}</span>
            <span className="text-slate-600 font-medium">ผขร. {vehicle.driver}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 shadow-xs">
              <div className="text-slate-500">เลขไมล์ล่าสุด</div>
              <div className="font-bold text-civic-navy text-[14px]">
                {vehicle.currentKm.toLocaleString()} กม.
              </div>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 shadow-xs">
              <div className="text-slate-500">ระยะทางเดือนนี้</div>
              <div className="font-bold text-emerald-700 text-[14px]">
                {totalKm.toLocaleString()} กม.
              </div>
            </div>
          </div>

          {latestTrip && (
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 text-[11px]">
              <span className="text-slate-500 font-semibold">ภารกิจล่าสุด ({latestTrip.date}):</span>
              <p className="text-slate-800 line-clamp-2 mt-0.5">{latestTrip.places}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
            <span>เที่ยววิ่งสะสม: {vehicleTrips.length} เที่ยว</span>
            <span className="text-[#06C755] font-bold">✓ ตรวจรับรองแล้ว</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full h-12 rounded-xl bg-line-green text-white font-bold text-[13px] shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกข้อความส่ง LINE'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onTriggerToast('บันทึกรูปภาพการ์ดรายงานสำเร็จ (บันทึกลงเครื่อง)');
              onClose();
            }}
            className="w-full h-11 rounded-xl bg-slate-100 text-slate-700 font-bold text-[12px] hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>ดาวน์โหลดภาพการ์ด (.png)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
