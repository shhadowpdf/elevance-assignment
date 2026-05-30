import React, { useState } from "react";
import { useRouter } from "next/router";

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export default function CallLobby() {
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
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold">Create or Join a Call</h1>
        <p className="text-sm text-gray-500 mt-2">Invite friends with a short room code or link.</p>

        <div className="flex gap-2 mt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={createRoom}>
            Create Room
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700" onClick={copyToClipboard}>
            Create & Copy Link
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="room" className="block text-sm font-medium text-gray-700">Enter Room Code</label>
          <div className="flex gap-2 mt-2">
            <input
              id="room"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABC123"
              className="w-full border px-3 py-2 rounded text-sm uppercase"
            />
            <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" onClick={joinRoom}>
              Join
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
