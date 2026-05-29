import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { notFound } from "next/navigation";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState, useRef } from "react";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [videos, setvideo] = useState<any>(null);
  const [video, setvide] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [gestureMessage, setGestureMessage] = useState("");
  const commentsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchvideo = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const res = await axiosInstance.get("/video/getall");
        const video = res.data?.filter((vid: any) => vid._id === id);
        setvideo(video[0]);
        setvide(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, [id]);

  const handleSkipForward = () => {
    setGestureMessage("⏩ Skip Forward 10s");
    setTimeout(() => setGestureMessage(""), 2000);
  };

  const handleSkipBackward = () => {
    setGestureMessage("⏪ Skip Backward 10s");
    setTimeout(() => setGestureMessage(""), 2000);
  };

  const handleTogglePlay = (paused: boolean) => {
    setGestureMessage(paused ? "⏸️ Paused" : "▶️ Playing");
    setTimeout(() => setGestureMessage(""), 2000);
  };

  const handleSkipNext = () => {
    setGestureMessage("⏭️ Skipping to Next Video");
    setTimeout(() => setGestureMessage(""), 2000);
    // Find and navigate to next video
    if (video && Array.isArray(video) && video.length > 0) {
      const currentIndex = video.findIndex((v: any) => v._id === id);
      if (currentIndex < video.length - 1) {
        router.push(`/watch/${video[currentIndex + 1]._id}`);
      } else {
        router.push(`/watch/${video[0]._id}`);
      }
    }
  };

  const handleCloseWebsite = () => {
    setGestureMessage("❌ Closing Website");
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  const handleOpenComments = () => {
    setShowComments(!showComments);
    setGestureMessage(showComments ? "💬 Comments Hidden" : "💬 Comments Opened");
    setTimeout(() => setGestureMessage(""), 2000);
    // Scroll to comments if opening
    if (!showComments) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading..</div>;
  }
  
  if (!videos) {
    return <div className="flex items-center justify-center min-h-screen">Video not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Gesture Feedback Toast */}
      {gestureMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 text-sm font-medium">
          {gestureMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Videopplayer
              video={videos}
              onSkipForward={handleSkipForward}
              onSkipBackward={handleSkipBackward}
              onTogglePlay={handleTogglePlay}
              onSkipNext={handleSkipNext}
              onCloseWebsite={handleCloseWebsite}
              onOpenComments={handleOpenComments}
            />
            <VideoInfo video={videos} />
            {showComments && (
              <div ref={commentsRef}>
                <Comments videoId={id} />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <RelatedVideos videos={video} />
          </div>
        </div>
      </div>

      {/* Gesture Controls Guide - Mobile Only */}
      <div className="lg:hidden fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-lg text-xs max-w-xs z-40">
        <p className="font-bold mb-2">📱 Gesture Controls:</p>
        <ul className="space-y-1">
          <li>👆 Tap Center = Play/Pause</li>
          <li>👆👆 Tap Right = +10s</li>
          <li>👆👆 Tap Left = -10s</li>
          <li>👆👆👆 Tap Center = Next</li>
          <li>👆👆👆 Tap Left = Comments</li>
          <li>👆👆👆 Tap Right = Close</li>
        </ul>
      </div>
    </div>
  );
};

export default index;
