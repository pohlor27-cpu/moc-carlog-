// State
let appState = {
    drivers: [],
    selectedDriverId: null,
    vehicles: [],
    selectedVehicleId: null,
    activeTrips: [],
    historyTrips: [],
    currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    departImageFile: null,
    arriveImageFile: null,
    currentArriveTripId: null
};

// Thai Date formatting helper
function getThaiDateNow() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear() + 543;
    return `${d}/${m}/${y}`;
}

function getTimeNow() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getTodayInputFormat() {
    const now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
    initEventListeners();
    await loadInitialData();
    setInterval(loadActiveTrips, 15000); // refresh active trips every 15s
});

async function loadInitialData() {
    await Promise.all([loadDrivers(), loadVehicles()]);
    await loadActiveTrips();
    await loadHistoryTrips();
}

// ----------------- Data Loaders -----------------

async function loadDrivers() {
    try {
        const res = await fetch("/api/drivers");
        const data = await res.json();
        appState.drivers = data.drivers || [];
        renderDriversGrid();
    } catch (e) {
        console.error("Error loading drivers:", e);
    }
}

async function loadVehicles() {
    try {
        const res = await fetch("/api/vehicles");
        const data = await res.json();
        appState.vehicles = data.vehicles || [];
        renderVehicleSelects();
    } catch (e) {
        console.error("Error loading vehicles:", e);
    }
}

async function loadActiveTrips() {
    try {
        const res = await fetch("/api/trips/active");
        const data = await res.json();
        appState.activeTrips = data.active_trips || [];
        renderActiveTrips();
    } catch (e) {
        console.error("Error loading active trips:", e);
    }
}

async function loadHistoryTrips() {
    const vehicleId = document.getElementById("filter-vehicle")?.value || "";
    const month = document.getElementById("filter-month")?.value || appState.currentMonth;
    
    try {
        let url = `/api/trips?month=${month}`;
        if (vehicleId) url += `&vehicle_id=${vehicleId}`;
        
        const res = await fetch(url);
        const data = await res.json();
        appState.historyTrips = data.trips || [];
        renderHistoryTable();
    } catch (e) {
        console.error("Error loading history:", e);
    }
}

// ----------------- UI Renderers -----------------

function renderDriversGrid() {
    const container = document.getElementById("driver-grid");
    if (!container) return;
    
    container.innerHTML = "";
    appState.drivers.forEach((driver, idx) => {
        const isSelected = appState.selectedDriverId === driver.id || (!appState.selectedDriverId && idx === 0);
        if (isSelected && !appState.selectedDriverId) {
            appState.selectedDriverId = driver.id;
        }

        const card = document.createElement("div");
        card.className = `driver-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => selectDriver(driver.id);
        
        const initials = driver.nickname ? driver.nickname.charAt(0) : driver.name.charAt(0);
        
        card.innerHTML = `
            <div class="driver-avatar" style="background: ${driver.avatar_color || '#2563eb'}">${initials}</div>
            <div class="driver-name" style="font-size: 1rem; font-weight: 700;">${driver.nickname || driver.name}</div>
            <div class="driver-nick" style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">${driver.name}</div>
        `;
        container.appendChild(card);
    });
}

function selectDriver(driverId) {
    appState.selectedDriverId = driverId;
    renderDriversGrid();
    
    // Auto-match vehicle: Driver 1 -> Vehicle 1, Driver 2 -> Vehicle 2, etc.
    const driverIdx = appState.drivers.findIndex(d => d.id === driverId);
    if (driverIdx >= 0 && appState.vehicles[driverIdx]) {
        appState.selectedVehicleId = appState.vehicles[driverIdx].id;
    }
    
    updateTopVehicleBanner();
    
    // Also sync dropdowns
    const departSelect = document.getElementById("depart-vehicle");
    const manualSelect = document.getElementById("manual-vehicle");
    const filterSelect = document.getElementById("filter-vehicle");
    if (departSelect && appState.selectedVehicleId) departSelect.value = appState.selectedVehicleId;
    if (manualSelect && appState.selectedVehicleId) manualSelect.value = appState.selectedVehicleId;
    if (filterSelect && appState.selectedVehicleId) {
        filterSelect.value = appState.selectedVehicleId;
        loadHistoryTrips();
    }
}

function updateTopVehicleBanner() {
    const driver = appState.drivers.find(d => d.id === appState.selectedDriverId) || appState.drivers[0];
    const vehicle = appState.vehicles.find(v => v.id === appState.selectedVehicleId) || appState.vehicles[0];
    
    if (driver) {
        const topDriverElem = document.getElementById("top-driver-name");
        if (topDriverElem) topDriverElem.innerText = `${driver.nickname || driver.name} (${driver.name})`;
    }
    
    if (vehicle) {
        const topPlateElem = document.getElementById("top-car-plate");
        const topMileageElem = document.getElementById("top-car-mileage");
        if (topPlateElem) topPlateElem.innerHTML = `<span>🚙</span> ${vehicle.license_plate}`;
        if (topMileageElem) topMileageElem.innerText = (vehicle.current_mileage || 0).toLocaleString();
    }
}

function renderVehicleSelects() {
    const departSelect = document.getElementById("depart-vehicle");
    const manualSelect = document.getElementById("manual-vehicle");
    const filterSelect = document.getElementById("filter-vehicle");
    const editSelect = document.getElementById("edit-mileage-vehicle");
    
    const optionsHtml = appState.vehicles.map(v => 
        `<option value="${v.id}" data-mileage="${v.current_mileage}">${v.license_plate} - ไมล์ล่าสุด: ${v.current_mileage.toLocaleString()} กม.</option>`
    ).join("");

    if (departSelect) departSelect.innerHTML = optionsHtml;
    if (manualSelect) manualSelect.innerHTML = optionsHtml;
    if (editSelect) editSelect.innerHTML = optionsHtml;
    if (filterSelect) {
        filterSelect.innerHTML = appState.vehicles.map(v => `<option value="${v.id}">${v.license_plate}</option>`).join("");
    }
    
    updateTopVehicleBanner();
}

function openEditMileageModal() {
    const editSelect = document.getElementById("edit-mileage-vehicle");
    if (editSelect) {
        if (appState.selectedVehicleId) editSelect.value = appState.selectedVehicleId;
        onEditVehicleChange();
    }
    document.getElementById("modal-edit-mileage").classList.add("open");
}

function closeEditMileageModal() {
    document.getElementById("modal-edit-mileage").classList.remove("open");
}

function onEditVehicleChange() {
    const editSelect = document.getElementById("edit-mileage-vehicle");
    const vehicleId = parseInt(editSelect.value);
    const vehicle = appState.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        document.getElementById("edit-mileage-input").value = vehicle.current_mileage || 0;
    }
}

async function submitEditMileage(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-edit-mileage-submit");
    btn.disabled = true;
    btn.innerText = "กำลังบันทึก...";

    const vehicleId = document.getElementById("edit-mileage-vehicle").value;
    const newMileage = parseInt(document.getElementById("edit-mileage-input").value) || 0;

    try {
        const res = await fetch(`/api/vehicles/${vehicleId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_mileage: newMileage })
        });
        const result = await res.json();
        if (result.status === "success") {
            closeEditMileageModal();
            await loadVehicles();
            alert("บันทึกและตั้งค่าเลขไมล์เริ่มต้นสำเร็จเรียบร้อยครับ!");
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "💾 บันทึกเลขไมล์";
    }
}

function renderActiveTrips() {
    const container = document.getElementById("active-trips-list");
    const section = document.getElementById("active-trips-card");
    if (!container || !section) return;

    if (appState.activeTrips.length === 0) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    container.innerHTML = appState.activeTrips.map(trip => `
        <div class="active-trip-item">
            <div class="active-trip-info">
                <div class="active-trip-plate">🚗 ${trip.license_plate} (${trip.driver_nickname || trip.driver_name})</div>
                <div class="active-trip-desc">
                    📍 <strong>ไป:</strong> ${trip.destination} | ออก: ${trip.depart_time} น. (ไมล์: ${trip.depart_mileage.toLocaleString()})
                </div>
            </div>
            <button class="btn-finish-trip" onclick="openArriveModal(${trip.id})">
                🏁 บันทึกกลับถึง สนง.
            </button>
        </div>
    `).join("");
}

function renderHistoryTable() {
    const tbody = document.getElementById("history-table-body");
    if (!tbody) return;

    if (appState.historyTrips.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 24px; color: #94a3b8;">ยังไม่มีข้อมูลการบันทึกในเดือนนี้</td></tr>`;
        return;
    }

    tbody.innerHTML = appState.historyTrips.map(trip => {
        const isCompleted = trip.status === 'completed';
        return `
            <tr>
                <td><strong>#${trip.trip_number || '-'}</strong></td>
                <td>
                    <div><strong>${trip.depart_date}</strong></div>
                    <small style="color:#64748b;">ออก: ${trip.depart_time} น.</small>
                </td>
                <td><strong>${trip.license_plate}</strong><br><small style="color:#64748b;">${trip.driver_nickname || trip.driver_name}</small></td>
                <td>${trip.destination}</td>
                <td>${trip.approver || '-'}</td>
                <td>
                    ${isCompleted ? `
                        <div>${trip.arrive_date} (${trip.arrive_time} น.)</div>
                        <small style="color:#059669; font-weight:600;">+${(trip.distance_km || 0).toLocaleString()} กม.</small>
                    ` : `<span class="badge badge-warning">กำลังเดินทาง</span>`}
                </td>
                <td>
                    <div>ไมล์ออก: ${trip.depart_mileage?.toLocaleString() || '-'}</div>
                    <div>ไมล์กลับ: ${trip.arrive_mileage?.toLocaleString() || '-'}</div>
                </td>
                <td>
                    ${trip.fuel_liters ? `<span style="color:#d97706; font-weight:600;">⛽ ${trip.fuel_liters} ลิตร</span>` : '-'}
                </td>
                <td style="text-align:center;">
                    <button class="action-icon-btn" onclick="deleteTrip(${trip.id})" title="ลบรายการ">🗑️</button>
                </td>
            </tr>
        `;
    }).join("");
}

// ----------------- Modal Controls -----------------

function openDepartModal() {
    document.getElementById("depart-date").value = getTodayInputFormat();
    document.getElementById("depart-time").value = getTimeNow();
    
    // Set default mileage from selected vehicle
    const vehicleSelect = document.getElementById("depart-vehicle");
    if (vehicleSelect && vehicleSelect.selectedOptions[0]) {
        const mileage = vehicleSelect.selectedOptions[0].getAttribute("data-mileage") || 0;
        document.getElementById("depart-mileage").value = mileage;
    }
    
    // Reset photo & OCR
    resetPhotoBox("depart");
    document.getElementById("depart-destination").value = "";
    syncDestinationChips("depart-destination");
    document.getElementById("depart-approver").value = "";
    
    document.getElementById("modal-depart").classList.add("open");
}

function closeDepartModal() {
    document.getElementById("modal-depart").classList.remove("open");
}

function openArriveModal(tripId = null) {
    if (!appState.activeTrips || appState.activeTrips.length === 0) {
        if (confirm("⚠️ ขณะนี้ยังไม่มีรถคันใดอยู่ในสถานะ 'กำลังเดินทาง' ครับ (ยังไม่ได้กด '🚗 บันทึกเวลาออก')\n\n👉 ต้องการเปิดหน้า '✏️ กรอกเลขไมล์เอง' เพื่อบันทึกทั้งเที่ยวในครั้งเดียวหรือไม่ครับ?")) {
            openManualModal();
        }
        return;
    }

    const select = document.getElementById("arrive-trip-select");
    if (select) {
        select.innerHTML = appState.activeTrips.map(t => 
            `<option value="${t.id}">🚗 ${t.license_plate} (${t.driver_nickname || t.driver_name}) ➔ ${t.destination} (ออก ${t.depart_time} น.)</option>`
        ).join("");
    }

    let targetTripId = tripId;
    if (!targetTripId) {
        // Auto-match current selected driver or vehicle
        const matched = appState.activeTrips.find(t => t.vehicle_id === appState.selectedVehicleId)
            || appState.activeTrips.find(t => t.driver_id === appState.selectedDriverId)
            || appState.activeTrips[0];
        targetTripId = matched ? matched.id : appState.activeTrips[0].id;
    }

    if (select) select.value = targetTripId;
    selectArriveTrip(targetTripId);

    document.getElementById("arrive-date").value = getTodayInputFormat();
    document.getElementById("arrive-time").value = getTimeNow();
    document.getElementById("arrive-fuel-liters").value = "";
    document.getElementById("arrive-fuel-authorizer").value = "";
    
    resetPhotoBox("arrive");
    
    document.getElementById("modal-arrive").classList.add("open");
}

function onArriveTripSelectChange(val) {
    const tripId = parseInt(val);
    if (tripId) selectArriveTrip(tripId);
}

function selectArriveTrip(tripId) {
    appState.currentArriveTripId = tripId;
    const trip = appState.activeTrips.find(t => t.id === tripId) || appState.historyTrips.find(t => t.id === tripId);
    
    if (trip) {
        document.getElementById("arrive-trip-info").innerHTML = `
            <div style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                🚗 <strong>รถทะเบียน:</strong> ${trip.license_plate} (${trip.driver_nickname || trip.driver_name})
            </div>
            <div style="color: #475569; font-size: 0.88rem;">
                📍 <strong>สถานที่ไป:</strong> ${trip.destination} | ⏰ <strong>เวลาออก:</strong> ${trip.depart_time} น. (${trip.depart_date})
            </div>
            <div style="color: #2563eb; font-weight: 700; margin-top: 4px; font-size: 0.95rem;">
                🔢 <strong>เลขไมล์ตอนออก:</strong> <span id="arrive-depart-mileage-val">${trip.depart_mileage}</span> กม.
            </div>
        `;
        
        const arriveMileageInput = document.getElementById("arrive-mileage");
        if (arriveMileageInput && (!arriveMileageInput.value || parseInt(arriveMileageInput.value) <= trip.depart_mileage)) {
            arriveMileageInput.value = trip.depart_mileage;
        }
        updateDistanceCalc();
    }
}

function closeArriveModal() {
    document.getElementById("modal-arrive").classList.remove("open");
}

function openManualModal() {
    document.getElementById("manual-depart-date").value = getTodayInputFormat();
    document.getElementById("manual-depart-time").value = getTimeNow();
    document.getElementById("manual-arrive-date").value = getTodayInputFormat();
    document.getElementById("manual-arrive-time").value = getTimeNow();
    
    const curMileage = appState.vehicles[0]?.current_mileage || 52204;
    document.getElementById("manual-depart-mileage").value = curMileage;
    document.getElementById("manual-arrive-mileage").value = curMileage + 10;
    document.getElementById("manual-destination").value = "";
    syncDestinationChips("manual-destination");
    document.getElementById("manual-approver").value = "";
    document.getElementById("manual-fuel-liters").value = "";
    document.getElementById("manual-fuel-authorizer").value = "";
    
    updateManualDistanceCalc();
    document.getElementById("modal-manual").classList.add("open");
}

function closeManualModal() {
    document.getElementById("modal-manual").classList.remove("open");
}

function updateManualDistanceCalc() {
    const dep = parseInt(document.getElementById("manual-depart-mileage").value) || 0;
    const arr = parseInt(document.getElementById("manual-arrive-mileage").value) || 0;
    const dist = Math.max(0, arr - dep);
    const badge = document.getElementById("manual-calc-distance-badge");
    if (badge) {
        badge.innerText = `ระยะทาง: ${dist.toLocaleString()} กม.`;
    }
}

async function submitManualTrip(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-manual-submit");
    btn.disabled = true;
    btn.innerText = "กำลังบันทึก...";

    const formData = new FormData();
    formData.append("vehicle_id", document.getElementById("manual-vehicle").value);
    formData.append("driver_id", appState.selectedDriverId || 1);
    formData.append("depart_date", document.getElementById("manual-depart-date").value);
    formData.append("depart_time", document.getElementById("manual-depart-time").value);
    formData.append("depart_mileage", document.getElementById("manual-depart-mileage").value);
    formData.append("destination", document.getElementById("manual-destination").value);
    formData.append("approver", document.getElementById("manual-approver").value);
    formData.append("arrive_date", document.getElementById("manual-arrive-date").value);
    formData.append("arrive_time", document.getElementById("manual-arrive-time").value);
    formData.append("arrive_mileage", document.getElementById("manual-arrive-mileage").value);
    formData.append("fuel_liters", document.getElementById("manual-fuel-liters").value || "0");
    formData.append("fuel_authorizer", document.getElementById("manual-fuel-authorizer").value || "");

    try {
        const res = await fetch("/api/trips/manual", {
            method: "POST",
            body: formData
        });
        const result = await res.json();
        if (result.status === "success") {
            closeManualModal();
            await loadInitialData();
            alert(`บันทึกข้อมูลเรียบร้อยแล้วครับ! (ระยะทาง ${result.distance_km} กม.)`);
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "💾 บันทึกลงตารางทันที";
    }
}

function setTimeNow(type) {
    const input = document.getElementById(`${type}-time`);
    if (input) input.value = getTimeNow();
}

function adjustTime(type, minutesDelta) {
    const input = document.getElementById(`${type}-time`);
    if (!input) return;
    
    let currentVal = input.value || getTimeNow();
    let [h, m] = currentVal.split(":").map(Number);
    let totalMins = h * 60 + m + minutesDelta;
    
    // Wrap within 24 hours
    if (totalMins < 0) totalMins += 24 * 60;
    totalMins = totalMins % (24 * 60);
    
    let newH = String(Math.floor(totalMins / 60)).padStart(2, '0');
    let newM = String(totalMins % 60).padStart(2, '0');
    input.value = `${newH}:${newM}`;
}

function adjustMileage(type, deltaKm) {
    const input = document.getElementById(`${type}-mileage`);
    if (!input) return;
    
    let currentVal = parseInt(input.value) || 0;
    input.value = Math.max(0, currentVal + deltaKm);
    
    if (type === "arrive") updateDistanceCalc();
}

function resetPhotoBox(type) {
    document.getElementById(`${type}-photo-preview`).style.display = "none";
    document.getElementById(`${type}-photo-placeholder`).style.display = "block";
    document.getElementById(`${type}-ai-badge`).style.display = "none";
    
    const camInput = document.getElementById(`${type}-photo-camera`);
    const galInput = document.getElementById(`${type}-photo-gallery`);
    if (camInput) camInput.value = "";
    if (galInput) galInput.value = "";
    
    if (type === "depart") appState.departImageFile = null;
    if (type === "arrive") appState.arriveImageFile = null;
}

// ----------------- Camera & Gallery & AI OCR -----------------

function handlePhotoSelected(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    if (type === "depart") appState.departImageFile = file;
    if (type === "arrive") appState.arriveImageFile = file;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById(`${type}-photo-preview`);
        preview.src = e.target.result;
        preview.style.display = "block";
        document.getElementById(`${type}-photo-placeholder`).style.display = "none";
    };
    reader.readAsDataURL(file);

    // Client-side fallback from file timestamp
    if (file.lastModified) {
        const fileDate = new Date(file.lastModified);
        const y = fileDate.getFullYear();
        const m = String(fileDate.getMonth() + 1).padStart(2, '0');
        const d = String(fileDate.getDate()).padStart(2, '0');
        const hh = String(fileDate.getHours()).padStart(2, '0');
        const mm = String(fileDate.getMinutes()).padStart(2, '0');
        
        document.getElementById(`${type}-date`).value = `${y}-${m}-${d}`;
        document.getElementById(`${type}-time`).value = `${hh}:${mm}`;
    }

    // Trigger AI Vision & EXIF OCR
    runAiOcr(file, type);
}

async function runAiOcr(file, type) {
    const badge = document.getElementById(`${type}-ai-badge`);
    badge.innerHTML = `🔍 AI กำลังอ่านเลขไมล์ วันที่ และเวลาจากรูปถ่าย...`;
    badge.style.display = "inline-flex";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/ocr/analyze", {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        let detailMsg = [];

        // Auto-fill mileage into input field
        if (data.mileage) {
            const mileageInput = document.getElementById(`${type}-mileage`);
            mileageInput.value = data.mileage;
            
            // Visual highlight effect
            mileageInput.style.transition = "all 0.3s ease";
            mileageInput.style.backgroundColor = "#dcfce7";
            mileageInput.style.borderColor = "#16a34a";
            setTimeout(() => {
                mileageInput.style.backgroundColor = "white";
            }, 1500);

            detailMsg.push(`เลขไมล์: <strong>${data.mileage.toLocaleString()} กม.</strong>`);
            if (type === "arrive") updateDistanceCalc();
        }

        // Auto-fill extracted date & time from EXIF/Vision
        if (data.extracted_date) {
            document.getElementById(`${type}-date`).value = data.extracted_date;
            detailMsg.push(`วันที่: <strong>${data.extracted_date}</strong>`);
        }
        if (data.extracted_time) {
            document.getElementById(`${type}-time`).value = data.extracted_time;
            detailMsg.push(`เวลา: <strong>${data.extracted_time} น.</strong>`);
        }

        if (data.mileage) {
            badge.style.background = "#dcfce7";
            badge.style.color = "#166534";
            badge.innerHTML = `✅ AI อ่านเลขไมล์สำเร็จ: <strong>${data.mileage.toLocaleString()} กม.</strong> | ${data.extracted_time ? `เวลา: <strong>${data.extracted_time} น.</strong>` : ''}`;
        } else if (data.note) {
            badge.style.background = "#fef3c7";
            badge.style.color = "#92400e";
            badge.innerHTML = `⚠️ ${data.note}`;
        } else {
            badge.innerHTML = `ℹ️ กรุณาตรวจสอบหรือพิมพ์เลขไมล์`;
        }
    } catch (e) {
        badge.style.background = "#fee2e2";
        badge.style.color = "#991b1b";
        badge.innerHTML = `⚠️ การประมวลผลขัดข้อง: ${e.message}`;
    }
}

function updateDistanceCalc() {
    const departValElem = document.getElementById("arrive-depart-mileage-val");
    const departMileage = departValElem ? parseInt(departValElem.innerText) || 0 : 0;
    const arriveMileage = parseInt(document.getElementById("arrive-mileage").value) || 0;
    
    const distance = Math.max(0, arriveMileage - departMileage);
    const distElem = document.getElementById("calc-distance-badge");
    if (distElem) {
        distElem.innerText = `ระยะทางรวม: ${distance.toLocaleString()} กม.`;
    }
}

// ----------------- Multi Quick Destination Chips -----------------

function toggleDestination(inputId, text) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let currentVal = input.value.trim();
    let items = currentVal ? currentVal.split(/[,，]\s*/).map(s => s.trim()).filter(Boolean) : [];

    const existingIdx = items.indexOf(text);
    if (existingIdx >= 0) {
        // Toggle OFF if already clicked
        items.splice(existingIdx, 1);
    } else {
        // Toggle ON (Append to list)
        items.push(text);
    }

    input.value = items.join(", ");
    syncDestinationChips(inputId);
}

function clearDestinations(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.value = "";
    syncDestinationChips(inputId);
}

function syncDestinationChips(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const currentVal = input.value.toLowerCase();
    const modal = input.closest(".modal-card") || document;
    const chips = modal.querySelectorAll(".chip-btn[data-dest]");

    chips.forEach(chip => {
        const dest = chip.getAttribute("data-dest");
        if (dest && currentVal.includes(dest.toLowerCase())) {
            chip.classList.add("active-tag");
        } else {
            chip.classList.remove("active-tag");
        }
    });
}

// ----------------- Submissions -----------------

async function submitDeparture(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("btn-depart-submit");
    submitBtn.disabled = true;
    submitBtn.innerText = "กำลังบันทึก...";

    const formData = new FormData();
    formData.append("vehicle_id", document.getElementById("depart-vehicle").value);
    formData.append("driver_id", appState.selectedDriverId || 1);
    formData.append("depart_date", document.getElementById("depart-date").value);
    formData.append("depart_time", document.getElementById("depart-time").value);
    formData.append("depart_mileage", document.getElementById("depart-mileage").value);
    formData.append("destination", document.getElementById("depart-destination").value);
    formData.append("approver", document.getElementById("depart-approver").value);
    
    if (appState.departImageFile) {
        formData.append("image", appState.departImageFile);
    }

    try {
        const res = await fetch("/api/trips/depart", {
            method: "POST",
            body: formData
        });
        const result = await res.json();
        
        if (result.status === "success") {
            closeDepartModal();
            await loadInitialData();
            alert("บันทึกเวลาออกสำเร็จเรียบร้อยครับ!");
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + e.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "บันทึกเวลาออก";
    }
}

async function submitArrival(e) {
    e.preventDefault();
    if (!appState.currentArriveTripId) {
        alert("⚠️ ไม่พบข้อมูลเที่ยวรถที่กำลังบันทึก กรุณาเลือกเที่ยวรถที่ต้องการบันทึกเวลากลับ");
        return;
    }

    const submitBtn = document.getElementById("btn-arrive-submit");
    submitBtn.disabled = true;
    submitBtn.innerText = "กำลังบันทึก...";

    const formData = new FormData();
    formData.append("arrive_date", document.getElementById("arrive-date").value);
    formData.append("arrive_time", document.getElementById("arrive-time").value);
    formData.append("arrive_mileage", document.getElementById("arrive-mileage").value);
    formData.append("fuel_liters", document.getElementById("arrive-fuel-liters").value || "0");
    formData.append("fuel_authorizer", document.getElementById("arrive-fuel-authorizer").value || "");
    
    if (appState.arriveImageFile) {
        formData.append("image", appState.arriveImageFile);
    }

    try {
        const res = await fetch(`/api/trips/${appState.currentArriveTripId}/arrive`, {
            method: "POST",
            body: formData
        });
        const result = await res.json();
        
        if (res.ok && result.status === "success") {
            closeArriveModal();
            await loadInitialData();
            alert(`✅ บันทึกเวลากลับสำเร็จเรียบร้อยครับ!\nระยะทางวิ่ง: ${result.distance_km.toLocaleString()} กม.`);
        } else {
            alert(`⚠️ เกิดข้อผิดพลาด: ${result.detail || result.message || 'ไม่สามารถบันทึกได้'}`);
        }
    } catch (e) {
        alert("⚠️ เกิดข้อผิดพลาดในการบันทึก: " + e.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "💾 บันทึกเวลากลับ";
    }
}

async function deleteTrip(tripId) {
    if (!confirm("คุณต้องการลบรายการบันทึกนี้ใช่หรือไม่?")) return;
    try {
        await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
        await loadInitialData();
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการลบรายการ");
    }
}

// ----------------- Print / Form 4 Generator -----------------

async function fetchForm4Data() {
    const vehicleSelect = document.getElementById("filter-vehicle");
    const vehicleId = vehicleSelect.value || (appState.vehicles[0] ? appState.vehicles[0].id : 1);
    const month = document.getElementById("filter-month").value || appState.currentMonth;

    const res = await fetch(`/api/report/form4?vehicle_id=${vehicleId}&month=${month}`);
    if (!res.ok) throw new Error("ไม่พบข้อมูลรายงาน");
    return await res.json();
}

function populateForm4DOM(data) {
    document.getElementById("print-plate").innerText = data.license_plate;
    document.getElementById("print-prev-month").innerText = data.prev_month_label || data.month_label;
    document.getElementById("print-start-mileage").innerText = (data.start_mileage || 0).toLocaleString();

    const tbody = document.getElementById("print-table-body");
    tbody.innerHTML = "";

    const maxRows = Math.max(12, data.trips.length);
    for (let i = 0; i < maxRows; i++) {
        const t = data.trips[i] || {};
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="height:24px;">${t.trip_number || (i < data.trips.length ? i + 1 : '')}</td>
            <td>${t.depart_date || ''}</td>
            <td>${t.depart_time || ''}</td>
            <td>${t.depart_mileage ? t.depart_mileage.toLocaleString() : ''}</td>
            <td>${t.approver || ''}</td>
            <td style="text-align:left; padding-left: 4px;">${t.destination || ''}</td>
            <td>${t.arrive_date || ''}</td>
            <td>${t.arrive_time || ''}</td>
            <td>${t.distance_km ? t.distance_km.toLocaleString() : ''}</td>
            <td>${t.arrive_mileage ? t.arrive_mileage.toLocaleString() : ''}</td>
            <td>${t.driver_name || ''}</td>
            <td>${t.fuel_liters ? t.fuel_liters : ''}</td>
            <td>${t.fuel_authorizer || ''}</td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById("print-sum-month").innerText = data.month_name || '-';
    document.getElementById("print-sum-year").innerText = data.year_be || '-';
    document.getElementById("print-sum-fuel").innerText = data.summary.total_fuel_liters || '0';
    document.getElementById("print-sum-trips").innerText = data.summary.total_trips || '0';
    document.getElementById("print-sum-distance").innerText = (data.summary.total_distance_km || 0).toLocaleString();
    document.getElementById("print-driver-name").innerText = data.summary.driver_name || 'กฤษณพัฒน์ แสงหล้า';
}

async function generateForm4Print() {
    try {
        const data = await fetchForm4Data();
        populateForm4DOM(data);
        window.print();
    } catch (e) {
        alert("ไม่สามารถสั่งพิมพ์ได้: " + e.message);
    }
}

async function downloadForm4Image() {
    try {
        const data = await fetchForm4Data();
        populateForm4DOM(data);

        const printArea = document.getElementById("print-area");
        printArea.classList.add("active-preview");

        // Wait brief tick for font rendering
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(printArea.querySelector(".form4-page"), {
            scale: 2, // High resolution crisp image
            useCORS: true,
            backgroundColor: "#ffffff"
        });

        printArea.classList.remove("active-preview");

        // Download PNG
        const link = document.createElement("a");
        link.download = `แบบ4_บันทึกการใช้รถ_${data.license_plate.replace(/\s+/g, '_')}_${data.month_label.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

    } catch (e) {
        alert("ไม่สามารถเซฟเป็นรูปภาพได้: " + e.message);
    }
}

// ----------------- Event Listeners -----------------

function initEventListeners() {
    // Mileage input changes update distance live
    document.getElementById("arrive-mileage")?.addEventListener("input", updateDistanceCalc);
    
    // Vehicle selection updates default mileage
    document.getElementById("depart-vehicle")?.addEventListener("change", (e) => {
        const option = e.target.selectedOptions[0];
        if (option) {
            document.getElementById("depart-mileage").value = option.getAttribute("data-mileage") || 0;
        }
    });

    // Month filter change
    const monthInput = document.getElementById("filter-month");
    if (monthInput) {
        monthInput.value = appState.currentMonth;
        monthInput.addEventListener("change", (e) => {
            appState.currentMonth = e.target.value;
            loadHistoryTrips();
        });
    }

    document.getElementById("filter-vehicle")?.addEventListener("change", loadHistoryTrips);
}
