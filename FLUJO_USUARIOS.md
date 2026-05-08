# Flujo de Gestión de Usuarios - Opción 1 + 2

Este documento explica cómo funciona el sistema de gestión de usuarios con acceso restringido donde:
- **Tú (admin)** creas usuarios manualmente en Firebase
- **Los usuarios** establecen y gestionan su propia contraseña

## 🔐 Cómo Funciona

### Flujo Completo

1. **Admin crea usuario en Firebase** (solo email, sin contraseña)
2. **Sistema envía email de invitación** para establecer contraseña
3. **Usuario establece su contraseña** mediante el enlace
4. **Usuario puede cambiar su contraseña** cuando quiera desde su perfil

---

## 📝 Paso a Paso

### Paso 1: Admin Crea Usuario en Firebase

1. Ve a **Firebase Console** → **Authentication** → **Users**
2. Click en **"Add user"** (o "Agregar usuario")
3. Ingresa **solo el email** del usuario (ej: `usuario@agro.com`)
4. **Deja la contraseña vacía** o usa una contraseña temporal que el usuario cambiará
5. Click en **"Add user"**

**Opción A: Crear usuario sin contraseña inicial (Recomendado)**
- Firebase no permite crear usuarios sin contraseña directamente
- Usa una contraseña temporal fuerte (ej: `Temp123!@#`)
- Envía inmediatamente el enlace para establecer contraseña

**Opción B: Crear usuario y enviar enlace de restablecimiento**
- Crea usuario con contraseña temporal
- Luego envía enlace de restablecimiento de contraseña

### Paso 2: Enviar Enlace de Establecimiento de Contraseña

Hay dos formas de hacerlo:

#### Método A: Desde Firebase Console (Manual)

1. En la lista de usuarios, encuentra el usuario recién creado
2. Click en el usuario
3. Click en **"Reset password"** (Restablecer contraseña)
4. Firebase enviará un email al usuario con el enlace

#### Método B: Automático al crear usuario (Requiere implementación)

Si quieres automatizar esto, puedes crear un script o usar Cloud Functions para enviar el enlace automáticamente al crear un usuario.

### Paso 3: Usuario Establece su Contraseña

1. El usuario recibe un email con un enlace tipo:
   ```
   https://tu-app.com/setup-password?mode=resetPassword&oobCode=CODIGO_AQUI
   ```
2. Click en el enlace
3. Se abre la página `/setup-password` en tu aplicación
4. El usuario ingresa su nueva contraseña
5. Confirmar contraseña
6. Click en "Establecer Contraseña"
7. Redirección automática a `/login`

### Paso 4: Usuario Inicia Sesión

1. Va a `/login`
2. Ingresa su email y la contraseña que estableció
3. Accede a la aplicación

### Paso 5: Usuario Cambia su Contraseña (Opcional, cuando quiera)

1. Va a **"Mi Perfil"** en la aplicación
2. Click en **"Cambiar Contraseña"**
3. Se envía un email con enlace de restablecimiento
4. Click en el enlace del email
5. Ingresa nueva contraseña
6. Confirmar

---

## 🔧 Configuración en Firebase

### 1. Configurar Email Templates

1. Ve a **Firebase Console** → **Authentication** → **Templates**
2. Selecciona **"Password reset"** (Restablecer contraseña)
3. **IMPORTANTE:** Configura la URL de acción personalizada:
   - Habilita "Customize action URL"
   - Ingresa: `https://tu-dominio.com/setup-password`
   - O para desarrollo: `http://localhost:3000/setup-password`
   - Firebase agregará automáticamente: `?mode=resetPassword&oobCode=...`
4. Personaliza el texto del email si quieres (opcional)

**Template sugerido:**
```
Asunto: Establece tu contraseña para Agro Notes

Hola,

Has sido invitado a usar Agro Notes. Establece tu contraseña haciendo clic en el siguiente enlace:

{{link}}

Este enlace expira en 1 hora.

Si no solicitaste esto, puedes ignorar este email.

Saludos,
Equipo Agro Notes
```

### 2. Configurar Dominio Autorizado

1. Ve a **Authentication** → **Settings** → **Authorized domains**
2. Agrega tu dominio de producción
3. `localhost` ya está incluido para desarrollo

### 3. Configurar Whitelist en Backend

En `agro-notes-api/.env`:
```env
AUTHORIZED_EMAILS=usuario1@agro.com,usuario2@agro.com,admin@agro.com
```

**IMPORTANTE:** Después de agregar un nuevo usuario en Firebase, **agrégalo también a esta lista** para que pueda acceder a la API.

---

## 📧 Templates de Email Personalizados

Puedes personalizar el email que reciben los usuarios en Firebase Console → Authentication → Templates.

**Template sugerido para "Password reset":**

```
Asunto: Establece tu contraseña para Agro Notes

Hola,

Has sido invitado a usar Agro Notes. Establece tu contraseña haciendo clic en el siguiente enlace:

{{link}}

Este enlace expira en 1 hora.

Si no solicitaste esto, puedes ignorar este email.

Saludos,
Equipo Agro Notes
```

---

## 🛠️ Comandos Útiles

### Agregar Nuevo Usuario Rápidamente

**Script manual (ejecutar en terminal de Firebase Console o usar Admin SDK):**

```javascript
// Esto requeriría implementar una función con Firebase Admin SDK
// Por ahora, hazlo manualmente desde la consola
```

### Verificar Usuarios Autorizados

El backend muestra un log al iniciar indicando cuántos emails están autorizados:
```
⚠️  No hay emails autorizados configurados. Todos los usuarios podrán acceder.
```
o
```
✓ X emails autorizados configurados
```

---

## 🔒 Seguridad

### Buenas Prácticas

1. **Contraseñas temporales fuertes:**
   - Usa contraseñas aleatorias fuertes al crear usuarios
   - No compartas la contraseña temporal con el usuario
   - Siempre envía el enlace de restablecimiento

2. **Expiración de enlaces:**
   - Los enlaces de Firebase expiran en 1 hora por defecto
   - Configúralo en Firebase Console si necesitas más tiempo

3. **Whitelist siempre actualizada:**
   - Cada vez que agregues un usuario, agrégalo a `AUTHORIZED_EMAILS`
   - Mantén la lista sincronizada

4. **Revisar usuarios activos:**
   - Revisa periódicamente la lista de usuarios en Firebase
   - Deshabilita o elimina usuarios que ya no necesiten acceso

---

## ❓ Preguntas Frecuentes

### ¿Puedo crear usuarios sin contraseña inicial?

Firebase requiere una contraseña al crear usuario. La solución es:
1. Crear con contraseña temporal fuerte
2. Enviar inmediatamente enlace de restablecimiento
3. Usuario establece su propia contraseña

### ¿Qué pasa si el usuario pierde el enlace?

El usuario puede:
1. Ir a `/login`
2. Click en "Olvidé mi contraseña" (si lo implementas)
3. O tú puedes enviar un nuevo enlace desde Firebase Console

### ¿Puedo deshabilitar el registro público?

Sí, pero Firebase no tiene una opción directa para esto. La solución es:
- No mostrar el botón de registro en el frontend (ya está hecho)
- Verificar en el backend con whitelist (ya está implementado)

### ¿Los usuarios pueden cambiarse el email?

No por defecto. Si lo necesitas, deberías implementar una función con Firebase Admin SDK para actualizar el email.

---

## 🚀 Resumen del Flujo

```
1. Admin → Firebase Console → Crear usuario (email + temp password)
2. Admin → Enviar enlace de restablecimiento
3. Usuario → Recibe email → Click en enlace
4. Usuario → /setup-password → Establece contraseña
5. Usuario → /login → Inicia sesión
6. Usuario → /profile → Puede cambiar contraseña cuando quiera
```

---

## 📋 Checklist para Agregar Nuevo Usuario

- [ ] Crear usuario en Firebase Console
- [ ] Enviar enlace de restablecimiento de contraseña
- [ ] Agregar email a `AUTHORIZED_EMAILS` en `.env` del backend
- [ ] Reiniciar backend para cargar nueva lista
- [ ] Informar al usuario que revise su email
- [ ] Verificar que el usuario pueda iniciar sesión

---

¿Necesitas ayuda con algún paso? Revisa `CONFIGURACION_FIREBASE.md` para más detalles.
