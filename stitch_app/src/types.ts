export type ScreenType = 'home-log' | 'trip-history' | 'maintenance-report' | 'officer-dashboard';

export interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  initialKm: number;
  currentKm: number;
  nextOilKm: number;
  status: 'normal' | 'warning' | 'active' | 'pending';
  statusText: string;
  taxDate: string;
  inspectionDate: string;
  isPrimary?: boolean;
  missionStatus?: string;
  distanceThisMonth: number;
  percentUsage: number;
  color: string;
  ringColor: string;
}

export interface Driver {
  id: string;
  name: string;
  shortName: string;
  initial: string;
  role: string;
  isSpecial: boolean;
  avatarBg?: string;
}

export interface TripRecord {
  id: number;
  date: string;
  timeDepart: string;
  timeReturn: string;
  places: string;
  approver: string;
  odoDepart: number;
  odoReturn: number;
  distance: number;
  fuelLiters: number;
  driverName: string;
  carPlate: string;
  status: 'approved' | 'pending' | 'in_progress';
  isSpecial?: boolean;
  signedBy?: string;
  signedDate?: string;
}

export type MaintenanceCategory =
  | 'ถ่ายน้ำมันเครื่อง'
  | 'แจ้งซ่อมบำรุง / ศูนย์'
  | 'ตรวจสภาพตามระยะ'
  | 'เปลี่ยนยาง / สลับยาง';

export interface MaintenanceRecord {
  id: string;
  carPlate: string;
  driverName: string;
  title: string;
  category: MaintenanceCategory;
  status: 'completed' | 'approved' | 'in_progress';
  cost: number;
  date: string;
  garage: string;
  entryKm: number;
  nextKm: number;
  details: string;
  warranty?: string;
  hasReceipt?: boolean;
  receiptNumber?: string;
}
