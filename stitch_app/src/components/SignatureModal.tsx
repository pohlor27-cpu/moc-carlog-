import React, { useState } from 'react';
import { TripRecord } from '../types';

interface SignatureModalProps {
  isOpen: boolean;
  trip: TripRecord | null;
  onClose: () => void;
  onSignSuccess: (tripId: number, signerName: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  trip,
  onClose,
  onSignSuccess,
}) => {
  const [signer, setSigner] = useState('นางกานดา ชำนาญคิด (พาณิชย์จังหวัดเพชรบุรี)');
  const [hasDrawn, setHasDrawn] = useState(false);

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
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-civic-navy text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">draw</span>
            </div>
            <div>
              <h3 className="font-headline text-[15px] text-civic-navy font-bold">
                ลงนามรับรองการใช้รถราชการ
              </h3>
              <p className="text-[11px] text-slate-muted">รายการเที่ยววิ่ง #{trip.id} ({trip.date})</p>
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

        {/* Trip details summary */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">ทะเบียนรถ:</span>
            <span className="font-bold text-civic-navy">{trip.carPlate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">พนักงานขับรถ:</span>
            <span className="font-semibold text-slate-800">{trip.driverName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ระยะทาง:</span>
            <span className="font-bold text-emerald-700">{trip.distance} กิโลเมตร</span>
          </div>
          <div className="text-slate-500 pt-1 border-t border-slate-200">
            ภารกิจ: <span className="text-slate-800">{trip.places}</span>
          </div>
        </div>

        {/* Digital Signature Pad Canvas Mock */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold text-civic-navy">
              ช่องลงลายมือชื่อดิจิทัล *
            </label>
            <button
              type="button"
              onClick={() => setHasDrawn(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              ล้างลายเซ็น
            </button>
          </div>

          <div
            onClick={() => setHasDrawn(true)}
            className="w-full h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 relative flex items-center justify-center cursor-pointer hover:bg-slate-100/70 transition-colors overflow-hidden"
          >
            {hasDrawn ? (
              <svg className="w-full h-full text-civic-navy p-4" viewBox="0 0 300 100">
                <path
                  d="M20,60 Q70,10 110,65 T180,45 Q220,90 270,30"
                  fill="none"
                  stroke="#0D3B66"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="270" cy="30" r="3" fill="#0D3B66" />
                <path
                  d="M100,50 L200,50"
                  fill="none"
                  stroke="#0D3B66"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            ) : (
              <div className="text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-[24px]">gesture</span>
                <span>แตะหรือลากนิ้วที่นี่เพื่อจำลองการลงลายมือชื่อ</span>
              </div>
            )}
          </div>
        </div>

        {/* Signer Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600">ตำแหน่ง / ผู้ลงนาม</label>
          <select
            value={signer}
            onChange={(e) => setSigner(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-slate-50 text-[12px] text-slate-800 border border-slate-200 focus:outline-none font-medium"
          >
            <option value="นางกานดา ชำนาญคิด (พาณิชย์จังหวัดเพชรบุรี)">
              นางกานดา ชำนาญคิด (พาณิชย์จังหวัดเพชรบุรี)
            </option>
            <option value="นายสมชาย วิริยะพาณิชย์ (ผอ.กลุ่มยุทธศาสตร์ฯ)">
              นายสมชาย วิริยะพาณิชย์ (ผอ.กลุ่มยุทธศาสตร์ฯ)
            </option>
            <option value="น.ส.รัตนา เกียรติกำจร (หน.ฝ่ายบริหารงานทั่วไป)">
              น.ส.รัตนา เกียรติกำจร (หน.ฝ่ายบริหารงานทั่วไป)
            </option>
          </select>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-[13px]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onSignSuccess(trip.id, signer);
              onClose();
            }}
            className="flex-1 h-12 rounded-xl bg-gradient-to-b from-[#184e85] to-[#08213b] text-white font-bold text-[13px] shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>บันทึกลงนาม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
