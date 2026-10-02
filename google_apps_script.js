/**
 * Google Apps Script สำหรับระบบบันทึกการใช้รถราชการ (แบบ 4)
 * สำนักงานพาณิชย์จังหวัดเพชรบุรี
 * 
 * วิธีติดตั้ง (ทำเพียงครั้งเดียว):
 * 1. สร้าง Google Sheets ใหม่ใน Google Drive (เช่น ตั้งชื่อว่า "บันทึกการใช้รถราชการ_MOC")
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดนี้ลงไป
 * 4. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) -> "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 5. เลือกประเภท "เว็บแอป" (Web app)
 *    - สิทธิ์การเข้าถึง (Who has access): เลือก "ทุกคน" (Anyone)
 * 6. กด "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก "URL เว็บแอป" (Web app URL) นำไปใส่ในแอปหน้าตั้งค่า
 */

function setupHeaders(sheet) {
  var headers = [
    "รหัส (ID)", "ลำดับเที่ยว", "ทะเบียนรถ", "รุ่นรถ", "พนักงานขับรถ", 
    "วันออก", "เวลาออก", "ไมล์ออก", "สถานที่ไป", "ผู้รับรอง", 
    "วันกลับ", "เวลากลับ", "ไมล์กลับ", "ระยะทาง (กม.)", "น้ำมัน (ลิตร)", "ผู้สั่งจ่าย", 
    "สถานะ", "หมายเหตุ", "อัปเดตล่าสุด"
  ];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    setupHeaders(sheet);

    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "upsert") {
      var t = data.trip;
      var tripId = t.id;
      var now = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

      var rowData = [
        tripId,
        t.trip_number || 1,
        t.vehicle_plate || "",
        t.vehicle_model || "",
        t.driver_name || "",
        t.depart_date || "",
        t.depart_time || "",
        t.depart_mileage || 0,
        t.destination || "",
        t.approver || "",
        t.arrive_date || "",
        t.arrive_time || "",
        t.arrive_mileage || "",
        t.distance_km || 0,
        t.fuel_liters || 0,
        t.fuel_authorizer || "",
        t.status || "completed",
        t.notes || "",
        now
      ];

      var lastRow = sheet.getLastRow();
      var foundRow = -1;

      if (lastRow > 1) {
        var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < idValues.length; i++) {
          if (String(idValues[i][0]) === String(tripId)) {
            foundRow = i + 2;
            break;
          }
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", id: tripId })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === "batch_sync") {
      var trips = data.trips || [];
      sheet.clearContents();
      setupHeaders(sheet);
      
      var now = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
      var rows = [];

      for (var j = 0; j < trips.length; j++) {
        var tr = trips[j];
        rows.push([
          tr.id,
          tr.trip_number || (j + 1),
          tr.license_plate || tr.vehicle_plate || "",
          tr.vehicle_model || "",
          tr.driver_name || "",
          tr.depart_date || "",
          tr.depart_time || "",
          tr.depart_mileage || 0,
          tr.destination || "",
          tr.approver || "",
          tr.arrive_date || "",
          tr.arrive_time || "",
          tr.arrive_mileage || "",
          tr.distance_km || 0,
          tr.fuel_liters || 0,
          tr.fuel_authorizer || "",
          tr.status || "completed",
          tr.notes || "",
          now
        ]);
      }

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: rows.length })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === "delete") {
      var delId = data.trip_id;
      var lastR = sheet.getLastRow();
      if (lastR > 1) {
        var ids = sheet.getRange(2, 1, lastR - 1, 1).getValues();
        for (var k = 0; k < ids.length; k++) {
          if (String(ids[k][0]) === String(delId)) {
            sheet.deleteRow(k + 2);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", deleted_id: delId })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    setupHeaders(sheet);

    var lastRow = sheet.getLastRow();
    var trips = [];

    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
      for (var i = 0; i < values.length; i++) {
        var r = values[i];
        if (r[0]) {
          trips.push({
            id: r[0],
            trip_number: r[1],
            vehicle_plate: r[2],
            vehicle_model: r[3],
            driver_name: r[4],
            depart_date: r[5],
            depart_time: r[6],
            depart_mileage: r[7],
            destination: r[8],
            approver: r[9],
            arrive_date: r[10],
            arrive_time: r[11],
            arrive_mileage: r[12],
            distance_km: r[13],
            fuel_liters: r[14],
            fuel_authorizer: r[15],
            status: r[16],
            notes: r[17]
          });
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", trips: trips })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
