// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    ARCHIVO DE CONFIGURACIÓN - config.js                      ║
// ║                         Sistema VetCare v2.0                                 ║
// ║                    Sistema de Gestión Veterinaria                            ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    
    // ══════════════════════════════════════════════════════════════════════════
    // ID DEL DOCUMENTO DE GOOGLE SHEETS
    // ══════════════════════════════════════════════════════════════════════════
    GOOGLE_SHEET_ID: '1AmFocVwvywXz6LOwggkFscXjEhx_FZvZCVmb-1ihm5I',
    
    // ══════════════════════════════════════════════════════════════════════════
    // CREDENCIALES DE GOOGLE API
    // ══════════════════════════════════════════════════════════════════════════
    CLIENT_ID: '488089624210-ns62tr4g9rqov3k2b85965c4p4fto028.apps.googleusercontent.com',
    API_KEY: 'AIzaSyDsIk-N9hDAzZN7vc9b2rUIhcA7D8ViOFk',
    
    // ══════════════════════════════════════════════════════════════════════════
    // ID DE LA CARPETA DE GOOGLE DRIVE PARA ARCHIVOS ADJUNTOS
    // ══════════════════════════════════════════════════════════════════════════
    DRIVE_FOLDER_ID: '',
    
    // ══════════════════════════════════════════════════════════════════════════
    // NOMBRES DE LAS HOJAS DE LA BASE DE DATOS
    // ══════════════════════════════════════════════════════════════════════════
    SHEETS: {
        // CLIENTES: ID | Cedula | Nombre | Telefono | Email | Direccion | FechaRegistro
        CLIENTES: 'Clientes',
        
        // MASCOTAS: ID | Nombre | Tipo | Raza | Edad | Peso | ClienteID | CedulaDueno | Notas | FechaRegistro
        MASCOTAS: 'Mascotas',
        
        // CITAS: ID | MascotaID | ClienteID | Fecha | Hora | TipoConsulta | Notas | Estado | WhatsAppEnviado | FechaCreacion
        CITAS: 'Citas',
        
        // HISTORIAL_CLINICO: ID | MascotaID | ClienteID | Fecha | TipoConsulta | Diagnostico | Tratamiento | Medicamentos | Veterinario | FechaCreacion
        HISTORIAL_CLINICO: 'Historial_Clinico',
        
        // ARCHIVOS_ADJUNTOS: ID | HistorialID | MascotaID | ClienteID | NombreArchivo | TipoArchivo | TamañoKB | URLDrive | FechaSubida
        ARCHIVOS_ADJUNTOS: 'Archivos_Adjuntos',
        
        // USUARIOS_AUTORIZADOS: Email | Nombre | Rol | Activo
        USUARIOS_AUTORIZADOS: 'Usuarios_Autorizados'
    },
    
    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURACIÓN DE WHATSAPP
    // ══════════════════════════════════════════════════════════════════════════
    WHATSAPP: {
        MENSAJE_RECORDATORIO: `🐾 *RECORDATORIO DE CITA - VetCare*

Hola {cliente}! 👋

Le recordamos su cita programada:

📅 *Fecha:* {fecha}
🕐 *Hora:* {hora}
🐕 *Mascota:* {mascota}
💉 *Tipo:* {tipo}

¡Lo esperamos! 🏥

_VetCare - Cuidamos a tu mejor amigo_`,

        MENSAJE_CITA_AGENDADA: `🐾 *CITA AGENDADA - VetCare*

Hola {cliente}! 👋

Su cita ha sido agendada exitosamente:

📅 *Fecha:* {fecha}
🕐 *Hora:* {hora}
🐕 *Mascota:* {mascota}
💉 *Tipo:* {tipo}
{notas}

¡Lo esperamos! 🏥

_VetCare - Cuidamos a tu mejor amigo_`
    },
    
    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURACIÓN DE LA APLICACIÓN
    // ══════════════════════════════════════════════════════════════════════════
    APP: {
        NOMBRE: 'VetCare',
        VERSION: '2.0',
        DESCRIPCION: 'Sistema de Gestión Veterinaria',
        TIMEZONE: 'America/La_Paz',
        DATE_FORMAT: 'DD/MM/YYYY',
        MAX_FILE_SIZE_MB: 10,
        ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        HORARIO: {
            APERTURA: '08:00',
            CIERRE: '20:00',
            DIAS_LABORALES: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
        },
        TIPOS_MASCOTA: [
            { id: 'dog', nombre: 'Perro', icono: '🐕' },
            { id: 'cat', nombre: 'Gato', icono: '🐱' },
            { id: 'bird', nombre: 'Ave', icono: '🐦' },
            { id: 'rabbit', nombre: 'Conejo', icono: '🐰' }
        ],
        TIPOS_CONSULTA: [
            { id: 'checkup', nombre: 'Revisión General', icono: '🩺' },
            { id: 'vaccine', nombre: 'Vacunación', icono: '💉' },
            { id: 'surgery', nombre: 'Cirugía', icono: '🏥' },
            { id: 'grooming', nombre: 'Estética', icono: '✨' },
            { id: 'emergency', nombre: 'Emergencia', icono: '🚨' },
            { id: 'dental', nombre: 'Dental', icono: '🦷' },
            { id: 'treatment', nombre: 'Tratamiento', icono: '💊' }
        ]
    }
};
