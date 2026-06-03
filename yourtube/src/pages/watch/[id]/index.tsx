import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { formatWatchLimit, getEffectivePlanCode, getPlanConfig } from "@/lib/plans";

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const {isLightTheme} = useUser();
  const { user, handlegooglesignin } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [gestureMessage, setGestureMessage] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  const currentPlanCode = getEffectivePlanCode(user);
  const currentPlan = getPlanConfig(currentPlanCode);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const [watchToken, setWatchToken] = useState<string | null>(null);
  const [watchTokenError, setWatchTokenError] = useState<string | null>(null);

  const playbackUrl = video
    ? watchToken
      ? `${backendUrl.replace(/\/$/, "")}/video/stream/${video._id}?token=${watchToken}`
      : ""
    : "";

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id || typeof id !== "string") {
        return;
      }

      try {
        const res = await axiosInstance.get("/video/getall");
        const allVideos = Array.isArray(res.data) ? res.data : [];
        const selectedVideo = allVideos.find((vid: any) => vid._id === id);

        setVideo(selectedVideo || null);
        setVideos(allVideos);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  useEffect(() => {
    if (!video || !user?._id) {
      setWatchToken(null);
      setWatchTokenError(null);
      return;
    }

    const createSession = async () => {
      try {
        const response = await axiosInstance.post("/video/watch-session", {
          userId: user._id,
          videoId: video._id,
        });
        setWatchToken(response.data.token);
        setWatchTokenError(null);
      } catch (error: any) {
        console.error("Unable to create watch session", error);
        setWatchToken(null);
        setWatchTokenError(
          error?.response?.data?.message || "Unable to start protected playback."
        );
      }
    };

    createSession();
  }, [video, user]);

  useEffect(() => {
    setShowUpgradeModal(false);
  }, [id, currentPlanCode]);

  const flashGestureMessage = (message: string) => {
    setGestureMessage(message);
    setTimeout(() => setGestureMessage(""), 2000);
  };

  const handleSkipForward = () => {
    flashGestureMessage("Skip forward 10s");
  };

  const handleSkipBackward = () => {
    flashGestureMessage("Skip backward 10s");
  };

  const handleTogglePlay = (paused: boolean) => {
    flashGestureMessage(paused ? "Paused" : "Playing");
  };

  const handleSkipNext = () => {
    flashGestureMessage("Skipping to next video");

    if (videos.length === 0 || !video) {
      return;
    }

    const currentIndex = videos.findIndex((item: any) => item._id === id);

    if (currentIndex === -1) {
      return;
    }

    const nextVideo =
      currentIndex < videos.length - 1 ? videos[currentIndex + 1] : videos[0];

    router.push(`/watch/${nextVideo._id}`);
  };

  const handleCloseWebsite = () => {
    flashGestureMessage("Closing website");
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  const handleOpenComments = () => {
    const nextValue = !showComments;
    setShowComments(nextValue);
    flashGestureMessage(nextValue ? "Comments opened" : "Comments hidden");

    if (nextValue) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  const handleWatchLimitReached = () => {
    setShowUpgradeModal(true);
    flashGestureMessage(`${currentPlan.name} plan limit reached`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Video not found
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLightTheme ? "bg-white" : "bg-gray-900"}`}>
      {gestureMessage && (
        <div className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg ${isLightTheme ? "bg-black text-white" : "bg-gray-800 text-white"} px-6 py-3 text-sm font-medium  shadow-lg`}>
          {gestureMessage}
        </div>
      )}

      <div className="mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!user ? (
              <div className={`rounded-2xl border ${isLightTheme ? "border-red-200 bg-red-50 text-red-800" : "border-red-200 bg-red-900 text-white"} p-4 text-sm `}>
                Sign in to stream this video through the protected playback service.
              </div>
            ) : watchTokenError ? (
              <div className={`rounded-2xl border  ${isLightTheme ? "bg-red-50 border-red-200 text-red-800" : "bg-red-900 text-white"} p-4 text-sm `}>
                {watchTokenError}
              </div>
            ) : !watchToken ? (
              <div className={`rounded-2xl border border-slate-200 ${isLightTheme ? "bg-slate-50" : "bg-slate-800"} p-4 text-sm text-slate-600`}>
                Preparing protected playback...
              </div>
            ) : null}

            <Videopplayer
              video={{ ...video, filepath: playbackUrl }}
              maxWatchSeconds={currentPlan.watchLimitSeconds}
              onSkipForward={handleSkipForward}
              onSkipBackward={handleSkipBackward}
              onTogglePlay={handleTogglePlay}
              onSkipNext={handleSkipNext}
              onCloseWebsite={handleCloseWebsite}
              onOpenComments={handleOpenComments}
              onWatchLimitReached={handleWatchLimitReached}
            />
            <VideoInfo video={video} />
            {showComments && (
              <div ref={commentsRef}>
                <Comments videoId={id} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
                Current plan
              </div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {currentPlan.name}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page enforces {formatWatchLimit(currentPlan.watchLimitMinutes)}{" "}
                for your current access level.
              </p>
              <Button
                asChild
                className="mt-4 w-full rounded-full bg-blue-700 hover:bg-blue-900"
              >
                <Link href="/subscriptions">Compare plans</Link>
              </Button>
            </div>
            <RelatedVideos videos={videos} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-40 max-w-xs rounded-lg bg-blue-500 p-3 text-xs text-white lg:hidden">
        <p className="mb-2 font-bold">Gesture controls</p>
        <ul className="space-y-1">
          <li>Tap center = Play/Pause</li>
          <li>Tap right twice = +10s</li>
          <li>Tap left twice = -10s</li>
          <li>Tap center three times = Next</li>
          <li>Tap left three times = Comments</li>
          <li>Tap right three times = Close</li>
        </ul>
      </div>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Watch limit reached</DialogTitle>
            <DialogDescription>
              Your current plan pauses this video at{" "}
              {formatWatchLimit(currentPlan.watchLimitMinutes)}. Upgrade to keep
              watching longer.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="text-sm font-medium text-orange-900">
              Current plan: {currentPlan.name}
            </div>
            <div className="mt-2 text-sm leading-6 text-orange-800">
              Bronze gives 7 minutes per video, Silver gives 10 minutes, and Gold
              unlocks unlimited watch time.
            </div>
          </div>

          {!user && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Sign in first so the upgrade can be attached to your account before checkout.
            </div>
          )}

          <DialogFooter>
            {user ? (
              <Button asChild className="bg-blue-700 hover:bg-blue-900">
                <Link href="/subscriptions">See upgrade plans</Link>
              </Button>
            ) : (
              <Button
                className="bg-blue-700 hover:bg-blue-900"
                onClick={handlegooglesignin}
              >
                Sign in to upgrade
              </Button>
            )}
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowUpgradeModal(false)}>
              Maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchPage;
