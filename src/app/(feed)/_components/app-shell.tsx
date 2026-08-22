import type { ReactNode } from "react";

/**
 * AppShell manages the responsive three-column grid layout for the feed.
 * Features sticky side panels on desktop and a fixed bottom tab bar on mobile.
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
    <div className="min-h-screen bg-white md:bg-slate-100 dark:bg-black dark:md:bg-slate-950">
      <div className="mx-auto max-w-7xl px-0 md:px-4 lg:px-8">
        <div className="flex justify-center md:grid md:grid-cols-[240px_minmax(0,640px)] lg:grid-cols-[240px_minmax(0,640px)_280px] md:gap-6 lg:gap-8 pt-0 md:pt-8 pb-20 md:pb-8">
          
          {/* Left Nav: Sticky behavior with scrollbar hidden if content exceeds height */}
          <aside className="hidden md:block sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden scrollbar-hide">
            {leftNav}
          </aside>
          
          {/* Main Feed Content */}
          <main className="w-full max-w-[640px] flex-shrink-0">
            {children}
          </main>
          
          {/* Right Panel: Sticky behavior with scrollbar hidden if content exceeds height */}
          <aside className="hidden lg:block sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden scrollbar-hide">
            {rightPanel}
          </aside>
        </div>
      </div>
      
      {/* Mobile Bottom Bar wrapper */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
        {leftNav}
      </div>
    </div>
  );
}
