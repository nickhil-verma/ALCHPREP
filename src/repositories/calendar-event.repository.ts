import { BaseRepository } from './base.repository';
import { CalendarEvent, ICalendarEventDocument } from '@/models/calendar-event.model';

class CalendarEventRepositoryClass extends BaseRepository<ICalendarEventDocument> {
  constructor() {
    super(CalendarEvent);
  }

  async findByDateRange(
    userId: string,
    start: Date,
    end: Date
  ): Promise<ICalendarEventDocument[]> {
    return this.find(
      { user_id: userId, start: { $gte: start, $lte: end } } as never,
      { sort: { start: 1 } }
    );
  }

  async findUpcoming(userId: string, limit: number = 10): Promise<ICalendarEventDocument[]> {
    return this.find(
      { user_id: userId, start: { $gte: new Date() } } as never,
      { sort: { start: 1 }, limit }
    );
  }
}

export const CalendarEventRepository = new CalendarEventRepositoryClass();
