"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const CAMERA_ATTACH_TIMEOUT_MS = 12_000;
const CAMERA_PERMISSION_TIMEOUT_MS = 15_000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  captureFrame: () => Promise<Blob>;
}

/**
 * Custom hook for camera access via getUserMedia.
 *
 * Provides:
 * - videoRef: attach to a <video> element
 * - start/stop: control the camera stream
 * - captureFrame: grab a JPEG blob from the current frame
 * - isReady: camera is live and streaming
 * - error: any error message
 */
export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startRequestRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachStreamToVideo = useCallback(async (stream: MediaStream) => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;

        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error("Camera preview failed to load"));
          };
          const cleanup = () => {
            video.removeEventListener("loadedmetadata", onReady);
            video.removeEventListener("error", onError);
          };

          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve();
            return;
          }

          video.addEventListener("loadedmetadata", onReady, { once: true });
          video.addEventListener("error", onError, { once: true });
        });

        try {
          await withTimeout(
            video.play(),
            CAMERA_ATTACH_TIMEOUT_MS,
            "Camera preview timed out"
          );
        } catch {
          // Muted kiosk previews can still render frames even if play() is blocked.
        }

        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setIsReady(true);
          setError(null);
          return;
        }

        throw new Error("Camera preview unavailable");
      }

      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    throw new Error("Camera preview unavailable");
  }, []);

  const start = useCallback(async () => {
    const requestId = ++startRequestRef.current;

    try {
      setError(null);
      setIsReady(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await withTimeout(
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }),
        CAMERA_PERMISSION_TIMEOUT_MS,
        "Camera permission timed out. Allow camera access or use email login."
      );

      if (requestId !== startRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      await withTimeout(
        attachStreamToVideo(stream),
        CAMERA_ATTACH_TIMEOUT_MS,
        "Camera preview timed out"
      );
    } catch (err) {
      if (requestId !== startRequestRef.current) {
        return;
      }

      const message =
        err instanceof Error ? err.message : "Camera access denied";
      setError(message);
      setIsReady(false);
    }
  }, [attachStreamToVideo]);

  const stop = useCallback(() => {
    startRequestRef.current += 1;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const captureFrame = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      if (!video || !isReady) {
        return reject(new Error("Camera not ready"));
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Cannot create canvas context"));
      }

      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to capture frame"));
        },
        "image/jpeg",
        0.9
      );
    });
  }, [isReady]);

  // If the video element mounts after the stream is already live, attach it.
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream || isReady) {
      return;
    }

    void attachStreamToVideo(stream).catch((err) => {
      const message =
        err instanceof Error ? err.message : "Camera preview unavailable";
      setError(message);
      setIsReady(false);
    });
  }, [attachStreamToVideo, isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      startRequestRef.current += 1;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return { videoRef, isReady, error, start, stop, captureFrame };
}
