import React, { useState } from 'react';
import { TripRecord, Vehicle } from '../types';

interface TripHistoryScreenProps {
  vehicles: Vehicle[];
  trips: TripRecord[];
  activeVehicle: Vehicle;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onOpenPdfModal: (isAllCars?: boolean) => void;
  onOpenLineShare: () => void;
  onViewTripDetail: (trip: TripRecord) => void;
  onTriggerToast: (msg: string) => void;
}

export const TripHistoryScreen: React.FC<TripHistoryScreenProps> = ({
  vehicles,
  trips,
  activeVehicle,
  onSelectVehicle,
  onOpenPdfModal,
  onOpenLineShare,
  onViewTripDetail,
  onTriggerToast,
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>(activeVehicle.plate);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTrips = trips.filter((t) => {
    const matchPlate = selectedPlate === 'all' || t.carPlate === selectedPlate;
    const matchSearch =
      searchTerm.trim() === '' ||
      t.places.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.date.includes(searchTerm);
    const matchCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'ศาลากลาง' && t.places.includes('ศาลากลาง')) ||
      (categoryFilter === 'ตรวจราคา' && t.places.includes('ตรวจราคา')) ||
      (categoryFilter === 'กระทรวงพาณิชย์' && t.places.includes('กระทรวงพาณิชย์'));

    return matchPlate && matchSearch && matchCategory;
  });

  const totalKm = filteredTrips.reduce((acc, t) => acc + t.distance, 0);
  const totalFuel = filteredTrips.reduce((acc, t) => acc + (t.fuelLiters || 0), 0);
  const specialCount = filteredTrips.filter((t) => t.isSpecial).length;

  return (
    <div className="flex flex-col w-full gap-5 pb-10">
      {/* Top Operational Banner & Selector Section */}
      <section className="bg-surface-container-low rounded-2xl p-4 shadow-sm flex flex-col gap-3.5 border border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-active animate-pulse"></span>
            <span className="font-headline font-bold text-[15px] text-civic-navy">
              ประวัติบันทึกการใช้รถ & แบบ 4
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-full shadow-xs border border-slate-200">
            <span className="material-symbols-outlined text-[16px] text-civic-navy">
              calendar_month
            </span>
            <span className="text-[12px] font-bold text-civic-navy">ตุลาคม 2569</span>
          </div>
        </div>

        {/* Vehicle Filter Pills (Segmented Control) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              เลือกรถยนต์ประจำสำนักงาน (4 คัน)
            </span>
            <span className="text-civic-navy font-bold">พาณิชย์ จ.เพชรบุรี</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {vehicles.map((v) => {
              const isSelected = selectedPlate === v.plate;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlate(v.plate);
                    onSelectVehicle(v);
                  }}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-civic-navy text-on-primary shadow-md'
                      : 'bg-surface text-slate-700 hover:text-civic-navy hover:bg-surface-container border border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {v.id === 'car-2' ? 'oil_barrel' : 'directions_car'}
                  </span>
                  <span>{v.plate}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedPlate('all')}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-[12px] font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                selectedPlate === 'all'
                  ? 'bg-civic-navy text-on-primary shadow-md'
                  : 'bg-surface text-slate-700 hover:text-civic-navy border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">layers</span>
              <span>ทุกคัน (4 คัน)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Summary Overview Cards */}
      <section className="grid grid-cols-2 gap-2.5">
        {/* Distance Card */}
        <div className="bg-slate-card-dark text-on-primary rounded-2xl p-3.5 shadow-md flex flex-col justify-between relative overflow-hidden border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">ระยะทางวิ่งรวมเดือนนี้</span>
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-700 p-0.5 shadow-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-white">speed</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-odometer text-[28px] font-extrabold text-secondary-fixed">
              {totalKm.toLocaleString()}
            </span>
            <span className="text-[12px] text-slate-400 font-bold">กม.</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            ไมล์ล่าสุด: {activeVehicle.currentKm.toLocaleString()} กม.
          </span>
        </div>

        {/* Fuel Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col justify-between border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">น้ำมันที่เบิกจ่าย</span>
            <div className="w-7 h-7 rounded-xl bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-amber-900">
                local_gas_station
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-odometer text-[28px] font-extrabold text-amber-warning">
              {totalFuel}
            </span>
            <span className="text-[12px] text-slate-500 font-bold">ลิตร</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            เฉลี่ย {(totalKm / (totalFuel || 1)).toFixed(1)} กม./ลิตร
          </span>
        </div>

        {/* Duty Trips Count */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col justify-between border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">ออกปฏิบัติงาน</span>
            <div className="w-7 h-7 rounded-xl bg-gradient-to-b from-blue-300 via-civic-navy to-slate-900 p-0.5 shadow-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-white">task_alt</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-headline text-[24px] font-bold text-civic-navy">
              {filteredTrips.length}
            </span>
            <span className="text-[12px] text-slate-500">เที่ยว</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold mt-1">ปิดทริปครบ 100%</span>
        </div>

        {/* Special Mission Count */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col justify-between border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">ภารกิจเฉพาะกิจ</span>
            <div className="w-7 h-7 rounded-xl bg-gradient-to-b from-violet-300 via-indigo-600 to-slate-900 p-0.5 shadow-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-white">verified_user</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-headline text-[24px] font-bold text-tertiary">
              {specialCount}
            </span>
            <span className="text-[12px] text-slate-500">เที่ยว</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">ผขร. สลับเวรทดแทน</span>
        </div>
      </section>

      {/* Official Government Export Toolbar */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5 text-[11px]">
          <span className="text-slate-500 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[16px]">print</span>
            ส่งออกเอกสารราชการ (กลุ่มยุทธศาสตร์ฯ)
          </span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">cloud_done</span>
            ซิงค์ Google Sheets แล้ว
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* PDF Print Button */}
          <button
            type="button"
            onClick={() => onOpenPdfModal(false)}
            className="h-14 py-2 px-3 rounded-2xl bg-slate-card-dark text-on-primary flex items-center justify-center gap-2 shadow-md hover:bg-civic-navy transition-all active:scale-[0.98] border border-slate-700"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-red-400 via-red-500 to-red-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-white">
                picture_as_pdf
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-[12px] leading-tight">พิมพ์ PDF (แบบ 4)</span>
              <span className="text-slate-400 text-[10px]">ฟอร์มแนวนอนทางการ</span>
            </div>
          </button>

          {/* LINE Share Button */}
          <button
            type="button"
            onClick={onOpenLineShare}
            className="h-14 py-2 px-3 rounded-2xl bg-line-green text-on-primary flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-emerald-200 via-emerald-400 to-green-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-white">chat</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-[12px] leading-tight">เซฟส่ง LINE</span>
              <span className="text-white/80 text-[10px]">บันทึกภาพลงกลุ่ม</span>
            </div>
          </button>
        </div>

        {/* Batch Print 4 Cars Button */}
        <button
          type="button"
          onClick={() => onOpenPdfModal(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-civic-navy-light text-civic-navy hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 text-[12px] font-bold shadow-xs border border-civic-navy/20"
        >
          <div className="w-6 h-6 rounded-md bg-civic-navy flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[15px]">layers</span>
          </div>
          <span>สั่งพิมพ์แบบ 4 ครบ 4 คัน (รวดเดียวประจำเดือน)</span>
        </button>
      </section>

      {/* Search, Filter & View Toggle Section */}
      <section className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 bg-surface-container-lowest rounded-xl shadow-xs flex items-center px-3 py-2 border border-slate-200">
            <span className="material-symbols-outlined text-[17px] text-civic-navy">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาจุดหมาย, ผู้ขับขี่ หรือวันที่..."
              className="w-full bg-transparent pl-2 text-[12px] text-on-surface placeholder:text-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-surface-container-low rounded-xl p-1 shadow-xs border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'card'
                  ? 'bg-surface text-civic-navy shadow-xs font-bold'
                  : 'text-slate-500 hover:text-civic-navy'
              }`}
              title="มุมมองการ์ด"
            >
              <span className="material-symbols-outlined text-[19px]">view_agenda</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-surface text-civic-navy shadow-xs font-bold'
                  : 'text-slate-500 hover:text-civic-navy'
              }`}
              title="มุมมองตาราง แบบ 4"
            >
              <span className="material-symbols-outlined text-[19px]">table_chart</span>
            </button>
          </div>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-semibold ${
              categoryFilter === 'all'
                ? 'bg-civic-navy text-on-primary shadow-xs'
                : 'bg-surface-container text-slate-700 hover:text-civic-navy'
            }`}
          >
            ทั้งหมด ({trips.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('ศาลากลาง')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-semibold ${
              categoryFilter === 'ศาลากลาง'
                ? 'bg-civic-navy text-on-primary shadow-xs'
                : 'bg-surface-container text-slate-700 hover:text-civic-navy'
            }`}
          >
            ศาลากลาง จ.เพชรบุรี
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('ตรวจราคา')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-semibold ${
              categoryFilter === 'ตรวจราคา'
                ? 'bg-civic-navy text-on-primary shadow-xs'
                : 'bg-surface-container text-slate-700 hover:text-civic-navy'
            }`}
          >
            ตรวจราคาสินค้าเกษตร
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('กระทรวงพาณิชย์')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-semibold ${
              categoryFilter === 'กระทรวงพาณิชย์'
                ? 'bg-civic-navy text-on-primary shadow-xs'
                : 'bg-surface-container text-slate-700 hover:text-civic-navy'
            }`}
          >
            กระทรวงพาณิชย์
          </button>
        </div>
      </section>

      {/* View 1: Card Stream */}
      {viewMode === 'card' ? (
        <div className="flex flex-col gap-3">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs flex flex-col gap-2.5 border border-slate-200/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-surface-container-high text-civic-navy text-[12px] flex items-center justify-center font-bold">
                    #{trip.id}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[13px] text-civic-navy">{trip.date}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-active-bg text-emerald-active font-bold text-[10px]">
                        ปิดทริปแล้ว
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      เวลา {trip.timeDepart} - {trip.timeReturn}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline text-[16px] font-bold text-civic-navy">
                    {trip.distance}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-0.5">กม.</span>
                </div>
              </div>

              {/* Route & Purpose */}
              <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-1 border border-slate-100">
                <div className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-civic-navy flex-shrink-0 mt-0.5">
                    near_me
                  </span>
                  <p className="text-[12px] text-on-surface leading-snug">
                    <span className="font-bold text-civic-navy">สถานที่:</span> {trip.places}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-slate-500 pl-6 text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">person_check</span>
                  <span>ผู้ขอใช้/รับรอง: {trip.approver}</span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 pt-0.5 text-center text-[11px]">
                <div className="bg-surface rounded-xl p-2 flex flex-col border border-slate-100">
                  <span className="text-[10px] text-slate-500">เลขไมล์ออก - กลับ</span>
                  <span className="font-bold text-civic-navy mt-0.5 tabular-nums">
                    {trip.odoDepart.toLocaleString()} → {trip.odoReturn.toLocaleString()}
                  </span>
                </div>
                <div className="bg-surface rounded-xl p-2 flex flex-col border border-slate-100">
                  <span className="text-[10px] text-slate-500">พนักงานขับรถ</span>
                  <span className="font-bold text-civic-navy mt-0.5 truncate">
                    {trip.driverName}
                  </span>
                </div>
                <div className="bg-surface rounded-xl p-2 flex flex-col border border-slate-100">
                  <span className="text-[10px] text-slate-500">เบิกน้ำมัน</span>
                  <span
                    className={`font-bold mt-0.5 ${
                      trip.fuelLiters > 0 ? 'text-amber-warning' : 'text-slate-400'
                    }`}
                  >
                    {trip.fuelLiters > 0 ? `เติม ${trip.fuelLiters} ลิตร` : '- (ไม่ได้เติม)'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-500 font-medium">รถยนต์ {trip.carPlate}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onViewTripDetail(trip)}
                    className="px-2.5 py-1 rounded-lg bg-surface-container text-civic-navy font-bold hover:bg-surface-container-high transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span>ดูข้อมูล</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerToast(`เปิดเมนูแก้ไขเที่ยว #${trip.id}`)}
                    className="px-2.5 py-1 rounded-lg bg-surface-container text-civic-navy font-bold hover:bg-surface-container-high transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                    <span>แก้ไข</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* View 2: Official Form 4 Table View */
        <div className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-1">
            <div className="flex flex-col">
              <span className="font-bold text-[13px] text-civic-navy font-headline">
                ตารางบันทึกการใช้รถราชการ (แบบ 4)
              </span>
              <span className="text-[11px] text-slate-500">
                สำนักงานพาณิชย์จังหวัดเพชรบุรี • หมายเลขทะเบียน: {selectedPlate === 'all' ? 'ทุกคัน' : selectedPlate}
              </span>
            </div>
            <span className="text-[10px] text-civic-navy bg-surface-container-high px-2 py-0.5 rounded-lg font-bold">
              เลื่อนแนวนอน 👉
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-[11px] whitespace-nowrap min-w-[700px]">
              <thead className="bg-surface-container text-civic-navy font-bold">
                <tr>
                  <th className="p-2.5 text-center">ลำดับ</th>
                  <th className="p-2.5">ว/ด/ป</th>
                  <th className="p-2.5">เวลาออก - กลับ</th>
                  <th className="p-2.5">สถานที่ไป / ภารกิจ</th>
                  <th className="p-2.5">ผู้รับรอง</th>
                  <th className="p-2.5 text-right">ไมล์ออก</th>
                  <th className="p-2.5 text-right">ไมล์กลับ</th>
                  <th className="p-2.5 text-right">ระยะทาง (กม.)</th>
                  <th className="p-2.5 text-center">น้ำมัน (ลิตร)</th>
                  <th className="p-2.5 text-center">พนักงานขับรถ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-on-surface">
                {filteredTrips.map((trip, idx) => (
                  <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 text-center font-bold text-civic-navy">{idx + 1}</td>
                    <td className="p-2.5">{trip.date}</td>
                    <td className="p-2.5">
                      {trip.timeDepart} - {trip.timeReturn}
                    </td>
                    <td className="p-2.5 max-w-xs truncate">{trip.places}</td>
                    <td className="p-2.5 text-slate-600">{trip.approver}</td>
                    <td className="p-2.5 text-right tabular-nums">{trip.odoDepart.toLocaleString()}</td>
                    <td className="p-2.5 text-right tabular-nums">{trip.odoReturn.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-bold text-civic-navy tabular-nums">
                      {trip.distance.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center text-amber-warning font-bold">
                      {trip.fuelLiters > 0 ? trip.fuelLiters : '-'}
                    </td>
                    <td className="p-2.5 text-center">{trip.driverName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Document Signature Block */}
          <div className="mt-2 p-3 bg-surface-container-low rounded-xl flex flex-col gap-2 text-[11px] border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">สรุปการใช้รถประจำเดือน ตุลาคม 2569:</span>
              <span className="font-bold text-civic-navy">
                รวม {filteredTrips.length} เที่ยว | {totalKm.toLocaleString()} กม. | น้ำมัน {totalFuel} ลิตร
              </span>
            </div>
            <div className="pt-2 flex justify-end">
              <div className="text-right">
                <p className="font-bold text-civic-navy">ลงชื่อ ..................................................... ผู้บันทึก</p>
                <p className="text-slate-500 mt-0.5">({activeVehicle.driver}) พนักงานขับรถยนต์</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
