export function safeDestination(value: string | null) {
  if (!value || /[\\\x00-\x20]/.test(value)) return "/admin";
  return value === "/check-in" ||
    value === "/admin" ||
    value.startsWith("/admin/")
    ? value
    : "/admin";
}
