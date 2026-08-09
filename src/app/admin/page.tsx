import { Navbar } from "@/components/landing/Navbar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-[1280px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="mb-10">
          <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
            Admin Dashboard
          </h1>
          <p className="mt-4 max-w-[560px] text-base leading-relaxed text-white/[0.78]">
            Verify payments, send confirmation emails and manage workshop
            registrations.
          </p>
        </div>

        <AdminDashboard />
      </main>
    </>
  );
}