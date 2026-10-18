import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/middlewares/auth";
import { isEmailVerified } from "@/models/user";

export const metadata: Metadata = {
  title: "Products",
  description: "Notes, templates, and kits to move faster on your goals.",
};

/**
 * GET /app/products — authenticated copy of the public /products explorer.
 * Lives under the /app layout (AppNavbar + auth gate) and uses the same
 * white card language as the /app landing: 2px ink borders, hard shadows,
 * no hover effects. Catalog functionality slots in later.
 */
export default async function AppProductsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/products");
  if (!isEmailVerified(user)) redirect("/verify-email");

  return (
    <main className="mx-auto flex w-full max-w-[1320px] flex-col px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <p className="text-xs font-normal tracking-[0.22em] text-neutral-500 uppercase">
        Explore
      </p>
      <h1 className="mt-3 max-w-[20ch] text-4xl leading-[1.05] font-bold text-neutral-900 sm:text-5xl">
        Products
      </h1>
      <p className="mt-4 max-w-[52ch] text-base leading-relaxed font-normal text-neutral-600">
        Notes, templates, and kits to move faster on your goals.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
        <div className="flex min-h-[190px] flex-col justify-between rounded-lg border-2 border-dashed border-[#111111]/40 bg-white p-5 shadow-[3px_3px_0_0_#111111]">
          <span className="self-start rounded-full border border-[#111111]/30 px-2.5 py-1 text-[11px] font-normal tracking-[0.14em] text-[#111111]/60 uppercase">
            Coming soon
          </span>
          <span className="mt-8 block">
            <span className="block text-lg leading-snug font-normal text-[#111111]/70">
              The catalog is on its way
            </span>
            <span className="mt-1.5 block max-w-[52ch] text-sm leading-relaxed font-normal text-[#111111]/50">
              We are putting together the first set of products. Check back
              soon.
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}
