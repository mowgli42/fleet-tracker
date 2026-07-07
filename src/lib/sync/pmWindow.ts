import { PM_AT_RISK_DAYS } from './constants';

/** Days from today until ISO date string (calendar days, naive). */
export function daysUntilServiceDate(isoDate: string): number {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

export function isPmAtRiskFromVehicleNextService(nextService?: string): boolean {
  if (!nextService) return false;
  const days = daysUntilServiceDate(nextService);
  return days >= 0 && days <= PM_AT_RISK_DAYS;
}
