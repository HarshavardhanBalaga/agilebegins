"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/clientFetch";

interface ShotDetail {
  name: string;
  email: string;
  phone: string;
  transactionId: string;
  screenshot: string | null;
}

/**
 * Lightbox for viewing a payment screenshot during verification.
 */
export function ScreenshotModal({
  registrationId,
  onClose,
}: {
  registrationId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ShotDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/admin/registrations/${registrationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { registration?: ShotDetail } | null) => {
        if (!cancelled) {
          if (data?.registration) setDetail(data.registration);
          else setError("Could not load the registration.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the registration.");
      });
    return () => {
      cancelled = true;
    };
  }, [registrationId]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 text-ink shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-lg font-bold">
              Payment Screenshot
            </h3>
            {detail ? (
              <p className="mt-1 text-sm text-neutral-500">
                {detail.name} · {detail.transactionId}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close screenshot preview"
            className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 font-bold text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            ×
          </button>
        </div>

        <div className="mt-5">
          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}
          {!detail && !error ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              Loading…
            </p>
          ) : null}
          {detail?.screenshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={detail.screenshot}
              alt={`Payment screenshot for ${detail.name}`}
              className="max-h-[60vh] w-full rounded-xl object-contain"
            />
          ) : null}
          {detail && !detail.screenshot ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              No screenshot was uploaded for this registration.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}