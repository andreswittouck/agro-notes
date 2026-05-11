# Opciones para Restringir Acceso a la Aplicación

Hay varias formas de controlar quién puede acceder a la aplicación. Aquí están las opciones:

## Opción 1: Whitelist de Emails (✅ Implementada)

**Cómo funciona:**
- Solo los emails que agregues en la lista autorizada pueden acceder
- Se verifica en el backend al validar el token
- Puedes agregar emails desde variables de entorno

**Configuración:**

1. **En Firebase Console:**
   - Deja habilitado "Email/Password" para que los usuarios puedan registrarse
   - Los usuarios podrán crear cuentas, pero solo los autorizados podrán usar la app

2. **En el Backend (`.env`):**
   ```env
   AUTHORIZED_EMAILS=usuario1@agro.com,usuario2@agro.com,admin@agro.com
   ```

3. **Agregar usuarios:**
   - Opción A: Agregar manualmente en Firebase Console → Authentication → Users → "Add user"
   - Opción B: Permitir que se registren, pero solo los autorizados accederán

**Ventajas:**
- ✅ Control total sobre quién accede
- ✅ Fácil de gestionar
- ✅ No requiere cambios en el frontend

**Desventajas:**
- Los usuarios pueden registrarse pero no usar la app (experiencia confusa)

---

## Opción 2: Solo Creación Manual de Usuarios (Más Restrictivo)

**Cómo funciona:**
- Deshabilitas el registro público en Firebase
- Solo tú creas usuarios manualmente desde Firebase Console

**Configuración:**

1. **En Firebase Console:**
   - Authentication → Settings → "Users"
   - Deshabilita "Enable email/password signup" (o simplemente no les digas que pueden registrarse)
   - Para cada usuario:
     - Authentication → Users → "Add user"
     - Ingresa email y contraseña temporal
     - El usuario debe cambiar la contraseña al primer login

2. **En el Frontend:**
   - Remover el botón/opción de "Crear cuenta"
   - Solo mostrar "Iniciar sesión"

**Ventajas:**
- ✅ Control total desde el inicio
- ✅ No hay usuarios "fantasma" registrados

**Desventajas:**
- Más trabajo manual
- Requiere cambiar el frontend para ocultar registro

---

## Opción 3: Restricción por Dominio de Email

**Cómo funciona:**
- Solo permitir emails de ciertos dominios (ej: `@tuempresa.com`)

**Implementación requerida:**
- Modificar `AuthorizedUsersService` para validar dominios en lugar de emails específicos

**Ventajas:**
- Útil si todos los usuarios tienen el mismo dominio
- Fácil de escalar

**Desventajas:**
- Menos control granular
- Requiere cambios en el código

---

## Opción 4: Firebase Custom Claims (Avanzado)

**Cómo funciona:**
- Asignas "claims" personalizados a usuarios autorizados
- El backend verifica estos claims

**Implementación requerida:**
- Función Cloud Function o script para asignar claims
- Modificar el guard para verificar claims

**Ventajas:**
- Más escalable
- Permite roles y permisos

**Desventajas:**
- Más complejo de implementar
- Requiere Cloud Functions o scripts

---

## Recomendación: Opción 1 + Opción 2 Combinadas

**La mejor práctica es:**

1. **Deshabilitar registro público** (o no mostrar el botón en el frontend)
2. **Crear usuarios manualmente** en Firebase Console
3. **Usar whitelist** como capa adicional de seguridad

Esto te da:
- Control total sobre quién se registra
- Verificación adicional en el backend
- Seguridad en múltiples capas

---

## Configuración Recomendada

### Paso 1: Modificar el Frontend para ocultar registro

Edita `agro-notes/src/app/login/page.tsx` para remover el botón de registro, o mejor aún, crear una página de registro separada que solo tú uses.

### Paso 2: Configurar whitelist en backend

En `agro-notes-api/.env`:
```env
AUTHORIZED_EMAILS=usuario1@email.com,usuario2@email.com,admin@email.com
```

### Paso 3: Crear usuarios en Firebase

1. Ve a Firebase Console → Authentication → Users
2. Click en "Add user"
3. Ingresa email y contraseña temporal
4. Comparte las credenciales con el usuario
5. El usuario debe cambiar la contraseña al primer login

---

## Verificación Actual

La implementación actual usa **Opción 1** (Whitelist). Puedes verificar quién está autorizado revisando:

1. Variable de entorno `AUTHORIZED_EMAILS` en el backend
2. Los logs del servidor mostrarán cuántos emails están autorizados al iniciar

Si quieres implementar la Opción 2 (remover registro público), puedo ayudarte a modificar el frontend.
