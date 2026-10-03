import React, { useState } from 'react';
import { TripRecord, Vehicle } from '../types';
import { HOTLINK_ICONS } from '../data/mockData';

interface OfficerDashboardScreenProps {
  vehicles: Vehicle[];
  trips: TripRecord[];
  onOpenPdfModal: (isAllCars?: boolean) => void;
  onOpenPinModal: () => void;
  onOpenSignatureModal: (trip: TripRecord) => void;
  onViewTripDetail: (trip: TripRecord) => void;
  onTriggerToast: (msg: string) => void;
}

export const OfficerDashboardScreen: React.FC<OfficerDashboardScreenProps> = ({
  vehicles,
  trips,
  onOpenPdfModal,
  onOpenPinModal,
  onOpenSignatureModal,
  onViewTripDetail,
  onTriggerToast,
}) => {
  const [activeCarFilter, setActiveCarFilter] = useState<string>('all');
  const [syncing, setSyncing] = useState<boolean>(false);

  const handleManualSync = () => {
    setSyncing(true);
    onTriggerToast('กำลังซิงค์ข้อมูลกับ Google Sheets (Drive)...');
    setTimeout(() => {
      setSyncing(false);
      onTriggerToast('ซิงค์ Google Sheets สำเร็จ ข้อมูลเป็นปัจจุบัน 100%');
    }, 1200);
  };

  const handleExportExcel = () => {
    onTriggerToast('ส่งออกตารางข้อมูล Excel (.xlsx) แบบ 4 เรียบร้อยแล้ว');
  };

  const filteredTrips = trips.filter((t) => {
    if (activeCarFilter === 'all') return true;
    return t.carPlate.includes(activeCarFilter);
  });

  return (
    <div className="flex flex-col w-full gap-5 pb-10">
      {/* Operational Header & Controls Toolbar */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <span
              className={`inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500 ${
                syncing ? 'animate-spin bg-blue-500' : 'animate-pulse'
              }`}
            ></span>
            <span className="text-[11px] text-emerald-700 font-bold">
              {syncing
                ? 'กำลังเชื่อมต่อ Google Sheets...'
                : 'ซิงค์ Google Sheets เรียบร้อยแล้ว (อัปเดตสด)'}
            </span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-civic-navy text-[11px] font-bold">
            <span className="material-symbols-outlined text-[15px]">calendar_today</span>
            <span>ต.ค. 2569</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </div>
        </div>

        {/* Quick Action Bar for Admin Operations */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onOpenPdfModal(true)}
            className="flex items-center justify-center gap-2 py-3 px-3 text-white rounded-2xl active:scale-[0.98] transition-all relative overflow-hidden shadow-lg"
            style={{
              background:
                'radial-gradient(circle at 35% 20%, #1f5080 0%, #0d3b66 60%, #061c33 100%)',
              boxShadow:
                '0 6px 16px -2px rgba(13,59,102,0.42), inset 0 2px 2px rgba(255,255,255,0.35), inset 0 -3px 4px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-civic-navy flex-shrink-0"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #d8e5f5 100%)',
                boxShadow:
                  '0 3px 6px rgba(0,0,0,0.2), inset 0 1px 1px #ffffff, inset 0 -1.5px 2px rgba(0,0,0,0.12)',
              }}
            >
              <span className="material-symbols-outlined text-[17px] font-bold">print</span>
            </div>
            <span className="text-[12px] font-bold tracking-wide">
              พิมพ์แบบ 4 (ครบ 4 คัน)
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenPinModal}
            className="flex items-center justify-center gap-2 py-3 px-3 text-civic-navy rounded-2xl active:scale-[0.98] transition-all relative border border-slate-200"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f1f5fc 100%)',
              boxShadow:
                '0 6px 14px -2px rgba(13,59,102,0.12), 0 2px 5px rgba(0,0,0,0.04), inset 0 2px 2px #ffffff, inset 0 -2px 3px rgba(13,59,102,0.1)',
            }}
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white flex-shrink-0"
              style={{
                background: 'radial-gradient(circle at 35% 25%, #3a75b3 0%, #0d3b66 85%)',
                boxShadow:
                  '0 3px 6px rgba(13,59,102,0.3), inset 0 1px 1.5px rgba(255,255,255,0.4)',
              }}
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
            </div>
            <span className="text-[12px] font-bold">จัดการ PIN / ระบบ</span>
          </button>
        </div>
      </section>

      {/* Monthly Fleet KPI Summary Cards (Bento Metric Layout) */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-headline text-[15px] font-bold text-civic-navy">
            สรุปการใช้รถประจำเดือน
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">1 - 31 ต.ค. 2569</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* KPI 1: Total Distance */}
          <div
            className="p-3.5 rounded-2xl flex flex-col justify-between border border-slate-200/80 shadow-sm"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f6f9fe 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-500 font-semibold">ระยะทางรวมทั้งสิ้น</span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, #388bfd 0%, #0a84ff 50%, #0053b3 100%)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">speed</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-odometer text-[26px] text-civic-navy font-extrabold">
                  3,840
                </span>
                <span className="text-[11px] text-slate-400 font-bold">กม.</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  ↑
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">+12%</span>
                <span className="text-[10px] text-slate-400">จากเดือนก่อน</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Fuel Dispensed */}
          <div
            className="p-3.5 rounded-2xl flex flex-col justify-between border border-amber-200/60 shadow-sm"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fffdf8 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-500 font-semibold">ปริมาณน้ำมันเบิกจ่าย</span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, #ffb84d 0%, #d97706 60%, #944d00 100%)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">local_gas_station</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-odometer text-[26px] text-civic-navy font-extrabold">
                  245
                </span>
                <span className="text-[11px] text-slate-400 font-bold">ลิตร</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 font-medium">
                เฉลี่ย 15.6 กม./ลิตร
              </div>
            </div>
          </div>

          {/* KPI 3: Total Trips */}
          <div
            className="p-3.5 rounded-2xl flex flex-col justify-between border border-emerald-200/60 shadow-sm"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f6fdf9 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-500 font-semibold">เที่ยวปฏิบัติราชการ</span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, #5ee892 0%, #059669 65%, #024a34 100%)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-[26px] text-civic-navy font-extrabold">
                  42
                </span>
                <span className="text-[11px] text-slate-400 font-bold">เที่ยว</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                ปิดทริปครบ 100%
              </div>
            </div>
          </div>

          {/* KPI 4: Special Trips */}
          <div
            className="p-3.5 rounded-2xl flex flex-col justify-between border border-slate-200/80 shadow-sm"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-500 font-semibold">เฉพาะกิจ / นอกเวลา</span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, #6a95cc 0%, #204874 65%, #08213b 100%)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-[26px] text-civic-navy font-extrabold">
                  8
                </span>
                <span className="text-[11px] text-slate-400 font-bold">เที่ยว</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">คำสั่งอนุมัติครบ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Fleet Status Cards (4 Vehicles Active Inspection) */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-civic-navy text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
            </div>
            <h2 className="font-headline text-[15px] text-civic-navy font-bold">
              สถานะยานพาหนะ (4 คัน)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">สนง.พาณิชย์เพชรบุรี</span>
        </div>

        {/* Vehicle 1: Normal Ready */}
        <div className="rounded-2xl p-3.5 flex flex-col gap-1.5 bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-xl text-[12px] text-civic-navy font-bold bg-blue-50 border border-blue-200/60">
                ขก 225 นนทบุรี
              </span>
              <span className="px-2.5 py-1 rounded-xl text-emerald-800 text-[11px] font-bold bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                พร้อมใช้งาน (อยู่ที่ สนง.)
              </span>
            </div>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-civic-navy bg-slate-100">
              #1
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-civic-navy text-white flex items-center justify-center font-bold text-xs">
                ก
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-on-surface">นายกฤษณพัฒน์ แสงหล้า</span>
                <span className="text-[10px] text-slate-400">พนักงานขับรถยนต์</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-odometer text-[17px] font-extrabold text-civic-navy">
                52,204
              </span>
              <span className="text-[11px] text-slate-400 ml-1">กม.</span>
            </div>
          </div>
        </div>

        {/* Vehicle 2: Maintenance Alert with Engine Oil Graphic */}
        <div className="rounded-2xl p-3.5 flex flex-col gap-1.5 bg-gradient-to-b from-white to-amber-50/40 border border-amber-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-xl text-[12px] text-white font-bold bg-amber-600 shadow-xs">
                กอ 409 เพชรบุรี
              </span>
              <span className="px-2.5 py-1 rounded-xl text-amber-800 text-[11px] font-bold bg-amber-100/80 border border-amber-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-amber-700">warning</span>
                ถึงรอบเปลี่ยนถ่ายน้ำมัน
              </span>
            </div>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-amber-800 bg-amber-100">
              #2
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                ป
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-on-surface">นายประภาส ปักกิ่งเมือง</span>
                <span className="text-[10px] text-slate-400">พนักงานขับรถยนต์</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center p-1.5 bg-white shadow-xs border border-amber-200">
                <img
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 object-contain"
                  alt="Engine oil canister icon alert"
                  src={HOTLINK_ICONS.engineOilCanister}
                />
              </div>
              <div className="text-right">
                <span className="font-odometer text-[17px] font-extrabold text-amber-700">
                  68,450
                </span>
                <span className="text-[11px] text-slate-400 ml-1">กม.</span>
                <p className="text-[10px] text-red-600 font-bold">(เกิน 450 กม.)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle 3: Active on Mission */}
        <div className="rounded-2xl p-3.5 flex flex-col gap-1.5 bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-xl text-[12px] text-civic-navy font-bold bg-blue-50 border border-blue-200/60">
                ขก 192 นนทบุรี
              </span>
              <span className="px-2.5 py-1 rounded-xl text-white text-[11px] font-bold bg-civic-navy flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
                กำลังปฏิบัติงาน (อ.ชะอำ)
              </span>
            </div>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-civic-navy bg-slate-100">
              #3
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                ธ
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-on-surface">นายธรรมรัตน์ สุรเดชานนท์</span>
                <span className="text-[10px] text-slate-400">พนักงานขับรถยนต์</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-odometer text-[17px] font-extrabold text-civic-navy">
                41,120
              </span>
              <span className="text-[11px] text-slate-400 ml-1">กม.</span>
              <p className="text-[10px] text-slate-400">ออกปฏิบัติงาน 09:15 น.</p>
            </div>
          </div>
        </div>

        {/* Vehicle 4: Annual Inspection Overdue with Tire Wheel Graphic */}
        <div className="rounded-2xl p-3.5 flex flex-col gap-1.5 bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-xl text-[12px] text-civic-navy font-bold bg-blue-50 border border-blue-200/60">
                นจ 4648 เพชรบุรี
              </span>
              <span className="px-2.5 py-1 rounded-xl text-slate-700 text-[11px] font-bold bg-slate-100 border border-slate-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-civic-navy">search</span>
                รอตรวจสภาพประจำปี
              </span>
            </div>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-slate-500 bg-slate-100">
              #4
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-600 text-white flex items-center justify-center font-bold text-xs">
                อ
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-on-surface">นายอนุพงศ์ บุญมาก</span>
                <span className="text-[10px] text-slate-400">พนักงานขับรถยนต์</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center p-1.5 bg-slate-50 border border-slate-200 shadow-xs">
                <img
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 object-contain"
                  alt="Tire wheel condition graphic"
                  src={HOTLINK_ICONS.tireWheel}
                />
              </div>
              <div className="text-right">
                <span className="font-odometer text-[17px] font-extrabold text-civic-navy">
                  89,310
                </span>
                <span className="text-[11px] text-slate-400 ml-1">กม.</span>
                <p className="text-[10px] text-amber-700 font-bold">นัดตรวจ 5 พ.ย. 69</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Usage Breakdown with Apple Watch Concentric Activity Rings */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-civic-navy text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">donut_large</span>
            </div>
            <h3 className="font-headline text-[15px] font-bold text-civic-navy">
              สัดส่วนการใช้รถแยกรายคัน
            </h3>
          </div>
          <span className="text-[11px] text-civic-navy px-3 py-1 rounded-full font-bold bg-blue-50 border border-blue-200">
            รวม 3,840 กม.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
          {/* Apple Watch concentric Activity Rings in SVG */}
          <div className="relative flex items-center justify-center flex-shrink-0 w-44 h-44">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Ring 1 Track & Progress (Coral / Crimson, #FF375F) - Radius 68 */}
              <circle cx="80" cy="80" r="68" fill="none" stroke="#FF375F" strokeOpacity="0.15" strokeWidth="11" />
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="#FF375F"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray="427.26"
                strokeDashoffset="289.25"
                style={{ filter: 'drop-shadow(0 0 3px rgba(255,55,95,0.4))' }}
              />

              {/* Ring 2 Track & Progress (Electric Lime, #30D158) - Radius 54 */}
              <circle cx="80" cy="80" r="54" fill="none" stroke="#30D158" strokeOpacity="0.15" strokeWidth="11" />
              <circle
                cx="80"
                cy="80"
                r="54"
                fill="none"
                stroke="#30D158"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray="339.29"
                strokeDashoffset="241.24"
                style={{ filter: 'drop-shadow(0 0 3px rgba(48,209,88,0.4))' }}
              />

              {/* Ring 3 Track & Progress (Azure, #0A84FF) - Radius 40 */}
              <circle cx="80" cy="80" r="40" fill="none" stroke="#0A84FF" strokeOpacity="0.15" strokeWidth="11" />
              <circle
                cx="80"
                cy="80"
                r="40"
                fill="none"
                stroke="#0A84FF"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray="251.33"
                strokeDashoffset="195.03"
                style={{ filter: 'drop-shadow(0 0 3px rgba(10,132,255,0.4))' }}
              />

              {/* Ring 4 Track & Progress (Gold, #FF9F0A) - Radius 26 */}
              <circle cx="80" cy="80" r="26" fill="none" stroke="#FF9F0A" strokeOpacity="0.15" strokeWidth="10" />
              <circle
                cx="80"
                cy="80"
                r="26"
                fill="none"
                stroke="#FF9F0A"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="163.36"
                strokeDashoffset="136.57"
                style={{ filter: 'drop-shadow(0 0 3px rgba(255,159,10,0.4))' }}
              />
            </svg>

            {/* Center Summary Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="font-headline text-[20px] text-civic-navy font-extrabold leading-tight">
                3,840
              </span>
              <span className="text-[11px] font-semibold text-slate-500">กม. รวม</span>
            </div>
          </div>

          {/* Activity Ring Breakdown Progress Bars */}
          <div className="flex-1 w-full grid grid-cols-1 gap-2.5">
            {/* Item 1: ขก 225 */}
            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FF375F] shadow-sm"></div>
                  <span className="text-[12px] font-bold text-civic-navy">ขก 225 นนทบุรี</span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-bold text-civic-navy">1,240 กม.</span>
                  <span className="text-[11px] font-bold text-[#FF375F] ml-1.5">32.3%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-[#FF375F] rounded-full" style={{ width: '32.3%' }}></div>
              </div>
            </div>

            {/* Item 2: กอ 409 */}
            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#30D158] shadow-sm"></div>
                  <span className="text-[12px] font-bold text-civic-navy">กอ 409 เพชรบุรี</span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-bold text-civic-navy">1,110 กม.</span>
                  <span className="text-[11px] font-bold text-[#30D158] ml-1.5">28.9%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-[#30D158] rounded-full" style={{ width: '28.9%' }}></div>
              </div>
            </div>

            {/* Item 3: ขก 192 */}
            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#0A84FF] shadow-sm"></div>
                  <span className="text-[12px] font-bold text-civic-navy">ขก 192 นนทบุรี</span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-bold text-civic-navy">860 กม.</span>
                  <span className="text-[11px] font-bold text-[#0A84FF] ml-1.5">22.4%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-[#0A84FF] rounded-full" style={{ width: '22.4%' }}></div>
              </div>
            </div>

            {/* Item 4: นจ 4648 */}
            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FF9F0A] shadow-sm"></div>
                  <span className="text-[12px] font-bold text-civic-navy">นจ 4648 เพชรบุรี</span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-bold text-civic-navy">630 กม.</span>
                  <span className="text-[11px] font-bold text-[#FF9F0A] ml-1.5">16.4%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-[#FF9F0A] rounded-full" style={{ width: '16.4%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Logs & Document Verification Table */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-headline text-[15px] font-bold text-civic-navy">
              รายการเดินทาง (ตรวจสอบเอกสาร)
            </h2>
            <span className="text-[11px] text-slate-500">
              ตรวจสอบความครบถ้วนแบบ 4 เพื่อลงนาม
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-civic-navy text-[11px] font-bold active:scale-[0.98] transition-all bg-white border border-slate-200 shadow-xs"
          >
            <div className="w-4 h-4 rounded-md bg-emerald-600 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[11px]">file_download</span>
            </div>
            <span>ส่งออก Excel</span>
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <button
            type="button"
            onClick={() => setActiveCarFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap active:scale-95 transition-all ${
              activeCarFilter === 'all'
                ? 'bg-civic-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            ทั้งหมด (42)
          </button>
          <button
            type="button"
            onClick={() => setActiveCarFilter('225')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap active:scale-95 transition-all ${
              activeCarFilter === '225'
                ? 'bg-civic-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            ขก 225
          </button>
          <button
            type="button"
            onClick={() => setActiveCarFilter('409')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap active:scale-95 transition-all ${
              activeCarFilter === '409'
                ? 'bg-civic-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            กอ 409
          </button>
          <button
            type="button"
            onClick={() => setActiveCarFilter('192')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap active:scale-95 transition-all ${
              activeCarFilter === '192'
                ? 'bg-civic-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            ขก 192
          </button>
          <button
            type="button"
            onClick={() => setActiveCarFilter('4648')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap active:scale-95 transition-all ${
              activeCarFilter === '4648'
                ? 'bg-civic-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            นจ 4648
          </button>
        </div>

        {/* Verification Items List */}
        <div className="flex flex-col gap-2.5">
          {filteredTrips.map((trip) => {
            const isApproved = trip.status === 'approved';
            return (
              <div
                key={trip.id}
                className="rounded-2xl p-3.5 flex flex-col gap-2 bg-white border border-slate-200/80 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl text-civic-navy flex items-center justify-center text-[11px] font-bold bg-blue-50 border border-blue-200">
                      #{trip.id}
                    </span>
                    <span className="text-[12px] font-bold text-on-surface">{trip.date}</span>
                    <span className="px-2 py-0.5 rounded-lg text-civic-navy text-[10px] font-bold bg-blue-50">
                      {trip.carPlate.split(' ')[0]} {trip.carPlate.split(' ')[1]}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 ${
                      isApproved
                        ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                        : 'text-amber-800 bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {isApproved ? 'check_circle' : 'draw'}
                    </span>
                    <span>{isApproved ? 'อนุมัติแล้ว' : 'รอ ผอ. ลงนาม'}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1 pl-8">
                  <div className="flex items-center gap-1.5 text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-red-500">
                      place
                    </span>
                    <span className="text-[12px] font-bold leading-snug">{trip.places}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{trip.approver}</span>
                    <span>•</span>
                    <span>ผขร. {trip.driverName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400">เลขไมล์</span>
                      <span className="font-bold text-civic-navy">
                        {trip.odoDepart.toLocaleString()} → {trip.odoReturn.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400">ระยะทาง</span>
                      <span className="font-bold text-emerald-700">{trip.distance} กม.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-civic-navy text-[10px] font-bold bg-white border border-slate-200">
                      {trip.fuelLiters > 0 ? `น้ำมัน ${trip.fuelLiters} ล.` : '- ไม่เบิก -'}
                    </span>

                    {isApproved ? (
                      <button
                        type="button"
                        onClick={() => onViewTripDetail(trip)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-civic-navy bg-white border border-slate-200 shadow-xs hover:bg-slate-100"
                        title="ดูรายละเอียด"
                      >
                        <span className="material-symbols-outlined text-[17px]">visibility</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenSignatureModal(trip)}
                        className="px-3 py-1 rounded-xl bg-civic-navy text-white text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit_note</span>
                        <span>ลงนาม</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Admin Security & System Sync Status Banner */}
      <section className="bg-civic-navy text-white rounded-2xl p-4 shadow-md flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
              security
            </span>
            <span className="font-bold text-[13px]">ความปลอดภัยระบบราชการ</span>
          </div>
          <span className="text-[10px] text-primary-fixed-dim bg-white/10 px-2 py-0.5 rounded-full">
            TLS 256-bit
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl">
            <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
              lock_person
            </span>
            <span>PIN เจ้าหน้าที่: ใช้งานอยู่</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">
              cloud_done
            </span>
            <span>Google Drive Sync: ปกติ</span>
          </div>
        </div>
      </section>
    </div>
  );
};
