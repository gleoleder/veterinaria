/* ╔════════════════════════════════════════════════════════════════════════════╗
   ║                         LÓGICA - script.js                                  ║
   ║                         Sistema VetCare v2.0                                ║
   ║                    Sistema de Gestión Veterinaria                           ║
   ╚════════════════════════════════════════════════════════════════════════════╝ */

// ══════════════════════════════════════════════════════════════════════════════
// ALMACENAMIENTO DE DATOS (LocalStorage)
// ══════════════════════════════════════════════════════════════════════════════
let clients = JSON.parse(localStorage.getItem('vetClients')) || [];
let pets = JSON.parse(localStorage.getItem('vetPets')) || [];
let appointments = JSON.parse(localStorage.getItem('vetAppointments')) || [];
let history = JSON.parse(localStorage.getItem('vetHistory')) || [];

// ══════════════════════════════════════════════════════════════════════════════
// VARIABLES DE ESTADO
// ══════════════════════════════════════════════════════════════════════════════
let selectedOwner = null;
let isNewOwner = false;
let selectedFiles = [];
let selectedAppointmentClient = null;
let selectedAppointmentPet = null;
let selectedHistoryClient = null;
let selectedHistoryPet = null;
let selectedPetType = null;

// ══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN CON DATOS DE EJEMPLO
// ══════════════════════════════════════════════════════════════════════════════
function initSampleData() {
    if (clients.length === 0) {
        clients = [
            { id: 1, cedula: '12345678', name: 'María García', phone: '59170123456', email: 'maria@email.com', address: 'Av. Arce #123', color: '#7C9A92' },
            { id: 2, cedula: '87654321', name: 'Carlos López', phone: '59171234567', email: 'carlos@email.com', address: 'Calle Murillo #456', color: '#F2B880' },
            { id: 3, cedula: '11223344', name: 'Ana Rodríguez', phone: '59172345678', email: 'ana@email.com', address: 'Av. 6 de Agosto #789', color: '#E8998D' }
        ];
        localStorage.setItem('vetClients', JSON.stringify(clients));
    }

    if (pets.length === 0) {
        pets = [
            { id: 1, name: 'Max', type: 'dog', breed: 'Golden Retriever', age: '3 años', weight: 28, owner: 1, ownerCedula: '12345678', notes: 'Muy activo' },
            { id: 2, name: 'Luna', type: 'cat', breed: 'Siamés', age: '2 años', weight: 4, owner: 1, ownerCedula: '12345678', notes: '' },
            { id: 3, name: 'Rocky', type: 'dog', breed: 'Bulldog', age: '5 años', weight: 22, owner: 2, ownerCedula: '87654321', notes: 'Alergia al pollo' },
            { id: 4, name: 'Kiwi', type: 'bird', breed: 'Canario', age: '1 año', weight: 0.03, owner: 3, ownerCedula: '11223344', notes: '' }
        ];
        localStorage.setItem('vetPets', JSON.stringify(pets));
    }

    if (appointments.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        appointments = [
            { id: 1, petId: 1, clientId: 1, date: today, time: '09:00', type: 'checkup', notes: 'Revisión anual', completed: false },
            { id: 2, petId: 3, clientId: 2, date: today, time: '10:30', type: 'vaccine', notes: 'Vacuna antirrábica', completed: false },
            { id: 3, petId: 2, clientId: 1, date: today, time: '14:00', type: 'grooming', notes: 'Baño y corte', completed: false }
        ];
        localStorage.setItem('vetAppointments', JSON.stringify(appointments));
    }

    if (history.length === 0) {
        history = [
            { id: 1, petId: 1, clientId: 1, date: '2025-01-15', type: 'vaccine', diagnosis: 'Vacunación preventiva', treatment: 'Vacuna antirrábica aplicada', meds: 'N/A', attachments: [] },
            { id: 2, petId: 3, clientId: 2, date: '2025-01-10', type: 'checkup', diagnosis: 'Revisión general satisfactoria', treatment: 'Dieta especial recomendada', meds: 'Suplemento vitamínico', attachments: [] },
            { id: 3, petId: 2, clientId: 1, date: '2025-01-05', type: 'treatment', diagnosis: 'Infección menor en oído', treatment: 'Limpieza y medicación', meds: 'Gotas óticas', attachments: [] }
        ];
        localStorage.setItem('vetHistory', JSON.stringify(history));
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
// FONDO ANIMADO (Patitas flotantes)
// ══════════════════════════════════════════════════════════════════════════════
function createFloatingPaws() {
    const container = document.getElementById('floatingPaws');
    const paws = ['🐾', '🐕', '🐱', '🐦', '🐰', '❤️'];
    for (let i = 0; i < 20; i++) {
        const paw = document.createElement('div');
        paw.className = 'paw';
        paw.textContent = paws[Math.floor(Math.random() * paws.length)];
        paw.style.left = Math.random() * 100 + '%';
        paw.style.top = Math.random() * 100 + '%';
        paw.style.animationDelay = Math.random() * 10 + 's';
        paw.style.fontSize = (Math.random() * 1.5 + 1) + 'rem';
        container.appendChild(paw);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ══════════════════════════════════════════════════════════════════════════════
function getPetIcon(type) {
    return { dog: '🐕', cat: '🐱', bird: '🐦', rabbit: '🐰' }[type] || '🐾';
}

function getPetColor(type) {
    return { dog: '#C65D3B', cat: '#7B6BA8', bird: '#2D9596', rabbit: '#B8860B' }[type] || '#7C9A92';
}

function getPetTypeName(type) {
    return { dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo' }[type] || type;
}

function getAppointmentTypeName(type) {
    return { checkup: 'Revisión General', vaccine: 'Vacunación', surgery: 'Cirugía', grooming: 'Estética', emergency: 'Emergencia', dental: 'Dental' }[type] || type;
}

function getAppointmentIcon(type) {
    return { checkup: '🩺', vaccine: '💉', surgery: '🏥', grooming: '✨', emergency: '🚨', dental: '🦷' }[type] || '📋';
}

function getHistoryTypeName(type) {
    return { checkup: 'Revisión General', vaccine: 'Vacunación', surgery: 'Cirugía', treatment: 'Tratamiento', emergency: 'Emergencia' }[type] || type;
}

function getHistoryIcon(type) {
    return { checkup: '🩺', vaccine: '💉', surgery: '🏥', treatment: '💊', emergency: '🚨' }[type] || '📋';
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function generateColor() {
    return ['#7C9A92', '#F2B880', '#E8998D', '#A8C5BE', '#C9B8E8', '#86B3D1'][Math.floor(Math.random() * 6)];
}

// ══════════════════════════════════════════════════════════════════════════════
// ACTUALIZAR ESTADÍSTICAS
// ══════════════════════════════════════════════════════════════════════════════
function updateStats() {
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('totalPets').textContent = pets.length;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('todayAppointments').textContent = appointments.filter(a => a.date === today).length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('monthlyVisits').textContent = history.filter(h => h.date.startsWith(thisMonth)).length;
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDERIZADO DE CLIENTES
// ══════════════════════════════════════════════════════════════════════════════
function renderRecentClients() {
    const table = document.getElementById('recentClientsTable');
    table.innerHTML = clients.slice(-5).reverse().map(client => {
        const clientPets = pets.filter(p => p.owner === client.id);
        return `<tr>
            <td><div class="client-info">
                <div class="client-avatar" style="background: ${client.color}20; color: ${client.color}">${client.name.charAt(0)}</div>
                <div><div class="client-name">${client.name}</div><div class="client-email">${client.email || 'Sin email'}</div></div>
            </div></td>
            <td><span class="ci-badge">CI: ${client.cedula}</span></td>
            <td>${clientPets.map(p => `<span class="pet-badge ${p.type}">${getPetIcon(p.type)} ${p.name}</span>`).join('')}</td>
            <td><span class="status-badge active">Activo</span></td>
            <td>
                <button class="action-btn" onclick="viewClient(${client.id})">👁️</button>
                <button class="action-btn" onclick="sendWhatsApp('${client.phone}', 'Hola ${client.name}!')">📲</button>
                <button class="action-btn" onclick="deleteClient(${client.id})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderAllClients(filteredClients = null) {
    const table = document.getElementById('allClientsTable');
    const data = filteredClients || clients;
    
    if (data.length === 0) {
        table.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div><p>No hay clientes registrados</p></div></td></tr>`;
        return;
    }
    
    table.innerHTML = data.map(client => {
        const clientPets = pets.filter(p => p.owner === client.id);
        const lastVisit = history.filter(h => clientPets.some(p => p.id === h.petId)).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        return `<tr>
            <td><div class="client-info">
                <div class="client-avatar" style="background: ${client.color}20; color: ${client.color}">${client.name.charAt(0)}</div>
                <div><div class="client-name">${client.name}</div><div class="client-email">${client.email || 'Sin email'}</div></div>
            </div></td>
            <td><span class="ci-badge">CI: ${client.cedula}</span></td>
            <td>${client.phone}</td>
            <td>${clientPets.map(p => `<span class="pet-badge ${p.type}">${getPetIcon(p.type)} ${p.name}</span>`).join('') || '<span style="color: var(--text-light)">Sin mascotas</span>'}</td>
            <td>${lastVisit ? formatDate(lastVisit.date) : 'Sin visitas'}</td>
            <td>
                <button class="action-btn" onclick="viewClient(${client.id})">👁️</button>
                <button class="action-btn" onclick="deleteClient(${client.id})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDERIZADO DE MASCOTAS
// ══════════════════════════════════════════════════════════════════════════════
function renderAllPets(filteredPets = null) {
    const table = document.getElementById('allPetsTable');
    const data = filteredPets || pets;
    
    if (data.length === 0) {
        table.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🐾</div><p>No hay mascotas registradas</p></div></td></tr>`;
        return;
    }
    
    table.innerHTML = data.map(pet => {
        const owner = clients.find(c => c.id === pet.owner);
        return `<tr>
            <td><div class="client-info">
                <div class="client-avatar" style="background: ${getPetColor(pet.type)}20; font-size: 1.5rem;">${getPetIcon(pet.type)}</div>
                <div><div class="client-name">${pet.name}</div><div class="client-email">${pet.breed || 'Sin especificar'}</div></div>
            </div></td>
            <td><span class="pet-badge ${pet.type}">${getPetIcon(pet.type)} ${getPetTypeName(pet.type)}</span></td>
            <td>${owner ? `${owner.name} <span class="ci-badge">CI: ${owner.cedula}</span>` : 'Sin dueño'}</td>
            <td>${pet.age || 'No especificada'}</td>
            <td>
                <button class="action-btn" onclick="viewPetFullHistory(${pet.id})">📋</button>
                <button class="action-btn" onclick="deletePet(${pet.id})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDERIZADO DE CITAS
// ══════════════════════════════════════════════════════════════════════════════
function renderTodayAppointments() {
    const container = document.getElementById('todayAppointmentsList');
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.date === today && !a.completed).sort((a, b) => a.time.localeCompare(b.time));
    
    if (todayAppts.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p>No hay citas programadas para hoy</p></div>`;
        return;
    }
    
    container.innerHTML = todayAppts.map(appt => {
        const pet = pets.find(p => p.id === appt.petId);
        const client = clients.find(c => c.id === appt.clientId);
        const [h, m] = appt.time.split(':');
        const hour = parseInt(h);
        return `<div class="appointment-card" onclick="completeAppointment(${appt.id})">
            <div class="appointment-time">
                <div class="time">${hour > 12 ? hour - 12 : hour}:${m}</div>
                <div class="period">${hour >= 12 ? 'PM' : 'AM'}</div>
            </div>
            <div class="appointment-details">
                <div class="appointment-pet">${getPetIcon(pet?.type)} ${pet?.name || 'Mascota'}</div>
                <div class="appointment-type">${getAppointmentTypeName(appt.type)} • ${client?.name || ''}</div>
            </div>
            <div class="appointment-icon">${getAppointmentIcon(appt.type)}</div>
        </div>`;
    }).join('');
}

function renderUpcomingAppointments() {
    const container = document.getElementById('upcomingAppointments');
    const today = new Date().toISOString().split('T')[0];
    const upcoming = appointments.filter(a => a.date >= today && !a.completed).sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time));
    
    if (upcoming.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p>No hay citas próximas</p></div>`;
        return;
    }
    
    container.innerHTML = upcoming.slice(0, 8).map(appt => {
        const pet = pets.find(p => p.id === appt.petId);
        const [h, m] = appt.time.split(':');
        const hour = parseInt(h);
        return `<div class="appointment-card">
            <div class="appointment-time">
                <div class="time">${hour > 12 ? hour - 12 : hour}:${m}</div>
                <div class="period">${hour >= 12 ? 'PM' : 'AM'}</div>
            </div>
            <div class="appointment-details">
                <div class="appointment-pet">${getPetIcon(pet?.type)} ${pet?.name || 'Mascota'}</div>
                <div class="appointment-type">${formatDate(appt.date)} - ${getAppointmentTypeName(appt.type)}</div>
            </div>
            <button class="action-btn" onclick="event.stopPropagation(); sendAppointmentReminder(${appt.id})" title="Enviar recordatorio WhatsApp">📲</button>
        </div>`;
    }).join('');
}

function renderCompletedAppointments() {
    const container = document.getElementById('completedAppointments');
    const today = new Date().toISOString().split('T')[0];
    const completed = appointments.filter(a => a.date === today && a.completed);
    
    if (completed.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>No hay citas completadas hoy</p></div>`;
        return;
    }
    
    container.innerHTML = completed.map(appt => {
        const pet = pets.find(p => p.id === appt.petId);
        return `<div class="appointment-card" style="opacity: 0.7;">
            <div class="appointment-time" style="background: var(--mint);"><div class="time">✓</div></div>
            <div class="appointment-details">
                <div class="appointment-pet">${getPetIcon(pet?.type)} ${pet?.name || 'Mascota'}</div>
                <div class="appointment-type">${getAppointmentTypeName(appt.type)}</div>
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDERIZADO DE HISTORIAL
// ══════════════════════════════════════════════════════════════════════════════
function renderHistory(filteredHistory = null) {
    const container = document.getElementById('historyList');
    const data = (filteredHistory || history).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No hay registros en el historial</p></div>`;
        return;
    }
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    container.innerHTML = data.map(item => {
        const pet = pets.find(p => p.id === item.petId);
        const owner = pet ? clients.find(c => c.id === pet.owner) : null;
        const date = new Date(item.date);
        const attachments = item.attachments || [];
        
        return `<div class="history-item">
            <div class="history-date">
                <div class="history-day">${date.getDate()}</div>
                <div class="history-month">${months[date.getMonth()]}</div>
            </div>
            <div class="history-content">
                <div class="history-title">${getHistoryIcon(item.type)} ${getHistoryTypeName(item.type)}</div>
                <div class="history-desc">${item.diagnosis}</div>
                <div class="history-pet">${getPetIcon(pet?.type)} ${pet?.name || 'Mascota'} ${owner ? `• ${owner.name}` : ''}</div>
                ${attachments.length > 0 ? `<div class="history-attachments">${attachments.map(a => `<a href="${a.url}" target="_blank" class="attachment-badge">📎 ${a.name}</a>`).join('')}</div>` : ''}
            </div>
            <div class="history-actions">
                <button class="action-btn" onclick="viewPetFullHistory(${item.petId})" title="Ver historial completo">📋</button>
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE WHATSAPP
// ══════════════════════════════════════════════════════════════════════════════
function sendWhatsApp(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
}

function sendAppointmentReminder(appointmentId) {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) return;
    
    const pet = pets.find(p => p.id === appt.petId);
    const client = clients.find(c => c.id === appt.clientId);
    if (!client) return;

    const message = `🐾 *RECORDATORIO DE CITA - VetCare*

Hola ${client.name}! 👋

Le recordamos su cita programada:

📅 *Fecha:* ${formatDateLong(appt.date)}
🕐 *Hora:* ${appt.time}
🐕 *Mascota:* ${pet?.name || 'Su mascota'}
💉 *Tipo:* ${getAppointmentTypeName(appt.type)}
${appt.notes ? `📝 *Notas:* ${appt.notes}` : ''}

¡Lo esperamos! 🏥

_VetCare - Cuidamos a tu mejor amigo_`;

    sendWhatsApp(client.phone, message);
}

// ══════════════════════════════════════════════════════════════════════════════
// MODALES
// ══════════════════════════════════════════════════════════════════════════════
function openModal(type) {
    const modal = document.getElementById(`modal${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (modal) {
        modal.classList.add('active');
        if (type === 'newPet') resetOwnerSearch();
        if (type === 'newAppointment') resetAppointmentForm();
        if (type === 'newHistory') resetHistoryForm();
    }
}

function closeModal(type) {
    const modal = document.getElementById(`modal${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (modal) modal.classList.remove('active');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// FORMULARIO DE CITAS
// ══════════════════════════════════════════════════════════════════════════════
function resetAppointmentForm() {
    selectedAppointmentClient = null;
    selectedAppointmentPet = null;
    document.getElementById('appointmentClientSearch').value = '';
    document.getElementById('appointmentClientSearch').classList.remove('autocomplete-found');
    document.getElementById('appointmentClientId').value = '';
    document.getElementById('appointmentPetId').value = '';
    document.getElementById('appointmentClientCard').classList.remove('show');
    document.getElementById('appointmentPetSelection').style.display = 'none';
    document.getElementById('appointmentDetails').style.display = 'none';
    document.getElementById('appointmentDate').value = new Date().toISOString().split('T')[0];
}

function searchClientForAppointment(query) {
    const autocomplete = document.getElementById('appointmentClientAutocomplete');
    if (query.length < 2) {
        autocomplete.classList.remove('show');
        return;
    }
    
    const matches = clients.filter(c => c.cedula.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()));
    
    if (matches.length > 0) {
        autocomplete.innerHTML = matches.map(client => {
            const clientPets = pets.filter(p => p.owner === client.id);
            return `<div class="autocomplete-item" onclick="selectClientForAppointment(${client.id})">
                <div class="autocomplete-item-name">${client.name}<span class="autocomplete-badge">CI: ${client.cedula}</span></div>
                <div class="autocomplete-item-detail">📞 ${client.phone} • 🐾 ${clientPets.length} mascota(s)</div>
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

    // Mostrar tarjeta del cliente
    document.getElementById('appointmentClientAvatar').textContent = client.name.charAt(0);
    document.getElementById('appointmentClientName').textContent = client.name;
    document.getElementById('appointmentClientCedula').textContent = client.cedula;
    document.getElementById('appointmentClientPhone').textContent = client.phone;
    document.getElementById('appointmentClientCard').classList.add('show');

    // Mostrar selección de mascotas
    if (clientPets.length > 0) {
        document.getElementById('appointmentPetGrid').innerHTML = clientPets.map(pet => `
            <div class="pet-selection-card" data-pet-id="${pet.id}" onclick="selectPetForAppointment(${pet.id})">
                <div class="pet-selection-icon">${getPetIcon(pet.type)}</div>
                <div class="pet-selection-name">${pet.name}</div>
                <div class="pet-selection-breed">${pet.breed || getPetTypeName(pet.type)}</div>
            </div>
        `).join('');
        document.getElementById('appointmentPetSelection').style.display = 'block';
    } else {
        showToast('⚠️ Este cliente no tiene mascotas registradas');
    }
}

function selectPetForAppointment(petId) {
    selectedAppointmentPet = pets.find(p => p.id === petId);
    document.getElementById('appointmentPetId').value = petId;
    
    document.querySelectorAll('#appointmentPetGrid .pet-selection-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.petId) === petId);
    });
    
    document.getElementById('appointmentDetails').style.display = 'block';
    document.getElementById('appointmentDate').value = new Date().toISOString().split('T')[0];
}

// ══════════════════════════════════════════════════════════════════════════════
// FORMULARIO DE HISTORIAL
// ══════════════════════════════════════════════════════════════════════════════
function resetHistoryForm() {
    selectedHistoryClient = null;
    selectedHistoryPet = null;
    selectedFiles = [];
    document.getElementById('historyClientSearch').value = '';
    document.getElementById('historyClientSearch').classList.remove('autocomplete-found');
    document.getElementById('historyClientId').value = '';
    document.getElementById('historyPetId').value = '';
    document.getElementById('historyClientCard').classList.remove('show');
    document.getElementById('historyPetSelection').style.display = 'none';
    document.getElementById('historyDetails').style.display = 'none';
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
        autocomplete.innerHTML = matches.map(client => {
            const clientPets = pets.filter(p => p.owner === client.id);
            return `<div class="autocomplete-item" onclick="selectClientForHistory(${client.id})">
                <div class="autocomplete-item-name">${client.name}<span class="autocomplete-badge">CI: ${client.cedula}</span></div>
                <div class="autocomplete-item-detail">📞 ${client.phone} • 🐾 ${clientPets.length} mascota(s)</div>
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
        document.getElementById('historyPetGrid').innerHTML = clientPets.map(pet => `
            <div class="pet-selection-card" data-pet-id="${pet.id}" onclick="selectPetForHistory(${pet.id})">
                <div class="pet-selection-icon">${getPetIcon(pet.type)}</div>
                <div class="pet-selection-name">${pet.name}</div>
                <div class="pet-selection-breed">${pet.breed || getPetTypeName(pet.type)}</div>
            </div>
        `).join('');
        document.getElementById('historyPetSelection').style.display = 'block';
    } else {
        showToast('⚠️ Este cliente no tiene mascotas registradas');
    }
}

function selectPetForHistory(petId) {
    selectedHistoryPet = pets.find(p => p.id === petId);
    document.getElementById('historyPetId').value = petId;
    
    document.querySelectorAll('#historyPetGrid .pet-selection-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.petId) === petId);
    });
    
    document.getElementById('historyDetails').style.display = 'block';
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBIDA DE ARCHIVOS
// ══════════════════════════════════════════════════════════════════════════════
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
            showToast(`⚠️ ${file.name} es muy grande (máx. 10MB)`);
            return;
        }
        selectedFiles.push(file);
    });
    renderFileList();
}

function renderFileList() {
    const container = document.getElementById('fileList');
    container.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-item-info">
                <span>${file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                <div>
                    <div class="file-item-name">${file.name}</div>
                    <div class="file-item-size">${(file.size / 1024).toFixed(1)} KB</div>
                </div>
            </div>
            <button type="button" class="file-remove-btn" onclick="removeFile(${index})">✕</button>
        </div>
    `).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

// Drag and drop
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('fileUploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => {
                if (file.size <= 10 * 1024 * 1024) selectedFiles.push(file);
            });
            renderFileList();
        });
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// BÚSQUEDA DE DUEÑO (Nueva Mascota)
// ══════════════════════════════════════════════════════════════════════════════
function searchOwner(query) {
    const autocomplete = document.getElementById('ownerAutocomplete');
    const ownerInfoCard = document.getElementById('ownerInfoCard');
    const newOwnerForm = document.getElementById('newOwnerForm');
    
    if (query.length < 2) {
        autocomplete.classList.remove('show');
        ownerInfoCard.classList.remove('show');
        newOwnerForm.style.display = 'none';
        selectedOwner = null;
        isNewOwner = false;
        return;
    }
    
    const matches = clients.filter(c => c.cedula.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()));
    
    if (matches.length > 0) {
        autocomplete.innerHTML = matches.map(client => {
            const clientPets = pets.filter(p => p.owner === client.id);
            return `<div class="autocomplete-item" onclick="selectOwner(${client.id})">
                <div class="autocomplete-item-name">${client.name}<span class="autocomplete-badge">CI: ${client.cedula}</span></div>
                <div class="autocomplete-item-detail">📞 ${client.phone} • 🐾 ${clientPets.length} mascota(s)</div>
            </div>`;
        }).join('');
        autocomplete.classList.add('show');
        newOwnerForm.style.display = 'none';
        isNewOwner = false;
    } else {
        autocomplete.classList.remove('show');
        newOwnerForm.style.display = 'block';
        ownerInfoCard.classList.remove('show');
        
        if (/^\d+$/.test(query)) {
            document.getElementById('newOwnerCedula').value = query;
            document.getElementById('newOwnerName').value = '';
        } else {
            document.getElementById('newOwnerName').value = query;
            document.getElementById('newOwnerCedula').value = '';
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
    const clientPets = pets.filter(p => p.owner === client.id);
    
    document.getElementById('ownerSearch').value = `${client.name} - CI: ${client.cedula}`;
    document.getElementById('ownerSearch').classList.add('autocomplete-found');
    document.getElementById('petOwner').value = client.id;
    document.getElementById('ownerAutocomplete').classList.remove('show');
    document.getElementById('newOwnerForm').style.display = 'none';
    
    document.getElementById('ownerAvatar').textContent = client.name.charAt(0);
    document.getElementById('ownerInfoName').textContent = client.name;
    document.getElementById('ownerInfoCedula').textContent = client.cedula;
    document.getElementById('ownerInfoPhone').textContent = client.phone;
    document.getElementById('ownerInfoEmail').textContent = client.email || 'No registrado';
    document.getElementById('ownerInfoPets').textContent = `${clientPets.length} mascota(s)`;
    document.getElementById('ownerInfoCard').classList.add('show');
}

function resetOwnerSearch() {
    selectedOwner = null;
    isNewOwner = false;
    document.getElementById('ownerSearch').value = '';
    document.getElementById('ownerSearch').classList.remove('autocomplete-found');
    document.getElementById('petOwner').value = '';
    document.getElementById('ownerAutocomplete').classList.remove('show');
    document.getElementById('ownerInfoCard').classList.remove('show');
    document.getElementById('newOwnerForm').style.display = 'none';
    ['newOwnerCedula', 'newOwnerName', 'newOwnerPhone', 'newOwnerEmail', 'newOwnerAddress'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// SELECCIÓN DE TIPO DE MASCOTA
// ══════════════════════════════════════════════════════════════════════════════
function selectPetType(type) {
    selectedPetType = type;
    document.getElementById('petType').value = type;
    document.querySelectorAll('.pet-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.type === type);
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// GUARDAR CLIENTE
// ══════════════════════════════════════════════════════════════════════════════
function saveClient(e) {
    e.preventDefault();
    const cedula = document.getElementById('clientCedula').value.trim();
    
    if (clients.find(c => c.cedula === cedula)) {
        showToast('⚠️ Ya existe un cliente con esa cédula');
        return;
    }
    
    clients.push({
        id: Date.now(),
        cedula,
        name: document.getElementById('clientName').value,
        phone: document.getElementById('clientPhone').value.replace(/\D/g, ''),
        email: document.getElementById('clientEmail').value,
        address: document.getElementById('clientAddress').value,
        color: generateColor()
    });
    
    localStorage.setItem('vetClients', JSON.stringify(clients));
    closeModal('newClient');
    e.target.reset();
    renderAll();
    showToast('✅ Cliente registrado exitosamente');
}

// ══════════════════════════════════════════════════════════════════════════════
// GUARDAR MASCOTA
// ══════════════════════════════════════════════════════════════════════════════
function savePet(e) {
    e.preventDefault();
    
    if (!selectedPetType) {
        showToast('⚠️ Por favor selecciona un tipo de mascota');
        return;
    }
    
    let ownerId = null;
    let ownerCedula = null;

    if (isNewOwner) {
        const newCedula = document.getElementById('newOwnerCedula').value.trim();
        const newName = document.getElementById('newOwnerName').value.trim();
        const newPhone = document.getElementById('newOwnerPhone').value.trim();
        
        if (!newCedula || !newName || !newPhone) {
            showToast('⚠️ Complete los datos del nuevo dueño');
            return;
        }
        
        if (clients.find(c => c.cedula === newCedula)) {
            showToast('⚠️ Ya existe un cliente con esa cédula');
            return;
        }
        
        const newClient = {
            id: Date.now(),
            cedula: newCedula,
            name: newName,
            phone: newPhone.replace(/\D/g, ''),
            email: document.getElementById('newOwnerEmail').value || '',
            address: document.getElementById('newOwnerAddress').value || '',
            color: generateColor()
        };
        
        clients.push(newClient);
        localStorage.setItem('vetClients', JSON.stringify(clients));
        ownerId = newClient.id;
        ownerCedula = newClient.cedula;
        showToast('✅ Nuevo cliente registrado');
    } else if (selectedOwner) {
        ownerId = selectedOwner.id;
        ownerCedula = selectedOwner.cedula;
    } else {
        showToast('⚠️ Por favor selecciona o registra un dueño');
        return;
    }
    
    pets.push({
        id: Date.now() + 1,
        name: document.getElementById('petName').value,
        type: selectedPetType,
        breed: document.getElementById('petBreed').value,
        age: document.getElementById('petAge').value,
        weight: parseFloat(document.getElementById('petWeight').value) || 0,
        owner: ownerId,
        ownerCedula,
        notes: document.getElementById('petNotes').value
    });
    
    localStorage.setItem('vetPets', JSON.stringify(pets));
    closeModal('newPet');
    e.target.reset();
    selectedPetType = null;
    document.querySelectorAll('.pet-option').forEach(opt => opt.classList.remove('selected'));
    resetOwnerSearch();
    renderAll();
    showToast('✅ Mascota registrada exitosamente');
}

// ══════════════════════════════════════════════════════════════════════════════
// GUARDAR CITA
// ══════════════════════════════════════════════════════════════════════════════
function saveAppointment(e) {
    e.preventDefault();
    
    if (!selectedAppointmentClient || !selectedAppointmentPet) {
        showToast('⚠️ Seleccione cliente y mascota');
        return;
    }
    
    const appointment = {
        id: Date.now(),
        petId: selectedAppointmentPet.id,
        clientId: selectedAppointmentClient.id,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        type: document.getElementById('appointmentType').value,
        notes: document.getElementById('appointmentNotes').value,
        completed: false
    };
    
    appointments.push(appointment);
    localStorage.setItem('vetAppointments', JSON.stringify(appointments));

    // Enviar WhatsApp
    const message = `🐾 *CITA AGENDADA - VetCare*

Hola ${selectedAppointmentClient.name}! 👋

Su cita ha sido agendada exitosamente:

📅 *Fecha:* ${formatDateLong(appointment.date)}
🕐 *Hora:* ${appointment.time}
🐕 *Mascota:* ${selectedAppointmentPet.name}
💉 *Tipo:* ${getAppointmentTypeName(appointment.type)}
${appointment.notes ? `📝 *Notas:* ${appointment.notes}` : ''}

¡Lo esperamos! 🏥

_VetCare - Cuidamos a tu mejor amigo_`;

    sendWhatsApp(selectedAppointmentClient.phone, message);

    closeModal('newAppointment');
    renderAll();
    showToast('✅ Cita agendada - WhatsApp enviado');
}

// ══════════════════════════════════════════════════════════════════════════════
// GUARDAR HISTORIAL
// ══════════════════════════════════════════════════════════════════════════════
function saveHistory(e) {
    e.preventDefault();
    
    if (!selectedHistoryClient || !selectedHistoryPet) {
        showToast('⚠️ Seleccione cliente y mascota');
        return;
    }

    // Simular subida de archivos a Drive
    const attachments = selectedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: `https://drive.google.com/file/d/example_${Date.now()}/view`,
        uploadDate: new Date().toISOString()
    }));

    const historyItem = {
        id: Date.now(),
        petId: selectedHistoryPet.id,
        clientId: selectedHistoryClient.id,
        date: new Date().toISOString().split('T')[0],
        type: document.getElementById('historyType').value,
        diagnosis: document.getElementById('historyDiagnosis').value,
        treatment: document.getElementById('historyTreatment').value,
        meds: document.getElementById('historyMeds').value,
        attachments: attachments
    };

    history.push(historyItem);
    localStorage.setItem('vetHistory', JSON.stringify(history));

    closeModal('newHistory');
    renderAll();
    showToast('✅ Consulta registrada' + (attachments.length > 0 ? ` con ${attachments.length} archivo(s)` : ''));
}

// ══════════════════════════════════════════════════════════════════════════════
// VER HISTORIAL COMPLETO E IMPRIMIR
// ══════════════════════════════════════════════════════════════════════════════
function viewPetFullHistory(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;
    
    const owner = clients.find(c => c.id === pet.owner);
    const petHistory = history.filter(h => h.petId === petId).sort((a, b) => new Date(b.date) - new Date(a.date));

    const content = document.getElementById('viewHistoryContent');
    content.innerHTML = `
        <div id="printableHistory">
            <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 3px solid var(--primary);">
                <h1 style="font-family: 'Fredoka One', cursive; font-size: 2rem; color: var(--primary);">🐾 VetCare</h1>
                <p style="color: var(--text-light);">Sistema de Gestión Veterinaria</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div style="background: var(--cream); padding: 1.5rem; border-radius: 15px;">
                    <h3 style="color: var(--primary); margin-bottom: 1rem;">${getPetIcon(pet.type)} Datos de la Mascota</h3>
                    <p><strong>Nombre:</strong> ${pet.name}</p>
                    <p><strong>Tipo:</strong> ${getPetTypeName(pet.type)}</p>
                    <p><strong>Raza:</strong> ${pet.breed || 'No especificada'}</p>
                    <p><strong>Edad:</strong> ${pet.age || 'No especificada'}</p>
                    <p><strong>Peso:</strong> ${pet.weight ? pet.weight + ' kg' : 'No especificado'}</p>
                    ${pet.notes ? `<p><strong>Notas:</strong> ${pet.notes}</p>` : ''}
                </div>
                <div style="background: var(--mint); padding: 1.5rem; border-radius: 15px;">
                    <h3 style="color: var(--primary); margin-bottom: 1rem;">👤 Datos del Propietario</h3>
                    <p><strong>Nombre:</strong> ${owner?.name || 'No registrado'}</p>
                    <p><strong>Cédula:</strong> ${owner?.cedula || 'No registrada'}</p>
                    <p><strong>Teléfono:</strong> ${owner?.phone || 'No registrado'}</p>
                    <p><strong>Email:</strong> ${owner?.email || 'No registrado'}</p>
                    <p><strong>Dirección:</strong> ${owner?.address || 'No registrada'}</p>
                </div>
            </div>

            <h3 style="color: var(--primary); margin-bottom: 1rem; font-family: 'Fredoka One', cursive;">📋 Historial de Consultas</h3>
            
            ${petHistory.length === 0 ? '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No hay registros en el historial</p>' : 
            petHistory.map(item => `
                <div style="background: var(--cream); padding: 1.5rem; border-radius: 15px; margin-bottom: 1rem; border-left: 4px solid var(--primary);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong style="color: var(--primary);">${getHistoryIcon(item.type)} ${getHistoryTypeName(item.type)}</strong>
                        <span style="color: var(--text-light);">${formatDateLong(item.date)}</span>
                    </div>
                    <p><strong>Diagnóstico:</strong> ${item.diagnosis}</p>
                    ${item.treatment ? `<p><strong>Tratamiento:</strong> ${item.treatment}</p>` : ''}
                    ${item.meds ? `<p><strong>Medicamentos:</strong> ${item.meds}</p>` : ''}
                    ${item.attachments && item.attachments.length > 0 ? `
                        <div style="margin-top: 0.5rem;">
                            <strong>Archivos adjuntos:</strong>
                            ${item.attachments.map(a => `<a href="${a.url}" target="_blank" class="attachment-badge" style="margin-left: 0.5rem;">📎 ${a.name}</a>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
            
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #E2E8F0; text-align: center;">
                <p style="color: var(--text-light); font-size: 0.85rem;">
                    Documento generado el ${formatDateLong(new Date().toISOString().split('T')[0])} | VetCare - Sistema de Gestión Veterinaria
                </p>
            </div>
        </div>
    `;

    openModal('viewHistory');
}

function printHistory() {
    const printContent = document.getElementById('printableHistory').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Historial Clínico - VetCare</title>
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Fredoka+One&display=swap" rel="stylesheet">
            <style>
                @page { size: letter; margin: 1.5cm; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Nunito', sans-serif; 
                    color: #4A5568; 
                    line-height: 1.6;
                    padding: 20px;
                }
                h1, h3 { font-family: 'Fredoka One', cursive; }
                p { margin: 0.3rem 0; }
                strong { color: #4A5568; }
                .attachment-badge {
                    display: inline-block;
                    padding: 0.2rem 0.5rem;
                    background: #E6E0F0;
                    color: #7B6BA8;
                    border-radius: 5px;
                    font-size: 0.75rem;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>${printContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// OTRAS FUNCIONES
// ══════════════════════════════════════════════════════════════════════════════
function completeAppointment(id) {
    const appt = appointments.find(a => a.id === id);
    if (appt && confirm('¿Marcar esta cita como completada?')) {
        appt.completed = true;
        localStorage.setItem('vetAppointments', JSON.stringify(appointments));
        renderAll();
        showToast('✅ Cita completada');
    }
}

function deleteClient(id) {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
        clients = clients.filter(c => c.id !== id);
        localStorage.setItem('vetClients', JSON.stringify(clients));
        renderAll();
        showToast('🗑️ Cliente eliminado');
    }
}

function deletePet(id) {
    if (confirm('¿Estás seguro de eliminar esta mascota?')) {
        pets = pets.filter(p => p.id !== id);
        localStorage.setItem('vetPets', JSON.stringify(pets));
        renderAll();
        showToast('🗑️ Mascota eliminada');
    }
}

function viewClient(id) {
    const client = clients.find(c => c.id === id);
    if (client) {
        const clientPets = pets.filter(p => p.owner === client.id);
        alert(`👤 ${client.name}\n\n📋 Cédula: ${client.cedula}\n📞 Teléfono: ${client.phone}\n✉️ Email: ${client.email || 'No registrado'}\n📍 Dirección: ${client.address || 'No especificada'}\n\n🐾 Mascotas: ${clientPets.map(p => `${getPetIcon(p.type)} ${p.name}`).join(', ') || 'Sin mascotas'}`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// FILTROS DE BÚSQUEDA
// ══════════════════════════════════════════════════════════════════════════════
function filterClients() {
    const search = document.getElementById('clientSearch').value.toLowerCase();
    renderAllClients(clients.filter(c => 
        [c.name, c.cedula, c.email || '', c.phone].some(f => f.toLowerCase().includes(search))
    ));
}

function filterPets() {
    const search = document.getElementById('petSearch').value.toLowerCase();
    renderAllPets(pets.filter(p => {
        const owner = clients.find(c => c.id === p.owner);
        return p.name.toLowerCase().includes(search) || 
            (owner && (owner.name.toLowerCase().includes(search) || owner.cedula.includes(search)));
    }));
}

function filterHistory() {
    const search = document.getElementById('historySearch').value.toLowerCase();
    renderHistory(history.filter(h => {
        const pet = pets.find(p => p.id === h.petId);
        const owner = pet ? clients.find(c => c.id === pet.owner) : null;
        return h.diagnosis.toLowerCase().includes(search) || 
            (pet && pet.name.toLowerCase().includes(search)) || 
            (owner && owner.name.toLowerCase().includes(search));
    }));
}

function globalSearchFn() {
    const search = document.getElementById('globalSearch').value.toLowerCase();
    const results = document.getElementById('searchResults');
    
    if (!search) {
        results.innerHTML = '';
        return;
    }
    
    const matchedClients = clients.filter(c => c.name.toLowerCase().includes(search) || c.cedula.includes(search));
    const matchedPets = pets.filter(p => p.name.toLowerCase().includes(search));
    
    let html = '';
    if (matchedClients.length) {
        html += `<h4 style="margin: 1rem 0 0.5rem; color: var(--primary);">👥 Clientes</h4>`;
        html += matchedClients.map(c => `<div class="appointment-card">${c.name} <span class="ci-badge">CI: ${c.cedula}</span> - ${c.phone}</div>`).join('');
    }
    if (matchedPets.length) {
        html += `<h4 style="margin: 1rem 0 0.5rem; color: var(--primary);">🐾 Mascotas</h4>`;
        html += matchedPets.map(p => `<div class="appointment-card">${getPetIcon(p.type)} ${p.name}</div>`).join('');
    }
    
    results.innerHTML = html || '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No se encontraron resultados</p>';
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES TOAST
// ══════════════════════════════════════════════════════════════════════════════
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDERIZAR TODO
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
// CERRAR AUTOCOMPLETADO AL HACER CLIC FUERA
// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrapper')) {
        document.querySelectorAll('.autocomplete-list').forEach(el => el.classList.remove('show'));
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initSampleData();
    initNavigation();
    createFloatingPaws();
    renderAll();
});
