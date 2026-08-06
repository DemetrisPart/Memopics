"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  completeCoverUpload,
  initCoverUpload,
  updateEvent,
} from "@/lib/api/dashboard-client";
import { uploadFileToPresignedUrl } from "@/lib/api/client";
import { inferPhotoContentType } from "@/lib/utils";
import type { CoupleEvent } from "@/lib/api/types";

type EventSettingsClientProps = {
  event: CoupleEvent;
};

export function EventSettingsClient({ event }: EventSettingsClientProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [groomName, setGroomName] = useState(event.groomName);
  const [brideName, setBrideName] = useState(event.brideName);
  const [eventDate, setEventDate] = useState(event.eventDate);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateEvent(event.id, { groomName, brideName, eventDate });
      setMessage("Event details saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const onCoverSelect = async (file: File) => {
    setCoverUploading(true);
    setError(null);
    setMessage(null);
    try {
      const contentType = inferPhotoContentType(file);
      const init = await initCoverUpload(event.id, {
        contentType,
        contentLength: file.size,
        fileName: file.name,
      });
      await uploadFileToPresignedUrl(file, init.uploadUrl);
      await completeCoverUpload(event.id, init.mediaId);
      setMessage("Cover photo updated");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover upload failed");
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-charcoal-900">Cover photo</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ivory-100">
            {event.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onCoverSelect(file);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={coverUploading}
              onClick={() => fileRef.current?.click()}
            >
              {coverUploading ? "Uploading…" : "Change cover"}
            </Button>
          </div>
        </div>
      </section>

      <form
        onSubmit={saveDetails}
        className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft"
      >
        <h2 className="text-sm font-semibold text-charcoal-900">Event details</h2>

        <Input
          label="Groom / partner name"
          value={groomName}
          onChange={(e) => setGroomName(e.target.value)}
          required
        />
        <Input
          label="Bride / partner name"
          value={brideName}
          onChange={(e) => setBrideName(e.target.value)}
          required
        />
        <Input
          label="Event date"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />

        <Input
          label="Event URL"
          value={`/${event.slug}`}
          readOnly
          className="text-stone-400"
        />
        <p className="text-xs text-stone-400">
          The event URL cannot be changed after creation.
        </p>

        {error ? (
          <p className="text-sm text-rose-500">{error}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-700">{message}</p>
        ) : null}

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
