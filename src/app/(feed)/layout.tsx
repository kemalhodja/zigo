import { AppShell } from "./_components/app-shell";
import { LeftNav } from "./_components/left-nav";
import { RightPanel } from "./_components/right-panel";

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      leftNav={<LeftNav />}
      rightPanel={<RightPanel />}
    >
      {children}
    </AppShell>
  );
}
