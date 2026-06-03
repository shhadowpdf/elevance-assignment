import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  History,
  User,
  Download,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";

type Props = {
  mobile?: boolean;
  onClose?: () => void;
};

const Sidebar = ({ mobile = false, onClose }: Props) => {
  const { user, isLightTheme } = useUser();

  const [isdialogeopen, setisdialogeopen] = useState(false);
  const rootClass = mobile
    ? `w-64 ${isLightTheme ? "bg-white text-gray-900" : "bg-gray-900 text-white"} border-r min-h-screen p-2`
    : `hidden md:block w-64 ${isLightTheme ? "bg-white text-gray-900" : "bg-gray-900 text-white"} border-r min-h-screen p-2`;

  return (
    <aside className={rootClass}>
      {mobile && (
        <div className="flex items-center justify-between mb-2">
          <div />
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>
      )}
      <nav className="space-y-1">
        <Link href="/">
          <Button variant="ghost" className={`w-full justify-start ${isLightTheme ? "text-gray-900 hover:bg-gray-200" : "text-white hover:text-white hover:bg-gray-700"}`}>
            <Home className={`w-5 h-5 mr-3 ${isLightTheme ? "text-gray-900" : "text-white"}`} />
            Home
          </Button>
        </Link>
        <Link href="/explore">
          <Button variant="ghost" className={`w-full justify-start ${isLightTheme ? "text-gray-900 hover:bg-gray-200" : "text-white hover:text-white hover:bg-gray-700"}`}>
            <Compass className={`w-5 h-5 mr-3 ${isLightTheme ? "text-gray-900" : "text-white"}`} />
            Explore
          </Button>
        </Link>
        <Link href="/subscriptions">
          <Button variant="ghost" className={`w-full justify-start ${isLightTheme ? "text-gray-900 hover:bg-gray-200" : "text-white hover:text-white hover:bg-gray-700"}`}>
            <PlaySquare className={`w-5 h-5 mr-3 ${isLightTheme ? "text-gray-900" : "text-white"}`} />
            Subscriptions
          </Button>
        </Link>

        {user && (
          <>
            <div className="border-t pt-2 mt-2">
              <Link href="/history">
                <Button variant="ghost" className={`w-full justify-start ${isLightTheme ? "text-gray-900 hover:bg-gray-200" : "text-white hover:text-white hover:bg-gray-700  "}`}>
                  <History className={`w-5 h-5 mr-3 ${isLightTheme ? "text-gray-900" : "text-white"}`} />
                  History
                </Button>
              </Link>
              <Link href="/liked">
                <Button variant="ghost" className={`w-full justify-start ${isLightTheme ? "text-gray-900 hover:bg-gray-200" : "text-white hover:text-white hover:bg-gray-700"}`}  >
                  <ThumbsUp className={`w-5 h-5 mr-3 ${isLightTheme ? "text-gray-900" : "text-white"}`} />
                  Liked videos
                </Button>
              </Link>
              <Link href="/watch-later">
                <Button variant="ghost" className={`w-full justify-start ${isLightTheme ? "text-gray-900 hover:bg-gray-200" : "text-white hover:text-white hover:bg-gray-700"}`}>
                  <Clock className={`w-5 h-5 mr-3 ${isLightTheme ? "text-gray-900" : "text-white"}`} />
                  Watch later
                </Button>
              </Link>
              <Link href="/downloads">
                <Button variant="ghost" className={`w-full justify-start ${isLightTheme ? "text-gray-900 hover:bg-gray-200" : "text-white hover:text-white hover:bg-gray-700"}`}>
                  <Download className={`w-5 h-5 mr-3 ${isLightTheme ? "text-gray-900" : "text-white"}`} />
                  Downloads
                </Button>
              </Link>
              {user?.channelname ? (
                <Link href={`/channel/${user.id}`}>
                  <Button variant="ghost" className={`w-full justify-start ${isLightTheme ? "text-gray-900 hover:bg-gray-200" : "text-white hover:text-white hover:bg-gray-700"}`}>
                    <User className={`w-5 h-5 mr-3 ${isLightTheme ? "text-gray-900" : "text-white"}`} />
                    Your channel
                  </Button>
                </Link>
              ) : (
                <div className="px-2 py-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setisdialogeopen(true)}
                  >
                    Create Channel
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </aside>
  );
};

export default Sidebar;
