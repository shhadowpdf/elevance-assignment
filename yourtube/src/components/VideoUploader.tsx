import { Check, FileVideo, Upload, X } from "lucide-react";
import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const VideoUploader = ({ channelId, channelName }: any) => {
  const { user, isLightTheme } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [uploadComplete, setUploadComplete] = useState(false);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlefilechange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("video/")) {
        toast.error("Please upload a valid video file.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit.");
        return;
      }
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoPreviewUrl(previewUrl);

      const filename = file.name;
      if (!videoTitle) {
        setVideoTitle(filename);
      }
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setVideoPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
    setVideoTitle("");
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelUpload = () => {
    if (isUploading) {
      toast.error("Your video upload has been cancelled");
    }
  };

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleUpload = async () => {
    if (!user?._id) {
      toast.error("Sign in to upload videos.");
      return;
    }

    if (!videoFile || !videoTitle.trim()) {
      toast.error("Please provide file and title");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const newBlob = await upload(videoTitle, videoFile, {
        access: "public",
        handleUploadUrl: "/api/video/upload",
      });

      const formdata = new FormData();
      formdata.append("videotitle", videoTitle);
      formdata.append("videochanel", user?.channelname || channelName || user?.name || "Your channel");
      formdata.append("uploader", user._id);
      formdata.append("filesize", videoFile.size.toString());
      formdata.append("filetype", videoFile.type);
      formdata.append("filename", videoFile.name);
      formdata.append("filepath", newBlob.url);

      await axiosInstance.post("/video/upload", formdata);

      setBlob(newBlob);

      toast.success("Upload successfully");
      resetForm();
      setUploadComplete(true);
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("There was an error uploading your video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`rounded-lg p-6 ${
        isLightTheme
          ? "bg-white border border-slate-200 text-slate-950"
          : "bg-slate-950 border border-slate-800 text-white"
      }`}
    >
      <h2 className={`text-xl font-semibold mb-4 ${isLightTheme ? "text-slate-950" : "text-white"}`}>
        Upload a video
      </h2>

      <div className="space-y-4">
        {!videoFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isLightTheme
                ? "border-gray-300 bg-white hover:bg-gray-100"
                : "border-slate-700 bg-slate-900 hover:bg-slate-800"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-12 h-12 mx-auto mb-2 ${isLightTheme ? "text-gray-400" : "text-slate-400"}`} />
            <p className={`text-lg font-medium ${isLightTheme ? "text-slate-950" : "text-white"}`}>
              Drag and drop video files to upload
            </p>
            <p className={`text-sm mt-1 ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
              or click to select files
            </p>
            <p className={`text-xs mt-4 ${isLightTheme ? "text-slate-400" : "text-slate-500"}`}>
              MP4, WebM, MOV or AVI • Up to 100MB
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={handlefilechange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-700"
                }`}
              >
                <div className="bg-blue-100 p-2 rounded-md">
                  <FileVideo className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isLightTheme ? "text-slate-950" : "text-white"}`}>
                    {videoFile.name}
                  </p>
                  <p className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <Button variant="ghost" size="icon" onClick={cancelUpload}>
                    <X className="w-5 h-5" />
                  </Button>
                )}
                {uploadComplete && (
                  <div className="bg-green-100 p-1 rounded-full">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>

              {videoPreviewUrl && (
                <div className={`rounded-lg border overflow-hidden ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-700"}`}>
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full max-h-72 bg-black"
                  />
                  <div className="p-3 space-y-2">
                    <p className={`text-sm font-medium ${isLightTheme ? "text-slate-950" : "text-white"}`}>Preview</p>
                    <p className={`text-xs ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                      Your selected video will be uploaded to the backend and
                      shown here while uploading.
                    </p>
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Upload progress</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label htmlFor="title">Title (required)</Label>
                  <Input
                    id="title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Add a title that describes your video"
                    disabled={isUploading || uploadComplete}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {!user && (
                <p className="text-sm text-red-600">
                  Sign in to upload videos and enforce plan-based upload limits.
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                {!uploadComplete && (
                  <>
                    <Button onClick={cancelUpload} disabled={uploadComplete}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={
                        isUploading || !user || !videoTitle.trim() || uploadComplete
                      }
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
