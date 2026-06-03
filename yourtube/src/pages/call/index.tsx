import React, { useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export default function CallLobby() {
  const { isLightTheme } = useUser();
  const [code, setCode] = useState("");
  const router = useRouter();

  const createRoom = () => {
    const newCode = generateRoomCode();
    router.push(`/call/${newCode}`);
  };

  const joinRoom = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/call/${trimmed}`);
  };

  const copyToClipboard = async () => {
    const newCode = generateRoomCode();
    await navigator.clipboard.writeText(`${location.origin}/call/${newCode}`);
    router.push(`/call/${newCode}`);
  };

  return (
    <main
      className={`min-h-screen flex items-center justify-center p-6 ${
        isLightTheme
          ? "bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_40%),linear-gradient(180deg,#fffaf2_0%,#ffffff_45%,#fff7ed_100%)]"
          : "bg-gradient-to-b from-slate-950 via-slate-900 to-black"
      }`}
    >
      <div
        className={`w-full max-w-xl rounded-lg p-6 shadow-md ${
          isLightTheme
            ? "bg-white text-slate-950 border border-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            : "bg-slate-950 text-white border border-slate-800 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
        }`}
      >
        <h1 className={`text-2xl font-semibold ${isLightTheme ? "text-slate-950" : "text-white"}`}>
          Create or Join a Call
        </h1>
        <p className={`text-sm mt-2 ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
          Invite friends with a short room code or link.
        </p>

        <div className="flex flex-col gap-3 mt-6 sm:flex-row">
          <Button onClick={createRoom} className="w-full sm:w-auto">
            Create Room
          </Button>
          <Button variant="secondary" onClick={copyToClipboard} className="w-full sm:w-auto">
            Create & Copy Link
          </Button>
        </div>

        <div className="mt-6">
          <label
            htmlFor="room"
            className={`block text-sm font-medium ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}
          >
            Enter Room Code
          </label>
          <div className="flex flex-col gap-2 mt-2 sm:flex-row">
            <input
              id="room"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABC123"
              className={`w-full rounded-md px-3 py-2 text-sm uppercase outline-none transition-colors duration-150 ${
                isLightTheme
                  ? "border border-slate-300 bg-white text-slate-950 placeholder-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  : "border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-800"
              }`}
            />
            <Button variant="secondary" onClick={joinRoom} className="w-full sm:w-auto">
              Join
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
