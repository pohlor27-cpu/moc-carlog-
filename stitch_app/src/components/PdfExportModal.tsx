import React, { useRef } from 'react';
import { TripRecord, Vehicle } from '../types';

interface PdfExportModalProps {
  isOpen: boolean;
  vehicle?: Vehicle;
  trips: TripRecord[];
  allVehicles?: Vehicle[];
  isAllCars?: boolean;
  onClose: () => void;
  onTriggerToast: (msg: string) => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  vehicle,
  trips,
  isAllCars = false,
  onClose,
  onTriggerToast,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    onTriggerToast('ส่งคำสั่งพิมพ์เอกสาร แบบ 4 (แนวนอน) เรียบร้อย');
  };

  const filteredTrips = isAllCars
    ? trips
    : vehicle
    ? trips.filter((t) => t.carPlate === vehicle.plate)
    : trips;

  const totalDistance = filteredTrips.reduce((acc, t) => acc + t.distance, 0);
  const totalFuel = filteredTrips.reduce((acc, t) => acc + (t.fuelLiters || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            </div>
            <div>
              <h3 className="font-headline text-[16px] text-civic-navy font-bold">
                พิมพ์เอกสารราชการ: รายงานบันทึกการใช้รถ (แบบ 4)
              </h3>
              <p className="text-[11px] text-slate-muted">
                {isAllCars
                  ? 'แบบฟอร์มทางการ รวม 4 คัน ประจำเดือน ตุลาคม 2569'
                  : `หมายเลขทะเบียน: ${vehicle?.plate} • ผู้ดูแล: ${vehicle?.driver}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-civic-navy text-white text-[12px] font-bold shadow-md hover:bg-civic-navy-dark active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>สั่งพิมพ์ / เซฟ PDF</span>
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Preview */}
        <div
          ref={printAreaRef}
          className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-900"
        >
          {/* Header block in government format */}
          <div className="text-center pb-4 mb-4 border-b border-slate-300">
            <div className="font-headline font-bold text-[18px] text-slate-900">
              บันทึกการใช้รถราชการ (แบบ 4)
            </div>
            <div className="text-[13px] font-semibold text-slate-800 mt-1">
              สำนักงานพาณิชย์จังหวัดเพชรบุรี • กลุ่มงานยุทธศาสตร์และแผนงาน
            </div>
            <div className="text-[12px] text-slate-600 mt-0.5">
              ประจำเดือน: ตุลาคม 2569 | หมายเลขทะเบียน:{' '}
              <span className="font-bold text-civic-navy">
                {isAllCars ? 'รถยนต์ส่วนกลางทุกคัน (4 คัน)' : vehicle?.plate}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead className="bg-slate-200 font-bold text-slate-800">
                <tr>
                  <th className="p-2 border border-slate-300 text-center w-10">ลำดับ</th>
                  <th className="p-2 border border-slate-300 text-center w-20">ว/ด/ป</th>
                  <th className="p-2 border border-slate-300 text-center w-24">เวลาออก - กลับ</th>
                  <th className="p-2 border border-slate-300">สถานที่ไป / ภารกิจปฏิบัติราชการ</th>
                  <th className="p-2 border border-slate-300 text-center">ทะเบียนรถ</th>
                  <th className="p-2 border border-slate-300 text-right w-16">ไมล์ออก</th>
                  <th className="p-2 border border-slate-300 text-right w-16">ไมล์กลับ</th>
                  <th className="p-2 border border-slate-300 text-right w-16">ระยะทาง (กม.)</th>
                  <th className="p-2 border border-slate-300 text-center w-16">น้ำมัน (ลิตร)</th>
                  <th className="p-2 border border-slate-300 text-center">พนักงานขับรถ</th>
                  <th className="p-2 border border-slate-300 text-center">ผู้รับรอง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTrips.map((trip, idx) => (
                  <tr key={trip.id} className="hover:bg-slate-100 transition-colors">
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="p-2 border border-slate-300 text-center whitespace-nowrap">
                      {trip.date}
                    </td>
                    <td className="p-2 border border-slate-300 text-center whitespace-nowrap">
                      {trip.timeDepart} - {trip.timeReturn}
                    </td>
                    <td className="p-2 border border-slate-300">{trip.places}</td>
                    <td className="p-2 border border-slate-300 text-center whitespace-nowrap font-medium text-civic-navy">
                      {trip.carPlate}
                    </td>
                    <td className="p-2 border border-slate-300 text-right tabular-nums">
                      {trip.odoDepart.toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-300 text-right tabular-nums">
                      {trip.odoReturn.toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-bold tabular-nums">
                      {trip.distance.toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-semibold text-amber-800">
                      {trip.fuelLiters > 0 ? trip.fuelLiters : '-'}
                    </td>
                    <td className="p-2 border border-slate-300 text-center whitespace-nowrap">
                      {trip.driverName}
                    </td>
                    <td className="p-2 border border-slate-300 text-center text-slate-700">
                      {trip.approver}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <tr>
                  <td colSpan={7} className="p-2 border border-slate-300 text-right">
                    รวมทั้งสิ้น ({filteredTrips.length} รายการ):
                  </td>
                  <td className="p-2 border border-slate-300 text-right text-civic-navy">
                    {totalDistance.toLocaleString()} กม.
                  </td>
                  <td className="p-2 border border-slate-300 text-center text-amber-900">
                    {totalFuel > 0 ? `${totalFuel} ลิตร` : '-'}
                  </td>
                  <td colSpan={2} className="p-2 border border-slate-300 text-center text-slate-500">
                    เฉลี่ย {(totalDistance / (totalFuel || 1)).toFixed(1)} กม./ลิตร
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Official Signature Blocks */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[12px] pt-4 border-t border-slate-300">
            <div className="flex flex-col items-center">
              <div className="h-10"></div>
              <p className="font-semibold text-slate-800">
                ลงชื่อ ................................................................ ผู้บันทึก
              </p>
              <p className="text-slate-600 mt-1">
                ({vehicle ? vehicle.driver : 'นายกฤษณพัฒน์ แสงหล้า'})
              </p>
              <p className="text-slate-500 text-[11px]">พนักงานขับรถยนต์</p>
              <p className="text-slate-400 text-[10px] mt-0.5">วันที่ 31 ตุลาคม 2569</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-10"></div>
              <p className="font-semibold text-slate-800">
                ลงชื่อ ................................................................ ผู้รับรอง
              </p>
              <p className="text-slate-600 mt-1">(นางกานดา ชำนาญคิด)</p>
              <p className="text-slate-500 text-[11px]">พาณิชย์จังหวัดเพชรบุรี</p>
              <p className="text-slate-400 text-[10px] mt-0.5">วันที่ 31 ตุลาคม 2569</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
