import { Video, FileText, Download, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Workshop } from "@/data/workshops";

const ICONS: LucideIcon[] = [Video, FileText, Download, MessageCircle];

export function IncludesSection({ workshop }: { workshop: Workshop }) {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <SectionHeading kicker="Everything Included" title="What You Get" />

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {workshop.includes.map((item, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <Card key={item.title} className="p-7">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-ink">
                <Icon size={22} strokeWidth={2} />
              </span>
              <h3 className="mt-5 font-heading text-lg font-bold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {item.description}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}