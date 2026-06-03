import * as admin from 'firebase-admin';
import { logger } from '@/lib/utils/logger';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let isFirebaseConfigured = false;

if (!projectId || !clientEmail || !privateKey) {
  logger.warn(
    'Firebase Admin environment variables are not fully set (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Push notifications will be simulated in console.'
  );
} else {
  try {
    if (admin.apps.length === 0) {
      // Format private key correctly (replace escaped newlines from env strings)
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
      logger.info('Firebase Admin SDK initialized successfully');
    }
    isFirebaseConfigured = true;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK', error);
  }
}

export { admin, isFirebaseConfigured };
