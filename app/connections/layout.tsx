import GameJsonLd from "@/components/GameJsonLd";

export default function ConnectionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="connections" />
      {children}
    </>
  );
}
