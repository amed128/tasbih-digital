import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lists",
  description:
    "Create and manage your custom zikr lists. Browse the built-in library of 450+ dhikr.",
};

export default function ListesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
