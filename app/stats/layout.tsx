import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics",
  description:
    "View your daily dhikr statistics, session history, and progress over time.",
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
