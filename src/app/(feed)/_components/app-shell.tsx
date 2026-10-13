import type { ReactNode } from "react";

/**
 * AppShell manages the responsive three-column layout for the feed.
 * Mobile: single column with bottom tab bar (handled by root AppShell)
 * Tablet (md): left nav + feed (2 columns)
 * Desktop (lg): left nav + feed + right panel (3 columns, centered, max-w-7xl)
 */
export function AppShell({
  children,
  rightPanel,
}: {
  leftNav?: ReactNode;
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <div className="w-full">
      {/* Desktop (lg:): Feed + Right Panel side-by-side */}
      <div className="hidden lg:flex flex-row items-start justify-center gap-6 xl:gap-8 w-full">
        {/* Main Feed: centered, generous width */}
        <div className="w-full max-w-[640px] min-w-0">
          {children}
        </div>

        {/* Right Panel: sticky widgets */}
        {rightPanel ? (
          <aside className="sticky top-6 w-[300px] xl:w-[320px] shrink-0 self-start">
            {rightPanel}
          </aside>
        ) : null}
      </div>

      {/* Mobile & Tablet (< lg:): clean single column */}
      <div className="lg:hidden w-full max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
}
