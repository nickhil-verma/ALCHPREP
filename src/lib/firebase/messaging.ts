import { admin, isFirebaseConfigured } from './admin';
import { DeviceTokenRepository } from '@/repositories/device-token.repository';
import { logger } from '@/lib/utils/logger';

/**
 * Sends a push notification to a list of FCM device tokens.
 * Handles stale/invalid token feedback by deactivating them in the database.
 */
export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (tokens.length === 0) return;

  if (!isFirebaseConfigured) {
    logger.info(
      `[SIMULATED PUSH NOTIFICATION]\nTo: ${tokens.length} devices\nTitle: "${title}"\nBody: "${body}"\nData: ${JSON.stringify(
        data || {}
      )}`
    );
    return;
  }

  // FCM multicast supports max 500 tokens per call, so we batch it
  const batchSize = 500;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const tokenBatch = tokens.slice(i, i + batchSize);

    const message = {
      tokens: tokenBatch,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      
      logger.info(
        `FCM Batch sent: ${response.successCount} successes, ${response.failureCount} failures`
      );

      // Handle failures (clean up deactivated or invalid tokens)
      if (response.failureCount > 0) {
        response.responses.forEach((res, index) => {
          if (!res.success && res.error) {
            const errorToken = tokenBatch[index];
            const code = res.error.code;

            // Tokens that are no longer registered or invalid should be deactivated
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              logger.info(`Deactivating invalid FCM token: ${errorToken.substring(0, 15)}...`);
              DeviceTokenRepository.deactivateToken(errorToken).catch((err) =>
                logger.error('Failed to deactivate invalid token', err)
              );
            } else {
              logger.error(`FCM token send error: ${code}`, res.error);
            }
          }
        });
      }
    } catch (error) {
      logger.error('Error sending multicast message to FCM', error);
    }
  }
}
