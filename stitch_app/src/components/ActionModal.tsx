import React, { useState, useEffect } from 'react';
import { Driver, Vehicle } from '../types';

interface ActionModalProps {
  isOpen: boolean;
  type: 'depart' | 'return' | 'manual';
  vehicle: Vehicle;
  drivers: Driver[];
  activeDriver: Driver;
  onClose: () => void;
  onSubmit: (data: {
    type: 'depart' | 'return' | 'manual';
    driver: string;
    odometer: number;
    destination?: string;
    fuelLiters?: number;
    time?: string;
    date?: string;
    approver?: string;
  }) => void;
  onTriggerToast: (msg: string) => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  type,
  vehicle,
  drivers,
  activeDriver,
  onClose,
  onSubmit,
  onTriggerToast,
}) => {
  const [odometer, setOdometer] = useState<number>(vehicle.currentKm);
  const [selectedDriver, setSelectedDriver] = useState<string>(activeDriver.name);
  const [destination, setDestination] = useState<string>('');
  const [approver, setApprover] = useState<string>('ผอ.กลุ่มยุทธศาสตร์และแผนงาน');
  const [fuelLiters, setFuelLiters] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (type === 'return') {
        // Suggested return odometer +25 km
        setOdometer(vehicle.currentKm + 25);
      } else {
        setOdometer(vehicle.currentKm);
      }
      setSelectedDriver(activeDriver.name);
      setScannedImage(null);
      setIsScanning(false);
    }
  }, [isOpen, vehicle, activeDriver, type]);

  if (!isOpen) return null;

  const quickAdjust = (delta: number) => {
    setOdometer((prev) => Math.max(0, prev + delta));
  };

  const simulateCameraScan = () => {
    setIsScanning(true);
    onTriggerToast('กำลังเปิดกล้องถ่ายไมล์และวิเคราะห์ภาพ...');
    setTimeout(() => {
      setIsScanning(false);
      const randomAdd = type === 'return' ? 42 : 0;
      const detected = vehicle.currentKm + randomAdd;
      setOdometer(detected);
      setScannedImage('preview');
      onTriggerToast(`AI ตรวจพบเลขไมล์: ${detected.toLocaleString()} กม.`);
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fuel = fuelLiters ? parseFloat(fuelLiters) : 0;
    onSubmit({
      type,
      driver: selectedDriver,
      odometer: Number(odometer),
      destination: destination.trim() || 'ศาลากลาง จ.เพชรบุรี, อ.ท่ายาง',
      fuelLiters: isNaN(fuel) ? 0 : fuel,
      approver,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs p-3 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-200 border border-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                type === 'depart'
                  ? 'bg-civic-navy'
                  : type === 'return'
                  ? 'bg-emerald-600'
                  : 'bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {type === 'depart'
                  ? 'directions_car'
                  : type === 'return'
                  ? 'sports_score'
                  : 'edit_note'}
              </span>
            </div>
            <div>
              <h3 className="font-headline text-[16px] text-civic-navy font-bold">
                {type === 'depart'
                  ? 'บันทึกเวลาออกเดินทาง'
                  : type === 'return'
                  ? 'บันทึกเวลากลับถึง สนง.'
                  : 'กรอกเลขไมล์และเที่ยววิ่งเอง'}
              </h3>
              <p className="text-[11px] text-slate-muted">
                {type === 'depart'
                  ? 'เริ่มบันทึกทริปเพื่อออกเดินทางราชการ'
                  : type === 'return'
                  ? 'ปิดทริปการเดินทาง คำนวณระยะทางและเบิกน้ำมัน'
                  : 'พิมพ์ข้อมูลลงแบบฟอร์ม แบบ 4 โดยตรง'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-surface-container"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Vehicle & Driver Summary pill */}
          <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-civic-navy">{vehicle.plate}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">ผู้ขับ:</span>
            </div>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="bg-white px-2.5 py-1 rounded-xl text-civic-navy font-bold text-[12px] border border-slate-200 shadow-xs focus:outline-none"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} {d.isSpecial ? '(เฉพาะกิจ)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Odometer Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-civic-navy flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">speed</span>
                เลขไมล์หน้าปัด (กิโลเมตร) *
              </label>
              <span className="text-[11px] text-slate-500">
                ไมล์เดิม: {vehicle.currentKm.toLocaleString()} กม.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(parseInt(e.target.value) || 0)}
                  className="w-full h-13 px-3.5 rounded-2xl bg-surface-container-low text-civic-navy font-headline text-[18px] font-bold focus:outline-none focus:ring-2 focus:ring-civic-navy shadow-inner"
                  required
                />
                <span className="absolute right-3.5 top-3.5 text-slate-400 text-[12px] font-bold">
                  กม.
                </span>
              </div>
              <button
                type="button"
                onClick={() => quickAdjust(10)}
                className="h-13 px-3.5 rounded-2xl bg-surface-container text-civic-navy font-bold text-[12px] shadow-xs active:scale-95 transition-all"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => quickAdjust(50)}
                className="h-13 px-3.5 rounded-2xl bg-surface-container text-civic-navy font-bold text-[12px] shadow-xs active:scale-95 transition-all"
              >
                +50
              </button>
            </div>
            {type === 'return' && odometer > vehicle.currentKm && (
              <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                ระยะทางเที่ยวนี้: {(odometer - vehicle.currentKm).toLocaleString()} กิโลเมตร
              </div>
            )}
          </div>

          {/* AI Camera / Photo Scanner Section */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col items-center justify-center gap-2 text-center border border-slate-200/60">
            {scannedImage ? (
              <div className="flex items-center gap-2.5 w-full bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-left text-xs">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-emerald-900">ตรวจจับไมล์หน้าปัดเรียบร้อย</div>
                  <div className="text-emerald-700">รูปภาพ ODO-DASH-2569.jpg (อ่านค่า {odometer.toLocaleString()} กม.)</div>
                </div>
                <button
                  type="button"
                  onClick={() => setScannedImage(null)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ) : (
              <>
                <div className="w-11 h-11 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-civic-navy shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface text-[12px]">
                    เปิดกล้องถ่ายไมล์ / แกลลอรี่
                  </span>
                  <span className="text-[11px] text-slate-muted">
                    ระบบ AI จะอ่านตัวเลขไมล์และบันทึกเวลาให้อัตโนมัติ
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={simulateCameraScan}
                    className="px-3.5 py-1.5 rounded-xl bg-civic-navy text-white text-[11px] font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    <span>ถ่ายรูป</span>
                  </button>
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={simulateCameraScan}
                    className="px-3.5 py-1.5 rounded-xl bg-surface-container-lowest text-civic-navy text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 border border-slate-200"
                  >
                    <span className="material-symbols-outlined text-[14px]">image</span>
                    <span>เลือกรูป</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Destination & Mission (for Depart or Manual) */}
          {(type === 'depart' || type === 'manual') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-civic-navy flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">pin_drop</span>
                สถานที่ไป / ภารกิจปฏิบัติงาน
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="เช่น ศาลากลาง จ.เพชรบุรี, อ.ท่ายาง ตรวจราคาสินค้าเกษตร"
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-civic-navy"
              />
              {/* Quick tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                {['ศาลากลางเพชรบุรี', 'ตรวจตลาดสด', 'กระทรวงพาณิชย์', 'ไปรษณีย์', 'อ.ชะอำ'].map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setDestination((prev) => (prev ? `${prev}, ${tag}` : tag))
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 whitespace-nowrap hover:bg-slate-200"
                    >
                      + {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Fuel & Approver (for Return or Manual) */}
          {(type === 'return' || type === 'manual') && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-civic-navy flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">local_gas_station</span>
                  น้ำมันที่เบิก (ลิตร)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={fuelLiters}
                  onChange={(e) => setFuelLiters(e.target.value)}
                  placeholder="0 (ถ้าไม่ได้เติม)"
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-civic-navy font-bold text-amber-700"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-civic-navy flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">person_check</span>
                  ผู้ขอใช้ / รับรอง
                </label>
                <select
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-xl bg-surface-container-low text-on-surface text-[12px] focus:outline-none focus:ring-2 focus:ring-civic-navy"
                >
                  <option value="ผอ.กลุ่มยุทธศาสตร์และแผนงาน">ผอ.กลุ่มยุทธศาสตร์ฯ</option>
                  <option value="พาณิชย์จังหวัดเพชรบุรี">พาณิชย์จังหวัดเพชรบุรี</option>
                  <option value="หัวหน้าฝ่ายบริหารงานทั่วไป">หน.ฝ่ายบริหารทั่วไป</option>
                  <option value="ผอ.กลุ่มกำกับและพัฒนาเศรษฐกิจการค้า">ผอ.กลุ่มกำกับฯ</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            className={`w-full h-13 rounded-2xl text-white font-bold text-[14px] shadow-lg active:scale-95 transition-all mt-1 flex items-center justify-center gap-2 ${
              type === 'depart'
                ? 'bg-gradient-to-b from-[#184e85] to-[#08213b]'
                : type === 'return'
                ? 'bg-gradient-to-b from-emerald-500 to-emerald-700'
                : 'bg-gradient-to-b from-slate-700 to-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>
              {type === 'depart'
                ? 'ยืนยันบันทึกเวลาออก'
                : type === 'return'
                ? 'ยืนยันบันทึกเวลากลับ'
                : 'บันทึกข้อมูลเที่ยววิ่ง'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
