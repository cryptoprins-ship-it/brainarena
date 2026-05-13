import SudokuPage from "@/app/sudoku/page";

// Locale-prefixed sudoku route. The client SudokuPage is locale-agnostic
// at the JSX level — translated UI strings come from useLocale() inside
// child components, and that hook now derives its initial locale from
// the URL pathname (see lib/i18n.ts). So we can re-render the existing
// page component directly without forking its logic.
//
// The companion layout.tsx attaches localized metadata + hreflang.
export default function LocaleSudokuPage() {
  return <SudokuPage />;
}
