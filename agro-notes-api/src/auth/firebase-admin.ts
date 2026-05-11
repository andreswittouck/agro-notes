// agro-notes-api/src/auth/firebase-admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Inicializa Firebase Admin SDK con prioridad de fuentes:
 *
 * 1. `FIREBASE_ADMIN_CREDENTIALS` — JSON inline (1 línea). Recomendado
 *    para ambientes serverless / hosting donde no hay filesystem.
 * 2. `FIREBASE_ADMIN_KEY_PATH` — ruta al archivo JSON del service
 *    account. Recomendado para dev local.
 * 3. Application Default Credentials — fallback de Google Cloud
 *    (`gcloud auth application-default login` o variable
 *    `GOOGLE_APPLICATION_CREDENTIALS`).
 *
 * Si nada está configurado, lanzamos error claro al arrancar en vez de
 * dejar el SDK en un estado roto que rechaza todos los tokens con
 * "Unable to detect a Project Id".
 */
if (!admin.apps.length) {
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    try {
      const credentials = JSON.parse(
        process.env.FIREBASE_ADMIN_CREDENTIALS,
      ) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      console.log(
        `[firebase-admin] Inicializado con FIREBASE_ADMIN_CREDENTIALS (project_id=${
          (credentials as { project_id?: string })?.project_id ?? 'desconocido'
        })`,
      );
    } catch (e) {
      console.error('[firebase-admin] FIREBASE_ADMIN_CREDENTIALS no se pudo parsear como JSON.', e);
      throw new Error(
        'FIREBASE_ADMIN_CREDENTIALS inválida — debe ser el JSON del service account en una sola línea.',
      );
    }
  } else if (process.env.FIREBASE_ADMIN_KEY_PATH) {
    const keyPath = path.resolve(process.env.FIREBASE_ADMIN_KEY_PATH);
    if (!fs.existsSync(keyPath)) {
      throw new Error(
        `[firebase-admin] FIREBASE_ADMIN_KEY_PATH apunta a ${keyPath} pero el archivo no existe. ` +
          `Bajá el JSON del service account desde Firebase Console → Project settings → Service accounts → "Generate new private key" y guardalo en esa ruta.`,
      );
    }
    try {
      const raw = fs.readFileSync(keyPath, 'utf8');
      const parsed = JSON.parse(raw) as { project_id?: string };
      admin.initializeApp({
        credential: admin.credential.cert(keyPath),
      });
      console.log(
        `[firebase-admin] Inicializado con FIREBASE_ADMIN_KEY_PATH=${keyPath} (project_id=${
          parsed?.project_id ?? 'desconocido'
        })`,
      );
    } catch (e) {
      console.error('[firebase-admin] No se pudo leer/parsear el JSON del service account.', e);
      throw new Error(
        `FIREBASE_ADMIN_KEY_PATH=${keyPath} no contiene un JSON válido de service account.`,
      );
    }
  } else {
    // Fallback: Application Default Credentials. Si tampoco están,
    // initializeApp no falla, pero verifyIdToken sí — es lo que estabas
    // viendo. Mejor abortar acá con mensaje útil.
    if (
      !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      !process.env.GCLOUD_PROJECT &&
      process.env.NODE_ENV !== 'production'
    ) {
      throw new Error(
        'Firebase Admin no tiene credenciales configuradas. ' +
          'Definí FIREBASE_ADMIN_KEY_PATH (recomendado en dev) o ' +
          'FIREBASE_ADMIN_CREDENTIALS en el .env del API.',
      );
    }
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('[firebase-admin] Inicializado con Application Default Credentials.');
  }
}

export const firebaseAdmin = admin;
