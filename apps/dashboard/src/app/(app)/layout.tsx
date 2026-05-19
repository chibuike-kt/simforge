import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <Sidebar />
      <div className="ml-56">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
