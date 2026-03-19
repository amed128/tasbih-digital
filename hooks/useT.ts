"use client";

import { useTasbihStore } from "@/store/tasbihStore";
import { translations } from "@/i18n/translations";

type Vars = Record<string, string | number>;

function getByPath(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

export function useT() {
  const language = useTasbihStore((s) => s.preferences.language);
  const dict = translations[language] ?? translations.fr;

  return (key: string, vars?: Vars): string =>
    interpolate(getByPath(dict as unknown as Record<string, unknown>, key), vars);
}
