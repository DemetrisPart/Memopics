"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ImagePlus,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrivacyNoticeBanner } from "@/components/guest/privacy-notice";
import { NameEntryModal } from "@/components/guest/name-entry-modal";
import { SquareThumbFrame } from "@/components/guest/square-thumb-frame";
import { StorageBanner } from "@/components/guest/storage-banner";
import {
  checkGuestSession,
  completeUpload,
  initUpload,
  resolveUploadUrl,
  uploadFileToPresignedUrl,
} from "@/lib/api/client";
import { ApiError, type PublicEvent } from "@/lib/api/types";
import {
  clearUploadSession,
  createUploadSessionId,
  isAllowedPhotoFile,
  loadUploadSession,
  MAX_PHOTO_SIZE_MB,
  MAX_PHOTOS_PER_BATCH,
  saveUploadSession,
  type UploadFileState,
} from "@/lib/upload-session";
import { inferPhotoContentType, randomId } from "@/lib/utils";
import { dismissPrivacyNotice } from "@/components/guest/privacy-notice";

type UploadPageClientProps = {
  slug: string;
  event: PublicEvent;
};

type PendingPreviewItem = {
  id: string;
  file: File;
  url: string;
};

type PendingPreview = {
  items: PendingPreviewItem[];
};

export function UploadPageClient({ slug, event }: UploadPageClientProps) {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [files, setFiles] = useState<UploadFileState[]>([]);
  const [pendingPreview, setPendingPreview] = useState<PendingPreview | null>(
    null,
  );
  const [uploadSessionId, setUploadSessionId] = useState(createUploadSessionId);
  const [uploading, setUploading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyDismissed, setPrivacyDismissed] = useState(true);

  useEffect(() => {
    setPrivacyDismissed(
      sessionStorage.getItem(`memopics_privacy_notice_dismissed_${slug}`) === "1",
    );
  }, [slug]);

  useEffect(() => {
    async function verifySession() {
      setCheckingSession(true);
      const hasSession = await checkGuestSession(slug);
      if (!hasSession) {
        setNeedsName(true);
        setCheckingSession(false);
        return;
      }
      setNeedsName(false);
      setSessionReady(true);
      setCheckingSession(false);

      const persisted = loadUploadSession(slug);
      if (persisted) {
        setUploadSessionId(persisted.uploadSessionId);
      }
    }
    void verifySession();
  }, [slug]);

  useEffect(() => {
    return () => {
      pendingPreview?.items.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [pendingPreview]);

  function clearPendingPreview() {
    pendingPreview?.items.forEach((item) => URL.revokeObjectURL(item.url));
    setPendingPreview(null);
  }

  function removePendingItem(id: string) {
    if (!pendingPreview) return;

    const removed = pendingPreview.items.find((item) => item.id === id);
    if (removed) URL.revokeObjectURL(removed.url);

    const nextItems = pendingPreview.items.filter((item) => item.id !== id);
    if (nextItems.length === 0) {
      setPendingPreview(null);
      resetInputs();
      return;
    }

    setPendingPreview({ items: nextItems });
  }

  function persistState(nextFiles: UploadFileState[], nextBatchId?: string) {
    saveUploadSession(slug, {
      uploadSessionId,
      batchId: nextBatchId,
      files: nextFiles.map((f) => ({
        clientFileId: f.clientFileId,
        fileName: f.file.name,
        fileSize: f.file.size,
        fileType: f.file.type,
        status: f.status,
        progress: f.progress,
        mediaId: f.mediaId,
        error: f.error,
      })),
    });
  }

  function handleIncomingFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    setError(null);

    const remaining = MAX_PHOTOS_PER_BATCH - files.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS_PER_BATCH} photos per batch`);
      return;
    }

    const accepted = Array.from(selected).slice(0, remaining).filter((file) => {
      if (!isAllowedPhotoFile(file)) {
        setError(
          `Only photos (JPEG, PNG, WebP, HEIC) up to ${MAX_PHOTO_SIZE_MB} MB are supported.`,
        );
        return false;
      }
      return true;
    });

    if (accepted.length === 0) return;

    clearPendingPreview();
    setPendingPreview({
      items: accepted.map((file) => ({
        id: randomId(),
        file,
        url: URL.createObjectURL(file),
      })),
    });
  }

  function resetInputs() {
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function cancelPreview() {
    clearPendingPreview();
    resetInputs();
  }

  async function confirmAndUpload() {
    if (!pendingPreview || uploading) return;

    setUploading(true);
    setError(null);

    const newFiles: UploadFileState[] = pendingPreview.items.map((item) => ({
      clientFileId: randomId(),
      file: item.file,
      status: "pending" as const,
      progress: 0,
    }));

    clearPendingPreview();
    resetInputs();

    const nextFiles = [...files, ...newFiles];
    setFiles(nextFiles);
    persistState(nextFiles);

    await uploadFiles(nextFiles, newFiles);
  }

  async function uploadFiles(
    allFiles: UploadFileState[],
    targets: UploadFileState[],
  ) {
    if (targets.length === 0) return;

    if (event.storageUsedPercent >= 100) {
      setError("The gallery is full. The hosts have been notified.");
      setUploading(false);
      return;
    }

    setUploading(true);
    setError(null);
    setComplete(false);

    let workingFiles = [...allFiles];

    try {
      const initResult = await initUpload(slug, {
        uploadSessionId,
        files: targets.map((f) => ({
          clientFileId: f.clientFileId,
          contentType: inferPhotoContentType(f.file),
          contentLength: f.file.size,
          fileName: f.file.name,
        })),
      });

      const urlByClientId = new Map(
        initResult.items.map((item) => [item.clientFileId, item]),
      );

      for (const target of targets) {
        const index = workingFiles.findIndex(
          (f) => f.clientFileId === target.clientFileId,
        );
        if (index === -1) continue;

        const initItem = urlByClientId.get(target.clientFileId);
        if (!initItem) continue;

        workingFiles[index] = {
          ...workingFiles[index]!,
          status: "uploading",
          progress: 0,
          mediaId: initItem.mediaId,
        };
        setFiles([...workingFiles]);
        persistState(workingFiles, initResult.batchId);

        try {
          await uploadFileToPresignedUrl(
            target.file,
            resolveUploadUrl(initItem),
            (progress) => {
              workingFiles[index] = { ...workingFiles[index]!, progress };
              setFiles([...workingFiles]);
            },
          );
          workingFiles[index] = {
            ...workingFiles[index]!,
            status: "done",
            progress: 100,
          };
        } catch {
          workingFiles[index] = {
            ...workingFiles[index]!,
            status: "failed",
            error: "Upload failed",
          };
        }

        setFiles([...workingFiles]);
        persistState(workingFiles, initResult.batchId);
      }

      const successfulMediaIds = targets
        .map((t) => workingFiles.find((f) => f.clientFileId === t.clientFileId))
        .filter((f) => f?.status === "done" && f.mediaId)
        .map((f) => f!.mediaId!);

      if (successfulMediaIds.length === 0) {
        throw new Error("No uploads could be completed");
      }

      await completeUpload(slug, initResult.batchId, {
        mediaIds: successfulMediaIds,
      });

      setComplete(true);
      clearUploadSession(slug);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function retryFailed() {
    const failed = files.filter((f) => f.status === "failed");
    if (failed.length === 0) return;
    await uploadFiles(files, failed);
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-stone-400">
        Loading…
      </div>
    );
  }

  if (needsName) {
    return (
      <NameEntryModal
        slug={slug}
        open
        onClose={() => router.replace(`/${slug}`)}
        onSuccess={() => {
          setNeedsName(false);
          setSessionReady(true);
        }}
      />
    );
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-stone-400">
        Loading…
      </div>
    );
  }

  const doneCount = files.filter((f) => f.status === "done").length;
  const overallProgress =
    files.length === 0
      ? 0
      : Math.round(
          files.reduce((sum, f) => sum + f.progress, 0) / files.length,
        );

  const batchPhotoCount =
    files.length + (pendingPreview?.items.length ?? 0);
  const atPhotoLimit = batchPhotoCount >= MAX_PHOTOS_PER_BATCH;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28">
      <header className="mb-6">
        <Link
          href={`/${slug}`}
          className="text-sm text-stone-400 hover:text-charcoal-800"
        >
          ← Back to event
        </Link>

        <PrivacyNoticeBanner
          slug={slug}
          dismissed={privacyDismissed}
          onDismiss={() => {
            dismissPrivacyNotice(slug);
            setPrivacyDismissed(true);
          }}
          className="mt-4"
        />

        <h1 className="mt-4 text-2xl font-medium text-charcoal-900">
          Upload Photos
        </h1>
        <p className="mt-1 text-sm font-medium text-charcoal-900">
          {batchPhotoCount}/{MAX_PHOTOS_PER_BATCH} photos in this batch
        </p>
      </header>

      <div className="space-y-4">
        <StorageBanner
          storageUsedPercent={event.storageUsedPercent}
          storageUsedBytes={event.storageUsedBytes}
          storageLimitBytes={event.storageLimitBytes}
        />

        {!complete && !uploading && !pendingPreview ? (
          <>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={atPhotoLimit}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-charcoal-800/15 bg-ivory-100 px-6 py-10 text-charcoal-800 transition-colors hover:border-gold-600 hover:bg-gold-100/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="size-10 text-gold-600" aria-hidden />
              <span className="font-medium">Tap to select photos</span>
              <span className="text-sm text-stone-400">
                Choose from your gallery
              </span>
            </button>

            <Button
              variant="secondary"
              fullWidth
              className="min-h-12"
              disabled={atPhotoLimit}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-5" aria-hidden />
              Take a picture
            </Button>
          </>
        ) : null}

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={(e) => {
            handleIncomingFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleIncomingFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {pendingPreview ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
            <p className="text-sm font-medium text-charcoal-900">
              {pendingPreview.items.length === 1
                ? "Upload this photo?"
                : `Upload ${pendingPreview.items.length} photos?`}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Tap × on any photo to remove it before uploading.
            </p>
            <div className="mt-3 max-h-72 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
              <div className="grid grid-cols-3 gap-2">
                {pendingPreview.items.map((item) => (
                  <SquareThumbFrame
                    key={item.id}
                    className="rounded-lg bg-ivory-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingItem(item.id)}
                      disabled={uploading}
                      className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-charcoal-900/75 text-white disabled:opacity-50"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </SquareThumbFrame>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                className="min-h-12"
                onClick={cancelPreview}
                disabled={uploading}
              >
                <X className="size-4" aria-hidden />
                Cancel
              </Button>
              <Button
                fullWidth
                className="min-h-12"
                disabled={uploading}
                onClick={() => void confirmAndUpload()}
              >
                Upload
              </Button>
            </div>
          </div>
        ) : null}

        {uploading ? (
          <div className="rounded-2xl border border-gold-100 bg-gold-100/40 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-gold-600" aria-hidden />
              <div className="flex-1">
                <p className="text-sm font-medium text-charcoal-900">
                  Uploading…
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ivory-50">
                  <div
                    className="h-full bg-gold-600 transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-stone-400">{overallProgress}%</span>
            </div>
          </div>
        ) : null}

        {files.length > 0 ? (
          <ul className="space-y-2">
            {files.map((fileState) => (
              <li
                key={fileState.clientFileId}
                className="flex items-center gap-3 rounded-xl bg-ivory-100 px-4 py-3"
              >
                <Camera className="size-5 shrink-0 text-gold-600" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-charcoal-900">
                    {fileState.file.name}
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ivory-50">
                    <div
                      className={`h-full transition-all ${
                        fileState.status === "failed"
                          ? "bg-rose-500"
                          : "bg-gold-400"
                      }`}
                      style={{ width: `${fileState.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-stone-400">
                  {fileState.status === "uploading" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : fileState.status === "done" ? (
                    "Done"
                  ) : fileState.status === "failed" ? (
                    "Failed"
                  ) : (
                    `${fileState.progress}%`
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p className="text-sm text-rose-500" role="alert">
            {error}
          </p>
        ) : null}

        {complete ? (
          <div className="rounded-xl bg-gold-100/60 p-4 text-center">
            <p className="font-medium text-charcoal-900">
              {doneCount} photo{doneCount === 1 ? "" : "s"} uploaded successfully!
            </p>
            <div className="mt-4 space-y-3">
              {!atPhotoLimit ? (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setComplete(false);
                    setFiles([]);
                    setError(null);
                  }}
                >
                  Upload more
                </Button>
              ) : null}
              <Link
                href={`/${slug}/gallery`}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gold-600 px-6 text-base font-medium text-ivory-50 hover:bg-gold-700"
              >
                View my uploads
              </Link>
            </div>
          </div>
        ) : null}

        {files.some((f) => f.status === "failed") && !uploading && !complete ? (
          <Button variant="secondary" fullWidth onClick={() => void retryFailed()}>
            <RefreshCw className="size-4" aria-hidden />
            Retry failed
          </Button>
        ) : null}
      </div>
    </div>
  );
}
