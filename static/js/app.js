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
    updateOfflineBadgeUI();
    await Promise.all([loadDrivers(), loadVehicles()]);
    await loadActiveTrips();
    await loadHistoryTrips();
    syncOfflineQueue();
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
        
        const initials = driver.name.charAt(0);
        
        card.innerHTML = `
            <div class="driver-avatar" style="background: ${driver.avatar_color || '#2563eb'}">${initials}</div>
            <div class="driver-name" style="font-size: 0.95rem; font-weight: 700;">${driver.name}</div>
            <div class="driver-nick" style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">พนักงานขับรถ</div>
        `;
        container.appendChild(card);
    });

    // Control visibility of Admin Settings button (Only Driver 1 / กฤษณพัฒน์ แสงหล้า can see)
    const adminBtn = document.getElementById("btn-admin-settings");
    if (adminBtn) {
        adminBtn.style.display = (appState.selectedDriverId === 1) ? "flex" : "none";
    }

    // Also populate edit trip driver select
    const editDriverSelect = document.getElementById("edit-trip-driver");
    if (editDriverSelect) {
        editDriverSelect.innerHTML = appState.drivers.map(d => 
            `<option value="${d.id}">${d.name}</option>`
        ).join("");
    }
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
    
    // Toggle Admin Settings button
    const adminBtn = document.getElementById("btn-admin-settings");
    if (adminBtn) {
        adminBtn.style.display = (appState.selectedDriverId === 1) ? "flex" : "none";
    }
    
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
        if (topDriverElem) topDriverElem.innerText = driver.name;
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
    const editTripSelect = document.getElementById("edit-trip-vehicle");
    
    const optionsHtml = appState.vehicles.map(v => {
        const primaryDriver = appState.drivers.find(d => d.id === (v.primary_driver_id || v.id));
        const pName = primaryDriver ? ` (รถประจำ: ${primaryDriver.name})` : '';
        return `<option value="${v.id}" data-mileage="${v.current_mileage}">${v.license_plate}${pName} - ไมล์: ${v.current_mileage.toLocaleString()} กม.</option>`;
    }).join("");

    if (departSelect) departSelect.innerHTML = optionsHtml;
    if (manualSelect) manualSelect.innerHTML = optionsHtml;
    if (editSelect) editSelect.innerHTML = optionsHtml;
    if (editTripSelect) editTripSelect.innerHTML = optionsHtml;
    if (filterSelect) {
        filterSelect.innerHTML = appState.vehicles.map(v => {
            const primaryDriver = appState.drivers.find(d => d.id === (v.primary_driver_id || v.id));
            const pName = primaryDriver ? ` (${primaryDriver.name})` : '';
            return `<option value="${v.id}">${v.license_plate}${pName}</option>`;
        }).join("");
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
                <div class="active-trip-plate">🚗 ${trip.license_plate} (${trip.driver_name})</div>
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
                <td style="white-space: nowrap;">
                    <div><strong>${formatForm4Date(trip.depart_date)}</strong></div>
                    <small style="color:#64748b;">ออก: ${trip.depart_time} น.</small>
                </td>
                <td><strong>${trip.license_plate}</strong><br><small style="color:#64748b;">${trip.driver_name}</small></td>
                <td>${trip.destination}</td>
                <td>${trip.approver || '-'}</td>
                <td style="white-space: nowrap;">
                    ${isCompleted ? `
                        <div><strong>${formatForm4Date(trip.arrive_date)}</strong></div>
                        <small style="color:#64748b;">ถึง: ${trip.arrive_time} น. <span style="color:#059669; font-weight:700;">(+${(trip.distance_km || 0).toLocaleString()} กม.)</span></small>
                    ` : `<span class="badge badge-warning">กำลังเดินทาง</span>`}
                </td>
                <td style="white-space: nowrap;">
                    <div>ออก: <strong>${trip.depart_mileage?.toLocaleString() || '-'}</strong></div>
                    <div>กลับ: <strong>${trip.arrive_mileage?.toLocaleString() || '-'}</strong></div>
                </td>
                <td>
                    ${trip.fuel_liters ? `<span style="color:#d97706; font-weight:600;">⛽ ${trip.fuel_liters} ลิตร</span>` : '-'}
                </td>
                <td style="text-align:center; white-space: nowrap;">
                    <button class="action-icon-btn" onclick="openEditTripModal(${trip.id})" title="แก้ไขรายการ" style="color: #2563eb; margin-right: 6px; font-size: 1.05rem;">✏️</button>
                    <button class="action-icon-btn" onclick="deleteTrip(${trip.id})" title="ลบรายการ" style="color: #ef4444; font-size: 1.05rem;">🗑️</button>
                </td>
            </tr>
        `;
    }).join("");
}

function getDriverOptionsHtml(vehicleId, selectedDriverId = null) {
    const vId = parseInt(vehicleId) || 1;
    const vehicle = appState.vehicles.find(v => v.id === vId);
    const primaryDriverId = vehicle ? (vehicle.primary_driver_id || vehicle.id) : 1;
    
    return appState.drivers.map(d => {
        const isPrimary = (d.id === primaryDriverId);
        const label = isPrimary ? `${d.name} (คนขับประจำรถ)` : `${d.name} (ผู้ขับขี่เฉพาะกิจ)`;
        const isSel = selectedDriverId ? (d.id === parseInt(selectedDriverId)) : isPrimary;
        return `<option value="${d.id}" ${isSel ? 'selected' : ''}>${label}</option>`;
    }).join("");
}

function onDepartVehicleChange(vehicleId) {
    const vId = parseInt(vehicleId);
    const vehicle = appState.vehicles.find(v => v.id === vId);
    const mileage = vehicle ? (vehicle.current_mileage || 0) : 0;
    
    document.getElementById("depart-mileage").value = mileage;
    
    const driverSelect = document.getElementById("depart-driver");
    if (driverSelect) {
        driverSelect.innerHTML = getDriverOptionsHtml(vId, appState.selectedDriverId);
    }

    const badge = document.getElementById("depart-continuous-badge");
    const badgeMileage = document.getElementById("depart-continuous-mileage");
    if (badge && badgeMileage) {
        badgeMileage.innerText = Number(mileage).toLocaleString();
        badge.style.display = mileage > 0 ? "flex" : "none";
    }
}

function onManualVehicleChange(vehicleId) {
    const vId = parseInt(vehicleId);
    const vehicle = appState.vehicles.find(v => v.id === vId);
    const curMileage = vehicle ? (vehicle.current_mileage || 0) : 0;
    
    document.getElementById("manual-depart-mileage").value = curMileage;
    document.getElementById("manual-arrive-mileage").value = curMileage ? curMileage + 10 : 0;
    updateManualDistanceCalc();
    
    const driverSelect = document.getElementById("manual-driver");
    if (driverSelect) {
        driverSelect.innerHTML = getDriverOptionsHtml(vId, appState.selectedDriverId);
    }
}

// ----------------- Modal Controls -----------------

function openDepartModal() {
    document.getElementById("depart-date").value = getTodayInputFormat();
    document.getElementById("depart-time").value = getTimeNow();
    
    // Set default mileage and driver from selected vehicle
    const vehicleSelect = document.getElementById("depart-vehicle");
    if (vehicleSelect && appState.selectedVehicleId) {
        vehicleSelect.value = appState.selectedVehicleId;
    }
    
    const selectedVehId = vehicleSelect ? parseInt(vehicleSelect.value) : (appState.selectedVehicleId || 1);
    const vehicle = appState.vehicles.find(v => v.id === selectedVehId) || appState.vehicles[0];
    const mileage = vehicle ? (vehicle.current_mileage || 0) : 0;
    
    document.getElementById("depart-mileage").value = mileage;
    
    // Populate driver dropdown with Primary vs Ad-Hoc designation
    const driverSelect = document.getElementById("depart-driver");
    if (driverSelect) {
        driverSelect.innerHTML = getDriverOptionsHtml(selectedVehId, appState.selectedDriverId);
    }
    
    // Show continuous trip badge if mileage exists
    const badge = document.getElementById("depart-continuous-badge");
    const badgeMileage = document.getElementById("depart-continuous-mileage");
    if (badge && badgeMileage && mileage) {
        badgeMileage.innerText = Number(mileage).toLocaleString();
        badge.style.display = "flex";
    } else if (badge) {
        badge.style.display = "none";
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
            `<option value="${t.id}">🚗 ${t.license_plate} (${t.driver_name}) ➔ ${t.destination} (ออก ${t.depart_time} น.)</option>`
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
                🚗 <strong>รถทะเบียน:</strong> ${trip.license_plate} (${trip.driver_name})
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
    
    const manualVehSelect = document.getElementById("manual-vehicle");
    if (manualVehSelect && appState.selectedVehicleId) {
        manualVehSelect.value = appState.selectedVehicleId;
    }
    
    const selectedVehId = manualVehSelect ? parseInt(manualVehSelect.value) : (appState.selectedVehicleId || 1);
    const vehicle = appState.vehicles.find(v => v.id === selectedVehId) || appState.vehicles[0];
    const curMileage = vehicle ? (vehicle.current_mileage || 0) : 0;
    
    // Populate driver dropdown with Primary vs Ad-Hoc designation
    const driverSelect = document.getElementById("manual-driver");
    if (driverSelect) {
        driverSelect.innerHTML = getDriverOptionsHtml(selectedVehId, appState.selectedDriverId);
    }
    
    document.getElementById("manual-depart-mileage").value = curMileage;
    document.getElementById("manual-arrive-mileage").value = curMileage ? curMileage + 10 : 0;
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

    const payloadObj = {
        vehicle_id: document.getElementById("manual-vehicle").value,
        driver_id: document.getElementById("manual-driver")?.value || appState.selectedDriverId || 1,
        depart_date: document.getElementById("manual-depart-date").value,
        depart_time: document.getElementById("manual-depart-time").value,
        depart_mileage: document.getElementById("manual-depart-mileage").value,
        destination: document.getElementById("manual-destination").value,
        approver: document.getElementById("manual-approver").value,
        arrive_date: document.getElementById("manual-arrive-date").value,
        arrive_time: document.getElementById("manual-arrive-time").value,
        arrive_mileage: document.getElementById("manual-arrive-mileage").value,
        fuel_liters: document.getElementById("manual-fuel-liters").value || "0",
        fuel_authorizer: document.getElementById("manual-fuel-authorizer").value || ""
    };

    if (!navigator.onLine) {
        saveOfflineTrip('manual', payloadObj);
        btn.disabled = false;
        btn.innerText = "💾 บันทึกลงตารางทันที";
        return;
    }

    const formData = new FormData();
    for (const k in payloadObj) formData.append(k, payloadObj[k]);

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
        } else {
            alert("⚠️ เกิดข้อผิดพลาด: " + (result.detail || 'ไม่สามารถบันทึกได้'));
        }
    } catch (e) {
        saveOfflineTrip('manual', payloadObj);
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

    const payloadObj = {
        vehicle_id: document.getElementById("depart-vehicle").value,
        driver_id: document.getElementById("depart-driver")?.value || appState.selectedDriverId || 1,
        depart_date: document.getElementById("depart-date").value,
        depart_time: document.getElementById("depart-time").value,
        depart_mileage: document.getElementById("depart-mileage").value,
        destination: document.getElementById("depart-destination").value,
        approver: document.getElementById("depart-approver").value
    };

    if (!navigator.onLine) {
        saveOfflineTrip('depart', payloadObj);
        submitBtn.disabled = false;
        submitBtn.innerText = "บันทึกเวลาออก";
        return;
    }

    const formData = new FormData();
    for (const k in payloadObj) formData.append(k, payloadObj[k]);
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
        } else {
            alert(`⚠️ เกิดข้อผิดพลาด: ${result.detail || 'ไม่สามารถบันทึกได้'}`);
        }
    } catch (e) {
        saveOfflineTrip('depart', payloadObj);
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

    const payloadObj = {
        trip_id: appState.currentArriveTripId,
        arrive_date: document.getElementById("arrive-date").value,
        arrive_time: document.getElementById("arrive-time").value,
        arrive_mileage: document.getElementById("arrive-mileage").value,
        fuel_liters: document.getElementById("arrive-fuel-liters").value || "0",
        fuel_authorizer: document.getElementById("arrive-fuel-authorizer").value || ""
    };

    if (!navigator.onLine) {
        saveOfflineTrip('arrive', payloadObj);
        submitBtn.disabled = false;
        submitBtn.innerText = "💾 บันทึกเวลากลับ";
        return;
    }

    const formData = new FormData();
    for (const k in payloadObj) {
        if (k !== 'trip_id') formData.append(k, payloadObj[k]);
    }
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
            const recordedMileage = parseInt(document.getElementById("arrive-mileage").value) || 0;
            const distance = result.distance_km || 0;
            closeArriveModal();
            await loadInitialData();
            
            const cont = confirm(`✅ บันทึกเวลากลับสำเร็จเรียบร้อยครับ!\n• ระยะทางรอบนี้: ${distance.toLocaleString()} กม.\n• เลขไมล์สิ้นสุด: ${recordedMileage.toLocaleString()} กม.\n\n👉 มีการใช้รถต่อเนื่องในรอบวัน ต้องการเปิด 'บันทึกเวลาออก' สำหรับเที่ยวถัดไปต่อทันทีเลยหรือไม่ครับ?`);
            if (cont) {
                openDepartModal();
            }
        } else {
            alert(`⚠️ เกิดข้อผิดพลาด: ${result.detail || result.message || 'ไม่สามารถบันทึกได้'}`);
        }
    } catch (e) {
        saveOfflineTrip('arrive', payloadObj);
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

function formatForm4Date(dateStr) {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            const y = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            const d = parseInt(parts[2]);
            const yBe = y + 543;
            const shortY = String(yBe).slice(-2); // e.g. 69
            return `${d}/${m}/${shortY}`; // e.g. 2/10/69
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

function formatDriverCell(driverName) {
    if (!driverName) return '';
    if (driverName.includes("(ผู้ขับขี่เฉพาะกิจ)")) {
        const clean = driverName.replace("(ผู้ขับขี่เฉพาะกิจ)", "").trim();
        return `<div style="font-weight:600; line-height:1.1;">${clean}</div><div style="font-size:7.5pt; color:#475569; line-height:1; margin-top:2px;">(ผู้ขับขี่เฉพาะกิจ)</div>`;
    }
    return `<div style="line-height:1.15;">${driverName}</div>`;
}

function formatDestinationCell(destination) {
    if (!destination) return '';
    return `<div style="text-align:left; padding-left:4px; font-size:9.5pt; line-height:1.15; word-break:break-word;">${destination}</div>`;
}

function generateForm4PageHtml(pageTrips, pageNum, totalPages, data, isLastPage) {
    const rowsHtml = pageTrips.map((t, idx) => {
        const isBlank = !t.id && !t.trip_number && !t.depart_date;
        if (isBlank) {
            return `
                <tr style="height: 23px;">
                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
            `;
        }
        return `
            <tr style="height: 23px;">
                <td style="font-size: 10pt;">${t.trip_number || ''}</td>
                <td style="white-space: nowrap; font-size: 9.5pt;">${formatForm4Date(t.depart_date)}</td>
                <td style="white-space: nowrap; font-size: 9.5pt;">${t.depart_time || ''}</td>
                <td style="white-space: nowrap; font-size: 10pt; font-weight: 600;">${t.depart_mileage ? t.depart_mileage.toLocaleString() : ''}</td>
                <td style="font-size: 9.5pt;">${t.approver || ''}</td>
                <td>${formatDestinationCell(t.destination)}</td>
                <td style="white-space: nowrap; font-size: 9.5pt;">${formatForm4Date(t.arrive_date)}</td>
                <td style="white-space: nowrap; font-size: 9.5pt;">${t.arrive_time || ''}</td>
                <td style="white-space: nowrap; font-size: 10pt;">${t.distance_km ? t.distance_km.toLocaleString() : ''}</td>
                <td style="white-space: nowrap; font-size: 10pt; font-weight: 600;">${t.arrive_mileage ? t.arrive_mileage.toLocaleString() : ''}</td>
                <td>${formatDriverCell(t.driver_name)}</td>
                <td style="white-space: nowrap; font-size: 9.5pt;">${t.fuel_liters ? t.fuel_liters : ''}</td>
                <td style="font-size: 9.5pt;">${t.fuel_authorizer || ''}</td>
            </tr>
        `;
    }).join("");

    const pageTag = totalPages > 1 ? `<span style="font-size:10pt; font-weight:normal; margin-left:8px; color:#475569;">(หน้า ${pageNum}/${totalPages})</span>` : '';

    return `
        <div class="form4-page">
            <div class="form4-top-bar">
                <div class="form4-top-dummy"></div>
                <div class="form4-logo-container">
                    <img src="/images/moc_seal.png" class="form4-logo-img" alt="ตรากระทรวงพาณิชย์">
                </div>
                <div class="form4-header-top">
                    <span>แบบ 4 ${pageTag}</span>
                </div>
            </div>

            <div class="form4-title-row">
                <span>บันทึกการใช้รถราชการ</span>
            </div>

            <div class="form4-meta-row">
                <div>
                    หมายเลขทะเบียน: <strong>${data.license_plate}</strong>
                </div>
                <div>
                    ยอดยกมาจากเมื่อสิ้นเดือน: <span>${data.prev_month_label || data.month_label}</span> เลขไมล์ที่: <strong>${(data.start_mileage || 0).toLocaleString()}</strong>
                </div>
            </div>

            <table class="form4-table">
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 4%;">ลำดับ<br>เที่ยว</th>
                        <th colspan="3" style="width: 23%;">ออกเดินทาง</th>
                        <th rowspan="2" style="width: 10%;">ผู้รับรอง</th>
                        <th rowspan="2" style="width: 18%;">สถานที่ไป</th>
                        <th colspan="4" style="width: 29%;">รถกลับถึงสำนักงาน</th>
                        <th rowspan="2" style="width: 8%;">พนักงาน<br>ขับรถ</th>
                        <th colspan="2" style="width: 8%;">การเบิกจ่ายน้ำมัน</th>
                    </tr>
                    <tr>
                        <th style="width: 9%;">ว/ด/ป</th>
                        <th style="width: 6%;">เวลา</th>
                        <th style="width: 8%;">เลขไมล์</th>
                        <th style="width: 9%;">ว/ด/ป</th>
                        <th style="width: 6%;">เวลา</th>
                        <th style="width: 6%;">ระยะทาง</th>
                        <th style="width: 8%;">เลขไมล์</th>
                        <th style="width: 4%;">ลิตร</th>
                        <th style="width: 4%;">ผู้สั่งจ่าย</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="form4-footer" style="${isLastPage ? '' : 'visibility: hidden;'}">
                <div class="form4-footer-col">
                    <div>สรุปบันทึกการใช้รถยนต์ ประจำเดือน: <strong>${data.month_name || '-'}</strong> พ.ศ. <strong>${data.year_be || '-'}</strong></div>
                    <div>การใช้น้ำมัน: <strong>${data.summary?.total_fuel_liters || '0'}</strong> ลิตร</div>
                </div>
                <div class="form4-footer-col">
                    <div>จำนวนเที่ยว: <strong>${data.summary?.total_trips || '0'}</strong> เที่ยว</div>
                    <div>ระยะทาง กม.: <strong>${(data.summary?.total_distance_km || 0).toLocaleString()}</strong> กม.</div>
                </div>
                <div class="form4-footer-col">
                    <div class="signature-line">
                        ผู้บันทึก: <strong>${data.summary?.driver_name || 'กฤษณพัฒน์ แสงหล้า'}</strong><br>
                        ตำแหน่ง พนักงานขับรถยนต์
                    </div>
                </div>
            </div>
        </div>
    `;
}

function populateForm4DOM(data) {
    const printArea = document.getElementById("print-area");
    if (!printArea) return;
    
    const trips = data.trips || [];
    const ROWS_PER_PAGE = 10;
    
    if (trips.length <= ROWS_PER_PAGE) {
        // Single Page: Pad rows up to 10
        const pageTrips = [...trips];
        while (pageTrips.length < ROWS_PER_PAGE) {
            pageTrips.push({});
        }
        printArea.innerHTML = generateForm4PageHtml(pageTrips, 1, 1, data, true);
    } else {
        // Multi Page: Chunk by ROWS_PER_PAGE (10 rows per page)
        const totalPages = Math.ceil(trips.length / ROWS_PER_PAGE);
        let html = '';
        for (let p = 0; p < totalPages; p++) {
            const start = p * ROWS_PER_PAGE;
            const chunk = trips.slice(start, start + ROWS_PER_PAGE);
            while (chunk.length < ROWS_PER_PAGE) {
                chunk.push({});
            }
            const isLast = (p === totalPages - 1);
            html += generateForm4PageHtml(chunk, p + 1, totalPages, data, isLast);
        }
        printArea.innerHTML = html;
    }
}

async function generateForm4Print() {
    try {
        const data = await fetchForm4Data();
        populateForm4DOM(data);
        
        // Explicitly inject landscape page orientation for browser print dialog
        let printStyle = document.getElementById("force-landscape-style");
        if (!printStyle) {
            printStyle = document.createElement("style");
            printStyle.id = "force-landscape-style";
            printStyle.innerHTML = "@page { size: A4 landscape !important; size: landscape !important; margin: 6mm 8mm !important; }";
            document.head.appendChild(printStyle);
        }

        window.print();
    } catch (e) {
        alert("ไม่สามารถสั่งพิมพ์ได้: " + e.message);
    }
}

async function downloadForm4Image() {
    try {
        const data = await fetchForm4Data();
        populateForm4DOM(data);

        const pages = document.querySelectorAll("#print-area .form4-page");
        if (!pages || pages.length === 0) {
            throw new Error("ไม่พบข้อมูลแบบ 4 สำหรับสร้างรูปภาพ");
        }

        for (let i = 0; i < pages.length; i++) {
            const pageElem = pages[i];
            const pageNum = i + 1;
            const totalPages = pages.length;

            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.left = "-9999px";
            iframe.style.top = "-9999px";
            iframe.style.width = "1400px";
            iframe.style.height = "990px";
            iframe.style.border = "none";
            iframe.style.opacity = "0";
            iframe.style.pointerEvents = "none";
            iframe.style.zIndex = "-9999";
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html lang="th">
                <head>
                    <meta charset="UTF-8">
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        * {
                            box-sizing: border-box;
                            font-family: 'Sarabun', 'TH Sarabun New', sans-serif !important;
                            margin: 0;
                            padding: 0;
                        }
                        body {
                            background: #ffffff;
                            width: 1400px;
                            min-height: 990px;
                            overflow: visible;
                            display: flex;
                            justify-content: center;
                            align-items: flex-start;
                            padding: 16px 20px;
                        }
                        .form4-page {
                            width: 1350px;
                            min-width: 1350px;
                            max-width: 1350px;
                            background: #ffffff;
                            padding: 14px 22px;
                            border: 1px solid #333333;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            box-sizing: border-box;
                            height: 940px;
                            min-height: 940px;
                            max-height: 940px;
                        }
                        .form4-top-bar {
                            display: grid;
                            grid-template-columns: 1fr auto 1fr;
                            align-items: center;
                            margin-bottom: 2px;
                        }
                        .form4-top-dummy {
                            visibility: hidden;
                        }
                        .form4-logo-container {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
                        .form4-logo-img {
                            width: 52px;
                            height: 52px;
                            object-fit: contain;
                            display: block;
                        }
                        .form4-header-top {
                            display: flex;
                            justify-content: flex-end;
                            font-size: 13.5pt;
                            font-weight: 700;
                        }
                        .form4-title-row {
                            text-align: center;
                            font-size: 18pt;
                            font-weight: 700;
                            margin-bottom: 6px;
                            letter-spacing: 0.5px;
                        }
                        .form4-meta-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 13pt;
                            margin-bottom: 6px;
                        }
                        .form4-table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 11pt;
                            text-align: center;
                        }
                        .form4-table th, .form4-table td {
                            border: 1px solid #000000;
                            padding: 2.5px 2px;
                            line-height: 1.15;
                        }
                        .form4-table th {
                            font-weight: 700;
                            background: #f8f8f8;
                        }
                        .form4-footer {
                            margin-top: 8px;
                            display: grid;
                            grid-template-columns: 1.2fr 1fr 1.2fr;
                            font-size: 11.5pt;
                            align-items: end;
                        }
                        .form4-footer-col {
                            display: flex;
                            flex-direction: column;
                            gap: 3px;
                        }
                        .signature-line {
                            text-align: center;
                            line-height: 1.35;
                        }
                    </style>
                </head>
                <body>
                    ${pageElem.outerHTML}
                </body>
                </html>
            `);
            iframeDoc.close();

            await new Promise(r => setTimeout(r, 400));
            if (iframeDoc.fonts) {
                await iframeDoc.fonts.ready;
            }

            const targetElem = iframeDoc.querySelector(".form4-page");
            const canvas = await html2canvas(targetElem, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#ffffff",
                width: 1350,
                windowWidth: 1400
            });

            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }

            const link = document.createElement("a");
            const pageSuffix = totalPages > 1 ? `_หน้า${pageNum}จาก${totalPages}` : '';
            link.download = `แบบ4_บันทึกการใช้รถ_${data.license_plate.replace(/\s+/g, '_')}_${data.month_label.replace(/\s+/g, '_')}${pageSuffix}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            
            if (totalPages > 1 && i < totalPages - 1) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        alert("✅ เซฟรูปภาพขนาด A4 แนวนอน (ความละเอียดสูง) เรียบร้อยแล้วครับ!");
    } catch (e) {
        alert("ไม่สามารถเซฟเป็นรูปภาพได้: " + e.message);
    }
}

// ----------------- Event Listeners -----------------

function initEventListeners() {
    // Mileage input changes update distance live
    document.getElementById("arrive-mileage")?.addEventListener("input", updateDistanceCalc);
    
    // Vehicle selection updates default mileage & badge
    document.getElementById("depart-vehicle")?.addEventListener("change", (e) => {
        const vehicleId = parseInt(e.target.value);
        const vehicle = appState.vehicles.find(v => v.id === vehicleId);
        const mileage = vehicle ? (vehicle.current_mileage || 0) : (e.target.selectedOptions[0]?.getAttribute("data-mileage") || 0);
        document.getElementById("depart-mileage").value = mileage;
        
        const badge = document.getElementById("depart-continuous-badge");
        const badgeMileage = document.getElementById("depart-continuous-mileage");
        if (badge && badgeMileage) {
            badgeMileage.innerText = Number(mileage).toLocaleString();
            badge.style.display = mileage > 0 ? "flex" : "none";
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

    // Network status listeners for automatic offline sync
    window.addEventListener("online", () => {
        syncOfflineQueue();
    });
    window.addEventListener("offline", () => {
        updateOfflineBadgeUI();
    });
}

// ----------------- Edit Trip Modal Handlers -----------------

function openEditTripModal(tripId) {
    const trip = appState.historyTrips.find(t => t.id === tripId) || appState.activeTrips.find(t => t.id === tripId);
    if (!trip) {
        alert("ไม่พบข้อมูลรายการนี้");
        return;
    }

    document.getElementById("edit-trip-id").value = trip.id;
    
    // Vehicle & Driver
    const vehSelect = document.getElementById("edit-trip-vehicle");
    if (vehSelect) {
        vehSelect.value = trip.vehicle_id;
        vehSelect.onchange = (e) => {
            const drvSel = document.getElementById("edit-trip-driver");
            if (drvSel) drvSel.innerHTML = getDriverOptionsHtml(e.target.value, trip.driver_id);
        };
    }
    const drvSelect = document.getElementById("edit-trip-driver");
    if (drvSelect) drvSelect.innerHTML = getDriverOptionsHtml(trip.vehicle_id, trip.driver_id);

    // Depart Info
    document.getElementById("edit-trip-depart-date").value = trip.depart_date || getTodayInputFormat();
    document.getElementById("edit-trip-depart-time").value = trip.depart_time || getTimeNow();
    document.getElementById("edit-trip-depart-mileage").value = trip.depart_mileage || 0;

    // Destination & Approver
    document.getElementById("edit-trip-destination").value = trip.destination || "";
    syncDestinationChips("edit-trip-destination");
    document.getElementById("edit-trip-approver").value = trip.approver || "";

    // Arrive Info
    document.getElementById("edit-trip-arrive-date").value = trip.arrive_date || trip.depart_date || getTodayInputFormat();
    document.getElementById("edit-trip-arrive-time").value = trip.arrive_time || "";
    document.getElementById("edit-trip-arrive-mileage").value = trip.arrive_mileage || "";

    // Fuel Info
    document.getElementById("edit-trip-fuel-liters").value = trip.fuel_liters || "";
    document.getElementById("edit-trip-fuel-authorizer").value = trip.fuel_authorizer || "";

    updateEditTripDistanceCalc();
    document.getElementById("modal-edit-trip").classList.add("open");
}

function closeEditTripModal() {
    document.getElementById("modal-edit-trip").classList.remove("open");
}

function updateEditTripDistanceCalc() {
    const dep = parseInt(document.getElementById("edit-trip-depart-mileage").value) || 0;
    const arr = parseInt(document.getElementById("edit-trip-arrive-mileage").value) || 0;
    const dist = Math.max(0, arr - dep);
    const badge = document.getElementById("edit-trip-calc-distance-badge");
    if (badge) {
        if (arr > 0) {
            badge.innerText = `ระยะทาง: ${dist.toLocaleString()} กม.`;
        } else {
            badge.innerText = `กำลังเดินทาง`;
        }
    }
}

async function submitEditTrip(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-edit-trip-submit");
    btn.disabled = true;
    btn.innerText = "กำลังบันทึก...";

    const tripId = document.getElementById("edit-trip-id").value;
    const formData = new FormData();
    formData.append("vehicle_id", document.getElementById("edit-trip-vehicle").value);
    formData.append("driver_id", document.getElementById("edit-trip-driver").value);
    formData.append("depart_date", document.getElementById("edit-trip-depart-date").value);
    formData.append("depart_time", document.getElementById("edit-trip-depart-time").value);
    formData.append("depart_mileage", document.getElementById("edit-trip-depart-mileage").value);
    formData.append("destination", document.getElementById("edit-trip-destination").value);
    formData.append("approver", document.getElementById("edit-trip-approver").value);
    
    const arrDate = document.getElementById("edit-trip-arrive-date").value;
    const arrTime = document.getElementById("edit-trip-arrive-time").value;
    const arrMileage = document.getElementById("edit-trip-arrive-mileage").value;
    
    if (arrDate) formData.append("arrive_date", arrDate);
    if (arrTime) formData.append("arrive_time", arrTime);
    if (arrMileage) formData.append("arrive_mileage", arrMileage);
    
    formData.append("fuel_liters", document.getElementById("edit-trip-fuel-liters").value || "0");
    formData.append("fuel_authorizer", document.getElementById("edit-trip-fuel-authorizer").value || "");

    try {
        const res = await fetch(`/api/trips/${tripId}`, {
            method: "PUT",
            body: formData
        });
        const result = await res.json();
        if (res.ok && result.status === "success") {
            closeEditTripModal();
            await loadInitialData();
            alert("✅ บันทึกการแก้ไขข้อมูลเรียบร้อยแล้วครับ!");
        } else {
            alert(`⚠️ เกิดข้อผิดพลาด: ${result.detail || 'ไม่สามารถแก้ไขได้'}`);
        }
    } catch (e) {
        alert("⚠️ เกิดข้อผิดพลาดในการบันทึก: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "💾 บันทึกการแก้ไข";
    }
}

// ----------------- Settings & Google Sheets Sync -----------------

async function openSettingsModal() {
    try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        
        const gsInput = document.getElementById("setting-gs-url");
        const gsStatus = document.getElementById("settings-gs-status");
        
        if (gsInput) gsInput.value = data.google_sheets_url || "";
        if (gsStatus) {
            if (data.google_sheets_set) {
                gsStatus.innerText = "🟢 เชื่อมต่อแล้ว";
                gsStatus.style.background = "#dcfce7";
                gsStatus.style.color = "#15803d";
            } else {
                gsStatus.innerText = "⚪ ยังไม่เชื่อมต่อ";
                gsStatus.style.background = "#e2e8f0";
                gsStatus.style.color = "#475569";
            }
        }
        
        document.getElementById("modal-settings").classList.add("open");
    } catch (e) {
        alert("ไม่สามารถโหลดข้อมูลการตั้งค่าได้: " + e.message);
    }
}

function closeSettingsModal() {
    document.getElementById("modal-settings").classList.remove("open");
}

async function saveSettings(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-save-settings");
    btn.disabled = true;
    btn.innerText = "กำลังบันทึก...";

    const payload = {
        google_sheets_url: document.getElementById("setting-gs-url").value.trim()
    };
    
    const geminiKey = document.getElementById("setting-gemini-key")?.value?.trim();
    if (geminiKey) {
        payload.gemini_api_key = geminiKey;
    }

    try {
        const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert("✅ บันทึกการตั้งค่าเรียบร้อยแล้วครับ!");
            closeSettingsModal();
        } else {
            alert("⚠️ ไม่สามารถบันทึกการตั้งค่าได้");
        }
    } catch (err) {
        alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "💾 บันทึกการตั้งค่า";
    }
}

async function syncAllToGoogleSheets() {
    if (!confirm("คุณต้องการซิงค์ข้อมูลประวัติการใช้รถทั้งหมดขึ้น Google Sheets ใช่หรือไม่?")) return;
    try {
        const res = await fetch("/api/google/sync-all", { method: "POST" });
        const data = await res.json();
        if (data.status === "success") {
            alert(`✅ ซิงค์ข้อมูลทั้งหมดสำเร็จเรียบร้อยครับ! (จำนวน ${data.count} รายการ)`);
        } else {
            alert(`⚠️ เกิดข้อผิดพลาด: ${data.message || 'ไม่สามารถซิงค์ได้'}`);
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการซิงค์: " + e.message);
    }
}

async function restoreFromGoogleSheets() {
    if (!confirm("⚠️ การดึงข้อมูลจาก Google Sheets จะนำรายการจาก Google Sheet มาอัปเดตลงในแอป\n\nต้องการดำเนินการต่อหรือไม่ครับ?")) return;
    try {
        const res = await fetch("/api/google/restore", { method: "POST" });
        const data = await res.json();
        if (data.status === "success") {
            await loadInitialData();
            alert(`✅ ดึงข้อมูลสำเร็จเรียบร้อยครับ! (อัปเดต ${data.restored_count} รายการ)`);
            closeSettingsModal();
        } else {
            alert(`⚠️ เกิดข้อผิดพลาด: ${data.message || 'ไม่สามารถกู้คืนได้'}`);
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + e.message);
    }
}

async function copyAppsScriptCode() {
    try {
        const res = await fetch("/api/google/script-code");
        const data = await res.json();
        if (data.script_code) {
            await navigator.clipboard.writeText(data.script_code);
            alert("📋 คัดลอกโค้ด Apps Script ลงในคลิปบอร์ดเรียบร้อยแล้วครับ!\n\n👉 นำไปวางในหน้า Google Sheets (ส่วนขยาย ➔ Apps Script) ได้เลยครับ");
        } else {
            alert("ไม่พบโค้ด Apps Script");
        }
    } catch (e) {
        alert("ไม่สามารถคัดลอกโค้ดได้: " + e.message);
    }
}

// ----------------- Offline Storage & Auto-Sync Engine (พื้นที่อับสัญญาณ) -----------------

function getOfflineQueue() {
    try {
        const raw = localStorage.getItem("moc_offline_queue");
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveOfflineQueue(queue) {
    localStorage.setItem("moc_offline_queue", JSON.stringify(queue));
    updateOfflineBadgeUI();
}

function saveOfflineTrip(type, payload) {
    const queue = getOfflineQueue();
    const item = {
        queue_id: Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        type: type, // 'depart', 'arrive', 'manual'
        payload: payload,
        created_at: new Date().toISOString()
    };
    queue.push(item);
    saveOfflineQueue(queue);
    
    if (type === 'depart') {
        closeDepartModal();
    } else if (type === 'arrive') {
        closeArriveModal();
    } else if (type === 'manual') {
        closeManualModal();
    }

    alert(`📶 บันทึกข้อมูลลงในเครื่องเรียบร้อยแล้วครับ! (อยู่ในโหมดออฟไลน์ / ไม่มีสัญญาณเน็ต)\n\n👉 ระบบจะอัปโหลดขึ้นเซิร์ฟเวอร์และ Google Sheets ให้อัตโนมัติทันทีที่มือถือจับสัญญาณเน็ตได้ และลบข้อมูลออกจากเครื่องทันทีครับ`);
}

function updateOfflineBadgeUI() {
    const queue = getOfflineQueue();
    let badge = document.getElementById("offline-queue-badge");
    if (!badge) {
        const main = document.querySelector(".main-content");
        if (main) {
            badge = document.createElement("div");
            badge.id = "offline-queue-badge";
            badge.style.cssText = "background: #fef3c7; border: 1.5px solid #f59e0b; color: #92400e; padding: 10px 16px; border-radius: var(--radius-md); margin-bottom: 16px; font-size: 0.9rem; font-weight: 600; display: none; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm);";
            main.insertBefore(badge, main.firstChild);
        }
    }
    
    if (badge) {
        if (queue.length > 0) {
            badge.style.display = "flex";
            badge.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">📶</span>
                    <span>มีข้อมูลบันทึกรอส่งขึ้นเซิร์ฟเวอร์: <strong>${queue.length} รายการ</strong> (จะอัปโหลดอัตโนมัติเมื่อมีสัญญาณเน็ต)</span>
                </div>
                <button type="button" onclick="syncOfflineQueue()" style="background: #b45309; color: white; border: none; padding: 5px 12px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; cursor: pointer;">
                    🚀 ลองส่งตอนนี้
                </button>
            `;
        } else {
            badge.style.display = "none";
        }
    }
}

let isSyncingOffline = false;

async function syncOfflineQueue() {
    if (isSyncingOffline) return;
    if (!navigator.onLine) {
        updateOfflineBadgeUI();
        return;
    }
    
    const queue = getOfflineQueue();
    if (queue.length === 0) {
        updateOfflineBadgeUI();
        return;
    }

    isSyncingOffline = true;
    let syncedCount = 0;
    const remainingQueue = [];

    for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        let success = false;
        
        try {
            const formData = new FormData();
            for (const key in item.payload) {
                if (key !== 'trip_id' && item.payload[key] !== null && item.payload[key] !== undefined) {
                    formData.append(key, item.payload[key]);
                }
            }

            let url = "";
            let method = "POST";
            if (item.type === 'depart') {
                url = "/api/trips/depart";
            } else if (item.type === 'arrive') {
                url = `/api/trips/${item.payload.trip_id}/arrive`;
            } else if (item.type === 'manual') {
                url = "/api/trips/manual";
            }

            if (url) {
                const res = await fetch(url, { method: method, body: formData });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'success') {
                        success = true;
                        syncedCount++;
                    }
                }
            }
        } catch (e) {
            console.error("Offline sync error:", e);
            success = false;
        }

        // If NOT successful, keep in queue to retry later; IF successful, DO NOT add (immediately wipes out from device)
        if (!success) {
            remainingQueue.push(item);
        }
    }

    // Save remaining items only (all successfully uploaded items are permanently deleted from localStorage)
    saveOfflineQueue(remainingQueue);
    isSyncingOffline = false;

    if (syncedCount > 0) {
        await loadInitialData();
        alert(`✅ อัปโหลดข้อมูลที่บันทึกไว้ในโหมดออฟไลน์ขึ้นระบบเรียบร้อยแล้วครับ! (จำนวน ${syncedCount} รายการ)\n\n* ข้อมูลชั่วคราวถูกลบออกจากเครื่องเรียบร้อยแล้วครับ`);
    }
}

// ==========================================================================
// MODERATOR COMMAND CENTER & DASHBOARD (สำหรับเจ้าหน้าที่โม)
// ==========================================================================

let currentModeratorData = null;
let currentModeratorMonth = "";

function switchTab(tabName) {
    const driverBtn = document.getElementById("tab-driver-btn");
    const modBtn = document.getElementById("tab-moderator-btn");
    const driverView = document.getElementById("view-driver");
    const modView = document.getElementById("view-moderator");

    if (tabName === 'moderator') {
        if (driverBtn) driverBtn.classList.remove("active");
        if (modBtn) modBtn.classList.add("active");
        if (driverView) driverView.style.display = "none";
        if (modView) modView.style.display = "block";

        // Initialize default month if empty
        const modMonthInput = document.getElementById("moderator-month");
        if (modMonthInput && !modMonthInput.value) {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            modMonthInput.value = `${y}-${m}`;
        }
        loadModeratorData();
    } else {
        if (modBtn) modBtn.classList.remove("active");
        if (driverBtn) driverBtn.classList.add("active");
        if (modView) modView.style.display = "none";
        if (driverView) driverView.style.display = "block";
    }
}

async function loadModeratorData() {
    try {
        const modMonthInput = document.getElementById("moderator-month");
        let month = modMonthInput ? modMonthInput.value : "";
        if (!month) {
            const now = new Date();
            month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        currentModeratorMonth = month;

        const res = await fetch(`/api/moderator/overview?month=${month}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
        const data = await res.json();
        currentModeratorData = data;

        // 1. Update Metrics
        const sum = data.summary || {};
        const distEl = document.getElementById("metric-total-distance");
        const fuelEl = document.getElementById("metric-total-fuel");
        const tripsEl = document.getElementById("metric-total-trips");
        const adhocEl = document.getElementById("metric-adhoc-trips");

        if (distEl) distEl.innerHTML = `${(sum.total_distance_km || 0).toLocaleString()} <span style="font-size: 0.95rem; font-weight: 500; color: #64748b;">กม.</span>`;
        if (fuelEl) fuelEl.innerHTML = `${(sum.total_fuel_liters || 0).toLocaleString()} <span style="font-size: 0.95rem; font-weight: 500; color: #64748b;">ลิตร</span>`;
        if (tripsEl) tripsEl.innerHTML = `${(sum.total_trips || 0).toLocaleString()} <span style="font-size: 0.95rem; font-weight: 500; color: #64748b;">เที่ยว</span>`;
        if (adhocEl) adhocEl.innerHTML = `${(sum.ad_hoc_trips || 0).toLocaleString()} <span style="font-size: 0.95rem; font-weight: 500; color: #64748b;">เที่ยว</span>`;

        // 2. Render Bento Fleet Grid (4 Cars)
        renderModeratorBento(data.vehicles || [], data.vehicle_stats || []);

        // 3. Render Apple Fitness 3D Donut Activity Rings
        renderModeratorRings(data.vehicle_stats || [], sum);

        // 4. Render Trips Cross-Check Table
        renderModeratorTrips(data.recent_trips || []);

    } catch (e) {
        console.error("Error loading moderator data:", e);
    }
}

function renderModeratorBento(vehicles, vehicleStats) {
    const container = document.getElementById("moderator-bento-fleet");
    if (!container) return;

    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 20px;">ไม่พบข้อมูลรถยนต์</div>`;
        return;
    }

    const ringColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

    let html = "";
    vehicles.forEach((v, index) => {
        const color = ringColors[index % ringColors.length];
        const isOnMission = (v.status === 'on_mission' && v.active_trip);
        const act = v.active_trip || {};

        // Oil Status & Progress calculation
        const currMileage = v.current_mileage || 0;
        const targetMileage = v.oil_target_km || (currMileage + 10000);
        const remMileage = v.oil_remaining_km || Math.max(0, targetMileage - currMileage);
        
        let oilPercent = Math.min(100, Math.max(0, Math.round(((10000 - remMileage) / 10000) * 100)));
        let oilStatusBadge = "";
        let oilBarClass = "oil-bar-ok";

        if (v.oil_status === 'overdue') {
            oilStatusBadge = `<span style="color: #ef4444; font-weight: 700; font-size: 0.78rem;">🔴 เกินกำหนดแล้ว (${remMileage} กม.)</span>`;
            oilBarClass = "oil-bar-danger";
            oilPercent = 100;
        } else if (v.oil_status === 'warning') {
            oilStatusBadge = `<span style="color: #d97706; font-weight: 700; font-size: 0.78rem;">🟡 ใกล้ถึงกำหนด (เหลือ ${remMileage.toLocaleString()} กม.)</span>`;
            oilBarClass = "oil-bar-warning";
        } else {
            oilStatusBadge = `<span style="color: #10b981; font-weight: 600; font-size: 0.78rem;">🟢 ปกติ (อีก ${remMileage.toLocaleString()} กม.)</span>`;
            oilBarClass = "oil-bar-ok";
        }

        html += `
            <div class="bento-card ${isOnMission ? 'active-mission' : ''}">
                <div>
                    <!-- Card Top Header -->
                    <div class="bento-header">
                        <div class="bento-plate-box">
                            <div style="width: 12px; height: 12px; border-radius: 4px; background: ${color}; flex-shrink: 0;"></div>
                            <div>
                                <div class="bento-plate-title">${escapeHtml(v.license_plate)}</div>
                                <div class="bento-driver-sub">ผขร.ประจำ: <strong>${escapeHtml(v.primary_driver_name || '-')}</strong></div>
                            </div>
                        </div>
                        <div>
                            ${isOnMission ? 
                                `<span class="bento-status-pill pill-mission">🟡 กำลังเดินทาง</span>` : 
                                `<span class="bento-status-pill pill-available">🟢 จอดพร้อมใช้</span>`
                            }
                        </div>
                    </div>

                    <!-- Current Mileage Box -->
                    <div class="bento-mileage-row">
                        <span style="font-size: 0.82rem; color: #64748b; font-weight: 600;">เลขไมล์ปัจจุบัน:</span>
                        <div class="bento-mileage-num">${(currMileage).toLocaleString()} <span style="font-size: 0.82rem; font-weight: normal; color: #64748b;">กม.</span></div>
                    </div>

                    <!-- Live Mission Banner if on mission -->
                    ${isOnMission ? `
                        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 12px; font-size: 0.85rem;">
                            <div style="font-weight: 700; color: #b45309; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                                <span>📍</span> ไป: ${escapeHtml(act.destination || '-')}
                            </div>
                            <div style="color: #78350f; font-size: 0.8rem; line-height: 1.4;">
                                ผขร.: <strong>${escapeHtml(act.driver_name || '-')}</strong><br>
                                ออกเวลา: <strong>${escapeHtml(act.depart_time || '-')} น.</strong> | วันที่: ${escapeHtml(act.depart_date || '-')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Oil Change Tracker Meter -->
                    <div class="oil-meter-box">
                        <div class="oil-meter-header">
                            <span style="color: #475569; display: flex; align-items: center; gap: 4px;">
                                <span>🛢️</span> ถ่ายน้ำมันเครื่อง
                            </span>
                            ${oilStatusBadge}
                        </div>
                        <div class="oil-bar-bg">
                            <div class="oil-bar-fill ${oilBarClass}" style="width: ${oilPercent}%;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: #94a3b8; margin-top: 4px;">
                            <span>เป้าหมายเปลี่ยนที่: ${(targetMileage).toLocaleString()} กม.</span>
                            <span>(ป้ายคอพวงมาลัย)</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Action Buttons -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9;">
                    <button type="button" class="chip-btn" onclick="printSingleVehicleForm4(${v.id})" style="background: #f8fafc; border-color: #cbd5e1; color: #1e293b; font-weight: 600; justify-content: center; padding: 7px 4px; font-size: 0.82rem;">
                        🖨️ พิมพ์แบบ 4
                    </button>
                    <button type="button" class="chip-btn" onclick="openMaintenanceModal(${v.id})" style="background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; font-weight: 600; justify-content: center; padding: 7px 4px; font-size: 0.82rem;">
                        🔧 ถ่ายน้ำมัน/ซ่อม
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderModeratorRings(vehicleStats, summary) {
    const container = document.getElementById("moderator-rings-container");
    const legend = document.getElementById("moderator-rings-legend");
    if (!container || !legend) return;

    const ringColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
    const totalDist = summary.total_distance_km || 1; // avoid / 0

    // Concentric Ring Radii
    const radii = [90, 72, 54, 36];
    const strokeWidth = 12;
    const center = 110;

    let svgCirclesBg = "";
    let svgCirclesFill = "";
    let legendHtml = "";

    vehicleStats.forEach((vs, idx) => {
        const color = ringColors[idx % ringColors.length];
        const r = radii[idx] || (36 - idx * 10);
        const circumference = 2 * Math.PI * r;
        const vDist = vs.distance_km || 0;
        const percent = Math.min(1, vDist / totalDist);
        const offset = circumference * (1 - percent);

        // Background Track
        svgCirclesBg += `
            <circle class="ring-circle-bg" cx="${center}" cy="${center}" r="${r}" stroke-width="${strokeWidth}" />
        `;

        // Filled Glowing Ring
        svgCirclesFill += `
            <circle class="ring-circle-fill" cx="${center}" cy="${center}" r="${r}" 
                stroke="${color}" stroke-width="${strokeWidth}" 
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                transform="rotate(-90 ${center} ${center})" />
        `;

        legendHtml += `
            <div class="ring-legend-item">
                <div class="ring-legend-dot" style="background: ${color};"></div>
                <div style="line-height: 1.2;">
                    <strong style="color: white; font-size: 0.82rem;">${escapeHtml(vs.license_plate)}</strong>
                    <div style="font-size: 0.74rem; color: #94a3b8;">${vDist.toLocaleString()} กม. (${Math.round(percent * 100)}%)</div>
                </div>
            </div>
        `;
    });

    const svgHtml = `
        <svg width="220" height="220" viewBox="0 0 220 220">
            ${svgCirclesBg}
            ${svgCirclesFill}
            <text x="${center}" y="${center - 6}" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="'Prompt', sans-serif">ระยะทางรวม</text>
            <text x="${center}" y="${center + 16}" text-anchor="middle" fill="#ffffff" font-size="15" font-weight="bold" font-family="'Prompt', sans-serif">${(summary.total_distance_km || 0).toLocaleString()} <tspan font-size="10" font-weight="normal">กม.</tspan></text>
        </svg>
    `;

    container.innerHTML = svgHtml;
    legend.innerHTML = legendHtml;
}

function renderModeratorTrips(trips) {
    const tbody = document.getElementById("moderator-trips-table-body");
    if (!tbody) return;

    if (!trips || trips.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 24px; color: #94a3b8;">ไม่พบรายการเดินทางในเดือนนี้</td></tr>`;
        return;
    }

    let html = "";
    trips.forEach(t => {
        const isCompleted = (t.status === 'completed');
        const isAdHoc = (t.driver_id !== t.primary_driver_id);
        const dist = t.distance_km || 0;
        const fuel = t.fuel_liters || 0;

        html += `
            <tr id="mod-trip-row-${t.id}">
                <td style="font-weight: 600; color: #1e293b; font-size: 0.88rem;">${escapeHtml(t.depart_date || '-')}</td>
                <td style="font-weight: 700; color: #2563eb; font-size: 0.88rem;">${escapeHtml(t.license_plate || '-')}</td>
                <td>
                    <div style="font-weight: 600; color: #1e293b;">${escapeHtml(t.driver_name || '-')}</div>
                    ${isAdHoc ? '<span style="font-size: 0.72rem; background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-weight: 700;">(ผู้ขับขี่เฉพาะกิจ)</span>' : ''}
                </td>
                <td style="font-weight: 600; color: #0f172a; max-width: 220px;">
                    ${escapeHtml(t.destination || '-')}
                </td>
                <td style="color: #475569; font-size: 0.85rem;">${escapeHtml(t.approver || '-')}</td>
                <td style="font-size: 0.85rem; color: #334155;">
                    ออก: <strong>${escapeHtml(t.depart_time || '-')}</strong><br>
                    กลับ: <strong>${isCompleted ? escapeHtml(t.arrive_time || '-') : '<span style="color:#d97706;">(กำลังวิ่ง)</span>'}</strong>
                </td>
                <td style="font-weight: 700; color: #10b981; font-family: monospace; font-size: 0.95rem;">
                    ${isCompleted ? `${dist.toLocaleString()} กม.` : '-'}
                </td>
                <td style="font-size: 0.85rem;">
                    ${fuel > 0 ? `<strong style="color: #059669;">${fuel} ลิตร</strong>` : '-'}
                </td>
                <td>
                    ${isCompleted ? 
                        `<span style="background: #dcfce7; color: #15803d; font-size: 0.76rem; font-weight: 700; padding: 3px 8px; border-radius: 999px;">🟢 ครบถ้วน</span>` : 
                        `<span style="background: #fef3c7; color: #b45309; font-size: 0.76rem; font-weight: 700; padding: 3px 8px; border-radius: 999px;">🟡 รอลงขากลับ</span>`
                    }
                </td>
                <td style="text-align: center; white-space: nowrap;">
                    <button type="button" class="chip-btn" onclick="openEditTripModal(${t.id})" style="padding: 4px 8px; font-size: 0.8rem; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;">
                        ✏️ แก้ไข
                    </button>
                    <button type="button" class="chip-btn" onclick="deleteTrip(${t.id})" style="padding: 4px 8px; font-size: 0.8rem; background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;">
                        🗑️ ลบ
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function filterModeratorTrips() {
    if (!currentModeratorData || !currentModeratorData.recent_trips) return;
    const query = (document.getElementById("moderator-search-input")?.value || "").toLowerCase().trim();
    const vFilter = document.getElementById("moderator-filter-vehicle")?.value || "";

    const filtered = currentModeratorData.recent_trips.filter(t => {
        if (vFilter && String(t.vehicle_id) !== String(vFilter)) {
            return false;
        }
        if (!query) return true;
        const text = `${t.depart_date} ${t.license_plate} ${t.driver_name} ${t.destination} ${t.approver}`.toLowerCase();
        return text.includes(query);
    });

    renderModeratorTrips(filtered);
}

// 1-Click Batch Print All 4 Vehicles Form 4
async function generateBatchForm4Print() {
    try {
        const modMonthInput = document.getElementById("moderator-month");
        let month = modMonthInput ? modMonthInput.value : "";
        if (!month) {
            const now = new Date();
            month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        const printArea = document.getElementById("print-area");
        if (!printArea) return;

        printArea.innerHTML = `<div style="text-align:center; padding: 40px; font-size: 1.2rem;">กำลังรวบรวมข้อมูลแบบ 4 ของรถยนต์ทั้ง 4 คัน ประจำเดือน ${month}...</div>`;

        const vehicleIds = [1, 2, 3, 4];
        let combinedHtml = "";
        let successCount = 0;

        for (const vid of vehicleIds) {
            try {
                const res = await fetch(`/api/report/form4?vehicle_id=${vid}&month=${month}`);
                if (res.ok) {
                    const data = await res.json();
                    const trips = data.trips || [];
                    const ROWS_PER_PAGE = 10;
                    const totalPages = Math.max(1, Math.ceil(trips.length / ROWS_PER_PAGE));

                    for (let p = 0; p < totalPages; p++) {
                        const chunk = trips.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE);
                        while (chunk.length < ROWS_PER_PAGE) {
                            chunk.push({});
                        }
                        const isLast = (p === totalPages - 1);
                        combinedHtml += generateForm4PageHtml(chunk, p + 1, totalPages, data, isLast);
                    }
                    successCount++;
                }
            } catch (err) {
                console.warn(`Could not load vehicle ${vid} Form 4:`, err);
            }
        }

        if (successCount === 0 || !combinedHtml) {
            alert("ไม่สามารถสร้างเอกสารแบบ 4 ได้ โปรดตรวจสอบข้อมูล");
            return;
        }

        printArea.innerHTML = combinedHtml;

        // Force Landscape print style
        let printStyle = document.getElementById("force-landscape-style");
        if (!printStyle) {
            printStyle = document.createElement("style");
            printStyle.id = "force-landscape-style";
            printStyle.innerHTML = "@page { size: A4 landscape !important; size: landscape !important; margin: 6mm 8mm !important; }";
            document.head.appendChild(printStyle);
        }

        setTimeout(() => {
            window.print();
        }, 300);

    } catch (e) {
        alert("เกิดข้อผิดพลาดในการสั่งพิมพ์: " + e.message);
    }
}

async function printSingleVehicleForm4(vehicleId) {
    try {
        const modMonthInput = document.getElementById("moderator-month");
        let month = modMonthInput ? modMonthInput.value : "";
        if (!month) {
            const now = new Date();
            month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        const res = await fetch(`/api/report/form4?vehicle_id=${vehicleId}&month=${month}`);
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลแบบ 4 ได้");
        const data = await res.json();
        populateForm4DOM(data);

        let printStyle = document.getElementById("force-landscape-style");
        if (!printStyle) {
            printStyle = document.createElement("style");
            printStyle.id = "force-landscape-style";
            printStyle.innerHTML = "@page { size: A4 landscape !important; size: landscape !important; margin: 6mm 8mm !important; }";
            document.head.appendChild(printStyle);
        }

        window.print();
    } catch (e) {
        alert("ไม่สามารถสั่งพิมพ์ได้: " + e.message);
    }
}

// Maintenance & Service Modal Controls
function openMaintenanceModal(preselectedVehicleId = null) {
    const modal = document.getElementById("modal-maintenance");
    if (!modal) return;

    const vSelect = document.getElementById("maint-vehicle");
    if (vSelect && preselectedVehicleId) {
        vSelect.value = preselectedVehicleId;
    }

    const dateInput = document.getElementById("maint-date");
    if (dateInput) {
        const now = new Date();
        dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // Auto-fill vehicle current mileage
    if (vSelect) {
        onMaintVehicleChange(vSelect.value);
    }

    modal.classList.add("open");
}

function closeMaintenanceModal() {
    const modal = document.getElementById("modal-maintenance");
    if (modal) modal.classList.remove("open");
}

function onMaintVehicleChange(vehicleId) {
    if (!currentModeratorData || !currentModeratorData.vehicles) return;
    const v = currentModeratorData.vehicles.find(item => String(item.id) === String(vehicleId));
    if (v) {
        const mileageInput = document.getElementById("maint-mileage");
        if (mileageInput && (!mileageInput.value || mileageInput.value === '0')) {
            mileageInput.value = v.current_mileage || 0;
            suggestNextOilChange(v.current_mileage || 0);
        }
    }
}

function onMaintTypeChange(type) {
    const nextDueGroup = document.getElementById("group-next-due-mileage");
    if (!nextDueGroup) return;
    if (type === 'oil_change') {
        nextDueGroup.style.display = "block";
    } else {
        nextDueGroup.style.display = "none";
    }
}

function suggestNextOilChange(mileage) {
    const m = parseInt(mileage, 10);
    const nextInput = document.getElementById("maint-next-due-mileage");
    if (!isNaN(m) && nextInput && (!nextInput.value || parseInt(nextInput.value, 10) <= m)) {
        nextInput.value = m + 10000;
    }
}

async function submitMaintenance(event) {
    event.preventDefault();
    try {
        const vehicleId = parseInt(document.getElementById("maint-vehicle").value, 10);
        const serviceType = document.getElementById("maint-type").value;
        const serviceDate = document.getElementById("maint-date").value;
        const mileage = parseInt(document.getElementById("maint-mileage").value, 10);
        const nextDue = parseInt(document.getElementById("maint-next-due-mileage").value, 10) || (mileage + 10000);
        const center = document.getElementById("maint-center").value;
        const cost = parseFloat(document.getElementById("maint-cost").value) || 0.0;
        const desc = document.getElementById("maint-desc").value;

        const payload = {
            vehicle_id: vehicleId,
            service_type: serviceType,
            service_date: serviceDate,
            mileage: mileage,
            next_due_mileage: nextDue,
            cost: cost,
            service_center: center,
            description: desc,
            reporter_name: "โม (ธุรการ)",
            status: "completed"
        };

        const res = await fetch("/api/maintenance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("บันทึกข้อมูลไม่สำเร็จ");

        alert("✅ บันทึกประวัติการบำรุงรักษา / ถ่ายน้ำมันเครื่องเรียบร้อยแล้วครับ!");
        closeMaintenanceModal();
        await loadModeratorData();
        await loadInitialData(); // sync general vehicle state

    } catch (e) {
        alert("เกิดข้อผิดพลาด: " + e.message);
    }
}
