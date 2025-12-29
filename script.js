/* ══════════════════════════════════════════════════════════════════════
   VetCare - Sistema de Gestión Veterinaria
   Conectado a Google Sheets
   ══════════════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════════════════════
// VARIABLES GLOBALES
// ══════════════════════════════════════════════════════════════════════
let clients = [];
let pets = [];
let appointments = [];
let history = [];

let selectedOwner = null;
let isNewOwner = false;
let selectedFiles = [];
let selectedAppointmentClient = null;
let selectedAppointmentPet = null;
let selectedHistoryClient = null;
let selectedHistoryPet = null;
let selectedPetType = null;

let tokenClient;
let gapiInited = false;
let gisInited = false;

// ══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN GOOGLE API
// ══════════════════════════════════════════════════════════════════════
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

// ══════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN GOOGLE API
// ══════════════════════════════════════════════════════════════════════
function gapiLoaded() {
    console.log('GAPI cargado');
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        console.log('Inicializando GAPI client...');
        console.log('API_KEY:', CONFIG.API_KEY ? 'Configurada' : 'NO CONFIGURADA');
        
        await gapi.client.init({
            apiKey: CONFIG.API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        
        console.log('GAPI inicializado correctamente');
        gapiInited = true;
        maybeEnableButtons();
        
    } catch (error) {
        console.error('Error inicializando GAPI:', error);
        
        let errorMsg = 'Error al conectar con Google API';
        if (error.error) {
            errorMsg += ': ' + (error.error.message || error.error);
        }
        
        showLoginError(errorMsg);
    }
}

function gisLoaded() {
    console.log('GIS cargado');
    console.log('CLIENT_ID:', CONFIG.CLIENT_ID ? 'Configurado' : 'NO CONFIGURADO');
    
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.CLIENT_ID,
            scope: SCOPES,
            callback: '',
        });
        
        console.log('Token client creado');
        gisInited = true;
        maybeEnableButtons();
        
    } catch (error) {
        console.error('Error inicializando GIS:', error);
        showLoginError('Error al inicializar autenticación Google');
    }
}

function maybeEnableButtons() {
    console.log('Estado - GAPI:', gapiInited, 'GIS:', gisInited);
    
    if (gapiInited && gisInited) {
        const btn = document.getElementById('btnLogin');
        if (btn) btn.disabled = false;
        
        // Ocultar error si existe
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.style.display = 'none';
        
        // Verificar token guardado
        const savedToken = localStorage.getItem('vetcare_google_token');
        if (savedToken) {
            try {
                const tokenData = JSON.parse(savedToken);
                if (tokenData.expires_at && tokenData.expires_at > Date.now()) {
                    console.log('Token válido encontrado, iniciando sesión automática...');
                    gapi.client.setToken(tokenData);
                    onSignInSuccess();
                } else {
                    console.log('Token expirado, eliminando...');
                    localStorage.removeItem('vetcare_google_token');
                }
            } catch (e) {
                console.log('Error parseando token guardado');
                localStorage.removeItem('vetcare_google_token');
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ══════════════════════════════════════════════════════════════════════
function handleAuthClick() {
    console.log('Iniciando autenticación...');
    
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Error de autenticación:', resp);
            showLoginError('Error al iniciar sesión: ' + (resp.error_description || resp.error));
            return;
        }
        
        console.log('Autenticación exitosa');
        
        // Guardar token
        const token = gapi.client.getToken();
        token.expires_at = Date.now() + (token.expires_in * 1000);
        localStorage.setItem('vetcare_google_token', JSON.stringify(token));
        
        onSignInSuccess();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
    localStorage.removeItem('vetcare_google_token');
    
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    
    clients = [];
    pets = [];
    appointments = [];
    history = [];
}

async function onSignInSuccess() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'flex';
    
    try {
        // Info del usuario
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${gapi.client.getToken().access_token}` }
        }).then(r => r.json());
        
        document.getElementById('userPhoto').src = userInfo.picture || '';
        document.getElementById('userName').textContent = userInfo.name || userInfo.email;
        
        // Cargar datos
        await loadAllDataFromSheets();
        
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        initNavigation();
        createFloatingPaws();
        renderAll();
        
        showToast('✅ Sesión iniciada');
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        showLoginError('Error al cargar datos: ' + (error.message || error));
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    console.error('Login Error:', message);
}

// ══════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS - LECTURA
// ══════════════════════════════════════════════════════════════════════
async function readSheet(sheetName) {
    try {
        console.log('Leyendo hoja:', sheetName);
        
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.GOOGLE_SHEET_ID,
            range: `${sheetName}!A:Z`,
        });
        
        const values = response.result.values;
        if (!values || values.length < 2) {
            console.log(`Hoja ${sheetName} vacía o solo encabezados`);
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
        
        console.log(`Hoja ${sheetName}: ${data.length} registros`);
        return data;
        
    } catch (error) {
        console.error(`Error leyendo ${sheetName}:`, error);
        // Si la hoja no existe, devolver array vacío en lugar de fallar
        if (error.result?.error?.status === 'NOT_FOUND' || 
            error.result?.error?.message?.includes('Unable to parse range')) {
            console.log(`Hoja ${sheetName} no encontrada, retornando vacío`);
            return [];
        }
        throw error;
    }
}

// ══════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS - ESCRITURA
// ══════════════════════════════════════════════════════════════════════
async function appendToSheet(sheetName, values) {
    try {
        console.log('Escribiendo en:', sheetName);
        
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.GOOGLE_SHEET_ID,
            range: `${sheetName}!A:Z`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [values] }
        });
        
        console.log('Escrito exitosamente');
        
    } catch (error) {
        console.error(`Error escribiendo en ${sheetName}:`, error);
        throw error;
    }
}

async function updateSheetRow(sheetName, rowIndex, values) {
    try {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.GOOGLE_SHEET_ID,
            range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [values] }
        });
    } catch (error) {
        console.error(`Error actualizando ${sheetName}:`, error);
        throw error;
    }
}

async function deleteSheetRow(sheetName, rowIndex) {
    try {
        const sheetsResponse = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: CONFIG.GOOGLE_SHEET_ID
        });
        
        const sheet = sheetsResponse.result.sheets.find(s => s.properties.title === sheetName);
        if (!sheet) throw new Error('Hoja no encontrada');
        
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: CONFIG.GOOGLE_SHEET_ID,
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
        console.error(`Error eliminando fila en ${sheetName}:`, error);
        throw error;
    }
}

// ══════════════════════════════════════════════════════════════════════
// CARGAR DATOS
// ══════════════════════════════════════════════════════════════════════
async function loadAllDataFromSheets() {
    console.log('Cargando datos desde Google Sheets...');
    
    // Clientes
    const clientsData = await readSheet(CONFIG.SHEETS.CLIENTES);
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
    const petsData = await readSheet(CONFIG.SHEETS.MASCOTAS);
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
    const appointmentsData = await readSheet(CONFIG.SHEETS.CITAS);
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
    const historyData = await readSheet(CONFIG.SHEETS.HISTORIAL);
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
    
    // Archivos
    try {
        const attachmentsData = await readSheet(CONFIG.SHEETS.ARCHIVOS);
        attachmentsData.forEach(a => {
            const historyItem = history.find(h => h.id === parseInt(a.historialid));
            if (historyItem) {
                if (!historyItem.attachments) historyItem.attachments = [];
                historyItem.attachments.push({
                    name: a.nombrearchivo || '',
                    type: a.tipoarchivo || '',
                    url: a.urldrive || ''
                });
            }
        });
    } catch (e) {
        console.log('Hoja Archivos no disponible');
    }
    
    console.log('Datos cargados:', {
        clientes: clients.length,
        mascotas: pets.length,
        citas: appointments.length,
        historial: history.length
    });
}

// ══════════════════════════════════════════════════════════════════════
// GOOGLE DRIVE - SUBIR ARCHIVOS
// ══════════════════════════════════════════════════════════════════════
async function uploadFileToDrive(file) {
    const metadata = {
        name: `${Date.now()}_${file.name}`,
        mimeType: file.type
    };
    
    if (CONFIG.DRIVE_FOLDER_ID) {
        metadata.parents = [CONFIG.DRIVE_FOLDER_ID];
    }
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${gapi.client.getToken().access_token}` },
        body: form
    });
    
    const data = await response.json();
    
    // Hacer público
    await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    
    return {
        id: data.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`
    };
}

// ══════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ══════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ══════════════════════════════════════════════════════════════════════
function updateStats() {
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('totalPets').textContent = pets.length;
    
    const today = getTodayDate();
    document.getElementById('todayAppointments').textContent = appointments.filter(a => a.date === today && !a.completed).length;
    
    const thisMonth = today.slice(0, 7);
    document.getElementById('monthlyVisits').textContent = history.filter(h => h.date && h.date.startsWith(thisMonth)).length;
}

// ══════════════════════════════════════════════════════════════════════
// RENDERIZADO
// ══════════════════════════════════════════════════════════════════════
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
            <td>${clientPets.map(p => `<span class="pet-badge ${p.type}">${getPetIcon(p.type)} ${p.name}</span>`).join('') || '-'}</td>
            <td>
                <button class="action-btn" onclick="sendWhatsApp('${client.phone}', 'Hola ${client.name}!')">📲</button>
                <button class="action-btn" onclick="deleteClient(${client.id}, ${client._rowIndex})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderAllClients(filtered = null) {
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
            <td>${clientPets.map(p => `<span class="pet-badge ${p.type}">${getPetIcon(p.type)} ${p.name}</span>`).join('') || '-'}</td>
            <td>
                <button class="action-btn" onclick="sendWhatsApp('${client.phone}', 'Hola ${client.name}!')">📲</button>
                <button class="action-btn" onclick="deleteClient(${client.id}, ${client._rowIndex})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderAllPets(filtered = null) {
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
        const [h, m] = (appt.time || '00:00').split(':');
        const hour = parseInt(h) || 0;
        return `<div class="appointment-card" onclick="completeAppointment(${appt.id}, ${appt._rowIndex})">
            <div class="appointment-time">
                <div class="time">${hour > 12 ? hour - 12 : hour}:${m}</div>
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
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><p>No hay citas próximas</p></div>';
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

function renderHistory(filtered = null) {
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
                ${attachments.length > 0 ? `<div class="history-attachments">${attachments.map(a => `<a href="${a.url}" target="_blank" class="attachment-badge">📎 ${a.name}</a>`).join('')}</div>` : ''}
            </div>
            <button class="action-btn" onclick="viewPetHistory(${item.petId})">📋</button>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════════════════════════════════
// WHATSAPP
// ══════════════════════════════════════════════════════════════════════
function sendWhatsApp(phone, message) {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
        showToast('⚠️ Sin teléfono');
        return;
    }
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
}

function sendAppointmentReminder(appointmentId) {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) return;
    
    const pet = pets.find(p => p.id === appt.petId);
    const client = clients.find(c => c.id === appt.clientId);
    if (!client) return;

    const message = `🐾 *RECORDATORIO - VetCare*

Hola ${client.name}! 👋

📅 *Fecha:* ${formatDateLong(appt.date)}
🕐 *Hora:* ${appt.time}
🐕 *Mascota:* ${pet?.name || ''}
💉 *Tipo:* ${getTypeName(appt.type)}

¡Lo esperamos! 🏥`;

    sendWhatsApp(client.phone, message);
}

// ══════════════════════════════════════════════════════════════════════
// MODALES
// ══════════════════════════════════════════════════════════════════════
function openModal(type) {
    const modalId = `modal${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        if (type === 'newPet') resetPetForm();
        if (type === 'newAppointment') resetAppointmentForm();
        if (type === 'newHistory') resetHistoryForm();
    }
}

function closeModal(type) {
    const modalId = `modal${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
    if (!e.target.closest('.autocomplete-wrapper')) {
        document.querySelectorAll('.autocomplete-list').forEach(el => el.classList.remove('show'));
    }
});

// ══════════════════════════════════════════════════════════════════════
// GUARDAR CLIENTE
// ══════════════════════════════════════════════════════════════════════
async function saveClient(e) {
    e.preventDefault();
    
    const cedula = document.getElementById('clientCedula').value.trim();
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.replace(/\D/g, '');
    const email = document.getElementById('clientEmail').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    
    if (!cedula || !name || !phone) {
        showToast('⚠️ Complete campos obligatorios');
        return;
    }
    
    if (clients.find(c => c.cedula === cedula)) {
        showToast('⚠️ CI ya existe');
        return;
    }
    
    const newClient = {
        id: Date.now(),
        cedula, name, phone, email, address,
        color: generateColor()
    };
    
    try {
        showToast('💾 Guardando...');
        
        await appendToSheet(CONFIG.SHEETS.CLIENTES, [
            newClient.id, cedula, name, phone, email, address, newClient.color, new Date().toISOString()
        ]);
        
        clients.push(newClient);
        closeModal('newClient');
        document.getElementById('formNewClient').reset();
        renderAll();
        showToast('✅ Cliente guardado');
        
    } catch (error) {
        console.error(error);
        showToast('❌ Error: ' + (error.message || 'al guardar'));
    }
}

// ══════════════════════════════════════════════════════════════════════
// FORMULARIO MASCOTA
// ══════════════════════════════════════════════════════════════════════
function resetPetForm() {
    selectedOwner = null;
    isNewOwner = false;
    selectedPetType = null;
    
    document.getElementById('formNewPet').reset();
    document.querySelectorAll('.pet-option').forEach(o => o.classList.remove('selected'));
    document.getElementById('ownerInfoCard').classList.remove('show');
    document.getElementById('newOwnerForm').style.display = 'none';
    document.getElementById('ownerAutocomplete').classList.remove('show');
}

function selectPetType(type) {
    selectedPetType = type;
    document.getElementById('petType').value = type;
    document.querySelectorAll('.pet-option').forEach(o => o.classList.toggle('selected', o.dataset.type === type));
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
    
    const matches = clients.filter(c => c.cedula.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()));
    
    if (matches.length > 0) {
        autocomplete.innerHTML = matches.map(c => `
            <div class="autocomplete-item" onclick="selectOwner(${c.id})">
                <div class="autocomplete-item-name">${c.name} <span class="autocomplete-badge">CI: ${c.cedula}</span></div>
                <div class="autocomplete-item-detail">📞 ${c.phone}</div>
            </div>
        `).join('');
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
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    selectedOwner = client;
    isNewOwner = false;
    
    document.getElementById('ownerSearch').value = `${client.name} - CI: ${client.cedula}`;
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
        showToast('⚠️ Seleccione tipo');
        return;
    }
    
    const name = document.getElementById('petName').value.trim();
    if (!name) {
        showToast('⚠️ Ingrese nombre');
        return;
    }
    
    let ownerId, ownerCedula;
    
    if (isNewOwner) {
        const newCedula = document.getElementById('newOwnerCedula').value.trim();
        const newName = document.getElementById('newOwnerName').value.trim();
        const newPhone = document.getElementById('newOwnerPhone').value.replace(/\D/g, '');
        
        if (!newCedula || !newName || !newPhone) {
            showToast('⚠️ Complete datos del dueño');
            return;
        }
        
        if (clients.find(c => c.cedula === newCedula)) {
            showToast('⚠️ CI ya existe');
            return;
        }
        
        const newClient = {
            id: Date.now(),
            cedula: newCedula,
            name: newName,
            phone: newPhone,
            email: document.getElementById('newOwnerEmail').value.trim(),
            address: '',
            color: generateColor()
        };
        
        try {
            await appendToSheet(CONFIG.SHEETS.CLIENTES, [
                newClient.id, newCedula, newName, newPhone, newClient.email, '', newClient.color, new Date().toISOString()
            ]);
            clients.push(newClient);
            ownerId = newClient.id;
            ownerCedula = newCedula;
        } catch (error) {
            showToast('❌ Error al crear dueño');
            return;
        }
    } else if (selectedOwner) {
        ownerId = selectedOwner.id;
        ownerCedula = selectedOwner.cedula;
    } else {
        showToast('⚠️ Seleccione dueño');
        return;
    }
    
    const newPet = {
        id: Date.now() + 1,
        name,
        type: selectedPetType,
        breed: document.getElementById('petBreed').value.trim(),
        age: document.getElementById('petAge').value.trim(),
        weight: parseFloat(document.getElementById('petWeight').value) || 0,
        owner: ownerId,
        ownerCedula,
        notes: document.getElementById('petNotes').value.trim()
    };
    
    try {
        showToast('💾 Guardando...');
        
        await appendToSheet(CONFIG.SHEETS.MASCOTAS, [
            newPet.id, newPet.name, selectedPetType, newPet.breed, newPet.age, newPet.weight, ownerId, ownerCedula, newPet.notes, new Date().toISOString()
        ]);
        
        pets.push(newPet);
        closeModal('newPet');
        resetPetForm();
        renderAll();
        showToast('✅ Mascota guardada');
        
    } catch (error) {
        console.error(error);
        showToast('❌ Error al guardar');
    }
}

// ══════════════════════════════════════════════════════════════════════
// FORMULARIO CITAS
// ══════════════════════════════════════════════════════════════════════
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
    const autocomplete = document.getElementById('appointmentClientAutocomplete');
    
    if (query.length < 2) {
        autocomplete.classList.remove('show');
        return;
    }
    
    const matches = clients.filter(c => c.cedula.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()));
    
    if (matches.length > 0) {
        autocomplete.innerHTML = matches.map(c => {
            const cPets = pets.filter(p => p.owner === c.id);
            return `<div class="autocomplete-item" onclick="selectClientForAppointment(${c.id})">
                <div class="autocomplete-item-name">${c.name} <span class="autocomplete-badge">CI: ${c.cedula}</span></div>
                <div class="autocomplete-item-detail">🐾 ${cPets.length} mascota(s)</div>
            </div>`;
        }).join('');
        autocomplete.classList.add('show');
    } else {
        autocomplete.classList.remove('show');
    }
}

function selectClientForAppointment(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    selectedAppointmentClient = client;
    const clientPets = pets.filter(p => p.owner === client.id);
    
    document.getElementById('appointmentClientSearch').value = `${client.name} - CI: ${client.cedula}`;
    document.getElementById('appointmentClientSearch').classList.add('autocomplete-found');
    document.getElementById('appointmentClientId').value = client.id;
    document.getElementById('appointmentClientAutocomplete').classList.remove('show');
    
    document.getElementById('appointmentClientAvatar').textContent = client.name.charAt(0);
    document.getElementById('appointmentClientName').textContent = client.name;
    document.getElementById('appointmentClientCedula').textContent = client.cedula;
    document.getElementById('appointmentClientPhone').textContent = client.phone;
    document.getElementById('appointmentClientCard').classList.add('show');
    
    if (clientPets.length > 0) {
        document.getElementById('appointmentPetGrid').innerHTML = clientPets.map(p => `
            <div class="pet-selection-card" data-pet-id="${p.id}" onclick="selectPetForAppointment(${p.id})">
                <div class="pet-selection-icon">${getPetIcon(p.type)}</div>
                <div class="pet-selection-name">${p.name}</div>
            </div>
        `).join('');
        document.getElementById('appointmentPetSelection').style.display = 'block';
    } else {
        showToast('⚠️ Sin mascotas');
    }
}

function selectPetForAppointment(petId) {
    selectedAppointmentPet = pets.find(p => p.id === petId);
    document.getElementById('appointmentPetId').value = petId;
    document.querySelectorAll('#appointmentPetGrid .pet-selection-card').forEach(c => {
        c.classList.toggle('selected', parseInt(c.dataset.petId) === petId);
    });
    document.getElementById('appointmentDetails').style.display = 'block';
    document.getElementById('appointmentDate').value = getTodayDate();
}

async function saveAppointment(e) {
    e.preventDefault();
    
    if (!selectedAppointmentClient || !selectedAppointmentPet) {
        showToast('⚠️ Seleccione cliente y mascota');
        return;
    }
    
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const type = document.getElementById('appointmentType').value;
    const notes = document.getElementById('appointmentNotes').value.trim();
    
    if (!date || !time) {
        showToast('⚠️ Complete fecha y hora');
        return;
    }
    
    const newAppt = {
        id: Date.now(),
        petId: selectedAppointmentPet.id,
        clientId: selectedAppointmentClient.id,
        date, time, type, notes,
        completed: false
    };
    
    try {
        showToast('💾 Guardando...');
        
        await appendToSheet(CONFIG.SHEETS.CITAS, [
            newAppt.id, newAppt.petId, newAppt.clientId, date, time, type, notes, 'PENDIENTE', 'TRUE', new Date().toISOString()
        ]);
        
        appointments.push(newAppt);
        
        const message = `🐾 *CITA AGENDADA - VetCare*

Hola ${selectedAppointmentClient.name}!

📅 ${formatDateLong(date)}
🕐 ${time}
🐕 ${selectedAppointmentPet.name}
💉 ${getTypeName(type)}

¡Lo esperamos! 🏥`;

        sendWhatsApp(selectedAppointmentClient.phone, message);
        
        closeModal('newAppointment');
        renderAll();
        showToast('✅ Cita agendada');
        
    } catch (error) {
        console.error(error);
        showToast('❌ Error al guardar');
    }
}

// ══════════════════════════════════════════════════════════════════════
// FORMULARIO HISTORIAL
// ══════════════════════════════════════════════════════════════════════
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
    const autocomplete = document.getElementById('historyClientAutocomplete');
    
    if (query.length < 2) {
        autocomplete.classList.remove('show');
        return;
    }
    
    const matches = clients.filter(c => c.cedula.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()));
    
    if (matches.length > 0) {
        autocomplete.innerHTML = matches.map(c => {
            const cPets = pets.filter(p => p.owner === c.id);
            return `<div class="autocomplete-item" onclick="selectClientForHistory(${c.id})">
                <div class="autocomplete-item-name">${c.name} <span class="autocomplete-badge">CI: ${c.cedula}</span></div>
                <div class="autocomplete-item-detail">🐾 ${cPets.length} mascota(s)</div>
            </div>`;
        }).join('');
        autocomplete.classList.add('show');
    } else {
        autocomplete.classList.remove('show');
    }
}

function selectClientForHistory(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    selectedHistoryClient = client;
    const clientPets = pets.filter(p => p.owner === client.id);
    
    document.getElementById('historyClientSearch').value = `${client.name} - CI: ${client.cedula}`;
    document.getElementById('historyClientSearch').classList.add('autocomplete-found');
    document.getElementById('historyClientId').value = client.id;
    document.getElementById('historyClientAutocomplete').classList.remove('show');
    
    document.getElementById('historyClientAvatar').textContent = client.name.charAt(0);
    document.getElementById('historyClientName').textContent = client.name;
    document.getElementById('historyClientCard').classList.add('show');
    
    if (clientPets.length > 0) {
        document.getElementById('historyPetGrid').innerHTML = clientPets.map(p => `
            <div class="pet-selection-card" data-pet-id="${p.id}" onclick="selectPetForHistory(${p.id})">
                <div class="pet-selection-icon">${getPetIcon(p.type)}</div>
                <div class="pet-selection-name">${p.name}</div>
            </div>
        `).join('');
        document.getElementById('historyPetSelection').style.display = 'block';
    } else {
        showToast('⚠️ Sin mascotas');
    }
}

function selectPetForHistory(petId) {
    selectedHistoryPet = pets.find(p => p.id === petId);
    document.getElementById('historyPetId').value = petId;
    document.querySelectorAll('#historyPetGrid .pet-selection-card').forEach(c => {
        c.classList.toggle('selected', parseInt(c.dataset.petId) === petId);
    });
    document.getElementById('historyDetails').style.display = 'block';
}

function handleFileSelect(event) {
    Array.from(event.target.files).forEach(file => {
        if (file.size <= 10 * 1024 * 1024) {
            selectedFiles.push(file);
        }
    });
    renderFileList();
}

function renderFileList() {
    document.getElementById('fileList').innerHTML = selectedFiles.map((file, i) => `
        <div class="file-item">
            <div class="file-item-info">
                <span>${file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                <div><div class="file-item-name">${file.name}</div><div class="file-item-size">${(file.size / 1024).toFixed(0)} KB</div></div>
            </div>
            <button type="button" class="file-remove-btn" onclick="removeFile(${i})">✕</button>
        </div>
    `).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

async function saveHistory(e) {
    e.preventDefault();
    
    if (!selectedHistoryClient || !selectedHistoryPet) {
        showToast('⚠️ Seleccione cliente y mascota');
        return;
    }
    
    const diagnosis = document.getElementById('historyDiagnosis').value.trim();
    if (!diagnosis) {
        showToast('⚠️ Ingrese diagnóstico');
        return;
    }
    
    try {
        showToast('💾 Guardando...');
        
        const uploadedFiles = [];
        for (const file of selectedFiles) {
            showToast(`📤 Subiendo ${file.name}...`);
            const uploaded = await uploadFileToDrive(file);
            uploadedFiles.push(uploaded);
        }
        
        const newHistory = {
            id: Date.now(),
            petId: selectedHistoryPet.id,
            clientId: selectedHistoryClient.id,
            date: getTodayDate(),
            type: document.getElementById('historyType').value,
            diagnosis,
            treatment: document.getElementById('historyTreatment').value.trim(),
            meds: document.getElementById('historyMeds').value.trim(),
            attachments: uploadedFiles
        };
        
        await appendToSheet(CONFIG.SHEETS.HISTORIAL, [
            newHistory.id, newHistory.petId, newHistory.clientId, newHistory.date, newHistory.type, diagnosis, newHistory.treatment, newHistory.meds, '', new Date().toISOString()
        ]);
        
        for (const file of uploadedFiles) {
            await appendToSheet(CONFIG.SHEETS.ARCHIVOS, [
                Date.now(), newHistory.id, newHistory.petId, newHistory.clientId, file.name, file.type, Math.round(file.size / 1024), file.url, new Date().toISOString()
            ]);
        }
        
        history.push(newHistory);
        closeModal('newHistory');
        resetHistoryForm();
        renderAll();
        showToast('✅ Consulta guardada');
        
    } catch (error) {
        console.error(error);
        showToast('❌ Error al guardar');
    }
}

// ══════════════════════════════════════════════════════════════════════
// VER HISTORIAL
// ══════════════════════════════════════════════════════════════════════
function viewPetHistory(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;
    
    const owner = clients.find(c => c.id === pet.owner);
    const petHist = history.filter(h => h.petId === petId).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    document.getElementById('viewHistoryContent').innerHTML = `
        <div id="printableHistory">
            <div style="text-align: center; margin-bottom: 1.5rem; border-bottom: 3px solid var(--primary); padding-bottom: 1rem;">
                <h1 style="font-family: 'Fredoka One', cursive; color: var(--primary);">🐾 VetCare</h1>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: var(--cream); padding: 1rem; border-radius: 12px;">
                    <h3 style="color: var(--primary);">${getPetIcon(pet.type)} Mascota</h3>
                    <p><b>Nombre:</b> ${pet.name}</p>
                    <p><b>Tipo:</b> ${getPetTypeName(pet.type)}</p>
                    <p><b>Raza:</b> ${pet.breed || '-'}</p>
                    <p><b>Edad:</b> ${pet.age || '-'}</p>
                </div>
                <div style="background: var(--mint); padding: 1rem; border-radius: 12px;">
                    <h3 style="color: var(--primary);">👤 Propietario</h3>
                    <p><b>Nombre:</b> ${owner?.name || '-'}</p>
                    <p><b>CI:</b> ${owner?.cedula || '-'}</p>
                    <p><b>Tel:</b> ${owner?.phone || '-'}</p>
                </div>
            </div>
            <h3 style="color: var(--primary);">📋 Historial</h3>
            ${petHist.length === 0 ? '<p style="text-align: center; color: var(--text-light);">Sin registros</p>' : 
            petHist.map(h => `
                <div style="background: var(--cream); padding: 1rem; border-radius: 12px; margin: 0.5rem 0; border-left: 4px solid var(--primary);">
                    <div style="display: flex; justify-content: space-between;">
                        <b>${getTypeIcon(h.type)} ${getTypeName(h.type)}</b>
                        <span style="color: var(--text-light);">${formatDate(h.date)}</span>
                    </div>
                    <p><b>Diagnóstico:</b> ${h.diagnosis}</p>
                    ${h.treatment ? `<p><b>Tratamiento:</b> ${h.treatment}</p>` : ''}
                    ${h.meds ? `<p><b>Medicamentos:</b> ${h.meds}</p>` : ''}
                    ${h.attachments?.length ? `<div>${h.attachments.map(a => `<a href="${a.url}" target="_blank" class="attachment-badge">📎 ${a.name}</a>`).join(' ')}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    openModal('viewHistory');
}

function printHistory() {
    const content = document.getElementById('printableHistory');
    if (!content) return;
    
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Historial</title>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Fredoka+One&display=swap" rel="stylesheet">
        <style>body{font-family:'Nunito',sans-serif;color:#4A5568;padding:2cm;}h1,h3{font-family:'Fredoka One',cursive;}.attachment-badge{background:#E6E0F0;padding:2px 8px;border-radius:4px;font-size:12px;text-decoration:none;}</style>
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.onload = () => win.print();
}

// ══════════════════════════════════════════════════════════════════════
// ACCIONES
// ══════════════════════════════════════════════════════════════════════
async function completeAppointment(id, rowIndex) {
    if (!confirm('¿Marcar como completada?')) return;
    
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    
    try {
        showToast('💾 Actualizando...');
        await updateSheetRow(CONFIG.SHEETS.CITAS, rowIndex, [
            appt.id, appt.petId, appt.clientId, appt.date, appt.time, appt.type, appt.notes, 'COMPLETADA', 'TRUE', new Date().toISOString()
        ]);
        appt.completed = true;
        renderAll();
        showToast('✅ Completada');
    } catch (error) {
        showToast('❌ Error');
    }
}

async function deleteClient(id, rowIndex) {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
        showToast('🗑️ Eliminando...');
        await deleteSheetRow(CONFIG.SHEETS.CLIENTES, rowIndex);
        clients = clients.filter(c => c.id !== id);
        renderAll();
        showToast('✅ Eliminado');
    } catch (error) {
        showToast('❌ Error');
    }
}

async function deletePet(id, rowIndex) {
    if (!confirm('¿Eliminar mascota?')) return;
    try {
        showToast('🗑️ Eliminando...');
        await deleteSheetRow(CONFIG.SHEETS.MASCOTAS, rowIndex);
        pets = pets.filter(p => p.id !== id);
        renderAll();
        showToast('✅ Eliminado');
    } catch (error) {
        showToast('❌ Error');
    }
}

// ══════════════════════════════════════════════════════════════════════
// FILTROS
// ══════════════════════════════════════════════════════════════════════
function filterClients() {
    const q = (document.getElementById('clientSearch').value || '').toLowerCase();
    renderAllClients(clients.filter(c => c.name.toLowerCase().includes(q) || c.cedula.includes(q) || c.phone.includes(q)));
}

function filterPets() {
    const q = (document.getElementById('petSearch').value || '').toLowerCase();
    renderAllPets(pets.filter(p => {
        const owner = clients.find(c => c.id === p.owner);
        return p.name.toLowerCase().includes(q) || (owner && owner.name.toLowerCase().includes(q));
    }));
}

function filterHistory() {
    const q = (document.getElementById('historySearch').value || '').toLowerCase();
    renderHistory(history.filter(h => {
        const pet = pets.find(p => p.id === h.petId);
        return (h.diagnosis || '').toLowerCase().includes(q) || (pet && pet.name.toLowerCase().includes(q));
    }));
}

function globalSearchFn() {
    const q = (document.getElementById('globalSearch').value || '').toLowerCase();
    const results = document.getElementById('searchResults');
    
    if (!q) { results.innerHTML = ''; return; }
    
    let html = '';
    const mc = clients.filter(c => c.name.toLowerCase().includes(q) || c.cedula.includes(q));
    const mp = pets.filter(p => p.name.toLowerCase().includes(q));
    
    if (mc.length) {
        html += '<h4 style="margin: 1rem 0 0.5rem; color: var(--primary);">👥 Clientes</h4>';
        html += mc.map(c => `<div class="appointment-card">${c.name} <span class="ci-badge">CI: ${c.cedula}</span></div>`).join('');
    }
    if (mp.length) {
        html += '<h4 style="margin: 1rem 0 0.5rem; color: var(--primary);">🐾 Mascotas</h4>';
        html += mp.map(p => `<div class="appointment-card">${getPetIcon(p.type)} ${p.name}</div>`).join('');
    }
    
    results.innerHTML = html || '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Sin resultados</p>';
}

// ══════════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════════
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════════════════════════════
// RENDER ALL
// ══════════════════════════════════════════════════════════════════════
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
