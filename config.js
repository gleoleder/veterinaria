// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    ARCHIVO DE CONFIGURACIÓN - config.js                      ║
// ║                         Sistema VetCare v2.0                                 ║
// ║                    Sistema de Gestión Veterinaria                            ║
// ║                                                                              ║
// ║  Este archivo contiene todas las configuraciones necesarias para conectar   ║
// ║  el sistema con Google Sheets. Aquí se definen:                             ║
// ║  - ID del documento de Google Sheets                                        ║
// ║  - Credenciales de la API de Google                                         ║
// ║  - Nombres de las hojas que componen la base de datos                       ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    
    // ══════════════════════════════════════════════════════════════════════════
    // ID DEL DOCUMENTO DE GOOGLE SHEETS
    // ══════════════════════════════════════════════════════════════════════════
    // Este ID se encuentra en la URL de tu Google Sheet:
    // https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
    // ══════════════════════════════════════════════════════════════════════════
    GOOGLE_SHEET_ID: '11oCI6wOd_w2-YvVyChTeNvVlM-ULw0Ha2Yey4c08AhY',
    
    // ══════════════════════════════════════════════════════════════════════════
    // CREDENCIALES DE GOOGLE API
    // ══════════════════════════════════════════════════════════════════════════
    // Estas credenciales se obtienen desde la consola de Google Cloud Platform.
    // CLIENT_ID: Identifica la aplicación ante Google
    // API_KEY: Clave para acceder a la API de Google Sheets
    // ══════════════════════════════════════════════════════════════════════════
    CLIENT_ID: '814005655098-8csk41qts3okv4b2fjnq7ls4qc2kq0vc.apps.googleusercontent.com',
    API_KEY: 'AIzaSyAOhGTjJXHhuUhqf1g2DPCla59xNzftb-Q',
    
    // ══════════════════════════════════════════════════════════════════════════
    // ID DE LA CARPETA DE GOOGLE DRIVE PARA ARCHIVOS ADJUNTOS
    // ══════════════════════════════════════════════════════════════════════════
    // Esta carpeta almacenará las fotos, radiografías, análisis y documentos
    // de las mascotas. Se creará automáticamente si no existe.
    // ══════════════════════════════════════════════════════════════════════════
    DRIVE_FOLDER_ID: '', // Dejar vacío para crear automáticamente
    
    // ══════════════════════════════════════════════════════════════════════════
    // NOMBRES DE LAS HOJAS DE LA BASE DE DATOS
    // ══════════════════════════════════════════════════════════════════════════
    // Estos nombres deben coincidir EXACTAMENTE con los nombres de las hojas
    // en tu documento de Google Sheets (incluyendo mayúsculas/minúsculas)
    // ══════════════════════════════════════════════════════════════════════════
    SHEETS: {
        // ══════════════════════════════════════════════════════════════════════
        // CLIENTES: Almacena la información de los dueños de mascotas
        // Estructura: ID | Cedula | Nombre | Telefono | Email | Direccion | FechaRegistro
        // El teléfono debe estar en formato internacional para WhatsApp (ej: 59170000000)
        // Ejemplo: 1 | 12345678 | Juan Pérez | 59170000000 | juan@email.com | Av. Principal #123 | 2025-01-15
        // ══════════════════════════════════════════════════════════════════════
        CLIENTES: 'Clientes',
        
        // ══════════════════════════════════════════════════════════════════════
        // MASCOTAS: Almacena la información de todas las mascotas registradas
        // Estructura: ID | Nombre | Tipo | Raza | Edad | Peso | ClienteID | CedulaDueno | Notas | FechaRegistro
        // Tipo: perro | gato | ave | conejo | otro
        // Ejemplo: 1 | Max | perro | Golden Retriever | 3 años | 28 | 1 | 12345678 | Muy activo | 2025-01-15
        // ══════════════════════════════════════════════════════════════════════
        MASCOTAS: 'Mascotas',
        
        // ══════════════════════════════════════════════════════════════════════
        // CITAS: Almacena las citas programadas
        // Estructura: ID | MascotaID | ClienteID | Fecha | Hora | TipoConsulta | Notas | Estado | WhatsAppEnviado | FechaCreacion
        // TipoConsulta: checkup | vaccine | surgery | grooming | emergency | dental
        // Estado: PENDIENTE | COMPLETADA | CANCELADA
        // WhatsAppEnviado: TRUE | FALSE (indica si se envió el recordatorio)
        // Ejemplo: 1 | 1 | 1 | 2025-01-20 | 09:00 | checkup | Revisión anual | PENDIENTE | TRUE | 2025-01-15
        // ══════════════════════════════════════════════════════════════════════
        CITAS: 'Citas',
        
        // ══════════════════════════════════════════════════════════════════════
        // HISTORIAL_CLINICO: Almacena el historial médico de cada mascota
        // Estructura: ID | MascotaID | ClienteID | Fecha | TipoConsulta | Diagnostico | Tratamiento | Medicamentos | Veterinario | FechaCreacion
        // TipoConsulta: checkup | vaccine | surgery | treatment | emergency
        // Ejemplo: 1 | 1 | 1 | 2025-01-15 | vaccine | Vacunación preventiva | Vacuna aplicada | N/A | Dr. García | 2025-01-15T10:30:00
        // ══════════════════════════════════════════════════════════════════════
        HISTORIAL_CLINICO: 'Historial_Clinico',
        
        // ══════════════════════════════════════════════════════════════════════
        // ARCHIVOS_ADJUNTOS: Almacena los links de archivos subidos a Google Drive
        // Estructura: ID | HistorialID | MascotaID | ClienteID | NombreArchivo | TipoArchivo | TamañoKB | URLDrive | FechaSubida
        // TipoArchivo: image/jpeg | image/png | application/pdf | etc.
        // URLDrive: Link directo al archivo en Google Drive
        // Ejemplo: 1 | 1 | 1 | 1 | radiografia_torax.jpg | image/jpeg | 256 | https://drive.google.com/file/d/xxx/view | 2025-01-15
        // ══════════════════════════════════════════════════════════════════════
        ARCHIVOS_ADJUNTOS: 'Archivos_Adjuntos',
        
        // ══════════════════════════════════════════════════════════════════════
        // USUARIOS_AUTORIZADOS: Almacena los emails de Google autorizados para usar el sistema
        // Estructura: Email | Nombre | Rol | Activo
        // Rol: admin | veterinario | recepcionista
        // Ejemplo: leoleder1@gmail.com | Leo | admin | TRUE
        // ══════════════════════════════════════════════════════════════════════
        USUARIOS_AUTORIZADOS: 'Usuarios_Autorizados'
    },
    
    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURACIÓN DE WHATSAPP
    // ══════════════════════════════════════════════════════════════════════════
    WHATSAPP: {
        // Mensaje de recordatorio de cita (variables: {cliente}, {mascota}, {fecha}, {hora}, {tipo})
        MENSAJE_RECORDATORIO: `🐾 *RECORDATORIO DE CITA - VetCare*

Hola {cliente}! 👋

Le recordamos su cita programada:

📅 *Fecha:* {fecha}
🕐 *Hora:* {hora}
🐕 *Mascota:* {mascota}
💉 *Tipo:* {tipo}

¡Lo esperamos! 🏥

_VetCare - Cuidamos a tu mejor amigo_`,

        // Mensaje de confirmación de cita agendada
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
        
        // Zona horaria para fechas y horas
        TIMEZONE: 'America/La_Paz',
        
        // Formato de fecha preferido
        DATE_FORMAT: 'DD/MM/YYYY',
        
        // Tamaño máximo de archivos en MB
        MAX_FILE_SIZE_MB: 10,
        
        // Tipos de archivos permitidos
        ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        
        // Horario de atención (para validaciones de citas)
        HORARIO: {
            APERTURA: '08:00',
            CIERRE: '20:00',
            DIAS_LABORALES: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
        }
    }
};
