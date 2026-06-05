import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const channelId = Array.isArray(id) ? id[0] : id;
  const { user, isLightTheme } = useUser();
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;

    const fetchChannel = async () => {
      try {
        const res = await axiosInstance.get(`/user/${channelId}`);
        setChannel(res.data?.result || res.data);
      } catch (error) {
        console.error("Error fetching channel:", error);
        setChannel(null);
      }
    };

    fetchChannel();
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;

    const fetchVideos = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        const allVideos = res.data || [];
        const filtered = allVideos.filter((video: any) =>
          String(video.uploader) === String(channelId) ||
          String(video.uploader?._id) === String(channelId)
        );
        setVideos(filtered);
      } catch (error) {
        console.error("Error fetching videos:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [channelId]);

  const activeChannel = channel || (user?._id === channelId ? user : null);
  const canUpload = user?._id && activeChannel?._id && String(user._id) === String(activeChannel._id);

  return (
    <div
      className={`flex-1 min-h-screen px-4 ${
        isLightTheme
          ? "bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_40%),linear-gradient(180deg,#fffaf2_0%,#ffffff_45%,#fff7ed_100%)] text-slate-950"
          : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <ChannelHeader channel={activeChannel} user={user} />
        <Channeltabs />
        {canUpload && (
          <div className="px-4 pb-8">
            <VideoUploader
              channelId={activeChannel._id}
              channelName={activeChannel.channelname || activeChannel.name}
            />
          </div>
        )}
        <div className="px-4 pb-8">
          <ChannelVideos videos={videos} />
        </div>
      </div>
    </div>
  );
};

export default index;
