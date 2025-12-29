/* ══════════════════════════════════════════════════════════════════════
   VetCare - Archivo de Configuración
   
   INSTRUCCIONES:
   1. Crea un proyecto en Google Cloud Console
   2. Habilita: Google Sheets API, Google Drive API
   3. Crea credenciales OAuth 2.0 (aplicación web)
   4. Crea una API Key
   5. Crea un Google Sheet con las hojas especificadas abajo
   6. Reemplaza los valores de este archivo
   ══════════════════════════════════════════════════════════════════════ */

const CONFIG = {
    
    // ═══════════════════════════════════════════════════════════════════
    // GOOGLE SHEETS - ID del documento
    // ═══════════════════════════════════════════════════════════════════
    // Obtén el ID de la URL de tu Google Sheet:
    // https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
    // ═══════════════════════════════════════════════════════════════════
    GOOGLE_SHEET_ID: 'TU_GOOGLE_SHEET_ID_AQUI',
    
    // ═══════════════════════════════════════════════════════════════════
    // CREDENCIALES DE GOOGLE CLOUD
    // ═══════════════════════════════════════════════════════════════════
    // Ve a: console.cloud.google.com > APIs y servicios > Credenciales
    // ═══════════════════════════════════════════════════════════════════
    CLIENT_ID: 'TU_CLIENT_ID.apps.googleusercontent.com',
    API_KEY: 'TU_API_KEY',
    
    // ═══════════════════════════════════════════════════════════════════
    // GOOGLE DRIVE - Carpeta para archivos (opcional)
    // ═══════════════════════════════════════════════════════════════════
    // Crea una carpeta en Drive y obtén el ID de la URL:
    // https://drive.google.com/drive/folders/[ESTE_ES_EL_ID]
    // Déjalo vacío '' para guardar en la raíz de Drive
    // ═══════════════════════════════════════════════════════════════════
    DRIVE_FOLDER_ID: '',
    
    // ═══════════════════════════════════════════════════════════════════
    // NOMBRES DE LAS HOJAS EN GOOGLE SHEETS
    // ═══════════════════════════════════════════════════════════════════
    // Crea estas hojas en tu Google Sheet con ESTOS NOMBRES EXACTOS
    // y los encabezados indicados en la fila 1
    // ═══════════════════════════════════════════════════════════════════
    SHEETS: {
        // Hoja: Clientes
        // Encabezados: ID | Cedula | Nombre | Telefono | Email | Direccion | Color | FechaRegistro
        CLIENTES: 'Clientes',
        
        // Hoja: Mascotas
        // Encabezados: ID | Nombre | Tipo | Raza | Edad | Peso | ClienteID | CedulaDueno | Notas | FechaRegistro
        MASCOTAS: 'Mascotas',
        
        // Hoja: Citas
        // Encabezados: ID | MascotaID | ClienteID | Fecha | Hora | TipoConsulta | Notas | Estado | WhatsApp | FechaCreacion
        CITAS: 'Citas',
        
        // Hoja: Historial
        // Encabezados: ID | MascotaID | ClienteID | Fecha | TipoConsulta | Diagnostico | Tratamiento | Medicamentos | Veterinario | FechaCreacion
        HISTORIAL: 'Historial',
        
        // Hoja: Archivos
        // Encabezados: ID | HistorialID | MascotaID | ClienteID | NombreArchivo | TipoArchivo | TamanoKB | URLDrive | FechaSubida
        ARCHIVOS: 'Archivos'
    }
};
