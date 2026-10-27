import Avatar from "@/components/app/Avatar";
import type { RoomMemberView } from "@/services/roomService";

export function presenceLabel(presence: RoomMemberView["presence"]): string {
  if (presence === "break") return "On a break";
  if (presence === "away") return "Away";
  return "Studying";
}

export function presenceDot(presence: RoomMemberView["presence"], online: boolean): string {
  if (!online) return "bg-neutral-300";
  if (presence === "break") return "bg-amber-400";
  if (presence === "away") return "bg-neutral-400";
  return "bg-neutral-900";
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/**
 * Partner presence: avatar + name + live status + current goal. Reads as
 * "someone is actually studying alongside me" — not a social profile card.
 */
export function PartnerPresence({ partner }: { partner: RoomMemberView | null }) {
  if (!partner) {
    return (
      <section aria-label="Study companion">
        <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
          Your companion
        </p>
        <p className="mt-3 text-base leading-relaxed text-neutral-500">
          Waiting for your companion to join…
        </p>
      </section>
    );
  }
  return (
    <section aria-label="Study companion">
      <p className="text-xs font-normal tracking-[0.18em] text-neutral-900 uppercase">
        Studying with you
      </p>
      <div className="mt-4 flex items-center gap-4">
        <span className="relative shrink-0">
          <Avatar name={partner.displayName} avatarUrl={partner.avatarUrl} size={56} />
          <span
            aria-hidden="true"
            className={`absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-2 ring-white ${presenceDot(partner.presence, partner.online)}`}
          />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl leading-snug font-normal text-neutral-900">
            {partner.displayName}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-normal text-neutral-500">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${presenceDot(partner.presence, partner.online)}`} />
            {partner.online ? presenceLabel(partner.presence) : "Offline"}
          </p>
        </div>
              </div>
      {partner.goal ? (
        <p className="mt-3 max-w-[52ch] text-base leading-relaxed font-normal text-neutral-600">
          <span className="text-neutral-400">Working on — </span>
          {partner.goal}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed font-normal text-neutral-400">
          {partner.displayName} hasn&apos;t set a session goal yet.
        </p>
      )}
    </section>
  );
}
