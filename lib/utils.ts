import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameDay,
  isAfter,
  isBefore,
  parseISO,
  differenceInDays,
  getDay,
  lastDayOfMonth,
  eachDayOfInterval,
} from 'date-fns';
import type { HabitLog, StreakFreeze } from '../types/database';
import { Config } from '../constants/config';

// Date formatting helpers
export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

export const formatDisplayDate = (date: Date | string): string => {
  return formatDate(date, 'EEEE, MMMM d');
};

export const formatShortDate = (date: Date | string): string => {
  return formatDate(date, 'd MMM');
};

export const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: Config.WEEK_START_DAY as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
  return `${formatDate(weekStart, 'd MMM')} - ${formatDate(weekEnd, 'd MMM yyyy')}`;
};

export const formatMonthYear = (date: Date | string): string => {
  return formatDate(date, 'MMMM yyyy');
};

// Date calculation helpers
export const getToday = (): Date => {
  return new Date();
};

export const getTodayString = (): string => {
  return formatDate(getToday());
};

export const getWeekStart = (date: Date = getToday()): Date => {
  return startOfWeek(date, { weekStartsOn: Config.WEEK_START_DAY as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
};

export const getWeekEnd = (date: Date = getToday()): Date => {
  return endOfWeek(date, { weekStartsOn: Config.WEEK_START_DAY as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
};

export const getMonthStart = (date: Date = getToday()): Date => {
  return startOfMonth(date);
};

export const getMonthEnd = (date: Date = getToday()): Date => {
  return endOfMonth(date);
};

export const getYearStart = (date: Date = getToday()): Date => {
  return startOfYear(date);
};

export const getYearEnd = (date: Date = getToday()): Date => {
  return endOfYear(date);
};

export const isLastDayOfMonth = (date: Date = getToday()): boolean => {
  const lastDay = lastDayOfMonth(date);
  return isSameDay(date, lastDay);
};

export const isSunday = (date: Date = getToday()): boolean => {
  return getDay(date) === 0;
};

// Navigation helpers
export const getPreviousWeek = (date: Date): Date => subWeeks(date, 1);
export const getNextWeek = (date: Date): Date => addWeeks(date, 1);
export const getPreviousMonth = (date: Date): Date => subMonths(date, 1);
export const getNextMonth = (date: Date): Date => addMonths(date, 1);

// Get days of current week
export const getWeekDays = (weekStart: Date): Date[] => {
  const weekEnd = getWeekEnd(weekStart);
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
};

// Streak calculation
export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export const calculateStreak = (
  logs: HabitLog[],
  freezes: StreakFreeze[],
  startDate: string,
  today: Date = getToday()
): StreakResult => {
  const habitStartDate = parseISO(startDate);

  // Create a map of logs by date
  const logsByDate = new Map<string, boolean>();
  logs.forEach((log) => {
    logsByDate.set(log.date, log.completed);
  });

  // Create a set of freeze dates
  const freezeDates = new Set(freezes.map((f) => f.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Start from today and go backwards
  let checkDate = today;
  let hasStartedCounting = false;

  // Calculate current streak (consecutive days from today going back)
  while (!isBefore(checkDate, habitStartDate)) {
    const dateStr = formatDate(checkDate);
    const logCompleted = logsByDate.get(dateStr);
    const isFrozen = freezeDates.has(dateStr);

    // Skip today if no log yet (user might not have logged today)
    if (isSameDay(checkDate, today) && logCompleted === undefined) {
      checkDate = subDays(checkDate, 1);
      continue;
    }

    if (logCompleted === true) {
      if (!hasStartedCounting) {
        hasStartedCounting = true;
      }
      currentStreak++;
    } else if (isFrozen) {
      // Freeze preserves streak but doesn't add to it
      if (hasStartedCounting) {
        // Continue counting without adding
      } else {
        hasStartedCounting = true;
      }
    } else {
      // Streak broken (either false or no log)
      break;
    }

    checkDate = subDays(checkDate, 1);
  }

  // Calculate longest streak (go through all days from start)
  checkDate = habitStartDate;
  tempStreak = 0;

  while (!isAfter(checkDate, today)) {
    const dateStr = formatDate(checkDate);
    const logCompleted = logsByDate.get(dateStr);
    const isFrozen = freezeDates.has(dateStr);

    if (logCompleted === true) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (isFrozen) {
      // Freeze preserves streak
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (logCompleted === false || (!isSameDay(checkDate, today) && logCompleted === undefined)) {
      // Streak broken - reset
      tempStreak = 0;
    }

    checkDate = addDays(checkDate, 1);
  }

  return { currentStreak, longestStreak };
};

// Calculate completion rate
export const calculateCompletionRate = (
  logs: HabitLog[],
  startDate: string,
  today: Date = getToday()
): number => {
  const habitStartDate = parseISO(startDate);

  // Don't calculate for future start dates
  if (isAfter(habitStartDate, today)) {
    return 0;
  }

  const totalDays = differenceInDays(today, habitStartDate) + 1;
  const completedDays = logs.filter((log) => log.completed).length;

  if (totalDays === 0) return 0;
  return Math.round((completedDays / totalDays) * 100);
};

// Get weekly progress for a habit
export const getWeeklyProgress = (
  logs: HabitLog[],
  weekStart: Date
): number => {
  const weekEnd = getWeekEnd(weekStart);
  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  return logs.filter((log) => {
    return log.completed && log.date >= weekStartStr && log.date <= weekEndStr;
  }).length;
};

// Generate unique ID
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password (minimum 8 characters)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// Parse time string to hour and minute
export const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour: hour || 0, minute: minute || 0 };
};

// Format number with ordinal suffix (1st, 2nd, 3rd, etc.)
export const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
