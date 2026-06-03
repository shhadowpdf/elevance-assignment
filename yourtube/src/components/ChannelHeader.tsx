import React, { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { isLightTheme } = useUser();

  return (
    <div className="w-full">
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      <div
        className={`px-4 py-6 ${
          isLightTheme ? "bg-white" : "bg-slate-950"
        }`}
      >
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-32 md:h-32">
            <AvatarFallback className={`text-2xl ${isLightTheme ? "bg-slate-200 text-slate-950" : "bg-white text-black"}`}>
              {channel?.channelname[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1
              className={`text-2xl md:text-4xl font-bold ${
                isLightTheme ? "text-slate-950" : "text-white"
              }`}
            >
              {channel?.channelname}
            </h1>
            <div
              className={`flex flex-wrap gap-4 text-sm ${
                isLightTheme ? "text-slate-600" : "text-slate-300"
              }`}
            >
              <span>@{channel?.channelname.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            {channel?.description && (
              <p
                className={`text-sm max-w-2xl ${
                  isLightTheme ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {channel?.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <div className="flex gap-2">
              <Button
                onClick={() => setIsSubscribed(!isSubscribed)}
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed
                    ? isLightTheme
                      ? "bg-slate-100 text-slate-950"
                      : "bg-slate-800 text-white"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
