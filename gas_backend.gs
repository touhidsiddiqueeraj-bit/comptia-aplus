/**
 * CompTIA A+ Zero to Hero — Google Apps Script Backend
 * =====================================================
 * Handles user authentication and progress sync for CompTIA_Aplus_Release.html
 *
 * SETUP INSTRUCTIONS
 * ------------------
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into the editor
 * 3. Update SHEET_ID below with your Google Sheet ID (create a blank sheet first)
 * 4. Click Deploy → New Deployment → Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL
 * 6. In CompTIA_Aplus_Release.html, replace 'YOUR_GAS_WEB_APP_URL_HERE' with that URL
 *
 * GOOGLE SHEET STRUCTURE (auto-created on first run)
 * ---------------------------------------------------
 * Sheet "Users":
 *   A: username | B: name | C: password_hash | D: created_at | E: last_login
 *
 * Sheet "Progress":
 *   A: username | B: done | C: subs | D: xp | E: ach | F: scores | G: updated_at
 */

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
const SHEET_ID = '1I9qyGfQlHNuJZZbrW_CqYPB5l9Bu8mT-CzNtbY4dlLQ';  // ← Replace with your Sheet ID
const ALLOWED_ORIGIN = 'https://comptiacore.netlify.app/';                      // Restrict to your domain in production

// ── ENTRY POINT ───────────────────────────────────────────────────────────────
function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || '';

  let result;
  try {
    switch (action) {
      case 'login':         result = handleLogin(params);        break;
      case 'register':      result = handleRegister(params);     break;
      case 'saveProgress':  result = handleSaveProgress(params); break;
      case 'loadProgress':  result = handleLoadProgress(params); break;
      case 'ping':          result = { ok: true, msg: 'pong' };  break;
      default:              result = { ok: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { ok: false, error: err.message };
    console.error('GAS error:', err);
  }

  return buildResponse(result);
}

// ── RESPONSE HELPER ───────────────────────────────────────────────────────────
function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SHEET HELPERS ─────────────────────────────────────────────────────────────
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Set headers
    if (name === 'Users') {
      sheet.appendRow(['username', 'name', 'password_hash', 'created_at', 'last_login']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#E8F0FE');
    } else if (name === 'Progress') {
      sheet.appendRow(['username', 'done', 'subs', 'xp', 'ach', 'scores', 'updated_at']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E8F0FE');
    }
  }
  return sheet;
}

function findUserRow(username) {
  const sheet = getOrCreateSheet('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username.toLowerCase()) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

function findProgressRow(username) {
  const sheet = getOrCreateSheet('Progress');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username.toLowerCase()) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

// ── AUTH HANDLERS ─────────────────────────────────────────────────────────────
function handleLogin(params) {
  const username = (params.username || '').toLowerCase().trim();
  const passwordHash = params.password || '';

  if (!username || !passwordHash) {
    return { ok: false, error: 'Missing username or password' };
  }

  const userRow = findUserRow(username);
  if (!userRow) {
    return { ok: false, error: 'Account not found' };
  }

  const storedHash = String(userRow.data[2]);
  if (storedHash !== passwordHash) {
    return { ok: false, error: 'Incorrect password' };
  }

  // Update last login timestamp
  const sheet = getOrCreateSheet('Users');
  sheet.getRange(userRow.row, 5).setValue(new Date().toISOString());

  // Load progress data if available
  const progressRow = findProgressRow(username);
  let progressData = null;
  if (progressRow) {
    progressData = {
      done:   String(progressRow.data[1] || '[]'),
      subs:   String(progressRow.data[2] || '{}'),
      xp:     String(progressRow.data[3] || '0'),
      ach:    String(progressRow.data[4] || '[]'),
      scores: String(progressRow.data[5] || '{}')
    };
  }

  return {
    ok: true,
    username: username,
    name: String(userRow.data[1]),
    created: String(userRow.data[3]),
    data: progressData
  };
}

function handleRegister(params) {
  const username = (params.username || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  const name = (params.name || username).trim();
  const passwordHash = params.password || '';

  if (!username || !passwordHash) {
    return { ok: false, error: 'Missing username or password' };
  }
  if (username.length < 3) {
    return { ok: false, error: 'Username too short' };
  }

  // Check if already taken
  const existing = findUserRow(username);
  if (existing) {
    return { ok: false, error: 'Username already taken' };
  }

  const sheet = getOrCreateSheet('Users');
  const createdAt = new Date().toISOString();
  sheet.appendRow([username, name, passwordHash, createdAt, createdAt]);

  // Initialize empty progress row
  const progressSheet = getOrCreateSheet('Progress');
  progressSheet.appendRow([username, '[]', '{}', '0', '[]', '{}', createdAt]);

  return {
    ok: true,
    username: username,
    name: name,
    created: createdAt
  };
}

// ── PROGRESS HANDLERS ─────────────────────────────────────────────────────────
function handleSaveProgress(params) {
  const username = (params.username || '').toLowerCase().trim();
  if (!username) {
    return { ok: false, error: 'Missing username' };
  }

  // Validate user exists before saving
  const userRow = findUserRow(username);
  if (!userRow) {
    return { ok: false, error: 'User not found' };
  }

  const done   = params.done   || '[]';
  const subs   = params.subs   || '{}';
  const xp     = params.xp     || '0';
  const ach    = params.ach    || '[]';
  const scores = params.scores || '{}';
  const now    = new Date().toISOString();

  const sheet = getOrCreateSheet('Progress');
  const progressRow = findProgressRow(username);

  if (progressRow) {
    // Update existing row
    sheet.getRange(progressRow.row, 2, 1, 6).setValues([[done, subs, xp, ach, scores, now]]);
  } else {
    // Insert new row
    sheet.appendRow([username, done, subs, xp, ach, scores, now]);
  }

  return { ok: true, updated: now };
}

function handleLoadProgress(params) {
  const username = (params.username || '').toLowerCase().trim();
  if (!username) {
    return { ok: false, error: 'Missing username' };
  }

  const progressRow = findProgressRow(username);
  if (!progressRow) {
    return { ok: true, data: null }; // No progress saved yet
  }

  return {
    ok: true,
    data: {
      done:   String(progressRow.data[1] || '[]'),
      subs:   String(progressRow.data[2] || '{}'),
      xp:     String(progressRow.data[3] || '0'),
      ach:    String(progressRow.data[4] || '[]'),
      scores: String(progressRow.data[5] || '{}')
    }
  };
}

// ── ADMIN UTILITIES (run manually from Apps Script editor) ───────────────────

/**
 * Run this once to initialize the spreadsheet with correct headers.
 * Safe to run multiple times (only creates if missing).
 */
function initSheets() {
  getOrCreateSheet('Users');
  getOrCreateSheet('Progress');
  SpreadsheetApp.flush();
  Logger.log('Sheets initialized successfully.');
}

/**
 * List all registered users (for admin review).
 */
function listUsers() {
  const sheet = getOrCreateSheet('Users');
  const data = sheet.getDataRange().getValues();
  data.forEach((row, i) => Logger.log('Row ' + i + ': ' + row.join(' | ')));
}

/**
 * Delete a user and their progress (admin use only).
 */
function deleteUser(username) {
  const userRow = findUserRow(username);
  if (userRow) {
    getOrCreateSheet('Users').deleteRow(userRow.row);
    Logger.log('Deleted user: ' + username);
  }
  const progRow = findProgressRow(username);
  if (progRow) {
    getOrCreateSheet('Progress').deleteRow(progRow.row);
    Logger.log('Deleted progress for: ' + username);
  }
}
