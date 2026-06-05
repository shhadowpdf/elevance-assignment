import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { io, Socket } from "socket.io-client";
import { useUser } from "@/lib/AuthContext";
import { toast } from "sonner";

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:5000";

type Props = {
  roomId: string;
};

type RemoteOffer = {
  from: string;
  sdp: RTCSessionDescriptionInit;
  name?: string;
};

type RemoteAnswer = {
  from: string;
  sdp: RTCSessionDescriptionInit;
};

type IceCandidateMessage = {
  from: string;
  candidate: RTCIceCandidateInit;
};

const pcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCall({ roomId }: Props) {
  const { user } = useUser();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [remoteNames, setRemoteNames] = useState<Record<string, string>>({});
  const hasRemote = connectedPeers.length > 0;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState("00:00");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const socket = io(SIGNALING_URL);
    socketRef.current = socket;

    async function initLocal() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (!mounted) return;
        socket.emit("join-room", { roomId, name: user?.name || "Guest" });
      } catch (err) {
        console.error("getUserMedia error:", err);
        setErrorMessage("Please allow camera and microphone access to start the call.");
      }
    }

    initLocal();

    socket.on("connect", () => {
      console.log("signaling connected", socket.id);
    });

socket.on("new-peer", async ({ peerId, name }: { peerId: string; name?: string }) => {
      if (peerId === socket.id) return;
      if (name) {
        setRemoteNames((prev) => ({ ...prev, [peerId]: name }));
      }
      await createPeerConnection(peerId, true);
      setConnectedPeers((p) => [...p, peerId]);
    });

socket.on("offer", async ({ from, sdp, name }: RemoteOffer) => {
      if (from === socket.id) return;
      if (name) {
        setRemoteNames((prev) => ({ ...prev, [from]: name }));
      }
      await createPeerConnection(from, false);
      setConnectedPeers((p) => (p.includes(from) ? p : [...p, from]));
      const pc = pcsRef.current[from];
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, sdp: pc.localDescription });
    });

    socket.on("answer", async ({ from, sdp }: RemoteAnswer) => {
      const pc = pcsRef.current[from];
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("ice-candidate", async ({ from, candidate }: IceCandidateMessage) => {
      const pc = pcsRef.current[from];
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("addIceCandidate failed", e);
      }
    });

    socket.on("peer-left", (peerId: string) => {
      const pc = pcsRef.current[peerId];
      if (pc) {
        pc.close();
        delete pcsRef.current[peerId];
      }
      setConnectedPeers((p) => p.filter((id) => id !== peerId));
    });

    return () => {
      mounted = false;
      socket.emit("leave-room", roomId);
      socket.disconnect();
      Object.values(pcsRef.current).forEach((pc) => pc.close());
      pcsRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (!isRecording || recordingStartTime === null) return;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - recordingStartTime;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const formatted = `${hours > 0 ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
      setRecordingDuration(formatted);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isRecording, recordingStartTime]);

  async function createPeerConnection(peerId: string, isInitiator: boolean) {
    if (pcsRef.current[peerId]) return pcsRef.current[peerId];
    const socket = socketRef.current!;
    const pc = new RTCPeerConnection(pcConfig);
    pcsRef.current[peerId] = pc;

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    if (screenStreamRef.current) {
      const screenVideoTrack = screenStreamRef.current.getVideoTracks()[0];
      const screenAudioTrack = screenStreamRef.current.getAudioTracks()[0];
      if (screenVideoTrack) pc.addTrack(screenVideoTrack, screenStreamRef.current);
      if (screenAudioTrack) pc.addTrack(screenAudioTrack, screenStreamRef.current);
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        socket.emit("ice-candidate", { to: peerId, candidate: ev.candidate });
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: peerId, sdp: pc.localDescription, name: user?.name || "Guest" });
    }

    return pc;
  }

  async function startScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setErrorMessage("Your browser does not support screen sharing.");
      return;
    }

    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = screenStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      const screenAudioTrack = screenStream.getAudioTracks()[0];

      Object.values(pcsRef.current).forEach((pc) => {
        const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (videoSender && screenVideoTrack) {
          videoSender.replaceTrack(screenVideoTrack);
        } else if (screenVideoTrack) {
          pc.addTrack(screenVideoTrack, screenStream);
        }

        if (screenAudioTrack) {
          const screenAudioSender = pc.getSenders().find(
            (s) => s.track?.kind === "audio" && s.track?.label.includes("Screen")
          );
          if (!screenAudioSender) {
            pc.addTrack(screenAudioTrack, screenStream);
          }
        }
      });

      if (screenVideoTrack) {
        screenVideoTrack.onended = () => {
          stopScreenShare();
        };
      }
      setErrorMessage("");
    } catch (e) {
      console.error("screen share failed", e);
      setErrorMessage("Screen sharing failed or was cancelled.");
    }
  }

  function stopScreenShare() {
    const localStream = localStreamRef.current;
    const screenStream = screenStreamRef.current;

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    Object.values(pcsRef.current).forEach((pc) => {
      const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (videoSender && localStream) {
        videoSender.replaceTrack(localStream.getVideoTracks()[0]);
      }

      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio" && sender.track.label.includes("Screen")) {
          sender.track.stop();
          try {
            pc.removeTrack(sender);
          } catch {
            // Some browsers may not allow removeTrack on this sender.
          }
        }
      });
    });

    setIsScreenSharing(false);
  }

  async function getRecordingStream() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Display recording is not supported.");
      return;
    }

    const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({
      video: { cursor: "always" },
      audio: true,
    });

    displayStreamRef.current = displayStream;
    const displayVideoTrack = displayStream.getVideoTracks()[0];
    if (!displayVideoTrack) {
      throw new Error("No display video track available.");
    }

    const audioTracks: MediaStreamTrack[] = [];
    const displayAudioTrack = displayStream.getAudioTracks()[0];
    if (displayAudioTrack) {
      audioTracks.push(displayAudioTrack);
    }

    const localStream = localStreamRef.current;
    if (localStream) {
      const micTrack = localStream.getAudioTracks()[0];
      if (micTrack) {
        audioTracks.push(micTrack);
      }
    }

    if (audioTracks.length === 0) {
      const plainStream = new MediaStream([displayVideoTrack]);
      mixedStreamRef.current = plainStream;
      return plainStream;
    }

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    audioContextRef.current = audioContext;

    audioTracks.forEach((track) => {
      try {
        const source = audioContext.createMediaStreamSource(new MediaStream([track]));
        source.connect(destination);
      } catch (error) {
        console.warn("Unable to mix audio track:", error);
      }
    });

    const mixedStream = new MediaStream([
      displayVideoTrack,
      ...destination.stream.getAudioTracks(),
    ]);

    mixedStreamRef.current = mixedStream;
    return mixedStream;
  }

  async function startRecording() {
    try {
      const recordingStream = await getRecordingStream();
      recordedChunksRef.current = [];

      const options = [
        { mimeType: "video/webm;codecs=vp9,opus" },
        { mimeType: "video/webm;codecs=vp8,opus" },
        { mimeType: "video/webm" },
      ];

      let recorder: MediaRecorder | null = null;
      for (const option of options) {
        try {
          recorder = new MediaRecorder(recordingStream, option as MediaRecorderOptions);
          break;
        } catch {
          continue;
        }
      }

      if (!recorder) {
        setErrorMessage("MediaRecorder is not supported in this browser.");
        return;
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `call-${roomId}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingDuration("00:00");
      setErrorMessage("");
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Unable to start recording. Make sure the call has joined and permissions are granted.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (mixedStreamRef.current) {
      mixedStreamRef.current.getTracks().forEach((track) => track.stop());
      mixedStreamRef.current = null;
    }

    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setRecordingStartTime(null);
    setRecordingDuration("00:00");
  }

  function hangUp() {
    if (isRecording) {
      stopRecording();
    }
    if (mixedStreamRef.current) {
      mixedStreamRef.current.getTracks().forEach((track) => track.stop());
      mixedStreamRef.current = null;
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    const socket = socketRef.current;
    if (socket) {
      socket.emit("leave-room", roomId);
      socket.disconnect();
    }
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setConnectedPeers([]);
    setIsScreenSharing(false);
    setIsRecording(false);
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex flex-col items-center transition-all duration-500 ease-out md:w-5/12">
          <div className="w-full md:h-80 bg-black rounded overflow-hidden">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
          </div>
          <div className="mt-2 text-sm text-gray-700">You</div>
          {isScreenSharing ? <div className="mt-1 text-xs text-green-600">Screen sharing active</div> : null}
        </div>

        <div className={`flex flex-col items-center transition-all duration-700 ease-out transform ${hasRemote ? "w-full md:w-7/12 scale-100 opacity-100" : "w-full md:w-40 scale-95 opacity-80"}`}>
          <div className="w-full md:h-[28rem] max-h-[70vh] bg-black rounded overflow-hidden shadow-xl shadow-slate-900/20">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain transition-transform duration-700 ease-out" />
          </div>
          <div className="mt-2 text-sm text-gray-700">
            {hasRemote ? `Remote (${connectedPeers.map((id) => remoteNames[id] || "User").join(", ")})` : "Waiting for remote..."}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        >
          {isScreenSharing ? "Stop Screen Share" : "Share Screen"}
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? `Stop Recording (${recordingDuration})` : "Start Recording"}
        </button>

        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-auto"
          onClick={hangUp}
        >
          Hang Up
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
          onClick={() => {
            const local = localStreamRef.current;
            if (!local) return;
            local.getAudioTracks().forEach((t) => (t.enabled = muted));
            setMuted((m) => !m);
          }}
        >
          {muted ? "Unmute" : "Mute"}
        </button>

        <button
          className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
          onClick={() => {
            const local = localStreamRef.current;
            if (!local) return;
            const tracks = local.getVideoTracks();
            if (!tracks.length) return;
            tracks.forEach((t) => (t.enabled = !videoOn));
            Object.values(pcsRef.current).forEach((pc) => {
              const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
              if (videoSender) videoSender.replaceTrack(tracks[0]);
            });
            setVideoOn((v) => !v);
          }}
        >
          {videoOn ? "Stop Video" : "Start Video"}
        </button>

        <div className="ml-auto text-sm text-slate-500">Room: <strong>{roomId}</strong></div>
        <button
          className="px-3 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-100"
          onClick={() => {
            if (typeof window !== "undefined") {
              navigator.clipboard.writeText(`${window.location.origin}/call/${roomId}`);
            }
          }}
        >
          Copy Link
        </button>
      </div>

      {errorMessage ? <div className="text-sm text-red-600">{errorMessage}</div> : null}
      <div className="text-sm text-slate-600">
        Participants: {user?.name || "You"}
        {connectedPeers.length > 0 && (
          <>
            {", "}
            {connectedPeers
              .map((id) => remoteNames[id] || "User")
              .join(", ")}
          </>
        )}
      </div>
    </div>
  );
}
