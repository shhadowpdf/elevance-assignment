"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, X, ThumbsUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { getVideoSrc } from "@/lib/utils";

export default function LikedVideosContent() {
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isLightTheme } = useUser();

  useEffect(() => {
    if (user) {
      loadLikedVideos();
    }
  }, [user]);

  const loadLikedVideos = async () => {
    if (!user) return;

    try {
      const likedData = await axiosInstance.get(`/like/${user?._id}`);

      setLikedVideos(likedData.data);
    } catch (error) {
      console.error("Error loading liked videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlikeVideo = async (videoId: string, likedVideoId: string) => {
    if (!user) return;

    try {
      console.log("Unliking video:", videoId, "for user:", user.id);
      setLikedVideos(likedVideos.filter((item) => item._id !== likedVideoId));
    } catch (error) {
      console.error("Error unliking video:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <ThumbsUp className={`w-16 h-16 mx-auto mb-4 ${isLightTheme ? "text-gray-400" : "text-gray-600"}`} />
        <h2 className={`text-xl font-semibold mb-2 ${isLightTheme ? "text-slate-950" : "text-white"}`}>
          Keep track of videos you like
        </h2>
        <p className={`${isLightTheme ? "text-gray-600" : "text-slate-300"}`}>
          Sign in to see your liked videos.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading liked videos...</div>;
  }

  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <ThumbsUp className={`w-16 h-16 mx-auto mb-4 ${isLightTheme ? "text-gray-400" : "text-gray-600"}`} />
        <h2 className={`text-xl font-semibold mb-2 ${isLightTheme ? "text-slate-950" : "text-white"}`}>No liked videos yet</h2>
        <p className={`${isLightTheme ? "text-gray-600" : "text-slate-300"}`}>
          Videos you like will appear here.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className={`text-sm ${isLightTheme ? "text-gray-600" : "text-white"}`}>{likedVideos.length} videos</p>
        <Button className={`flex items-center gap-2 ${isLightTheme ? "bg-black" : "bg-gray-600"}`}>
          <Play className={`w-4 h-4 `} />
          Play all
        </Button>
      </div>

      <div className="space-y-4">
        {likedVideos.map((item) => (
          <div key={item._id} className="flex flex-col sm:flex-row gap-4 group">
            <Link href={`/watch/${item.videoid._id}`} className="flex-shrink-0">
              <div className="relative w-24 sm:w-40 aspect-video bg-gray-100 rounded overflow-hidden">
                <video
                  src={getVideoSrc(item.videoid?.filepath)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/watch/${item.videoid._id}`}>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-1">
                  {item.videoid.videotitle}
                </h3>
              </Link>
              <p className={`text-sm ${isLightTheme ? "text-gray-600" : "text-slate-300"}`}>
                {item.videoid.videochanel}
              </p>
              <p className={`text-sm ${isLightTheme ? "text-gray-600" : "text-slate-300"}`}>
                {item.videoid.views.toLocaleString()} views •{" "}
                {formatDistanceToNow(new Date(item.videoid.createdAt))} ago
              </p>
              <p className={`text-xs mt-1 ${isLightTheme ? "text-gray-500" : "text-slate-400"}`}>
                Liked {formatDistanceToNow(new Date(item.createdAt))} ago
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`opacity-100 ${isLightTheme ? "bg-gray-100" : "bg-gray-600"}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleUnlikeVideo(item.videoid._id, item._id)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove from liked videos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
