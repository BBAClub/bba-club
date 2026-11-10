export const statuses = {
  backlog: "Backlog",
  todo: "To do",
  progress: "In progress",
  review: "Review",
  done: "Done",
} as const;
export const priorities = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
} as const;
export type Fields = {
  title: string;
  description: string;
  eventId: string;
  assigneeId: string;
  dueDate: string;
  priority: keyof typeof priorities;
  status: keyof typeof statuses;
};
export type Task = Fields & { _id: string; _rev: string; _createdAt: string };
export type TaskEvent = { _id: string; title: string; date: string };

export function pragueDate(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function eventEligible(eventDate: string, taskCreatedAt: Date) {
  const cutoff = new Date(pragueDate(taskCreatedAt) + "T00:00:00Z");
  cutoff.setUTCDate(cutoff.getUTCDate() - 14);
  return eventDate > cutoff.toISOString().slice(0, 10);
}
