# 🐾 VetCare - Guía de Configuración

## PASO 1: Crear Proyecto en Google Cloud

1. Ve a: https://console.cloud.google.com/
2. Clic en el selector de proyectos → **NUEVO PROYECTO**
3. Nombre: `VetCare`
4. Clic en **CREAR**
5. Selecciona el proyecto creado

---

## PASO 2: Habilitar APIs

1. Menú → **APIs y servicios** → **Biblioteca**
2. Buscar y habilitar:
   - **Google Sheets API** → HABILITAR
   - **Google Drive API** → HABILITAR

---

## PASO 3: Configurar Pantalla de Consentimiento

1. Menú → **APIs y servicios** → **Pantalla de consentimiento OAuth**
2. Seleccionar: **Externo** → CREAR
3. Completar:
   - Nombre de la app: `VetCare`
   - Correo de asistencia: tu email
   - Correo del desarrollador: tu email
4. Clic en **GUARDAR Y CONTINUAR**
5. En Permisos → **AGREGAR O QUITAR PERMISOS**
6. Buscar y agregar:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
7. Clic en **ACTUALIZAR** → **GUARDAR Y CONTINUAR**
8. En Usuarios de prueba → **ADD USERS**
9. Agregar tu email de Google
10. **GUARDAR Y CONTINUAR**

---

## PASO 4: Crear Credenciales

### 4.1 Crear Client ID (OAuth 2.0)

1. Menú → **APIs y servicios** → **Credenciales**
2. Clic en **+ CREAR CREDENCIALES** → **ID de cliente de OAuth**
3. Tipo: **Aplicación web**
4. Nombre: `VetCare Web`
5. En **Orígenes de JavaScript autorizados** agregar:
   ```
   http://localhost
   http://127.0.0.1
   http://localhost:5500
   http://127.0.0.1:5500
   ```
   (Si usas hosting, agrega también tu URL)
6. Clic en **CREAR**
7. **COPIA el ID de cliente** (termina en .apps.googleusercontent.com)

### 4.2 Crear API Key

1. Clic en **+ CREAR CREDENCIALES** → **Clave de API**
2. **COPIA la clave**
3. Clic en **RESTRINGIR CLAVE**
4. En Restricciones de API → Seleccionar:
   - Google Sheets API
   - Google Drive API
5. **GUARDAR**

---

## PASO 5: Crear Google Sheet

1. Ve a: https://sheets.google.com
2. Crear nuevo documento
3. Nombre: `VetCare DB`
4. **Copia el ID** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/[COPIA_ESTE_ID]/edit
   ```

### 5.1 Crear Hojas con Encabezados

**Hoja 1: `Clientes`** (renombra la hoja existente)
```
A1: ID
B1: Cedula
C1: Nombre
D1: Telefono
E1: Email
F1: Direccion
G1: Color
H1: FechaRegistro
```

**Hoja 2: `Mascotas`** (clic en + para agregar hoja)
```
A1: ID
B1: Nombre
C1: Tipo
D1: Raza
E1: Edad
F1: Peso
G1: ClienteID
H1: CedulaDueno
I1: Notas
J1: FechaRegistro
```

**Hoja 3: `Citas`**
```
A1: ID
B1: MascotaID
C1: ClienteID
D1: Fecha
E1: Hora
F1: TipoConsulta
G1: Notas
H1: Estado
I1: WhatsApp
J1: FechaCreacion
```

**Hoja 4: `Historial`**
```
A1: ID
B1: MascotaID
C1: ClienteID
D1: Fecha
E1: TipoConsulta
F1: Diagnostico
G1: Tratamiento
H1: Medicamentos
I1: Veterinario
J1: FechaCreacion
```

**Hoja 5: `Archivos`**
```
A1: ID
B1: HistorialID
C1: MascotaID
D1: ClienteID
E1: NombreArchivo
F1: TipoArchivo
G1: TamanoKB
H1: URLDrive
I1: FechaSubida
```

---

## PASO 6: Configurar config.js

Abre `config.js` y reemplaza:

```javascript
const CONFIG = {
    GOOGLE_SHEET_ID: 'PEGA_AQUI_EL_ID_DEL_SHEET',
    CLIENT_ID: 'PEGA_AQUI_TU_CLIENT_ID.apps.googleusercontent.com',
    API_KEY: 'PEGA_AQUI_TU_API_KEY',
    DRIVE_FOLDER_ID: '',
    // ... resto igual
};
```

---

## PASO 7: Ejecutar la Aplicación

### Opción A: Live Server (VS Code)
1. Instala extensión "Live Server"
2. Abre la carpeta del proyecto
3. Clic derecho en `index.html` → "Open with Live Server"

### Opción B: Servidor Python
```bash
python -m http.server 8000
# Luego abre http://localhost:8000
```

### Opción C: Servidor Node
```bash
npx serve
```

---

## PASO 8: Primera Prueba

1. Abre la aplicación en el navegador
2. Clic en **Iniciar Sesión con Google**
3. Selecciona tu cuenta de Google
4. Acepta los permisos
5. ¡Listo! Ya puedes usar el sistema

---

## ❓ Solución de Problemas

### Error: "Error al iniciar sesión"
- Verifica que el CLIENT_ID sea correcto
- Verifica que tu email esté en "Usuarios de prueba"

### Error: "No autorizado" o "origen no válido"
- Agrega la URL desde donde accedes en "Orígenes autorizados"
- Incluye http:// o https:// exactamente

### Los datos no se guardan
- Verifica que el GOOGLE_SHEET_ID sea correcto
- Verifica que los nombres de las hojas sean EXACTOS

### Error 403 Forbidden
- Las APIs no están habilitadas
- Ve a Google Cloud Console y habilita Sheets API y Drive API

---

## 📱 Notas sobre WhatsApp

- Los teléfonos deben estar en formato internacional
- Ejemplo Bolivia: `59170000000` (sin +, sin espacios)
- El sistema abre WhatsApp Web automáticamente

---

## ✅ Checklist

- [ ] Proyecto creado en Google Cloud
- [ ] Google Sheets API habilitada
- [ ] Google Drive API habilitada
- [ ] Pantalla de consentimiento configurada
- [ ] Usuario de prueba agregado
- [ ] Client ID creado y copiado
- [ ] API Key creada y copiada
- [ ] Google Sheet creado con 5 hojas
- [ ] Encabezados en cada hoja
- [ ] config.js actualizado
- [ ] Aplicación ejecutándose en servidor local
- [ ] Login con Google exitoso
