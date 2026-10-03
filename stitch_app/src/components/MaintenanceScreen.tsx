import React, { useState } from 'react';
import { MaintenanceCategory, MaintenanceRecord, Vehicle } from '../types';

interface MaintenanceScreenProps {
  vehicles: Vehicle[];
  activeVehicle: Vehicle;
  maintenanceRecords: MaintenanceRecord[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAddRecord: (record: MaintenanceRecord) => void;
  onOpenReceiptModal: (record: MaintenanceRecord) => void;
  onTriggerToast: (msg: string) => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  vehicles,
  activeVehicle,
  maintenanceRecords,
  onSelectVehicle,
  onAddRecord,
  onOpenReceiptModal,
  onTriggerToast,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<MaintenanceCategory>('เปลี่ยนยาง / สลับยาง');
  const [increment, setIncrement] = useState<number>(40000);
  const [serviceDate, setServiceDate] = useState<string>('2025-05-15');
  const [entryMileage, setEntryMileage] = useState<number>(activeVehicle.currentKm);
  const [garageName, setGarageName] = useState<string>('ศูนย์บริการโตโยต้าเพชรบุรี');
  const [repairCost, setRepairCost] = useState<string>('');
  const [serviceDetail, setServiceDetail] = useState<string>(
    'เปลี่ยนน้ำมันเครื่องสังเคราะห์แท้ 10W-30 พร้อมกรองแท้ศูนย์...'
  );
  const [hasPhoto, setHasPhoto] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  const calculatedNextMileage =
    increment > 0 ? Number(entryMileage) + increment : Number(entryMileage);

  const handleCategorySelect = (cat: MaintenanceCategory, inc: number) => {
    setSelectedCategory(cat);
    setIncrement(inc);
  };

  const handleAppendTag = (tag: string) => {
    setServiceDetail((prev) => {
      const trimmed = prev.trim();
      if (!trimmed || trimmed === 'เปลี่ยนน้ำมันเครื่องสังเคราะห์แท้ 10W-30 พร้อมกรองแท้ศูนย์...') {
        return tag;
      }
      return `${trimmed}, ${tag}`;
    });
  };

  const handleTriggerCamera = () => {
    onTriggerToast('เปิดกล้องถ่ายใบเสร็จ / ใบแจ้งหนี้พัสดุ...');
    setTimeout(() => {
      setHasPhoto(true);
      onTriggerToast('แนบภาพใบเสร็จเรียบร้อยแล้ว (INV-2568-0515.jpg)');
    }, 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(repairCost) || 0;
    const newRecord: MaintenanceRecord = {
      id: `m-${Date.now()}`,
      carPlate: activeVehicle.plate,
      driverName: activeVehicle.driver,
      title: `${selectedCategory}`,
      category: selectedCategory,
      status: 'completed',
      cost,
      date: new Date(serviceDate).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      garage: garageName.trim() || 'ศูนย์บริการมาตรฐาน',
      entryKm: Number(entryMileage),
      nextKm: calculatedNextMileage,
      details: serviceDetail,
      warranty: increment > 0 ? `รอบถัดไป: ${calculatedNextMileage.toLocaleString()} กม.` : 'รับประกันงานซ่อม 6 เดือน',
      hasReceipt: hasPhoto,
      receiptNumber: hasPhoto ? 'INV-2568-0515.jpg' : undefined,
    };

    onAddRecord(newRecord);
    onTriggerToast('บันทึกประวัติการบำรุงรักษาเรียบร้อยแล้ว');
  };

  const handleResetForm = () => {
    setRepairCost('');
    setServiceDetail('');
    setHasPhoto(false);
    onTriggerToast('ล้างฟอร์มเรียบร้อย');
  };

  // Remaining km calculations
  const remaining = activeVehicle.nextOilKm - activeVehicle.currentKm;
  const isOverdue = remaining < 0;
  const progressPercent = Math.min(
    100,
    Math.max(10, Math.round(((10000 - Math.max(0, remaining)) / 10000) * 100))
  );

  const filteredHistory = maintenanceRecords.filter((rec) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'oil') return rec.category === 'ถ่ายน้ำมันเครื่อง';
    if (historyFilter === 'garage') return rec.category === 'แจ้งซ่อมบำรุง / ศูนย์';
    if (historyFilter === 'tires') return rec.category === 'เปลี่ยนยาง / สลับยาง';
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-5 pb-10">
      {/* Top Utility Bar: Civic Brand Identity & Fleet Summary */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#1c558f] to-[#092543] flex items-center justify-center text-white shadow-md border border-white/20">
            <span className="material-symbols-outlined text-[19px]">build</span>
          </div>
          <div>
            <h1 className="font-headline text-civic-navy text-[16px] leading-tight font-bold">
              บันทึกบำรุงรักษา / แจ้งซ่อม
            </h1>
            <p className="text-[11px] text-slate-muted">สนง.พาณิชย์จังหวัดเพชรบุรี (Fleet Care)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-gradient-to-b from-white to-blue-50/80 text-civic-navy px-3 py-1.5 rounded-full shadow-xs border border-blue-100">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-civic-navy">ระบบพร้อมบันทึก</span>
        </div>
      </div>

      {/* SECTION 1: Vehicle Selector with Real-time Service Status */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[12px] text-civic-navy flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined text-[16px]">directions_car</span>
            เลือกรถยนต์ราชการ (4 คัน)
          </span>
          <span className="text-[11px] text-slate-500">แตะเพื่อสลับคัน</span>
        </div>

        {/* 2x2 Interactive Vehicle Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {vehicles.map((v) => {
            const isSelected = activeVehicle.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onSelectVehicle(v);
                  setEntryMileage(v.currentKm);
                  onTriggerToast(`เลือกรถยนต์: ${v.plate}`);
                }}
                className={`text-left p-3 rounded-2xl relative transition-all duration-150 flex flex-col justify-between h-28 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#14477b] to-[#092644] text-white shadow-lg border border-blue-400/30'
                    : 'bg-surface-container-lowest text-on-surface shadow-xs border border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs ${
                      isSelected
                        ? 'bg-white/20 border border-white/30'
                        : v.status === 'warning'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : v.status === 'pending'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-blue-100 text-civic-navy border border-blue-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {v.status === 'warning' ? 'oil_barrel' : 'directions_car'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 shadow-xs ${
                      v.status === 'warning'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : v.status === 'pending'
                        ? 'bg-sky-100 text-sky-900 border border-sky-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {v.status === 'warning' ? (
                      <>
                        <span className="material-symbols-outlined text-[11px]">warning</span>
                        <span>ถึงรอบถ่ายน้ำมัน</span>
                      </>
                    ) : v.status === 'pending' ? (
                      'รอตรวจเช็ค'
                    ) : (
                      'ปกติ'
                    )}
                  </span>
                </div>

                <div className="min-w-0">
                  <div
                    className={`font-headline text-[14px] font-bold tracking-tight truncate leading-tight ${
                      isSelected ? 'text-white' : 'text-civic-navy'
                    }`}
                  >
                    {v.plate}
                  </div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      isSelected ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {v.driver}
                  </div>
                </div>

                <div
                  className={`w-full flex items-center justify-between pt-1 border-t text-[10px] ${
                    isSelected
                      ? 'border-white/15 text-blue-200'
                      : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <span>ไมล์: {v.currentKm.toLocaleString()} กม.</span>
                  <span
                    className={`font-bold ${
                      isSelected
                        ? 'text-secondary-fixed'
                        : v.status === 'warning'
                        ? 'text-amber-warning'
                        : 'text-civic-navy'
                    }`}
                  >
                    {v.status === 'warning'
                      ? 'เกิน 450 กม.'
                      : v.status === 'pending'
                      ? 'ตรวจสภาพปี'
                      : `รอบเตือน ${(v.nextOilKm / 1000).toFixed(0)}k`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Hero Inspection & Odometer Sticker Reminder Widget */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-card-dark text-slate-surface p-4 shadow-xl border border-slate-700/60">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-civic-navy/30 pointer-events-none flex items-center justify-center opacity-40">
          <span className="material-symbols-outlined text-[100px] text-surface-container-highest/10">
            verified
          </span>
        </div>

        {/* Active Car Pill Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#194f86] to-[#08223d] text-white font-headline text-[13px] font-bold tracking-wide shadow-md border border-blue-400/30">
              <span>{activeVehicle.plate}</span>
            </div>
            <span className="text-slate-400 text-[11px]">ผู้ดูแล: {activeVehicle.driver}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-secondary-fixed text-[11px] font-bold">
            <span className="material-symbols-outlined text-[14px]">speed</span>
            <span>{activeVehicle.currentKm.toLocaleString()} กม.</span>
          </div>
        </div>

        {/* Primary Milestone Progress */}
        <div className="mt-3.5 relative z-10">
          <div className="flex items-baseline justify-between">
            <span className="text-slate-100 flex items-center gap-2 text-[12px] font-semibold">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[14px]">oil_barrel</span>
              </div>
              สติกเกอร์ถ่ายน้ำมันรอบถัดไป
            </span>
            <span className="font-odometer text-secondary-fixed text-[20px] font-bold tracking-tight">
              {activeVehicle.nextOilKm.toLocaleString()} กม.
            </span>
          </div>

          {/* Distance Progress Bar */}
          <div className="w-full bg-slate-800 h-3 rounded-full mt-2.5 p-0.5 shadow-inner border border-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverdue
                  ? 'bg-amber-warning'
                  : 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-200'
              }`}
              style={{ width: isOverdue ? '100%' : `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-slate-400">วิ่งมาแล้ว 2,204 กม. ในรอบนี้</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                isOverdue ? 'text-amber-warning' : 'text-secondary-fixed'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isOverdue ? 'warning' : 'schedule'}
              </span>
              <span>
                {isOverdue
                  ? `เกินรอบแล้ว ${Math.abs(remaining).toLocaleString()} กม.`
                  : `เหลืออีก ${remaining.toLocaleString()} กม.`}
              </span>
            </span>
          </div>
        </div>

        {/* Tax & Mandatory Vehicle Inspection Strip */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-700/60 relative z-10 text-[11px]">
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-[17px]">receipt_long</span>
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 text-[10px]">ต่อภาษี / พ.ร.บ.</div>
              <div className="text-white text-[11px] font-bold truncate">
                {activeVehicle.taxDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-[17px]">health_and_safety</span>
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 text-[10px]">ตรวจสภาพประจำปี</div>
              <div className="text-white text-[11px] font-bold truncate">
                {activeVehicle.inspectionDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Service Entry Form (แบบ พ.4) */}
      <div className="rounded-2xl bg-surface-container-lowest shadow-sm p-4 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-civic-navy flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
            </div>
            <div>
              <h2 className="font-headline text-civic-navy text-[15px] font-bold">
                แบบฟอร์มบันทึกบำรุงรักษา
              </h2>
              <p className="text-[11px] text-slate-muted">
                บันทึกข้อมูลเพื่อคำนวณรอบถัดไปและส่งรายงานพัสดุ
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-civic-navy text-[10px] font-bold border border-blue-200">
            แบบ พ.4
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector Pills (4 categories) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[12px] text-civic-navy font-bold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-civic-navy">
                <span className="material-symbols-outlined text-[13px]">category</span>
              </span>
              ประเภทรายการบำรุงรักษา *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  name: 'ถ่ายน้ำมันเครื่อง' as MaintenanceCategory,
                  inc: 10000,
                  icon: 'oil_barrel',
                  color: 'amber',
                },
                {
                  name: 'แจ้งซ่อมบำรุง / ศูนย์' as MaintenanceCategory,
                  inc: 0,
                  icon: 'handyman',
                  color: 'blue',
                },
                {
                  name: 'ตรวจสภาพตามระยะ' as MaintenanceCategory,
                  inc: 10000,
                  icon: 'manage_search',
                  color: 'teal',
                },
                {
                  name: 'เปลี่ยนยาง / สลับยาง' as MaintenanceCategory,
                  inc: 40000,
                  icon: 'restart_alt',
                  color: 'slate',
                },
              ].map((item) => {
                const isActive = selectedCategory === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleCategorySelect(item.name, item.inc)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-[12px] font-semibold transition-all duration-150 active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-b from-[#184e85] to-[#08213b] text-white shadow-md border border-blue-400/30'
                        : 'bg-gradient-to-b from-white to-slate-100 text-on-surface border border-slate-200 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-xs ${
                        item.color === 'amber'
                          ? 'bg-amber-500'
                          : item.color === 'blue'
                          ? 'bg-blue-500'
                          : item.color === 'teal'
                          ? 'bg-teal-500'
                          : 'bg-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                    </div>
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Current Entry Odometer Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-[12px] text-civic-navy font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-civic-navy">
                  calendar_month
                </span>
                วันที่เข้าศูนย์ / ซ่อม *
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="h-12 w-full rounded-xl bg-surface-container-low px-3 text-[13px] border border-slate-200/60 focus:outline-none focus:bg-surface-container-high transition-all"
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[12px] text-civic-navy font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-civic-navy">pin</span>
                เลขไมล์ตอนเข้า (กม.) *
              </label>
              <input
                type="number"
                value={entryMileage}
                onChange={(e) => setEntryMileage(parseInt(e.target.value) || 0)}
                placeholder="เช่น 52204"
                className="h-12 w-full rounded-xl bg-surface-container-low px-3 font-odometer text-civic-navy text-[16px] font-bold border border-slate-200/60 focus:outline-none focus:bg-surface-container-high transition-all"
                required
              />
            </div>
          </div>

          {/* Auto Calculated Next Odometer Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-100/60 to-emerald-50 border border-emerald-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[17px]">notification_add</span>
              </div>
              <div className="min-w-0">
                <div className="text-emerald-800 text-[11px] font-bold">
                  สติกเกอร์เตือนถ่ายครั้งถัดไป (+{increment.toLocaleString()} กม.)
                </div>
                <div className="text-slate-500 text-[11px] truncate">
                  ระบบจะแจ้งเตือนเมื่อไมล์รถใกล้ถึงตัวเลขนี้
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 pl-2">
              <span className="font-odometer text-emerald-700 text-[17px] font-bold">
                {calculatedNextMileage.toLocaleString()}
              </span>
              <span className="text-emerald-700 text-[10px] ml-0.5">กม.</span>
            </div>
          </div>

          {/* Garage & Expense Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-[12px] text-civic-navy font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-civic-navy">
                  storefront
                </span>
                อู่ / ศูนย์บริการ *
              </label>
              <input
                type="text"
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                placeholder="ระบุชื่อศูนย์หรืออู่"
                className="h-12 w-full rounded-xl bg-surface-container-low px-3 text-[13px] border border-slate-200/60 focus:outline-none focus:bg-surface-container-high transition-all"
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[12px] text-civic-navy font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-civic-navy">
                  payments
                </span>
                ค่าใช้จ่าย (บาท)
              </label>
              <input
                type="number"
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
                placeholder="0.00"
                className="h-12 w-full rounded-xl bg-surface-container-low px-3 text-civic-navy text-[14px] font-bold border border-slate-200/60 focus:outline-none focus:bg-surface-container-high transition-all"
              />
            </div>
          </div>

          {/* Details & Quick Preset Chips */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-civic-navy font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-civic-navy">notes</span>
                รายละเอียด / อาการที่แจ้งซ่อม
              </label>
              <span className="text-slate-400 text-[10px]">เลือกข้อความด่วน:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['เปลี่ยนไส้กรองน้ำมัน', 'เช็คผ้าเบรกหน้า-หลัง', 'เปลี่ยนน้ำมันเกียร์', 'ตั้งศูนย์ถ่วงล้อ'].map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAppendTag(chip)}
                    className="px-2.5 py-1 rounded-full bg-gradient-to-b from-white to-slate-100 text-civic-navy text-[11px] font-semibold whitespace-nowrap border border-slate-200 hover:bg-slate-200 shadow-xs"
                  >
                    + {chip}
                  </button>
                )
              )}
            </div>

            <textarea
              rows={3}
              value={serviceDetail}
              onChange={(e) => setServiceDetail(e.target.value)}
              placeholder="ระบุอาการผิดปกติ ชิ้นส่วนที่ซ่อม หรือรายละเอียดบิล..."
              className="w-full rounded-xl bg-surface-container-low p-3 text-[13px] border border-slate-200/60 focus:outline-none focus:bg-surface-container-high transition-all"
            />
          </div>

          {/* Receipt / Photo Capture */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[12px] text-civic-navy font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-civic-navy">
                  receipt
                </span>
                รูปถ่ายใบเสร็จ / ใบแจ้งหนี้
              </span>
              <span className="text-slate-400 text-[10px] font-normal">แนบหลักฐานเบิกจ่ายพัสดุ</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleTriggerCamera}
                className="h-16 rounded-2xl bg-gradient-to-b from-white to-slate-100 flex flex-col items-center justify-center gap-1 text-civic-navy border border-slate-200/80 shadow-xs hover:bg-slate-200 active:scale-[0.98] transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                </div>
                <span className="text-[11px] font-bold">เปิดกล้องถ่ายใบเสร็จ</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerCamera}
                className="h-16 rounded-2xl bg-gradient-to-b from-white to-slate-100 flex flex-col items-center justify-center gap-1 text-slate-600 border border-slate-200/80 shadow-xs hover:bg-slate-200 active:scale-[0.98] transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-500 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[15px]">image</span>
                </div>
                <span className="text-[11px]">เลือกจากแกลลอรี่</span>
              </button>
            </div>

            {hasPhoto && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center justify-between border border-emerald-200">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                    check_circle
                  </span>
                  <span>แนบรูปใบเสร็จเรียบร้อย (INV-2568-0515.jpg)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasPhoto(false)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Action Triggers */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              className="h-14 w-full rounded-2xl bg-gradient-to-b from-[#184e85] to-[#08213b] text-white font-headline text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(13,59,102,0.35),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.3)] border border-blue-400/30 active:scale-[0.98] transition-all"
            >
              <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center shadow-inner border border-white/20">
                <span className="material-symbols-outlined text-[18px]">save</span>
              </div>
              <span>บันทึกประวัติการบำรุงรักษา</span>
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              className="h-11 w-full rounded-xl bg-gradient-to-b from-white to-slate-100 text-slate-600 font-semibold text-[13px] flex items-center justify-center border border-slate-200/80 shadow-xs hover:bg-slate-200 transition-all"
            >
              ยกเลิก / ล้างฟอร์ม
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: Maintenance History Stream */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="font-headline text-civic-navy text-[16px] font-bold">
              ประวัติการซ่อมบำรุงที่ผ่านมา
            </h3>
            <p className="text-[11px] text-slate-muted">ประวัติบันทึกแยกรายคันและประเภทงาน</p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-white to-slate-100 text-civic-navy text-[11px] font-bold flex items-center gap-1.5 border border-slate-200 shadow-xs"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span> กรองข้อมูล
          </button>
        </div>

        {/* History Filter Segment Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setHistoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shadow-xs ${
              historyFilter === 'all'
                ? 'bg-gradient-to-b from-[#184e85] to-[#08213b] text-white border border-blue-400/20'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            ทั้งหมด (4 คัน)
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter('oil')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
              historyFilter === 'oil'
                ? 'bg-gradient-to-b from-[#184e85] to-[#08213b] text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-md bg-amber-500 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px]">oil_barrel</span>
            </div>
            <span>ถ่ายน้ำมันเครื่อง</span>
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter('garage')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
              historyFilter === 'garage'
                ? 'bg-gradient-to-b from-[#184e85] to-[#08213b] text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-md bg-blue-500 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px]">handyman</span>
            </div>
            <span>ซ่อมศูนย์ / อู่</span>
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter('tires')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
              historyFilter === 'tires'
                ? 'bg-gradient-to-b from-[#184e85] to-[#08213b] text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px]">restart_alt</span>
            </div>
            <span>ยางรถยนต์</span>
          </button>
        </div>

        {/* History Cards List */}
        <div className="space-y-3">
          {filteredHistory.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-slate-200/80 flex flex-col space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md flex-shrink-0 ${
                      rec.category === 'ถ่ายน้ำมันเครื่อง'
                        ? 'bg-gradient-to-b from-amber-400 to-amber-600'
                        : rec.category === 'เปลี่ยนยาง / สลับยาง'
                        ? 'bg-gradient-to-b from-slate-700 to-slate-900'
                        : 'bg-gradient-to-b from-teal-400 to-teal-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {rec.category === 'ถ่ายน้ำมันเครื่อง'
                        ? 'oil_barrel'
                        : rec.category === 'เปลี่ยนยาง / สลับยาง'
                        ? 'restart_alt'
                        : 'handyman'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline text-civic-navy text-[14px] font-bold">
                        {rec.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-bold border border-emerald-200">
                        {rec.status === 'completed' ? 'เสร็จสิ้น' : 'อนุมัติพัสดุ'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {rec.carPlate} • โดย {rec.driverName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-civic-navy text-[14px]">
                    ฿ {rec.cost.toLocaleString()}
                  </span>
                  <div className="text-slate-400 text-[10px]">{rec.date}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low text-[11px] space-y-1 border border-slate-200/50">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[14px] text-civic-navy">
                      storefront
                    </span>
                    {rec.garage}
                  </span>
                  <span className="font-bold text-civic-navy">
                    ไมล์เข้า: {rec.entryKm.toLocaleString()} กม.
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{rec.details}</p>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px] text-emerald-600">
                    verified
                  </span>
                  <span>{rec.warranty || `รอบถัดไป: ${rec.nextKm.toLocaleString()} กม.`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenReceiptModal(rec)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-civic-navy font-bold flex items-center gap-1 border border-blue-200/60 shadow-xs hover:bg-blue-100"
                >
                  <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                  <span>ดูใบเสร็จ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
