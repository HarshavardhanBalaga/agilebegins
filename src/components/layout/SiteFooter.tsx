import { env } from "@/lib/env";
import { FooterIde } from "./FooterIde";

/**
 * The Agile Begins "source repository" footer.
 *
 * Server component: support + community links come from the validated env
 * (never hard-coded in the markup), while the interactive IDE chrome — file
 * explorer, editor caret, collapsed folders — lives in the client component.
 */
export function SiteFooter() {
  return (
    <FooterIde
      supportEmail={env.supportEmail()}
      whatsappUrl={env.whatsappCommunityUrl()}
    />
  );
}