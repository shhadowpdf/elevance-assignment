import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { notFound } from "next/navigation";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLightTheme } = useUser();
  const [videos, setvideo] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data || []);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);
  try {
    let channel = user;

    return (
      <div
        className={`flex-1 min-h-screen px-4 ${
          isLightTheme
            ? "bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_40%),linear-gradient(180deg,#fffaf2_0%,#ffffff_45%,#fff7ed_100%)] text-slate-950"
            : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <ChannelHeader channel={channel} user={user} />
          <Channeltabs />
          <div className="px-4 pb-8">
            <VideoUploader
              channelId={user?._id || id}
              channelName={user?.channelname || user?.name}
            />
          </div>
          <div className="px-4 pb-8">
            <ChannelVideos videos={videos} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching channel data:", error);
  }
};

export default index;
