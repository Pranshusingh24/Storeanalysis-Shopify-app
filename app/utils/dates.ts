/**
 * Date Range and Formatting Utilities
 * Storeanalysis - Pranshu Singh Baghel
 */

export function formatDate(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Return YYYY-MM-DD string for a Date
 */
export function toISODateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Get date range boundary (start Date, end Date) for a range key
 */
export function getDateRangeBoundaries(rangeKey: string = "30d"): {
  startDate: Date;
  endDate: Date;
  priorStartDate: Date;
  priorEndDate: Date;
  days: number;
} {
  const endDate = new Date();
  let days = 30;

  switch (rangeKey) {
    case "today":
      days = 1;
      break;
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    case "this_month": {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      days = Math.max(1, Math.ceil((now.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)));
      break;
    }
    case "last_month": {
      days = 30;
      break;
    }
    default:
      days = 30;
  }

  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const priorEndDate = new Date(startDate);
  const priorStartDate = new Date();
  priorStartDate.setDate(priorEndDate.getDate() - days);

  return {
    startDate,
    endDate,
    priorStartDate,
    priorEndDate,
    days,
  };
}
