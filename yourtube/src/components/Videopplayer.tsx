"use client";

import { useRef, useEffect, useState } from "react";
import { getVideoSrc } from "@/lib/utils";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  onSkipForward?: () => void;
  onSkipBackward?: () => void;
  onTogglePlay?: (paused: boolean) => void;
  onSkipNext?: () => void;
  onCloseWebsite?: () => void;
  onOpenComments?: () => void;
}

interface TapState {
  zone: "left" | "center" | "right" | null;
  count: number;
  lastTapTime: number;
  timeoutId?: NodeJS.Timeout;
}

export default function VideoPlayer({
  video,
  onSkipForward,
  onSkipBackward,
  onTogglePlay,
  onSkipNext,
  onCloseWebsite,
  onOpenComments,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tapStateRef = useRef<TapState>({
    zone: null,
    count: 0,
    lastTapTime: 0,
  });
  const [feedback, setFeedback] = useState<{
    message: string;
    position: { x: number; y: number };
  } | null>(null);

  const executeTapAction = (zone: "left" | "center" | "right", tapCount: number) => {
    if (tapCount === 1 && zone === "center") {
      // Single tap center - play/pause
      if (videoRef.current) {
        const paused = videoRef.current.paused;
        if (paused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
        onTogglePlay?.(!paused);
      }
    } else if (tapCount === 2 && zone === "right") {
      // Double tap right - skip forward 10s
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(
          videoRef.current.currentTime + 10,
          videoRef.current.duration
        );
        onSkipForward?.();
      }
    } else if (tapCount === 2 && zone === "left") {
      // Double tap left - skip backward 10s
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(
          videoRef.current.currentTime - 10,
          0
        );
        onSkipBackward?.();
      }
    } else if (tapCount === 3 && zone === "center") {
      // Triple tap center - skip to next video
      onSkipNext?.();
    } else if (tapCount === 3 && zone === "right") {
      // Triple tap right - close website
      onCloseWebsite?.();
    } else if (tapCount === 3 && zone === "left") {
      // Triple tap left - open comments
      onOpenComments?.();
    }
  };

  useEffect(() => {
    const handleTouchEnd = (e: TouchEvent) => {
      if (!containerRef.current) return;

      const touch = e.changedTouches[0];
      const rect = containerRef.current.getBoundingClientRect();

      // Calculate tap position as percentage
      const tapX = ((touch.clientX - rect.left) / rect.width) * 100;

      // Determine zone (left: 0-33%, center: 33-67%, right: 67-100%)
      let zone: "left" | "center" | "right";
      if (tapX < 33.33) {
        zone = "left";
      } else if (tapX > 66.67) {
        zone = "right";
      } else {
        zone = "center";
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - tapStateRef.current.lastTapTime;
      const TAP_TIMEOUT = 500; // 500ms window for multiple taps

      // Clear existing timeout
      if (tapStateRef.current.timeoutId) {
        clearTimeout(tapStateRef.current.timeoutId);
      }

      // Reset tap count if more than TAP_TIMEOUT has passed or zone changed
      if (timeDiff > TAP_TIMEOUT || tapStateRef.current.zone !== zone) {
        tapStateRef.current.zone = zone;
        tapStateRef.current.count = 1;
      } else {
        tapStateRef.current.count += 1;
      }

      tapStateRef.current.lastTapTime = currentTime;

      // Show feedback
      const feedbackX = ((touch.clientX - rect.left) / rect.width) * 100;
      const feedbackY = ((touch.clientY - rect.top) / rect.height) * 100;
      setFeedback({
        message: `${tapStateRef.current.count} tap${tapStateRef.current.count > 1 ? "s" : ""} (${zone})`,
        position: { x: feedbackX, y: feedbackY },
      });

      setTimeout(() => setFeedback(null), 500);

      // Set timeout to execute action after TAP_TIMEOUT if no more taps
      tapStateRef.current.timeoutId = setTimeout(() => {
        const { zone: finalZone, count: finalCount } = tapStateRef.current;
        if (finalCount > 0 && finalZone) {
          executeTapAction(finalZone, finalCount);
        }
        // Reset after executing
        tapStateRef.current = {
          zone: null,
          count: 0,
          lastTapTime: 0,
        };
      }, TAP_TIMEOUT);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("touchend", handleTouchEnd);
      return () => {
        container.removeEventListener("touchend", handleTouchEnd);
        if (tapStateRef.current.timeoutId) {
          clearTimeout(tapStateRef.current.timeoutId);
        }
      };
    }
  }, [onSkipForward, onSkipBackward, onTogglePlay, onSkipNext, onCloseWebsite, onOpenComments]);

  return (
    <div
      ref={containerRef}
      className="aspect-video bg-black rounded-lg overflow-hidden relative touch-none select-none"
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={`/placeholder.svg?height=480&width=854`}
      >
        <source
          src={getVideoSrc(video?.filepath)}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Gesture Feedback Indicator */}
      {feedback && (
        <div
          className="absolute bg-white bg-opacity-75 text-black px-3 py-1 rounded pointer-events-none text-sm font-semibold"
          style={{
            left: `${feedback.position.x}%`,
            top: `${feedback.position.y}%`,
            transform: "translate(-50%, -50%)",
            animation: "fadeOut 0.5s ease-out",
          }}
        >
          {feedback.message}
        </div>
      )}

      <style>{`
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}
