import { TimetableEntry } from '../models/TimetableEntry.js';
import { DutyAssignment } from '../models/DutyAssignment.js';

/**
 * Checks if two time strings "HH:mm" overlap.
 */
export const isTimeOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

/**
 * Detects schedule conflicts for a proposed timetable entry.
 *
 * @param {Object} params
 * @param {string} params.faculty - Faculty ObjectId
 * @param {string} params.room - Room string/code
 * @param {string} params.classDivision - ClassDivision ObjectId
 * @param {string} params.dayOfWeek - Day string
 * @param {string} params.startTime - "HH:mm"
 * @param {string} params.endTime - "HH:mm"
 * @param {Date} [params.effectiveFrom]
 * @param {Date} [params.effectiveUntil]
 * @param {string} [params.excludeId] - ID of entry being updated
 * @returns {Promise<{ hasConflict: boolean, conflicts: string[] }>}
 */
export const detectTimetableConflicts = async ({
  faculty,
  room,
  classDivision,
  dayOfWeek,
  startTime,
  endTime,
  effectiveFrom = new Date(),
  effectiveUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  excludeId = null,
}) => {
  const conflicts = [];

  // 1. Time range validity check
  if (startTime >= endTime) {
    conflicts.push(`Invalid time range: start time (${startTime}) must be earlier than end time (${endTime}).`);
    return { hasConflict: true, conflicts };
  }

  // Find all active published timetable entries on this day of the week
  const query = {
    dayOfWeek,
    status: { $in: ['Published', 'Draft'] },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingEntries = await TimetableEntry.find(query)
    .populate('faculty', 'fullName email')
    .populate('subject', 'name code')
    .populate('classDivision', 'name');

  for (const entry of existingEntries) {
    if (isTimeOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
      // Check date range overlap
      const entryFrom = new Date(entry.effectiveFrom || 0);
      const entryUntil = new Date(entry.effectiveUntil || 9999999999999);
      const propFrom = new Date(effectiveFrom);
      const propUntil = new Date(effectiveUntil);

      const datesOverlap = propFrom <= entryUntil && propUntil >= entryFrom;
      if (!datesOverlap) continue;

      // Check Faculty Overlap
      if (entry.faculty && entry.faculty._id.toString() === faculty.toString()) {
        conflicts.push(
          `Faculty conflict: Prof. ${entry.faculty.fullName} is already scheduled for ${entry.subject?.name || 'a lecture'} with ${entry.classDivision?.name || 'another class'} from ${entry.startTime} to ${entry.endTime} on ${dayOfWeek}.`
        );
      }

      // Check Room Overlap
      if (room && entry.room && entry.room.trim().toLowerCase() === room.trim().toLowerCase()) {
        conflicts.push(
          `Room conflict: ${room} is already booked for ${entry.subject?.name || 'Class'} (${entry.classDivision?.name || ''}) from ${entry.startTime} to ${entry.endTime} on ${dayOfWeek}.`
        );
      }

      // Check Class Overlap
      if (entry.classDivision && entry.classDivision._id.toString() === classDivision.toString()) {
        conflicts.push(
          `Class conflict: Class ${entry.classDivision.name} is already assigned to ${entry.subject?.name || 'another lecture'} from ${entry.startTime} to ${entry.endTime} on ${dayOfWeek}.`
        );
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
};

/**
 * Detects schedule conflicts for a duty or substitution assignment.
 */
export const detectDutyConflicts = async ({
  faculty,
  date,
  startTime,
  endTime,
  room = '',
  excludeId = null,
}) => {
  const conflicts = [];

  if (startTime >= endTime) {
    conflicts.push(`Invalid time range: start time (${startTime}) must be earlier than end time (${endTime}).`);
    return { hasConflict: true, conflicts };
  }

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Determine day of week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[targetDate.getDay()];

  // Check against Timetable entries on that day of week
  const timetableEntries = await TimetableEntry.find({
    faculty,
    dayOfWeek,
    status: 'Published',
    effectiveFrom: { $lte: endOfDay },
    effectiveUntil: { $gte: startOfDay },
  })
    .populate('subject', 'name code')
    .populate('classDivision', 'name');

  for (const entry of timetableEntries) {
    if (isTimeOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
      conflicts.push(
        `Faculty duty conflict: Faculty already has a scheduled regular lecture for ${entry.subject?.name} (${entry.startTime} - ${entry.endTime}) on ${dayOfWeek}.`
      );
    }
  }

  // Check against other existing duties on that specific date
  const dutyQuery = {
    faculty,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['Assigned', 'Acknowledged'] },
  };

  if (excludeId) {
    dutyQuery._id = { $ne: excludeId };
  }

  const existingDuties = await DutyAssignment.find(dutyQuery);
  for (const duty of existingDuties) {
    if (isTimeOverlap(startTime, endTime, duty.startTime, duty.endTime)) {
      conflicts.push(
        `Duty conflict: Faculty already has duty "${duty.title}" (${duty.type}) scheduled on this date from ${duty.startTime} to ${duty.endTime}.`
      );
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
};
