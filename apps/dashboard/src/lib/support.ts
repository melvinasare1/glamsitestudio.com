export const SUPPORT_SUBJECTS = [
  { value: "issue", label: "There's an issue" },
  { value: "support", label: "I need support" },
  { value: "question", label: "General question" },
  { value: "feature", label: "Request a feature" },
] as const;

export type SupportSubject = (typeof SUPPORT_SUBJECTS)[number]["value"];

export function isSupportSubject(value: string): value is SupportSubject {
  return SUPPORT_SUBJECTS.some((subject) => subject.value === value);
}

export function supportSubjectLabel(value: SupportSubject): string {
  return SUPPORT_SUBJECTS.find((subject) => subject.value === value)?.label ?? value;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
