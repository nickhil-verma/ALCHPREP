import { NextRequest } from 'next/server';
import { CronService } from '@/services/cron.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized attempt to trigger task reminders cron job');
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await CronService.runReminders();
    return successResponse({ message: 'Task reminders cron job executed successfully' });
  } catch (error) {
    logger.error('Error running task reminders cron job', error);
    return internalError('Cron execution failed');
  }
}
