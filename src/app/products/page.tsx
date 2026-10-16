import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Notes, templates, and kits to move faster on your goals.",
};

/**
 * GET /products — public explorer for future functionality.
 * Same white card language as /app/products (2px ink borders,
 * hard shadows, no hover). Catalog slots in later.
 */
export default function ProductsPage() {
  return (
    <main className="bg-white font-[family-name:var(--font-cal-sans)] antialiased">
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_40%,black_30%,transparent_75%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(17,17,17,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute top-[42%] left-[57%] h-96 w-[46rem] max-w-[115vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/40 blur-3xl"
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-14 pb-10 text-center md:pt-20">
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-bold text-balance text-neutral-900 md:text-6xl">
            Products
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed font-normal text-neutral-600 md:text-lg">
            Notes, templates, and kits to move faster on your goals.
          </p>
        </div>
      </section>
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
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
      </section>
    </main>
  );
}
