import React, { useState } from 'react';
import { Driver, TripRecord, Vehicle } from '../types';

interface HomeLogScreenProps {
  vehicle: Vehicle;
  drivers: Driver[];
  activeDriver: Driver;
  trips: TripRecord[];
  onSelectDriver: (driver: Driver) => void;
  onOpenActionModal: (type: 'depart' | 'return' | 'manual') => void;
  onOpenEditMileage: () => void;
  onOpenPdfModal: () => void;
  onOpenLineShare: () => void;
  onTriggerToast: (msg: string) => void;
  onViewTripDetail: (trip: TripRecord) => void;
}

export const HomeLogScreen: React.FC<HomeLogScreenProps> = ({
  vehicle,
  drivers,
  activeDriver,
  trips,
  onSelectDriver,
  onOpenActionModal,
  onOpenEditMileage,
  onOpenPdfModal,
  onOpenLineShare,
  onTriggerToast,
  onViewTripDetail,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const latestTrip = trips[0];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    onTriggerToast(`เลือกสถานที่: ${tag}`);
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-10">
      {/* 1. Hero Vehicle & Odometer Widget */}
      <section className="bg-slate-card-dark text-on-primary rounded-2xl p-4 shadow-xl flex flex-col gap-4 relative overflow-hidden border border-slate-700/50">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-civic-navy/40 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header bar within Card */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-line-green animate-pulse"></span>
            <span className="text-[12px] font-bold text-secondary-fixed">
              กำลังพร้อมใช้งาน • อยู่ที่สำนักงาน
            </span>
          </div>
          <span className="text-[11px] text-slate-muted bg-surface-container-highest/20 px-2.5 py-1 rounded-full font-medium">
            สิ้นเดือน: ก.ย. 2569
          </span>
        </div>

        {/* Active Vehicle & Driver Line */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#18395e] via-civic-navy-dark to-[#04101e] flex items-center justify-center text-primary-fixed shadow-[0_4px_12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.6)] border border-white/10 flex-shrink-0">
            <span className="material-symbols-outlined text-[28px] text-primary-fixed drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]">
              directions_car
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-[18px] font-bold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                {vehicle.plate}
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 font-bold">
                คันหลัก
              </span>
            </div>
            <p className="text-[12px] text-slate-300 truncate mt-0.5">
              ผู้ขับขี่:{' '}
              <span className="text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {activeDriver.name}
              </span>
            </p>
          </div>
        </div>

        {/* Digital Odometer Board */}
        <div className="bg-civic-navy-dark/90 rounded-2xl p-3.5 flex items-center justify-between z-10 shadow-inner border border-white/5">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">เลขไมล์ปัจจุบัน (กิโลเมตร)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-odometer text-[34px] font-extrabold text-secondary-fixed tracking-wider">
                {vehicle.currentKm.toLocaleString()}
              </span>
              <span className="text-[13px] font-bold text-slate-400">กม.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenEditMileage}
            className="h-10 px-3.5 rounded-xl bg-gradient-to-b from-[#293d56] to-[#162436] hover:from-[#324b6b] hover:to-[#1c2e45] text-white text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-[0_3px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-1px_2px_rgba(0,0,0,0.4)] border border-white/10 active:scale-95"
          >
            <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[15px]">settings</span>
            </div>
            <span>แก้ไขไมล์</span>
          </button>
        </div>
      </section>

      {/* 2. Driver Quick Selector (2x2 Touch Grid) */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-civic-navy text-[19px]">person_pin</span>
            <h2 className="font-headline text-[15px] font-bold text-civic-navy">
              เลือกพนักงานขับรถ
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">แตะเลือกของตนเอง</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {drivers.map((d) => {
            const isSelected = activeDriver.id === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  onSelectDriver(d);
                  onTriggerToast(`เลือกผู้ขับขี่: ${d.name}`);
                }}
                className={`relative flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-gradient-to-b from-white via-civic-navy-light to-[#dbe8f5] shadow-[0_4px_12px_rgba(13,59,102,0.12),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(13,59,102,0.08)] ring-2 ring-civic-navy border border-civic-navy/20'
                    : 'bg-surface-container-lowest shadow-[0_3px_8px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(0,0,0,0.04)] border border-slate-200 hover:bg-surface-container-low'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-headline text-[16px] font-bold flex-shrink-0 shadow-md border border-white/20 ${
                    d.id === 'd-1'
                      ? 'bg-gradient-to-b from-[#1e4d7d] via-civic-navy to-[#071d34]'
                      : d.id === 'd-2'
                      ? 'bg-gradient-to-b from-[#059669] via-secondary to-[#004730]'
                      : d.id === 'd-3'
                      ? 'bg-gradient-to-b from-[#f59e0b] via-amber-warning to-[#92400e]'
                      : 'bg-gradient-to-b from-[#0a4a70] via-tertiary-container to-[#022238]'
                  }`}
                >
                  <span>{d.initial}</span>
                </div>
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-[13px] text-on-surface font-bold truncate">
                    {d.shortName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{d.role}</span>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-civic-navy text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Primary Operational Action Triggers */}
      <section className="flex flex-col gap-2.5">
        {/* Departure Action Button */}
        <button
          type="button"
          onClick={() => onOpenActionModal('depart')}
          className="group w-full h-[76px] px-4 rounded-2xl bg-gradient-to-b from-[#1b4e80] via-civic-navy to-[#061e38] hover:brightness-105 active:scale-[0.98] text-white flex items-center justify-between shadow-[0_8px_20px_rgba(13,59,102,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-3px_6px_rgba(0,0,0,0.4)] border border-white/15 transition-all relative overflow-hidden"
        >
          <div className="absolute -left-10 -top-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-white/25 via-white/15 to-white/5 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(0,0,0,0.3)] border border-white/30 flex-shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                directions_car
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-headline text-[16px] leading-tight font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                บันทึกเวลาออก
              </span>
              <span className="text-[11px] text-primary-fixed-dim drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                ถ่ายรูป / พิมพ์ไมล์ออก
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white/20 to-white/5 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.25)] border border-white/25 group-hover:translate-x-0.5 transition-transform z-10">
            <span className="material-symbols-outlined text-[22px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              arrow_forward
            </span>
          </div>
        </button>

        {/* Return Action Button */}
        <button
          type="button"
          onClick={() => onOpenActionModal('return')}
          className="group w-full h-[76px] px-4 rounded-2xl bg-gradient-to-b from-[#08a574] via-emerald-active to-[#025a3d] hover:brightness-105 active:scale-[0.98] text-white flex items-center justify-between shadow-[0_8px_20px_rgba(5,150,105,0.35),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-3px_6px_rgba(0,0,0,0.35)] border border-white/20 transition-all relative overflow-hidden"
        >
          <div className="absolute -left-10 -top-10 w-28 h-28 bg-white/15 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-white/25 via-white/15 to-white/5 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(0,0,0,0.25)] border border-white/30 flex-shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                sports_score
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-headline text-[16px] leading-tight font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                บันทึกเวลากลับ
              </span>
              <span className="text-[11px] text-secondary-fixed drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                ถ่ายรูป / พิมพ์ไมล์กลับ
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white/20 to-white/5 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.2)] border border-white/25 group-hover:translate-y-0.5 transition-transform z-10">
            <span className="material-symbols-outlined text-[22px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              arrow_downward
            </span>
          </div>
        </button>

        {/* Manual Entry Button */}
        <button
          type="button"
          onClick={() => onOpenActionModal('manual')}
          className="w-full h-14 px-4 rounded-2xl bg-gradient-to-b from-[#2a384c] via-slate-card-dark to-[#131b27] hover:bg-slate-800 active:scale-[0.98] text-white flex items-center justify-center gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.4)] border border-white/10 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[18px] text-primary-fixed">edit_note</span>
          </div>
          <span className="text-[13px] font-bold">กรอกเลขไมล์เอง (พิมพ์ลงตารางโดยตรง)</span>
        </button>
      </section>

      {/* 4. Quick Trip Checklist / Frequent Destinations */}
      <section className="flex flex-col gap-2 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#1b4b7a] to-civic-navy text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[17px]">pin_drop</span>
            </div>
            <span className="text-[13px] text-civic-navy font-bold font-headline">
              สถานที่ไปบ่อย • อ้างอิงราชการ
            </span>
          </div>
          <span className="text-[11px] text-slate-400 bg-surface-container-low px-2 py-0.5 rounded-lg border border-slate-200/50">
            แตะเพื่อเพิ่ม
          </span>
        </div>

        {/* Landmark tags */}
        <div className="flex flex-wrap gap-2 mt-1">
          {[
            { icon: '🏛️', name: 'ศาลากลาง จ.เพชรบุรี' },
            { icon: '🏢', name: 'กระทรวงพาณิชย์' },
            { icon: '📮', name: 'ไปรษณีย์' },
            { icon: '🛒', name: 'ตรวจตลาดสด' },
            { icon: '🏦', name: 'ธนาคาร' },
          ].map((item) => {
            const isSelected = selectedTags.includes(item.name);
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => toggleTag(item.name)}
                className={`px-3 py-1.5 rounded-xl font-label text-[11px] active:scale-95 transition-all flex items-center gap-1.5 shadow-xs border ${
                  isSelected
                    ? 'bg-civic-navy text-white border-civic-navy shadow-sm'
                    : 'bg-gradient-to-b from-white to-[#edf2f9] text-on-surface-variant border-slate-200 hover:border-civic-navy/30'
                }`}
              >
                <span className="text-[14px]">{item.icon}</span>
                <span className="font-semibold">{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* District pills with horizontal scroll */}
        <div className="pt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] text-slate-500 flex-shrink-0 mr-1 font-semibold">
            อำเภอ:
          </span>
          {[
            'อ.เมืองเพชรบุรี',
            'อ.ชะอำ',
            'อ.ท่ายาง',
            'อ.บ้านลาด',
            'อ.บ้านแหลม',
            'อ.แก่งกระจาน',
          ].map((dist) => {
            const isSelected = selectedTags.includes(dist);
            return (
              <button
                key={dist}
                type="button"
                onClick={() => toggleTag(dist)}
                className={`px-3 py-1 rounded-xl text-[11px] flex-shrink-0 shadow-xs border active:scale-95 transition-all ${
                  isSelected
                    ? 'bg-civic-navy text-white border-civic-navy font-bold'
                    : 'bg-gradient-to-b from-white to-surface-container text-on-surface border-slate-200 font-medium'
                }`}
              >
                {dist}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Recent Trip History & Report Export (แบบ 4) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-civic-navy text-[22px]">description</span>
            <h2 className="font-headline text-[15px] text-civic-navy font-bold">
              ประวัติบันทึกการใช้รถ (แบบ 4)
            </h2>
          </div>
          <span className="text-[11px] text-slate-600 bg-surface-container-high px-2 py-0.5 rounded-lg font-bold">
            {trips.length} รายการ
          </span>
        </div>

        {/* Filter selectors */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center justify-between px-3 py-2.5 bg-surface-container-lowest rounded-xl shadow-xs text-on-surface text-[12px] border border-slate-200/80">
            <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
              <span className="material-symbols-outlined text-[17px] text-civic-navy">calendar_today</span>
              <span>ตุลาคม 2569</span>
            </span>
            <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 bg-surface-container-lowest rounded-xl shadow-xs text-on-surface text-[12px] border border-slate-200/80">
            <span className="flex items-center gap-1.5 font-bold text-civic-navy truncate">
              <span className="material-symbols-outlined text-[17px] text-civic-navy">local_taxi</span>
              <span>{vehicle.plate}</span>
            </span>
            <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
          </div>
        </div>

        {/* Quick Export Utility Bar */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onOpenPdfModal}
            className="h-12 px-3 bg-gradient-to-b from-[#2a384c] via-slate-card-dark to-[#131b27] hover:brightness-110 text-white rounded-2xl text-[12px] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-2px_3px_rgba(0,0,0,0.4)] border border-white/10 active:scale-95 transition-all font-bold"
          >
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[17px]">print</span>
            </div>
            <span>สั่งพิมพ์ / PDF แบบ 4</span>
          </button>
          <button
            type="button"
            onClick={onOpenLineShare}
            className="h-12 px-3 bg-gradient-to-b from-[#10db63] via-line-green to-[#039e41] hover:brightness-105 text-white rounded-2xl text-[12px] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(6,199,85,0.35),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.3)] border border-white/20 active:scale-95 transition-all font-bold"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[17px]">share</span>
            </div>
            <span>เซฟรูปส่ง LINE</span>
          </button>
        </div>

        {/* Trip Log Card Stream */}
        {latestTrip && (
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col gap-3 border border-slate-200/80">
            <div className="flex items-center justify-between pb-2 bg-surface-container-low/60 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-civic-navy text-white text-[11px] font-bold flex items-center justify-center">
                  #{latestTrip.id}
                </span>
                <span className="font-bold text-[13px] text-civic-navy">{latestTrip.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-active"></span>
                <span className="text-[11px] text-emerald-700 font-bold">บันทึกเรียบร้อย</span>
              </div>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500">เวลาออกเดินทาง</span>
                <span className="font-headline text-[15px] text-civic-navy font-bold">
                  {latestTrip.timeDepart}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  เลขไมล์: {latestTrip.odoReturn.toLocaleString()} กม.
                </span>
              </div>
              <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500">ผู้ขับขี่ในเที่ยวนี้</span>
                <span className="text-[12px] font-bold text-on-surface truncate mt-0.5">
                  {latestTrip.driverName}
                </span>
                {latestTrip.isSpecial && (
                  <span className="text-[10px] text-amber-700 font-semibold">ผู้ขับขี่เฉพาะกิจ</span>
                )}
              </div>
            </div>

            <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium">สถานที่ไป / ภารกิจ</span>
              <p className="text-[12px] text-on-surface font-semibold mt-0.5 line-clamp-2">
                {latestTrip.places}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
              <span>รถยนต์: {latestTrip.carPlate}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewTripDetail(latestTrip)}
                  className="text-civic-navy font-bold hover:underline"
                >
                  ดูรายละเอียด
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onOpenActionModal('manual')}
                  className="text-slate-600 hover:text-on-surface"
                >
                  แก้ไข
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
