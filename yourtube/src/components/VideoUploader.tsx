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
  const { user } = useUser();
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
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Upload a video</h2>

      <div className="space-y-4">
        {!videoFile ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-lg font-medium">
              Drag and drop video files to upload
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-4">
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
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="bg-blue-100 p-2 rounded-md">
                  <FileVideo className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{videoFile.name}</p>
                  <p className="text-sm text-gray-500">
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
                <div className="bg-white rounded-lg border overflow-hidden">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full max-h-72 bg-black"
                  />
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium">Preview</p>
                    <p className="text-xs text-gray-500">
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

            <div className="flex justify-between gap-3 items-center">
              {!user && (
                <p className="text-sm text-red-600">
                  Sign in to upload videos and enforce plan-based upload limits.
                </p>
              )}
              <div className="flex justify-end gap-3">
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
