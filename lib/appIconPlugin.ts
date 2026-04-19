import { registerPlugin } from "@capacitor/core";

interface AppIconPlugin {
  setIcon(options: { name: string | null }): Promise<void>;
}

const AppIconPlugin = registerPlugin<AppIconPlugin>("AppIcon", {
  web: {
    // No-op on web — icon switching isn't supported in PWA/browser
    setIcon: async () => {},
  },
});

// Map from IconTheme + app Theme to the native icon name (null = default/light)
export function resolveIconName(
  iconTheme: "auto" | "dark" | "blue" | "light",
  appTheme: "dark" | "blue" | "light"
): string | null {
  const effective = iconTheme === "auto" ? appTheme : iconTheme;
  if (effective === "dark") return "AppIconDark";
  if (effective === "blue") return "AppIconBlue";
  return null; // light = default icon
}

export { AppIconPlugin };
