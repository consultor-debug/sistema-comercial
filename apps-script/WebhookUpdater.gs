// URL de tu Webhook de n8n (opcional, se disparará al actualizar un lote)
const WEBHOOK_URL = "https://asistente-n8n.abqahy.easypanel.host/webhook/lote-update";

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Esperar un poco en caso de que lleguen 2 peticiones al mismo segundo
  lock.tryLock(10000);

  try {
    // 1. Capturar los datos enviados por la app web
    var params = JSON.parse(e.postData.contents);
    var targetId = String(params.id).trim();
    // Limpiamos los espacios para no romper el Menú Desplegable visual de Google
    var newStatus = String(params.status).trim(); 
    var sheetId = params.sheetId;

    var doc = SpreadsheetApp.openById(sheetId);
    
    // 2. BUSCAR EXACTAMENTE TU HOJA. Si le cambiaste el nombre, ajusta "Base General"
    var sheet = doc.getSheetByName("Base General"); 
    if (!sheet) {
       sheet = doc.getSheets()[0]; // Respaldo por si aca
    }
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var idIndex = headers.indexOf("ID");
    var estadoIndex = headers.indexOf("Estado");

    if (idIndex === -1 || estadoIndex === -1) throw new Error("Las columnas 'ID' o 'Estado' no existen.");

    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;

    // Buscar en qué fila está el lote
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]).trim() === targetId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 0) {
      // 3. Actualizar la celda exacta en Google Sheets
      var cellToUpdate = sheet.getRange(rowIndex, estadoIndex + 1);
      cellToUpdate.setValue(newStatus);
      
      SpreadsheetApp.flush(); // Forzamos a Google a refrescar la pantalla

      // 4. Leer la fila entera para pasársela a n8n
      var updatedRowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Llamada silenciosa a N8N
      try {
        enviarAN8N(updatedRowData, headers);
      } catch (err) {}

      return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "Lote actualizado a " + newStatus}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "No se encontró el Lote en el Excel"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}


function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'Base General') return;

  var row = e.range.getRow();
  if (row === 1) return; // Ignoramos si editas la primera fila de títulos

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  enviarAN8N(data, headers);
}


// Función super-inteligente que empaqueta todo basándose en tus nombres de títulos reales
function enviarAN8N(data, headers) {
  var payload = {};
  
  // Combina dinámicamente el título con el valor de la celda
  for(var i = 0; i < headers.length; i++) {
      if(headers[i]) {
          payload[headers[i]] = data[i];
      }
  }

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // Evita que un error 500 de n8n crashee el Excel
  };

  UrlFetchApp.fetch(WEBHOOK_URL, options);
}
