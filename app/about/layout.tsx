import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About At-tasbih — free, offline Islamic zikr counter. No account, no tracking, works everywhere.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
