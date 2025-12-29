// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    ARCHIVO DE CONFIGURACIÓN - config.js                      ║
// ║                         Sistema VetCare v2.0                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
    
    // ID del documento de Google Sheets
    GOOGLE_SHEET_ID: '11oCI6wOd_w2-YvVyChTeNvVlM-ULw0Ha2Yey4c08AhY',
    
    // Credenciales de Google API
    CLIENT_ID: '814005655098-8csk41qts3okv4b2fjnq7ls4qc2kq0vc.apps.googleusercontent.com',
    API_KEY: 'AIzaSyAOhGTjJXHhuUhqf1g2DPCla59xNzftb-Q',
    
    // Carpeta de Drive para archivos (opcional - dejar vacío si no se usa)
    DRIVE_FOLDER_ID: '',
    
    // Nombres de las hojas en Google Sheets
    // IMPORTANTE: Deben coincidir EXACTAMENTE con los nombres de las pestañas
    SHEETS: {
        CLIENTES: 'Clientes',
        MASCOTAS: 'Mascotas',
        CITAS: 'Citas',
        HISTORIAL: 'Historial_Clinico',
        ARCHIVOS: 'Archivos_Adjuntos'
    }
};
