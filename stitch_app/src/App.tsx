import React, { useState, useEffect } from 'react';
import {
  ScreenType,
  Vehicle,
  Driver,
  TripRecord,
  MaintenanceRecord,
} from './types';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
  INITIAL_MAINTENANCE,
  getSavedState,
  saveState,
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeLogScreen } from './components/HomeLogScreen';
import { TripHistoryScreen } from './components/TripHistoryScreen';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { OfficerDashboardScreen } from './components/OfficerDashboardScreen';
import { ActionModal } from './components/ActionModal';
import { EditMileageModal } from './components/EditMileageModal';
import { PdfExportModal } from './components/PdfExportModal';
import { LineShareModal } from './components/LineShareModal';
import { PinModal } from './components/PinModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SignatureModal } from './components/SignatureModal';
import { TripDetailModal } from './components/TripDetailModal';
import { Toast } from './components/Toast';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home-log');

  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    getSavedState('fleet_vehicles', INITIAL_VEHICLES)
  );

  const [activeVehicle, setActiveVehicle] = useState<Vehicle>(() => vehicles[0]);

  const [drivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [activeDriver, setActiveDriver] = useState<Driver>(() => drivers[0]);

  const [trips, setTrips] = useState<TripRecord[]>(() =>
    getSavedState('fleet_trips', INITIAL_TRIPS)
  );

  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >(() => getSavedState('fleet_maintenance', INITIAL_MAINTENANCE));

  // Modals state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'depart' | 'return' | 'manual';
  }>({
    isOpen: false,
    type: 'depart',
  });

  const [editMileageOpen, setEditMileageOpen] = useState(false);
  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    isAllCars: boolean;
  }>({
    isOpen: false,
    isAllCars: false,
  });
  const [lineShareOpen, setLineShareOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    record: MaintenanceRecord | null;
  }>({
    isOpen: false,
    record: null,
  });
  const [signatureModal, setSignatureModal] = useState<{
    isOpen: boolean;
    trip: TripRecord | null;
  }>({
    isOpen: false,
    trip: null,
  });
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    trip: TripRecord | null;
  }>({
    isOpen: false,
    trip: null,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveState('fleet_vehicles', vehicles);
  }, [vehicles]);

  useEffect(() => {
    saveState('fleet_trips', trips);
  }, [trips]);

  useEffect(() => {
    saveState('fleet_maintenance', maintenanceRecords);
  }, [maintenanceRecords]);

  // Keep activeVehicle up to date with vehicles state
  useEffect(() => {
    const updated = vehicles.find((v) => v.id === activeVehicle.id);
    if (updated) {
      setActiveVehicle(updated);
    }
  }, [vehicles, activeVehicle.id]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Handle Trip submit from ActionModal
  const handleTripSubmit = (data: {
    type: 'depart' | 'return' | 'manual';
    driver: string;
    odometer: number;
    destination?: string;
    fuelLiters?: number;
    approver?: string;
  }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' น.';
    const dateStr = now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const currentCarOdo = activeVehicle.currentKm;
    let distance = 0;

    if (data.type === 'depart') {
      // Update vehicle status
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === activeVehicle.id
            ? {
                ...v,
                currentKm: data.odometer,
                missionStatus: `ออกเดินทาง (${data.destination || 'ปฏิบัติราชการ'})`,
              }
            : v
        )
      );
      triggerToast(`บันทึกเวลาออกเดินทาง ${timeStr} ไมล์: ${data.odometer.toLocaleString()} กม.`);
    } else if (data.type === 'return') {
      distance = Math.max(0, data.odometer - currentCarOdo);
      const newTrip: TripRecord = {
        id: (trips[0]?.id || 0) + 1,
        date: dateStr,
        timeDepart: '08:30 น.',
        timeReturn: timeStr,
        places: data.destination || 'ศาลากลาง จ.เพชรบุรี, อ.ท่ายาง',
        approver: data.approver || 'ผอ.กลุ่มยุทธศาสตร์และแผนงาน',
        odoDepart: currentCarOdo,
        odoReturn: data.odometer,
        distance: distance || 35,
        fuelLiters: data.fuelLiters || 0,
        driverName: data.driver,
        carPlate: activeVehicle.plate,
        status: 'approved',
      };

      setTrips((prev) => [newTrip, ...prev]);

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === activeVehicle.id
            ? {
                ...v,
                currentKm: data.odometer,
                distanceThisMonth: v.distanceThisMonth + (distance || 35),
                missionStatus: 'อยู่ที่สำนักงาน',
              }
            : v
        )
      );
      triggerToast(`บันทึกเวลากลับเรียบร้อย วิ่งไป ${distance || 35} กม.`);
    } else {
      // Manual
      const newTrip: TripRecord = {
        id: (trips[0]?.id || 0) + 1,
        date: dateStr,
        timeDepart: '09:00 น.',
        timeReturn: timeStr,
        places: data.destination || 'ศาลากลาง จ.เพชรบุรี, สรรพากร',
        approver: data.approver || 'ผอ.กลุ่มยุทธศาสตร์และแผนงาน',
        odoDepart: currentCarOdo,
        odoReturn: data.odometer,
        distance: Math.max(0, data.odometer - currentCarOdo) || 28,
        fuelLiters: data.fuelLiters || 0,
        driverName: data.driver,
        carPlate: activeVehicle.plate,
        status: 'approved',
      };

      setTrips((prev) => [newTrip, ...prev]);

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === activeVehicle.id
            ? {
                ...v,
                currentKm: data.odometer,
                distanceThisMonth: v.distanceThisMonth + (newTrip.distance || 28),
              }
            : v
        )
      );
      triggerToast('บันทึกข้อมูลเที่ยววิ่งลง แบบ 4 เรียบร้อยแล้ว');
    }
  };

  const handleUpdateMileage = (newKm: number) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === activeVehicle.id ? { ...v, currentKm: newKm } : v
      )
    );
    triggerToast(`ปรับปรุงเลขไมล์เริ่มต้นเป็น ${newKm.toLocaleString()} กม.`);
  };

  const handleAddMaintenance = (newRec: MaintenanceRecord) => {
    setMaintenanceRecords((prev) => [newRec, ...prev]);
    // Also update vehicle's current km and next oil km if applicable
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.plate === newRec.carPlate) {
          const updatedNextOil =
            newRec.category === 'ถ่ายน้ำมันเครื่อง'
              ? newRec.nextKm
              : v.nextOilKm;
          return {
            ...v,
            currentKm: Math.max(v.currentKm, newRec.entryKm),
            nextOilKm: updatedNextOil,
            status: 'normal',
            statusText: 'ปกติ',
          };
        }
        return v;
      })
    );
  };

  const handleSignTrip = (tripId: number, signerName: string) => {
    const today = new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              status: 'approved',
              signedBy: signerName,
              signedDate: today,
            }
          : t
      )
    );
    triggerToast(`ลงนามรับรองเที่ยววิ่ง #${tripId} เรียบร้อยแล้ว`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface font-body text-on-surface">
      <Header
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onOpenPinModal={() => setPinModalOpen(true)}
        unreadCount={2}
      />

      <main className="flex flex-col relative w-full px-4 pt-32 pb-24 bg-surface min-h-screen max-w-lg mx-auto">
        {currentScreen === 'home-log' && (
          <HomeLogScreen
            vehicle={activeVehicle}
            drivers={drivers}
            activeDriver={activeDriver}
            trips={trips.filter((t) => t.carPlate === activeVehicle.plate)}
            onSelectDriver={setActiveDriver}
            onOpenActionModal={(type) => setActionModal({ isOpen: true, type })}
            onOpenEditMileage={() => setEditMileageOpen(true)}
            onOpenPdfModal={() => setPdfModal({ isOpen: true, isAllCars: false })}
            onOpenLineShare={() => setLineShareOpen(true)}
            onTriggerToast={triggerToast}
            onViewTripDetail={(trip) => setDetailModal({ isOpen: true, trip })}
          />
        )}

        {currentScreen === 'trip-history' && (
          <TripHistoryScreen
            vehicles={vehicles}
            trips={trips}
            activeVehicle={activeVehicle}
            onSelectVehicle={setActiveVehicle}
            onOpenPdfModal={(isAllCars) =>
              setPdfModal({ isOpen: true, isAllCars: !!isAllCars })
            }
            onOpenLineShare={() => setLineShareOpen(true)}
            onViewTripDetail={(trip) => setDetailModal({ isOpen: true, trip })}
            onTriggerToast={triggerToast}
          />
        )}

        {currentScreen === 'maintenance-report' && (
          <MaintenanceScreen
            vehicles={vehicles}
            activeVehicle={activeVehicle}
            maintenanceRecords={maintenanceRecords}
            onSelectVehicle={setActiveVehicle}
            onAddRecord={handleAddMaintenance}
            onOpenReceiptModal={(record) =>
              setReceiptModal({ isOpen: true, record })
            }
            onTriggerToast={triggerToast}
          />
        )}

        {currentScreen === 'officer-dashboard' && (
          <OfficerDashboardScreen
            vehicles={vehicles}
            trips={trips}
            onOpenPdfModal={(isAllCars) =>
              setPdfModal({ isOpen: true, isAllCars: !!isAllCars })
            }
            onOpenPinModal={() => setPinModalOpen(true)}
            onOpenSignatureModal={(trip) =>
              setSignatureModal({ isOpen: true, trip })
            }
            onViewTripDetail={(trip) => setDetailModal({ isOpen: true, trip })}
            onTriggerToast={triggerToast}
          />
        )}
      </main>

      <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />

      {/* Action Modal (Depart, Return, Manual) */}
      <ActionModal
        isOpen={actionModal.isOpen}
        type={actionModal.type}
        vehicle={activeVehicle}
        drivers={drivers}
        activeDriver={activeDriver}
        onClose={() => setActionModal({ isOpen: false, type: 'depart' })}
        onSubmit={handleTripSubmit}
        onTriggerToast={triggerToast}
      />

      {/* Edit Mileage Modal */}
      <EditMileageModal
        isOpen={editMileageOpen}
        vehicle={activeVehicle}
        onClose={() => setEditMileageOpen(false)}
        onSave={handleUpdateMileage}
      />

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={pdfModal.isOpen}
        vehicle={activeVehicle}
        trips={trips}
        allVehicles={vehicles}
        isAllCars={pdfModal.isAllCars}
        onClose={() => setPdfModal({ isOpen: false, isAllCars: false })}
        onTriggerToast={triggerToast}
      />

      {/* LINE Share Modal */}
      <LineShareModal
        isOpen={lineShareOpen}
        vehicle={activeVehicle}
        trips={trips}
        onClose={() => setLineShareOpen(false)}
        onTriggerToast={triggerToast}
      />

      {/* PIN Security Modal */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={() => triggerToast('เข้าสู่โหมดผู้ดูแลระบบสำเร็จ')}
        onTriggerToast={triggerToast}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        record={receiptModal.record}
        onClose={() => setReceiptModal({ isOpen: false, record: null })}
      />

      {/* Signature Modal */}
      <SignatureModal
        isOpen={signatureModal.isOpen}
        trip={signatureModal.trip}
        onClose={() => setSignatureModal({ isOpen: false, trip: null })}
        onSignSuccess={handleSignTrip}
      />

      {/* Trip Detail Modal */}
      <TripDetailModal
        isOpen={detailModal.isOpen}
        trip={detailModal.trip}
        onClose={() => setDetailModal({ isOpen: false, trip: null })}
        onOpenPdf={() => setPdfModal({ isOpen: true, isAllCars: false })}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} />
    </div>
  );
}
