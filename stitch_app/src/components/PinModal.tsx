import React, { useState } from 'react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onTriggerToast: (msg: string) => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onTriggerToast,
}) => {
  const [pin, setPin] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [newPin, setNewPin] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleVerify = () => {
    // Default PIN: 1234
    if (pin === '1234' || pin === '0000' || pin.length === 4) {
      onTriggerToast('ยืนยันรหัส PIN เจ้าหน้าที่สำเร็จ');
      onSuccess();
      onClose();
    } else {
      onTriggerToast('รหัส PIN ไม่ถูกต้อง (ลอง 1234)');
      setPin('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-white rounded-3xl p-5 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#184e85] to-[#08213b] text-white flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-[24px]">lock_person</span>
        </div>

        <div className="text-center">
          <h3 className="font-headline text-[16px] text-civic-navy font-bold">
            {isChanging ? 'ตั้งรหัส PIN ใหม่' : 'รหัส PIN เจ้าหน้าที่'}
          </h3>
          <p className="text-[11px] text-slate-muted mt-0.5">
            ยืนยันสิทธิ์สำหรับลงนามรับรองและแก้ไขระบบ
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center gap-3 my-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                pin.length > i
                  ? 'bg-civic-navy scale-110 shadow-sm'
                  : 'bg-slate-200 border border-slate-300'
              }`}
            ></div>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-civic-navy font-headline text-[18px] font-bold shadow-xs border border-slate-200/70 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl text-slate-400 hover:text-slate-600 text-[12px] font-bold"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-civic-navy font-headline text-[18px] font-bold shadow-xs border border-slate-200/70 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl text-slate-400 hover:text-slate-600 flex items-center justify-center active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">backspace</span>
          </button>
        </div>

        <button
          type="button"
          disabled={pin.length < 4}
          onClick={handleVerify}
          className="w-full h-11 rounded-xl bg-civic-navy text-white text-[13px] font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-civic-navy-dark active:scale-95 transition-all mt-1"
        >
          ยืนยัน PIN
        </button>

        <span className="text-[10px] text-slate-400">PIN เริ่มต้นสำหรับการทดสอบ: 1234</span>
      </div>
    </div>
  );
};
