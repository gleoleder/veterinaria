// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                      SISTEMA VETCARE - script.js                             ║
// ║                         Versión 2.0                                          ║
// ║                                                                              ║
// ║  Sistema de Gestión Veterinaria con integración a Google Sheets             ║
// ║  Basado en el patrón de autenticación del Sistema POS Mindy's               ║
// ╚════════════════════════════════════════════════════════════════════════════╝


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 1: CONFIGURACIÓN DE GOOGLE API                   ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const CLIENT_ID = CONFIG.CLIENT_ID;
const API_KEY = CONFIG.API_KEY;
const SPREADSHEET_ID = CONFIG.GOOGLE_SHEET_ID;
const SHEETS = CONFIG.SHEETS;

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

const SCOPES =
    'https://www.googleapis.com/auth/spreadsheets ' +
    'https://www.googleapis.com/auth/drive.file ' +
    'https://www.googleapis.com/auth/userinfo.profile ' +
    'https://www.googleapis.com/auth/userinfo.email';


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 2: VARIABLES DE ESTADO                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

let tokenClient;
let gapiInited = false;
let gisInited = false;
let usuarioGoogle = false;
let emailUsuario = '';
let nombreUsuario = '';

// Datos de la aplicación
let clients = [];
let pets = [];
let appointments = [];
let history = [];

// Estado de formularios
let selectedOwner = null;
let isNewOwner = false;
let selectedFiles = [];
let selectedAppointmentClient = null;
let selectedAppointmentPet = null;
let selectedHistoryClient = null;
let selectedHistoryPet = null;
let selectedPetType = null;

// Clave para guardar el token (igual que el sistema POS)
const TOKEN_STORAGE_KEY = 'vetcare_google_token';


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 3: INICIALIZACIÓN DE GOOGLE API                  ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * Callback cuando GAPI se carga
 */
function gapiLoaded() {
    console.log('📦 GAPI cargado');
    gapi.load('client', initializeGapiClient);
}

/**
 * Inicializa el cliente de Google API
 */
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC]
        });
        gapiInited = true;
        console.log('✅ Google API inicializada');
        checkReady();
    } catch (e) {
        console.error('❌ Error GAPI:', e);
        showLoginError('Error al inicializar Google API: ' + (e.message || e));
    }
}

/**
 * Callback cuando Google Identity Services se carga
 */
function gisLoaded() {
    console.log('📦 GIS cargado');
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse  // Callback directo como en el sistema POS
    });
    gisInited = true;
    console.log('✅ Google Identity Services cargado');
    checkReady();
}

/**
 * Verifica si GAPI y GIS están listos
 */
function checkReady() {
    if (gapiInited && gisInited) {
        console.log('🐾 Sistema VetCare listo');
        
        // Intentar restaurar sesión guardada
        const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (savedToken) {
            console.log('🔑 Token guardado encontrado, verificando...');
            gapi.client.setToken({ access_token: savedToken });
            verificarToken();
        } else {
            console.log('⚠️ No hay token guardado');
            // Mostrar pantalla de login
        }
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 4: AUTENTICACIÓN CON GOOGLE                      ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * Maneja el click en el botón de conectar/desconectar
 */
function handleGoogleAuth() {
    if (!gapiInited || !gisInited) {
        showToast('Esperando Google API...', 'warning');
        return;
    }
    
    if (usuarioGoogle) {
        logoutGoogle();
    } else {
        // Solicitar token mostrando popup de Google
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

/**
 * Callback cuando Google devuelve un token
 */
function handleTokenResponse(resp) {
    if (resp.error) {
        console.error('❌ Error auth:', resp);
        showLoginError('Error de autenticación: ' + (resp.error_description || resp.error));
        return;
    }
    
    console.log('✅ Token recibido');
    
    // Guardar token
    gapi.client.setToken(resp);
    localStorage.setItem(TOKEN_STORAGE_KEY, resp.access_token);
    
    // Cargar datos del usuario y la aplicación
    cargarDatosUsuarioYApp();
}

/**
 * Cierra la sesión de Google
 */
function logoutGoogle() {
    const token = gapi.client.getToken();
    if (token) {
        google.accounts.oauth2.revoke(token.access_token);
    }
    
    gapi.client.setToken('');
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    
    usuarioGoogle = false;
    emailUsuario = '';
    nombreUsuario = '';
    clients = [];
    pets = [];
    appointments = [];
    history = [];
    
    // Mostrar pantalla de login
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    showToast('Sesión cerrada', 'warning');
}

/**
 * Verifica si el token guardado sigue siendo válido
 */
async function verificarToken() {
    try {
        // Intentar una llamada simple para verificar el token
        await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        console.log('✅ Token válido');
        cargarDatosUsuarioYApp();
    } catch (e) {
        console.log('⚠️ Token expirado o inválido');
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Token inválido, el usuario debe volver a conectar
    }
}

/**
 * Carga los datos del usuario y luego los datos de la aplicación
 */
async function cargarDatosUsuarioYApp() {
    try {
        // Mostrar pantalla de carga
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'flex';
        
        // Obtener info del usuario
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: 'Bearer ' + gapi.client.getToken().access_token }
        });
        const userData = await userRes.json();
        
        emailUsuario = userData.email || '';
        nombreUsuario = userData.name || userData.email || 'Usuario';
        usuarioGoogle = true;
        
        console.log('👤 Usuario:', nombreUsuario, emailUsuario);
        
        // Actualizar UI con datos del usuario
        const userPhoto = document.getElementById('userPhoto');
        const userName = document.getElementById('userName');
        if (userPhoto) userPhoto.src = userData.picture || '';
        if (userName) userName.textContent = nombreUsuario;
        
        // Cargar datos desde Google Sheets
        await loadAllDataFromSheets();
        
        // Ocultar carga, mostrar app
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Inicializar UI
        initNavigation();
        createFloatingPaws();
        renderAll();
        
        showToast('¡Bienvenido ' + nombreUsuario + '!', 'success');
        
    } catch (e) {
        console.error('Error cargando datos:', e);
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        showLoginError('Error al cargar datos: ' + (e.message || e));
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 5: FUNCIONES DE GOOGLE SHEETS                    ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * Lee datos de una hoja de Google Sheets
 */
async function readSheet(sheetName) {
    try {
        console.log('📖 Leyendo hoja:', sheetName);
        
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName + '!A:Z'
        });
        
        const values = response.result.values;
        if (!values || values.length < 2) {
            console.log(`Hoja ${sheetName} vacía`);
            return [];
        }
        
        const headers = values[0].map(h => h.toLowerCase().trim());
        const data = values.slice(1).map((row, index) => {
            const obj = { _rowIndex: index + 2 };
            headers.forEach((header, i) => {
                obj[header] = row[i] || '';
            });
            return obj;
        });
        
        console.log(`✅ ${sheetName}: ${data.length} registros`);
        return data;
        
    } catch (error) {
        console.error(`Error leyendo ${sheetName}:`, error);
        return [];
    }
}

/**
 * Agrega una fila a una hoja
 */
async function appendToSheet(sheetName, values) {
    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName + '!A:Z',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [values] }
        });
        console.log('✅ Datos guardados en', sheetName);
    } catch (error) {
        console.error('Error escribiendo en', sheetName, error);
        throw error;
    }
}

/**
 * Actualiza una fila específica
 */
async function updateSheetRow(sheetName, rowIndex, values) {
    try {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName + '!A' + rowIndex + ':Z' + rowIndex,
            valueInputOption: 'RAW',
            resource: { values: [values] }
        });
    } catch (error) {
        console.error('Error actualizando', sheetName, error);
        throw error;
    }
}

/**
 * Elimina una fila
 */
async function deleteSheetRow(sheetName, rowIndex) {
    try {
        const sheetsInfo = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID
        });
        
        const sheet = sheetsInfo.result.sheets.find(s => s.properties.title === sheetName);
        if (!sheet) throw new Error('Hoja no encontrada');
        
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        }
                    }
                }]
            }
        });
    } catch (error) {
        console.error('Error eliminando fila:', error);
        throw error;
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 6: CARGAR DATOS                                  ║
// ╚════════════════════════════════════════════════════════════════════════════╝

async function loadAllDataFromSheets() {
    console.log('📥 Cargando datos desde Google Sheets...');
    
    // Clientes
    const clientsData = await readSheet(SHEETS.CLIENTES);
    clients = clientsData.map(c => ({
        id: parseInt(c.id) || Date.now(),
        cedula: c.cedula || '',
        name: c.nombre || '',
        phone: c.telefono || '',
        email: c.email || '',
        address: c.direccion || '',
        color: c.color || generateColor(),
        _rowIndex: c._rowIndex
    }));
    
    // Mascotas
    const petsData = await readSheet(SHEETS.MASCOTAS);
    pets = petsData.map(p => ({
        id: parseInt(p.id) || Date.now(),
        name: p.nombre || '',
        type: p.tipo || 'dog',
        breed: p.raza || '',
        age: p.edad || '',
        weight: parseFloat(p.peso) || 0,
        owner: parseInt(p.clienteid) || 0,
        ownerCedula: p.ceduladueno || '',
        notes: p.notas || '',
        _rowIndex: p._rowIndex
    }));
    
    // Citas
    const appointmentsData = await readSheet(SHEETS.CITAS);
    appointments = appointmentsData.map(a => ({
        id: parseInt(a.id) || Date.now(),
        petId: parseInt(a.mascotaid) || 0,
        clientId: parseInt(a.clienteid) || 0,
        date: a.fecha || '',
        time: a.hora || '',
        type: a.tipoconsulta || 'checkup',
        notes: a.notas || '',
        completed: a.estado === 'COMPLETADA',
        _rowIndex: a._rowIndex
    }));
    
    // Historial
    const historyData = await readSheet(SHEETS.HISTORIAL);
    history = historyData.map(h => ({
        id: parseInt(h.id) || Date.now(),
        petId: parseInt(h.mascotaid) || 0,
        clientId: parseInt(h.clienteid) || 0,
        date: h.fecha || '',
        type: h.tipoconsulta || 'checkup',
        diagnosis: h.diagnostico || '',
        treatment: h.tratamiento || '',
        meds: h.medicamentos || '',
        attachments: [],
        _rowIndex: h._rowIndex
    }));
    
    // Archivos adjuntos
    try {
        const attachmentsData = await readSheet(SHEETS.ARCHIVOS);
        attachmentsData.forEach(a => {
            const histItem = history.find(h => h.id === parseInt(a.historialid));
            if (histItem) {
                if (!histItem.attachments) histItem.attachments = [];
                histItem.attachments.push({
                    name: a.nombrearchivo || '',
                    type: a.tipoarchivo || '',
                    url: a.urldrive || ''
                });
            }
        });
    } catch (e) {
        console.log('Hoja Archivos no disponible');
    }
    
    console.log('✅ Datos cargados:', {
        clientes: clients.length,
        mascotas: pets.length,
        citas: appointments.length,
        historial: history.length
    });
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 7: GOOGLE DRIVE - SUBIR ARCHIVOS                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝

async function uploadFileToDrive(file) {
    try {
        const metadata = {
            name: Date.now() + '_' + file.name,
            mimeType: file.type
        };
        
        // Solo agregar carpeta si está configurada
        if (CONFIG.DRIVE_FOLDER_ID && CONFIG.DRIVE_FOLDER_ID.length > 10) {
            metadata.parents = [CONFIG.DRIVE_FOLDER_ID];
        }
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + gapi.client.getToken().access_token },
            body: form
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error subiendo archivo:', errorData);
            throw new Error('Error al subir archivo: ' + (errorData.error?.message || 'Error desconocido'));
        }
        
        const data = await response.json();
        
        if (!data.id) {
            throw new Error('No se obtuvo ID del archivo');
        }
        
        // Intentar hacer público (pero no fallar si no se puede)
        try {
            await fetch('https://www.googleapis.com/drive/v3/files/' + data.id + '/permissions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + gapi.client.getToken().access_token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: 'reader', type: 'anyone' })
            });
        } catch (permError) {
            console.warn('No se pudo hacer público el archivo:', permError);
        }
        
        return {
            id: data.id,
            name: file.name,
            type: file.type,
            size: file.size,
            url: data.webViewLink || 'https://drive.google.com/file/d/' + data.id + '/view'
        };
        
    } catch (error) {
        console.error('Error en uploadFileToDrive:', error);
        throw error;
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 8: FUNCIONES AUXILIARES                          ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function getPetIcon(type) {
    return { dog: '🐕', cat: '🐱', bird: '🐦', rabbit: '🐰' }[type] || '🐾';
}

function getPetTypeName(type) {
    return { dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo' }[type] || type;
}

function getTypeIcon(type) {
    return { checkup: '🩺', vaccine: '💉', surgery: '🏥', grooming: '✨', emergency: '🚨', dental: '🦷', treatment: '💊' }[type] || '📋';
}

function getTypeName(type) {
    return { checkup: 'Revisión', vaccine: 'Vacunación', surgery: 'Cirugía', grooming: 'Estética', emergency: 'Emergencia', dental: 'Dental', treatment: 'Tratamiento' }[type] || type;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function generateColor() {
    return ['#7C9A92', '#F2B880', '#E8998D', '#A8C5BE', '#C9B8E8', '#86B3D1'][Math.floor(Math.random() * 6)];
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 9: INTERFAZ DE USUARIO                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    console.error('Login Error:', message);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const msgEl = toast.querySelector('.toast-message');
    if (msgEl) msgEl.textContent = message;
    
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
        });
    });
}

function createFloatingPaws() {
    const container = document.getElementById('floatingPaws');
    if (!container) return;
    const paws = ['🐾', '🐕', '🐱', '🐦', '🐰', '❤️'];
    for (let i = 0; i < 15; i++) {
        const paw = document.createElement('div');
        paw.className = 'paw';
        paw.textContent = paws[Math.floor(Math.random() * paws.length)];
        paw.style.left = Math.random() * 100 + '%';
        paw.style.top = Math.random() * 100 + '%';
        paw.style.animationDelay = Math.random() * 10 + 's';
        container.appendChild(paw);
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 10: ESTADÍSTICAS                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function updateStats() {
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('totalPets').textContent = pets.length;
    
    const today = getTodayDate();
    document.getElementById('todayAppointments').textContent = appointments.filter(a => a.date === today && !a.completed).length;
    
    const thisMonth = today.slice(0, 7);
    document.getElementById('monthlyVisits').textContent = history.filter(h => h.date && h.date.startsWith(thisMonth)).length;
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 11: RENDERIZADO                                  ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function renderRecentClients() {
    const table = document.getElementById('recentClientsTable');
    if (!table) return;
    
    if (clients.length === 0) {
        table.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">👥</div><p>No hay clientes</p></div></td></tr>';
        return;
    }
    
    table.innerHTML = clients.slice(-5).reverse().map(client => {
        const clientPets = pets.filter(p => p.owner === client.id);
        return `<tr>
            <td><div class="client-info">
                <div class="client-avatar" style="background: ${client.color}20; color: ${client.color}">${client.name.charAt(0)}</div>
                <div><div class="client-name">${client.name}</div><div class="client-email">${client.email || ''}</div></div>
            </div></td>
            <td><span class="ci-badge">CI: ${client.cedula}</span></td>
            <td>${clientPets.map(p => '<span class="pet-badge ' + p.type + '">' + getPetIcon(p.type) + ' ' + p.name + '</span>').join('') || '-'}</td>
            <td>
                <button class="action-btn" onclick="sendWhatsApp('${client.phone}', 'Hola ${client.name}!')">📲</button>
                <button class="action-btn" onclick="deleteClient(${client.id}, ${client._rowIndex})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderAllClients(filtered) {
    const table = document.getElementById('allClientsTable');
    if (!table) return;
    
    const data = filtered || clients;
    
    if (data.length === 0) {
        table.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">👥</div><p>No hay clientes</p></div></td></tr>';
        return;
    }
    
    table.innerHTML = data.map(client => {
        const clientPets = pets.filter(p => p.owner === client.id);
        return `<tr>
            <td><div class="client-info">
                <div class="client-avatar" style="background: ${client.color}20; color: ${client.color}">${client.name.charAt(0)}</div>
                <div><div class="client-name">${client.name}</div><div class="client-email">${client.email || ''}</div></div>
            </div></td>
            <td><span class="ci-badge">CI: ${client.cedula}</span></td>
            <td>${client.phone}</td>
            <td>${clientPets.map(p => '<span class="pet-badge ' + p.type + '">' + getPetIcon(p.type) + ' ' + p.name + '</span>').join('') || '-'}</td>
            <td>
                <button class="action-btn" onclick="sendWhatsApp('${client.phone}', 'Hola ${client.name}!')">📲</button>
                <button class="action-btn" onclick="deleteClient(${client.id}, ${client._rowIndex})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderAllPets(filtered) {
    const table = document.getElementById('allPetsTable');
    if (!table) return;
    
    const data = filtered || pets;
    
    if (data.length === 0) {
        table.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🐾</div><p>No hay mascotas</p></div></td></tr>';
        return;
    }
    
    table.innerHTML = data.map(pet => {
        const owner = clients.find(c => c.id === pet.owner);
        return `<tr>
            <td><div class="client-info">
                <div class="client-avatar" style="font-size: 1.3rem;">${getPetIcon(pet.type)}</div>
                <div><div class="client-name">${pet.name}</div><div class="client-email">${pet.breed || ''}</div></div>
            </div></td>
            <td><span class="pet-badge ${pet.type}">${getPetTypeName(pet.type)}</span></td>
            <td>${owner ? owner.name : '-'}</td>
            <td>${pet.age || '-'}</td>
            <td>
                <button class="action-btn" onclick="viewPetHistory(${pet.id})">📋</button>
                <button class="action-btn" onclick="deletePet(${pet.id}, ${pet._rowIndex})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderTodayAppointments() {
    const container = document.getElementById('todayAppointmentsList');
    if (!container) return;
    
    const today = getTodayDate();
    const todayAppts = appointments.filter(a => a.date === today && !a.completed).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    if (todayAppts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><p>No hay citas hoy</p></div>';
        return;
    }
    
    container.innerHTML = todayAppts.map(appt => {
        const pet = pets.find(p => p.id === appt.petId);
        const client = clients.find(c => c.id === appt.clientId);
        const parts = (appt.time || '00:00').split(':');
        const hour = parseInt(parts[0]) || 0;
        return `<div class="appointment-card" onclick="completeAppointment(${appt.id}, ${appt._rowIndex})">
            <div class="appointment-time">
                <div class="time">${hour > 12 ? hour - 12 : hour}:${parts[1] || '00'}</div>
                <div class="period">${hour >= 12 ? 'PM' : 'AM'}</div>
            </div>
            <div class="appointment-details">
                <div class="appointment-pet">${getPetIcon(pet?.type)} ${pet?.name || 'Mascota'}</div>
                <div class="appointment-type">${getTypeName(appt.type)} • ${client?.name || ''}</div>
            </div>
            <span>${getTypeIcon(appt.type)}</span>
        </div>`;
    }).join('');
}

function renderUpcomingAppointments() {
    const container = document.getElementById('upcomingAppointments');
    if (!container) return;
    
    const today = getTodayDate();
    const upcoming = appointments.filter(a => a.date >= today && !a.completed).sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : (a.time || '').localeCompare(b.time || ''));
    
    if (upcoming.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><p>No hay citas</p></div>';
        return;
    }
    
    container.innerHTML = upcoming.slice(0, 10).map(appt => {
        const pet = pets.find(p => p.id === appt.petId);
        const client = clients.find(c => c.id === appt.clientId);
        return `<div class="appointment-card">
            <div class="appointment-time">
                <div class="time">${appt.time || '--'}</div>
                <div class="period">${formatDate(appt.date)}</div>
            </div>
            <div class="appointment-details">
                <div class="appointment-pet">${getPetIcon(pet?.type)} ${pet?.name || ''}</div>
                <div class="appointment-type">${getTypeName(appt.type)} • ${client?.name || ''}</div>
            </div>
            <button class="action-btn" onclick="event.stopPropagation(); sendAppointmentReminder(${appt.id})">📲</button>
        </div>`;
    }).join('');
}

function renderCompletedAppointments() {
    const container = document.getElementById('completedAppointments');
    if (!container) return;
    
    const today = getTodayDate();
    const completed = appointments.filter(a => a.date === today && a.completed);
    
    if (completed.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>Sin completadas</p></div>';
        return;
    }
    
    container.innerHTML = completed.map(appt => {
        const pet = pets.find(p => p.id === appt.petId);
        return `<div class="appointment-card" style="opacity: 0.6;">
            <div class="appointment-time" style="background: var(--mint);"><div class="time">✓</div></div>
            <div class="appointment-details">
                <div class="appointment-pet">${getPetIcon(pet?.type)} ${pet?.name || ''}</div>
                <div class="appointment-type">${getTypeName(appt.type)}</div>
            </div>
        </div>`;
    }).join('');
}

function renderHistory(filtered) {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    const data = (filtered || history).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No hay registros</p></div>';
        return;
    }
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    container.innerHTML = data.map(item => {
        const pet = pets.find(p => p.id === item.petId);
        const owner = pet ? clients.find(c => c.id === pet.owner) : null;
        const date = item.date ? new Date(item.date + 'T00:00:00') : new Date();
        const attachments = item.attachments || [];
        
        return `<div class="history-item">
            <div class="history-date">
                <div class="history-day">${date.getDate()}</div>
                <div class="history-month">${months[date.getMonth()]}</div>
            </div>
            <div class="history-content">
                <div class="history-title">${getTypeIcon(item.type)} ${getTypeName(item.type)}</div>
                <div class="history-desc">${item.diagnosis || ''}</div>
                <div class="history-pet">${getPetIcon(pet?.type)} ${pet?.name || ''} ${owner ? '• ' + owner.name : ''}</div>
                ${attachments.length > 0 ? '<div class="history-attachments">' + attachments.map(a => '<a href="' + a.url + '" target="_blank" class="attachment-badge">📎 ' + a.name + '</a>').join('') + '</div>' : ''}
            </div>
            <button class="action-btn" onclick="viewPetHistory(${item.petId})">📋</button>
        </div>`;
    }).join('');
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 12: WHATSAPP                                     ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function sendWhatsApp(phone, message) {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
        showToast('Sin teléfono', 'warning');
        return;
    }
    window.open('https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(message), '_blank');
}

function sendAppointmentReminder(appointmentId) {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) return;
    
    const pet = pets.find(p => p.id === appt.petId);
    const client = clients.find(c => c.id === appt.clientId);
    if (!client) return;

    // Mensaje con códigos Unicode para evitar problemas de codificación
    const message = '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n' +
        '\uD83D\uDD14 RECORDATORIO - VetCare\n' +
        '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n\n' +
        'Hola ' + client.name + ' \uD83D\uDC4B\n\n' +
        'Te recordamos que tienes una cita programada:\n\n' +
        '\uD83D\uDCC5 Fecha: ' + formatDateLong(appt.date) + '\n' +
        '\uD83D\uDD50 Hora: ' + appt.time + '\n' +
        '\uD83D\uDC36 Paciente: ' + (pet?.name || 'Tu mascota') + '\n' +
        '\uD83E\uDE7A Servicio: ' + getTypeName(appt.type) + '\n\n' +
        '\uD83D\uDCCD Te esperamos en nuestra clinica.\n\n' +
        '\u26A0\uFE0F Si necesitas reprogramar, contactanos con anticipacion.\n\n' +
        'Gracias por tu preferencia \uD83D\uDC9A\n\n' +
        '\uD83C\uDFE5 VetCare - Cuidamos a tu mejor amigo';

    sendWhatsApp(client.phone, message);
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 13: MODALES                                      ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function openModal(type) {
    const modalId = 'modal' + type.charAt(0).toUpperCase() + type.slice(1);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        if (type === 'newPet') resetPetForm();
        if (type === 'newAppointment') resetAppointmentForm();
        if (type === 'newHistory') resetHistoryForm();
    }
}

function closeModal(type) {
    const modalId = 'modal' + type.charAt(0).toUpperCase() + type.slice(1);
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
    if (!e.target.closest('.autocomplete-wrapper')) {
        document.querySelectorAll('.autocomplete-list').forEach(function(el) { el.classList.remove('show'); });
    }
});


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 14: GUARDAR CLIENTE                              ║
// ╚════════════════════════════════════════════════════════════════════════════╝

async function saveClient(e) {
    e.preventDefault();
    
    const cedula = document.getElementById('clientCedula').value.trim();
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.replace(/\D/g, '');
    const email = document.getElementById('clientEmail').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    
    if (!cedula || !name || !phone) {
        showToast('Complete campos obligatorios', 'warning');
        return;
    }
    
    if (clients.find(c => c.cedula === cedula)) {
        showToast('CI ya existe', 'warning');
        return;
    }
    
    const newClient = {
        id: Date.now(),
        cedula: cedula,
        name: name,
        phone: phone,
        email: email,
        address: address,
        color: generateColor()
    };
    
    try {
        showToast('Guardando...', 'warning');
        
        await appendToSheet(SHEETS.CLIENTES, [
            newClient.id, cedula, name, phone, email, address, newClient.color, new Date().toISOString()
        ]);
        
        clients.push(newClient);
        closeModal('newClient');
        document.getElementById('formNewClient').reset();
        renderAll();
        showToast('Cliente guardado', 'success');
        
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 15: FORMULARIO MASCOTA                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function resetPetForm() {
    selectedOwner = null;
    isNewOwner = false;
    selectedPetType = null;
    
    document.getElementById('formNewPet').reset();
    document.querySelectorAll('.pet-option').forEach(function(o) { o.classList.remove('selected'); });
    document.getElementById('ownerInfoCard').classList.remove('show');
    document.getElementById('newOwnerForm').style.display = 'none';
    document.getElementById('ownerAutocomplete').classList.remove('show');
}

function selectPetType(type) {
    selectedPetType = type;
    document.getElementById('petType').value = type;
    document.querySelectorAll('.pet-option').forEach(function(o) { o.classList.toggle('selected', o.dataset.type === type); });
}

function searchOwner(query) {
    const autocomplete = document.getElementById('ownerAutocomplete');
    const infoCard = document.getElementById('ownerInfoCard');
    const newForm = document.getElementById('newOwnerForm');
    
    if (query.length < 2) {
        autocomplete.classList.remove('show');
        infoCard.classList.remove('show');
        newForm.style.display = 'none';
        selectedOwner = null;
        isNewOwner = false;
        return;
    }
    
    const matches = clients.filter(function(c) { 
        return c.cedula.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()); 
    });
    
    if (matches.length > 0) {
        autocomplete.innerHTML = matches.map(function(c) {
            return '<div class="autocomplete-item" onclick="selectOwner(' + c.id + ')"><div class="autocomplete-item-name">' + c.name + ' <span class="autocomplete-badge">CI: ' + c.cedula + '</span></div><div class="autocomplete-item-detail">📞 ' + c.phone + '</div></div>';
        }).join('');
        autocomplete.classList.add('show');
        newForm.style.display = 'none';
        isNewOwner = false;
    } else {
        autocomplete.classList.remove('show');
        infoCard.classList.remove('show');
        newForm.style.display = 'block';
        if (/^\d+$/.test(query)) {
            document.getElementById('newOwnerCedula').value = query;
        } else {
            document.getElementById('newOwnerName').value = query;
        }
        isNewOwner = true;
        selectedOwner = null;
    }
}

function selectOwner(clientId) {
    const client = clients.find(function(c) { return c.id === clientId; });
    if (!client) return;
    
    selectedOwner = client;
    isNewOwner = false;
    
    document.getElementById('ownerSearch').value = client.name + ' - CI: ' + client.cedula;
    document.getElementById('ownerSearch').classList.add('autocomplete-found');
    document.getElementById('petOwner').value = client.id;
    document.getElementById('ownerAutocomplete').classList.remove('show');
    document.getElementById('newOwnerForm').style.display = 'none';
    
    document.getElementById('ownerAvatar').textContent = client.name.charAt(0);
    document.getElementById('ownerInfoName').textContent = client.name;
    document.getElementById('ownerInfoCedula').textContent = client.cedula;
    document.getElementById('ownerInfoPhone').textContent = client.phone;
    document.getElementById('ownerInfoCard').classList.add('show');
}

async function savePet(e) {
    e.preventDefault();
    
    if (!selectedPetType) {
        showToast('Seleccione tipo', 'warning');
        return;
    }
    
    const name = document.getElementById('petName').value.trim();
    if (!name) {
        showToast('Ingrese nombre', 'warning');
        return;
    }
    
    var ownerId, ownerCedula;
    
    if (isNewOwner) {
        var newCedula = document.getElementById('newOwnerCedula').value.trim();
        var newName = document.getElementById('newOwnerName').value.trim();
        var newPhone = document.getElementById('newOwnerPhone').value.replace(/\D/g, '');
        
        if (!newCedula || !newName || !newPhone) {
            showToast('Complete datos del dueño', 'warning');
            return;
        }
        
        if (clients.find(function(c) { return c.cedula === newCedula; })) {
            showToast('CI ya existe', 'warning');
            return;
        }
        
        var newClient = {
            id: Date.now(),
            cedula: newCedula,
            name: newName,
            phone: newPhone,
            email: document.getElementById('newOwnerEmail').value.trim(),
            address: '',
            color: generateColor()
        };
        
        try {
            await appendToSheet(SHEETS.CLIENTES, [
                newClient.id, newCedula, newName, newPhone, newClient.email, '', newClient.color, new Date().toISOString()
            ]);
            clients.push(newClient);
            ownerId = newClient.id;
            ownerCedula = newCedula;
        } catch (error) {
            showToast('Error al crear dueño', 'error');
            return;
        }
    } else if (selectedOwner) {
        ownerId = selectedOwner.id;
        ownerCedula = selectedOwner.cedula;
    } else {
        showToast('Seleccione dueño', 'warning');
        return;
    }
    
    var newPet = {
        id: Date.now() + 1,
        name: name,
        type: selectedPetType,
        breed: document.getElementById('petBreed').value.trim(),
        age: document.getElementById('petAge').value.trim(),
        weight: parseFloat(document.getElementById('petWeight').value) || 0,
        owner: ownerId,
        ownerCedula: ownerCedula,
        notes: document.getElementById('petNotes').value.trim()
    };
    
    try {
        showToast('Guardando...', 'warning');
        
        await appendToSheet(SHEETS.MASCOTAS, [
            newPet.id, newPet.name, selectedPetType, newPet.breed, newPet.age, newPet.weight, ownerId, ownerCedula, newPet.notes, new Date().toISOString()
        ]);
        
        pets.push(newPet);
        closeModal('newPet');
        resetPetForm();
        renderAll();
        showToast('Mascota guardada', 'success');
        
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 16: FORMULARIO CITAS                             ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function resetAppointmentForm() {
    selectedAppointmentClient = null;
    selectedAppointmentPet = null;
    
    document.getElementById('formNewAppointment').reset();
    document.getElementById('appointmentClientCard').classList.remove('show');
    document.getElementById('appointmentPetSelection').style.display = 'none';
    document.getElementById('appointmentDetails').style.display = 'none';
    document.getElementById('appointmentClientAutocomplete').classList.remove('show');
    document.getElementById('appointmentDate').value = getTodayDate();
}

function searchClientForAppointment(query) {
    var autocomplete = document.getElementById('appointmentClientAutocomplete');
    
    if (query.length < 2) {
        autocomplete.classList.remove('show');
        return;
    }
    
    var matches = clients.filter(function(c) { 
        return c.cedula.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()); 
    });
    
    if (matches.length > 0) {
        autocomplete.innerHTML = matches.map(function(c) {
            var cPets = pets.filter(function(p) { return p.owner === c.id; });
            return '<div class="autocomplete-item" onclick="selectClientForAppointment(' + c.id + ')"><div class="autocomplete-item-name">' + c.name + ' <span class="autocomplete-badge">CI: ' + c.cedula + '</span></div><div class="autocomplete-item-detail">🐾 ' + cPets.length + ' mascota(s)</div></div>';
        }).join('');
        autocomplete.classList.add('show');
    } else {
        autocomplete.classList.remove('show');
    }
}

function selectClientForAppointment(clientId) {
    var client = clients.find(function(c) { return c.id === clientId; });
    if (!client) return;
    
    selectedAppointmentClient = client;
    var clientPets = pets.filter(function(p) { return p.owner === client.id; });
    
    document.getElementById('appointmentClientSearch').value = client.name + ' - CI: ' + client.cedula;
    document.getElementById('appointmentClientSearch').classList.add('autocomplete-found');
    document.getElementById('appointmentClientId').value = client.id;
    document.getElementById('appointmentClientAutocomplete').classList.remove('show');
    
    document.getElementById('appointmentClientAvatar').textContent = client.name.charAt(0);
    document.getElementById('appointmentClientName').textContent = client.name;
    document.getElementById('appointmentClientCedula').textContent = client.cedula;
    document.getElementById('appointmentClientPhone').textContent = client.phone;
    document.getElementById('appointmentClientCard').classList.add('show');
    
    if (clientPets.length > 0) {
        document.getElementById('appointmentPetGrid').innerHTML = clientPets.map(function(p) {
            return '<div class="pet-selection-card" data-pet-id="' + p.id + '" onclick="selectPetForAppointment(' + p.id + ')"><div class="pet-selection-icon">' + getPetIcon(p.type) + '</div><div class="pet-selection-name">' + p.name + '</div></div>';
        }).join('');
        document.getElementById('appointmentPetSelection').style.display = 'block';
    } else {
        showToast('Sin mascotas', 'warning');
    }
}

function selectPetForAppointment(petId) {
    selectedAppointmentPet = pets.find(function(p) { return p.id === petId; });
    document.getElementById('appointmentPetId').value = petId;
    document.querySelectorAll('#appointmentPetGrid .pet-selection-card').forEach(function(c) {
        c.classList.toggle('selected', parseInt(c.dataset.petId) === petId);
    });
    document.getElementById('appointmentDetails').style.display = 'block';
    document.getElementById('appointmentDate').value = getTodayDate();
}

async function saveAppointment(e) {
    e.preventDefault();
    
    if (!selectedAppointmentClient || !selectedAppointmentPet) {
        showToast('Seleccione cliente y mascota', 'warning');
        return;
    }
    
    var date = document.getElementById('appointmentDate').value;
    var time = document.getElementById('appointmentTime').value;
    var type = document.getElementById('appointmentType').value;
    var notes = document.getElementById('appointmentNotes').value.trim();
    
    if (!date || !time) {
        showToast('Complete fecha y hora', 'warning');
        return;
    }
    
    var newAppt = {
        id: Date.now(),
        petId: selectedAppointmentPet.id,
        clientId: selectedAppointmentClient.id,
        date: date,
        time: time,
        type: type,
        notes: notes,
        completed: false
    };
    
    try {
        showToast('Guardando...', 'warning');
        
        await appendToSheet(SHEETS.CITAS, [
            newAppt.id, newAppt.petId, newAppt.clientId, date, time, type, notes, 'PENDIENTE', 'TRUE', new Date().toISOString()
        ]);
        
        appointments.push(newAppt);
        
        // Mensaje con códigos Unicode para evitar problemas de codificación
        var message = '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n' +
            '\uD83D\uDC3E CITA AGENDADA - VetCare\n' +
            '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n\n' +
            'Hola ' + selectedAppointmentClient.name + ' \uD83D\uDC4B\n\n' +
            'Tu cita ha sido confirmada con exito \u2705\n\n' +
            '\uD83D\uDCC5 Fecha: ' + formatDateLong(date) + '\n' +
            '\uD83D\uDD50 Hora: ' + time + '\n' +
            '\uD83D\uDC36 Paciente: ' + selectedAppointmentPet.name + '\n' +
            '\uD83E\uDE7A Servicio: ' + getTypeName(type) + '\n\n' +
            '\uD83D\uDCCD Te esperamos en nuestra clinica.\n\n' +
            '\uD83D\uDCA1 Recuerda:\n' +
            '\u2022 Llegar 10 min antes\n' +
            '\u2022 Traer carnet de vacunas\n' +
            '\u2022 Si no puedes asistir, avisanos\n\n' +
            'Gracias por confiar en nosotros \uD83D\uDC9A\n\n' +
            '\uD83C\uDFE5 VetCare - Cuidamos a tu mejor amigo';

        sendWhatsApp(selectedAppointmentClient.phone, message);
        
        closeModal('newAppointment');
        renderAll();
        showToast('Cita agendada', 'success');
        
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 17: FORMULARIO HISTORIAL                         ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function resetHistoryForm() {
    selectedHistoryClient = null;
    selectedHistoryPet = null;
    selectedFiles = [];
    
    document.getElementById('formNewHistory').reset();
    document.getElementById('historyClientCard').classList.remove('show');
    document.getElementById('historyPetSelection').style.display = 'none';
    document.getElementById('historyDetails').style.display = 'none';
    document.getElementById('historyClientAutocomplete').classList.remove('show');
    document.getElementById('fileList').innerHTML = '';
}

function searchClientForHistory(query) {
    var autocomplete = document.getElementById('historyClientAutocomplete');
    
    if (query.length < 2) {
        autocomplete.classList.remove('show');
        return;
    }
    
    var matches = clients.filter(function(c) { 
        return c.cedula.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()); 
    });
    
    if (matches.length > 0) {
        autocomplete.innerHTML = matches.map(function(c) {
            var cPets = pets.filter(function(p) { return p.owner === c.id; });
            return '<div class="autocomplete-item" onclick="selectClientForHistory(' + c.id + ')"><div class="autocomplete-item-name">' + c.name + ' <span class="autocomplete-badge">CI: ' + c.cedula + '</span></div><div class="autocomplete-item-detail">🐾 ' + cPets.length + ' mascota(s)</div></div>';
        }).join('');
        autocomplete.classList.add('show');
    } else {
        autocomplete.classList.remove('show');
    }
}

function selectClientForHistory(clientId) {
    var client = clients.find(function(c) { return c.id === clientId; });
    if (!client) return;
    
    selectedHistoryClient = client;
    var clientPets = pets.filter(function(p) { return p.owner === client.id; });
    
    document.getElementById('historyClientSearch').value = client.name + ' - CI: ' + client.cedula;
    document.getElementById('historyClientSearch').classList.add('autocomplete-found');
    document.getElementById('historyClientId').value = client.id;
    document.getElementById('historyClientAutocomplete').classList.remove('show');
    
    document.getElementById('historyClientAvatar').textContent = client.name.charAt(0);
    document.getElementById('historyClientName').textContent = client.name;
    document.getElementById('historyClientCard').classList.add('show');
    
    if (clientPets.length > 0) {
        document.getElementById('historyPetGrid').innerHTML = clientPets.map(function(p) {
            return '<div class="pet-selection-card" data-pet-id="' + p.id + '" onclick="selectPetForHistory(' + p.id + ')"><div class="pet-selection-icon">' + getPetIcon(p.type) + '</div><div class="pet-selection-name">' + p.name + '</div></div>';
        }).join('');
        document.getElementById('historyPetSelection').style.display = 'block';
    } else {
        showToast('Sin mascotas', 'warning');
    }
}

function selectPetForHistory(petId) {
    selectedHistoryPet = pets.find(function(p) { return p.id === petId; });
    document.getElementById('historyPetId').value = petId;
    document.querySelectorAll('#historyPetGrid .pet-selection-card').forEach(function(c) {
        c.classList.toggle('selected', parseInt(c.dataset.petId) === petId);
    });
    document.getElementById('historyDetails').style.display = 'block';
}

function handleFileSelect(event) {
    Array.from(event.target.files).forEach(function(file) {
        if (file.size <= 10 * 1024 * 1024) {
            selectedFiles.push(file);
        }
    });
    renderFileList();
}

function renderFileList() {
    document.getElementById('fileList').innerHTML = selectedFiles.map(function(file, i) {
        return '<div class="file-item"><div class="file-item-info"><span>' + (file.type.startsWith('image/') ? '🖼️' : '📄') + '</span><div><div class="file-item-name">' + file.name + '</div><div class="file-item-size">' + (file.size / 1024).toFixed(0) + ' KB</div></div></div><button type="button" class="file-remove-btn" onclick="removeFile(' + i + ')">✕</button></div>';
    }).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

async function saveHistory(e) {
    e.preventDefault();
    
    if (!selectedHistoryClient || !selectedHistoryPet) {
        showToast('Seleccione cliente y mascota', 'warning');
        return;
    }
    
    var diagnosis = document.getElementById('historyDiagnosis').value.trim();
    if (!diagnosis) {
        showToast('Ingrese diagnostico', 'warning');
        return;
    }
    
    try {
        showToast('Guardando...', 'warning');
        
        // Subir archivos si hay (opcional)
        var uploadedFiles = [];
        if (selectedFiles.length > 0) {
            for (var i = 0; i < selectedFiles.length; i++) {
                try {
                    showToast('Subiendo ' + selectedFiles[i].name + '...', 'warning');
                    var uploaded = await uploadFileToDrive(selectedFiles[i]);
                    uploadedFiles.push(uploaded);
                } catch (uploadError) {
                    console.error('Error subiendo archivo:', uploadError);
                    showToast('Error subiendo ' + selectedFiles[i].name, 'error');
                    // Continuar sin el archivo
                }
            }
        }
        
        var newHistory = {
            id: Date.now(),
            petId: selectedHistoryPet.id,
            clientId: selectedHistoryClient.id,
            date: getTodayDate(),
            type: document.getElementById('historyType').value,
            diagnosis: diagnosis,
            treatment: document.getElementById('historyTreatment').value.trim(),
            meds: document.getElementById('historyMeds').value.trim(),
            attachments: uploadedFiles
        };
        
        // Guardar en hoja Historial
        await appendToSheet(SHEETS.HISTORIAL, [
            newHistory.id, 
            newHistory.petId, 
            newHistory.clientId, 
            newHistory.date, 
            newHistory.type, 
            diagnosis, 
            newHistory.treatment, 
            newHistory.meds, 
            '', 
            new Date().toISOString()
        ]);
        
        // Guardar archivos en hoja Archivos (si hay)
        if (uploadedFiles.length > 0) {
            for (var j = 0; j < uploadedFiles.length; j++) {
                var file = uploadedFiles[j];
                try {
                    await appendToSheet(SHEETS.ARCHIVOS, [
                        Date.now() + j, 
                        newHistory.id, 
                        newHistory.petId, 
                        newHistory.clientId, 
                        file.name, 
                        file.type, 
                        Math.round(file.size / 1024), 
                        file.url, 
                        new Date().toISOString()
                    ]);
                } catch (archiveError) {
                    console.error('Error guardando archivo en hoja:', archiveError);
                    // La hoja Archivos puede no existir, no es crítico
                }
            }
        }
        
        history.push(newHistory);
        closeModal('newHistory');
        resetHistoryForm();
        renderAll();
        showToast('Consulta guardada', 'success');
        
    } catch (error) {
        console.error('Error guardando historial:', error);
        showToast('Error: ' + (error.message || 'al guardar'), 'error');
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 18: VER HISTORIAL                                ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function viewPetHistory(petId) {
    var pet = pets.find(function(p) { return p.id === petId; });
    if (!pet) return;
    
    var owner = clients.find(function(c) { return c.id === pet.owner; });
    var petHist = history.filter(function(h) { return h.petId === petId; }).sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    
    document.getElementById('viewHistoryContent').innerHTML = '<div id="printableHistory"><div style="text-align: center; margin-bottom: 1.5rem; border-bottom: 3px solid var(--primary); padding-bottom: 1rem;"><h1 style="font-family: Fredoka One, cursive; color: var(--primary);">🐾 VetCare</h1></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;"><div style="background: var(--cream); padding: 1rem; border-radius: 12px;"><h3 style="color: var(--primary);">' + getPetIcon(pet.type) + ' Mascota</h3><p><b>Nombre:</b> ' + pet.name + '</p><p><b>Tipo:</b> ' + getPetTypeName(pet.type) + '</p><p><b>Raza:</b> ' + (pet.breed || '-') + '</p><p><b>Edad:</b> ' + (pet.age || '-') + '</p></div><div style="background: var(--mint); padding: 1rem; border-radius: 12px;"><h3 style="color: var(--primary);">👤 Propietario</h3><p><b>Nombre:</b> ' + (owner?.name || '-') + '</p><p><b>CI:</b> ' + (owner?.cedula || '-') + '</p><p><b>Tel:</b> ' + (owner?.phone || '-') + '</p></div></div><h3 style="color: var(--primary);">📋 Historial</h3>' + (petHist.length === 0 ? '<p style="text-align: center; color: var(--text-light);">Sin registros</p>' : petHist.map(function(h) { return '<div style="background: var(--cream); padding: 1rem; border-radius: 12px; margin: 0.5rem 0; border-left: 4px solid var(--primary);"><div style="display: flex; justify-content: space-between;"><b>' + getTypeIcon(h.type) + ' ' + getTypeName(h.type) + '</b><span style="color: var(--text-light);">' + formatDate(h.date) + '</span></div><p><b>Diagnóstico:</b> ' + h.diagnosis + '</p>' + (h.treatment ? '<p><b>Tratamiento:</b> ' + h.treatment + '</p>' : '') + (h.meds ? '<p><b>Medicamentos:</b> ' + h.meds + '</p>' : '') + (h.attachments?.length ? '<div>' + h.attachments.map(function(a) { return '<a href="' + a.url + '" target="_blank" class="attachment-badge">📎 ' + a.name + '</a>'; }).join(' ') + '</div>' : '') + '</div>'; }).join('')) + '</div>';
    
    openModal('viewHistory');
}

function printHistory() {
    var content = document.getElementById('printableHistory');
    if (!content) return;
    
    var win = window.open('', '_blank');
    win.document.write('<!DOCTYPE html><html><head><title>Historial</title><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Fredoka+One&display=swap" rel="stylesheet"><style>body{font-family:Nunito,sans-serif;color:#4A5568;padding:2cm;}h1,h3{font-family:Fredoka One,cursive;}.attachment-badge{background:#E6E0F0;padding:2px 8px;border-radius:4px;font-size:12px;text-decoration:none;}</style></head><body>' + content.innerHTML + '</body></html>');
    win.document.close();
    win.onload = function() { win.print(); };
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 19: ACCIONES                                     ║
// ╚════════════════════════════════════════════════════════════════════════════╝

async function completeAppointment(id, rowIndex) {
    if (!confirm('¿Marcar como completada?')) return;
    
    var appt = appointments.find(function(a) { return a.id === id; });
    if (!appt) return;
    
    try {
        showToast('Actualizando...', 'warning');
        await updateSheetRow(SHEETS.CITAS, rowIndex, [
            appt.id, appt.petId, appt.clientId, appt.date, appt.time, appt.type, appt.notes, 'COMPLETADA', 'TRUE', new Date().toISOString()
        ]);
        appt.completed = true;
        renderAll();
        showToast('Completada', 'success');
    } catch (error) {
        showToast('Error', 'error');
    }
}

async function deleteClient(id, rowIndex) {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
        showToast('Eliminando...', 'warning');
        await deleteSheetRow(SHEETS.CLIENTES, rowIndex);
        clients = clients.filter(function(c) { return c.id !== id; });
        renderAll();
        showToast('Eliminado', 'success');
    } catch (error) {
        showToast('Error', 'error');
    }
}

async function deletePet(id, rowIndex) {
    if (!confirm('¿Eliminar mascota?')) return;
    try {
        showToast('Eliminando...', 'warning');
        await deleteSheetRow(SHEETS.MASCOTAS, rowIndex);
        pets = pets.filter(function(p) { return p.id !== id; });
        renderAll();
        showToast('Eliminado', 'success');
    } catch (error) {
        showToast('Error', 'error');
    }
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 20: FILTROS                                      ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function filterClients() {
    var q = (document.getElementById('clientSearch').value || '').toLowerCase();
    renderAllClients(clients.filter(function(c) { return c.name.toLowerCase().includes(q) || c.cedula.includes(q) || c.phone.includes(q); }));
}

function filterPets() {
    var q = (document.getElementById('petSearch').value || '').toLowerCase();
    renderAllPets(pets.filter(function(p) {
        var owner = clients.find(function(c) { return c.id === p.owner; });
        return p.name.toLowerCase().includes(q) || (owner && owner.name.toLowerCase().includes(q));
    }));
}

function filterHistory() {
    var q = (document.getElementById('historySearch').value || '').toLowerCase();
    renderHistory(history.filter(function(h) {
        var pet = pets.find(function(p) { return p.id === h.petId; });
        return (h.diagnosis || '').toLowerCase().includes(q) || (pet && pet.name.toLowerCase().includes(q));
    }));
}

function globalSearchFn() {
    var q = (document.getElementById('globalSearch').value || '').toLowerCase();
    var results = document.getElementById('searchResults');
    
    if (!q) { results.innerHTML = ''; return; }
    
    var html = '';
    var mc = clients.filter(function(c) { return c.name.toLowerCase().includes(q) || c.cedula.includes(q); });
    var mp = pets.filter(function(p) { return p.name.toLowerCase().includes(q); });
    
    if (mc.length) {
        html += '<h4 style="margin: 1rem 0 0.5rem; color: var(--primary);">👥 Clientes</h4>';
        html += mc.map(function(c) { return '<div class="appointment-card">' + c.name + ' <span class="ci-badge">CI: ' + c.cedula + '</span></div>'; }).join('');
    }
    if (mp.length) {
        html += '<h4 style="margin: 1rem 0 0.5rem; color: var(--primary);">🐾 Mascotas</h4>';
        html += mp.map(function(p) { return '<div class="appointment-card">' + getPetIcon(p.type) + ' ' + p.name + '</div>'; }).join('');
    }
    
    results.innerHTML = html || '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Sin resultados</p>';
}


// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    SECCIÓN 21: RENDER ALL                                   ║
// ╚════════════════════════════════════════════════════════════════════════════╝

function renderAll() {
    updateStats();
    renderRecentClients();
    renderAllClients();
    renderAllPets();
    renderTodayAppointments();
    renderUpcomingAppointments();
    renderCompletedAppointments();
    renderHistory();
}
