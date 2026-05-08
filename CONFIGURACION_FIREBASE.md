# Configuración de Firebase Auth

Este documento explica cómo configurar Firebase Authentication para el proyecto Agro Notes.

## 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Authentication** en el menú lateral
4. En la pestaña "Sign-in method", habilita:
   - **Email/Password**
   - **Google** (opcional pero recomendado)

## 2. Configuración del Frontend

### Obtener las credenciales de Firebase

1. En Firebase Console, ve a **Project Settings** (⚙️)
2. En la sección "Your apps", haz clic en el ícono web (`</>`)
3. Registra la app con un nombre (ej: "Agro Notes Web")
4. Copia las credenciales que se muestran

### Configurar variables de entorno

Crea o actualiza el archivo `.env.local` en `agro-notes/`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
```

## 3. Configuración del Backend

### Obtener credenciales de Firebase Admin

1. En Firebase Console, ve a **Project Settings** → **Service accounts**
2. Haz clic en **Generate new private key**
3. Descarga el archivo JSON con las credenciales

### Opción A: Usar variable de entorno (Recomendado para producción)

Convierte el JSON a una sola línea y agrégalo a `.env` en `agro-notes-api/`:

```env
FIREBASE_ADMIN_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

### Opción B: Usar archivo de credenciales (Recomendado para desarrollo)

1. Coloca el archivo JSON descargado en `agro-notes-api/` (ej: `firebase-admin-key.json`)
2. Agrega a `.gitignore`:
   ```
   firebase-admin-key.json
   ```
3. En `.env`:
   ```env
   FIREBASE_ADMIN_KEY_PATH=./firebase-admin-key.json
   ```

### Opción C: Application Default Credentials (Para producción en GCP)

Si el backend está desplegado en Google Cloud Platform, puedes usar Application Default Credentials sin configurar nada adicional.

## 4. Instalación de Dependencias

### Frontend

```bash
cd agro-notes
npm install firebase
```

### Backend

```bash
cd agro-notes-api
npm install firebase-admin
```

## 5. Configurar Dominios Autorizados

En Firebase Console → Authentication → Settings → Authorized domains:
- Agrega tu dominio de producción
- `localhost` ya está incluido por defecto para desarrollo

## 6. Verificación

### Frontend

1. Inicia el servidor de desarrollo:
   ```bash
   cd agro-notes
   npm run dev
   ```

2. Ve a `http://localhost:3000/login`
3. Intenta crear una cuenta o iniciar sesión

### Backend

1. Inicia el servidor:
   ```bash
   cd agro-notes-api
   npm run start:dev
   ```

2. Verifica que el servidor inicie sin errores relacionados con Firebase Admin

3. Prueba un endpoint protegido desde Swagger (`http://localhost:4000/docs`):
   - Haz clic en "Authorize" en la parte superior
   - Ingresa un token de Firebase (puedes obtenerlo desde el frontend después de iniciar sesión)
   - Prueba un endpoint de notas

## 7. Obtener Token para Pruebas

Para probar los endpoints desde Swagger o Postman:

1. Inicia sesión en el frontend
2. Abre la consola del navegador (F12)
3. Ejecuta:
   ```javascript
   const user = firebase.auth().currentUser;
   user.getIdToken().then(token => console.log(token));
   ```
4. Copia el token y úsalo en Swagger/Postman como: `Bearer <token>`

## Troubleshooting

### Error: "Firebase Admin SDK initialization error"

- Verifica que las credenciales estén correctamente configuradas
- Asegúrate de que el archivo JSON de credenciales sea válido
- Verifica que las variables de entorno estén cargadas correctamente

### Error: "Token inválido o expirado"

- Los tokens de Firebase expiran después de 1 hora
- Obtén un nuevo token desde el frontend
- Verifica que el proyecto de Firebase sea el mismo en frontend y backend

### Error: "CORS" en el frontend

- Verifica que `CORS_ORIGIN` en el backend incluya `http://localhost:3000`
- O usa `*` para desarrollo (no recomendado para producción)

## Seguridad

⚠️ **Importante**:
- Nunca commitees archivos de credenciales de Firebase Admin
- Usa variables de entorno en producción
- Restringe los dominios autorizados en Firebase Console
- Usa HTTPS en producción
- Considera usar Firebase App Check para protección adicional
