import GameJsonLd from "@/components/GameJsonLd";

export default function MinesweeperLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GameJsonLd slug="minesweeper" />
      {children}
    </>
  );
}
