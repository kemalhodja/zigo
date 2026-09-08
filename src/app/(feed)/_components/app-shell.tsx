import type { ReactNode } from "react";

/**
 * AppShell manages the responsive three-column layout for the feed.
 * Mobile: single column with bottom tab bar (handled by root AppShell)
 * Tablet (md): left nav + feed (2 columns)
 * Desktop (lg): left nav + feed + right panel (3 columns, centered, max-w-7xl)
 */
export function AppShell({
  leftNav,
  children,
  rightPanel,
}: {
  leftNav: ReactNode;
  children: ReactNode;
  rightPanel: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl">
        {/* Desktop & Tablet: Flex row side-by-side */}
        <div className="hidden md:flex flex-row justify-center items-start gap-6 lg:gap-8 px-4 lg:px-8 pt-6 pb-12">
          {/* Left Nav: sticky sidebar */}
          <aside className="sticky top-20 w-[220px] lg:w-[240px] shrink-0 self-start">
            {leftNav}
          </aside>

          {/* Main Feed: centered, generous width */}
          <main className="w-full max-w-[620px] min-w-0" id="main-content">
            {children}
          </main>

          {/* Right Panel: sticky widgets */}
          <aside className="hidden lg:block sticky top-20 w-[300px] xl:w-[320px] shrink-0 self-start">
            {rightPanel}
          </aside>
        </div>

        {/* Mobile: clean single column */}
        <div className="md:hidden pb-20">
          <main id="main-content" className="w-full max-w-lg mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
