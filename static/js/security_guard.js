/**
 * MOC Phetchaburi Vehicle Logbook - Security Guard & Anti-Reverse Engineering System
 * Confidential & Proprietary - All Rights Reserved
 */
(function () {
    'use strict';

    // 1. Block Keyboard Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
    document.addEventListener('keydown', function (e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Cmd+Opt+I/J/C
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (
            e.key === 'I' || e.key === 'i' || e.keyCode === 73 ||
            e.key === 'J' || e.key === 'j' || e.keyCode === 74 ||
            e.key === 'C' || e.key === 'c' || e.keyCode === 67
        )) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+U (View Source)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+S (Save Page)
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);

    // 2. Prevent Right-Click Context Menu (Except on Images & Inputs)
    document.addEventListener('contextmenu', function (e) {
        const target = e.target;
        if (target && (
            target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'IMG' || 
            target.tagName === 'CANVAS' ||
            target.closest('.receipt-preview') ||
            target.closest('#print-area')
        )) {
            return true;
        }
        e.preventDefault();
        return false;
    }, true);

    // 3. Console Protection & Warning Banner
    try {
        if (window.console) {
            const warningStyle = 'color: #D4AF37; font-size: 20px; font-weight: bold; background: #0B0F17; padding: 10px 20px; border-radius: 8px; border: 1px solid #D4AF37;';
            const descStyle = 'color: #EF4444; font-size: 14px; font-weight: bold; margin-top: 5px;';
            
            setTimeout(() => {
                console.clear();
                console.log('%c🏛️ สำนักงานพาณิชย์จังหวัดเพชรบุรี', warningStyle);
                console.log('%c⚠️ คำเตือนด้านความปลอดภัย: ไม่อนุญาตให้คัดลอกหรือแก้ไขข้อมูลระบบราชการโดยไม่ได้รับอนุญาต', descStyle);
            }, 500);

            // Mute verbose debug in production
            const noop = function () {};
            const originalWarn = console.warn;
            const originalError = console.error;
            
            window.__security_safe_log = function () {};
        }
    } catch (err) {}

    // 4. Anti-Debugger / DevTools Detection Heuristics
    function initDebuggerDefense() {
        let devtoolsOpen = false;
        const threshold = 160;

        setInterval(function () {
            const widthDiff = window.outerWidth - window.innerWidth > threshold;
            const heightDiff = window.outerHeight - window.innerHeight > threshold;
            
            if (widthDiff || heightDiff) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                }
            } else {
                devtoolsOpen = false;
            }
        }, 1000);
    }

    // Initialize defense
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebuggerDefense);
    } else {
        initDebuggerDefense();
    }
})();
