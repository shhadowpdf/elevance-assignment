import React, { useState } from "react";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
const tabs = [
  { id: "home", label: "Home" },
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "playlists", label: "Playlists" },
  { id: "community", label: "Community" },
  { id: "about", label: "About" },
];
const Channeltabs = () => {
  const [activeTab, setActiveTab] = useState("videos");
  const { isLightTheme } = useUser();
  return (
    <div className={`border-b px-4 ${isLightTheme ? "border-slate-200" : "border-slate-700"}`}>
      <div className="flex gap-8 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`px-2 py-4 border-b-2 rounded-none ${
              activeTab === tab.id
                ? isLightTheme
                  ? "border-black text-black"
                  : "border-white text-white"
                : isLightTheme
                ? "border-transparent text-gray-600 hover:text-black"
                : "border-transparent text-slate-400 hover:text-black"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Channeltabs;
