import { AppShell } from "./_components/app-shell";
import { RightPanel } from "./_components/right-panel";

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      rightPanel={<RightPanel />}
    >
      {children}
    </AppShell>
  );
}
