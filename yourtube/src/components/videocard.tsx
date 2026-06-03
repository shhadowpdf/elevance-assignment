"use clinet";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { getVideoSrc } from "@/lib/utils";
import { useUser } from "@/lib/AuthContext";

export default function VideoCard({ video }: any) {
  const { isLightTheme } = useUser();
  return (
    <Link href={`/watch/${video?._id}`} className="group flex flex-col h-full">
      <div className={`aspect-video rounded-lg overflow-hidden ${isLightTheme ? "bg-gray-100" : "bg-gray-800"} relative flex-shrink-0`}>
        <video
          src={getVideoSrc(video?.filepath)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2  bg-black/80 text-white text-xs px-1 rounded`}>
          10:24
        </div>
      </div>
      <div className="p-1.5 sm:p-2 flex-1 flex flex-col justify-between">
        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 group-hover:text-blue-600 leading-snug">
          {video?.videotitle}
        </h3>
        <div className="mt-1 space-y-0.5 text-xs">
          <p className={`${isLightTheme ? "text-gray-600" : "text-gray-400"} line-clamp-1`}>{video?.videochanel}</p>
          <p className={`${isLightTheme ? "text-gray-600" : "text-gray-400"}`}>
            {(video?.views || 0).toLocaleString()} views • {video?.createdAt ? formatDistanceToNow(new Date(video?.createdAt)) : ""} ago
          </p>
        </div>
      </div>
    </Link>
  );
}
