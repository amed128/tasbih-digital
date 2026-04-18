import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description:
    "How to use At-tasbih — counter modes, zikr lists, audio recognition, and frequently asked questions.",
};

export default function AideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
