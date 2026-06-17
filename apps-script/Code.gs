// Paste this whole file into Extensions > Apps Script on the Alumni Tracer
// Google Sheet, then deploy as a Web App (Execute as: Me, Who has access: Anyone).
// See README.md "Apps Script setup" section for full steps.

var SECRET = 'REPLACE_WITH_SHARED_SECRET';
var SHEET_NAME = 'Alumni';
var PHOTO_FOLDER_NAME = 'Alumni Tracer Photos';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) {
      return jsonResponse({ success: false, message: 'Unauthorized' });
    }

    if (body.action === 'append_row') {
      var rowIndex = appendRow(body.row);
      return jsonResponse({ success: true, rowIndex: rowIndex });
    }

    if (body.action === 'add_photo') {
      var link = addPhoto(body.rowIndex, body.filename, body.mimeType, body.base64);
      return jsonResponse({ success: true, link: link });
    }

    if (body.action === 'list_rows') {
      return jsonResponse({ success: true, rows: listRows() });
    }

    return jsonResponse({ success: false, message: 'Unknown action: ' + body.action });
  } catch (err) {
    return jsonResponse({ success: false, message: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet tab "' + SHEET_NAME + '" not found');
  return sheet;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function appendRow(rowObj) {
  var sheet = getSheet();
  var headers = getHeaders(sheet);
  var newRow = headers.map(function (h) {
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });
  sheet.appendRow(newRow);
  return sheet.getLastRow();
}

function addPhoto(rowIndex, filename, mimeType, base64) {
  var folder = getOrCreatePhotoFolder();
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, mimeType, filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var link = file.getUrl();

  var sheet = getSheet();
  var headers = getHeaders(sheet);
  var colIndex = headers.indexOf('Link Foto Terbaik') + 1;
  if (colIndex > 0) {
    var cell = sheet.getRange(rowIndex, colIndex);
    var existing = cell.getValue();
    cell.setValue(existing ? existing + ', ' + link : link);
  }
  return link;
}

function listRows() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];

  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var value = data[i][c];
      obj[headers[c]] = value instanceof Date ? value.toISOString() : value;
    }
    rows.push(obj);
  }
  return rows;
}

function getOrCreatePhotoFolder() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('PHOTO_FOLDER_ID');
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      // stored id no longer valid, fall through and recreate
    }
  }
  var folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}
