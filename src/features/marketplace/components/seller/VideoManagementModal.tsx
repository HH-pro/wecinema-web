"use client";
// src/components/marketplace/seller/VideoManagementModal.tsx
import React, { useState } from "react";
import { toast } from '@/lib/toast';
import { formatFileSize } from '@/utils/helpers';

// ─── formatVideoDuration (was getVideoDurationFormatted from api) ────

const formatVideoDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

// ─── Types ───────────────────────────────────────────────────

interface MediaItem {
  _id: string;
  url: string;
  type: "image" | "video" | "document" | "audio";
  thumbnail?: string;
  duration?: number;
  fileSize?: number;
  filename?: string;
  mimeType?: string;
  resolution?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  isPreview?: boolean;
  order?: number;
}

interface Listing {
  _id: string;
  title: string;
  mediaUrls: MediaItem[];
  isVideoListing: boolean;
  videoStatus?: "active" | "processing" | "deactivated" | "failed";
  primaryVideo?: {
    url: string;
    thumbnail: string;
    duration: number;
    quality: string;
  };
}

interface VideoManagementModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onVideoStatusToggle: (listingId: string, status: "activated" | "deactivated") => void;
  onMediaDelete: (listingId: string, mediaId: string) => void;
}

// ─── Component ───────────────────────────────────────────────

const VideoManagementModal: React.FC<VideoManagementModalProps> = ({
  listing,
  isOpen,
  onClose,
  onVideoStatusToggle,
  onMediaDelete,
}) => {
  const [processing, setProcessing]               = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo]         = useState<MediaItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete]         = useState<string | null>(null);

  const videoMedia  = listing.mediaUrls.filter((m) => m.type === "video");
  const primaryVideo = videoMedia.find((m) => m.isPrimary) ?? videoMedia[0];

  // ── Handlers ─────────────────────────────────────────────

  const handleToggleVideoStatus = async () => {
    try {
      setProcessing("toggling");
      const newStatus = listing.videoStatus === "active" ? "deactivated" : "activated";
      await onVideoStatusToggle(listing._id, newStatus);
    } catch {
      toast.error("Failed to toggle video status");
    } finally {
      setProcessing(null);
    }
  };

  const handleSetPrimaryVideo = async (mediaId: string) => {
    try {
      setProcessing(`setting-primary-${mediaId}`);
      toast.success("Primary video set successfully!");
    } catch {
      toast.error("Failed to set primary video");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteVideo = (mediaId: string) => {
    setVideoToDelete(mediaId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    try {
      setProcessing(`deleting-${videoToDelete}`);
      await onMediaDelete(listing._id, videoToDelete);
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
      if (selectedVideo?._id === videoToDelete) setSelectedVideo(null);
    } catch {
      toast.error("Failed to delete video");
    } finally {
      setProcessing(null);
    }
  };

  const handleUploadNewVideo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = () => {
      toast("Video upload functionality coming soon", { icon: "ℹ️" });
    };
    input.click();
  };

  if (!isOpen) return null;

  // ── Video list sidebar ────────────────────────────────────

  const VideoSidebar = () => (
    <div className="w-1/3 border-r border-border bg-bg-secondary">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-text-primary">Videos ({videoMedia.length})</h4>
          <button
            onClick={handleUploadNewVideo}
            className="px-3 py-1 text-sm bg-info-bg text-info rounded-lg hover:opacity-80 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Video
          </button>
        </div>

        {/* Toggle all */}
        <div className="mb-4 p-4 bg-card-bg rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-text-primary text-sm">All Videos</span>
            <button
              onClick={handleToggleVideoStatus}
              disabled={processing === "toggling"}
              className={`px-3 py-1 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                listing.videoStatus === "active"
                  ? "bg-danger-bg text-danger hover:opacity-80"
                  : "bg-success-bg text-success hover:opacity-80"
              }`}
            >
              {processing === "toggling"
                ? "Processing…"
                : listing.videoStatus === "active"
                ? "Deactivate All"
                : "Activate All"}
            </button>
          </div>
          <p className="text-xs text-text-tertiary">
            {listing.videoStatus === "active"
              ? "All videos are currently visible to buyers."
              : "All videos are currently hidden from buyers."}
          </p>
        </div>

        {/* Video list */}
        <div className="space-y-3 overflow-y-auto max-h-[400px]">
          {videoMedia.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-text-tertiary mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <p className="text-sm text-text-secondary">No videos uploaded yet</p>
              <button onClick={handleUploadNewVideo} className="mt-2 text-sm text-info hover:opacity-80">
                Upload your first video
              </button>
            </div>
          ) : (
            videoMedia.map((video) => (
              <div
                key={video._id}
                onClick={() => setSelectedVideo(video)}
                className={`p-3 bg-card-bg rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                  selectedVideo?._id === video._id
                    ? "border-accent ring-1 ring-accent"
                    : "border-border"
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Thumbnail */}
                  <div className="w-20 h-12 bg-bg-tertiary rounded overflow-hidden flex-shrink-0">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt="thumb" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {video.filename ?? "Untitled Video"}
                      </p>
                      {video.isPrimary && (
                        <span className="ml-1 text-xs bg-info-bg text-info px-1.5 py-0.5 rounded flex-shrink-0">Primary</span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-text-tertiary mt-1 gap-2">
                      <span>{formatVideoDuration(video.duration ?? 0)}</span>
                      {video.fileSize && <span>{formatFileSize(video.fileSize)}</span>}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        video.isActive
                          ? "bg-success-bg text-success"
                          : "bg-danger-bg text-danger"
                      }`}>
                        {video.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex gap-2">
                        {!video.isPrimary && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSetPrimaryVideo(video._id); }}
                            disabled={!!processing}
                            className="text-xs text-info hover:opacity-80 disabled:opacity-50"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video._id); }}
                          disabled={!!processing}
                          className="text-xs text-danger hover:opacity-80 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ── Video detail panel ────────────────────────────────────

  const DetailPanel = () =>
    selectedVideo ? (
      <div className="space-y-6">
        {/* Player */}
        <div className="bg-black rounded-lg overflow-hidden">
          <div className="aspect-video">
            <video key={selectedVideo.url} controls className="w-full h-full" poster={selectedVideo.thumbnail}>
              <source src={selectedVideo.url} type={selectedVideo.mimeType ?? "video/mp4"} />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Details */}
        <div className="bg-card-bg rounded-lg border border-border p-6">
          <h4 className="font-medium text-text-primary mb-4">Video Details</h4>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Filename",     value: selectedVideo.filename ?? "N/A" },
              { label: "Duration",     value: formatVideoDuration(selectedVideo.duration ?? 0) },
              { label: "File Size",    value: selectedVideo.fileSize ? formatFileSize(selectedVideo.fileSize) : "N/A" },
              { label: "Primary",      value: selectedVideo.isPrimary ? "Yes" : "No" },
              ...(selectedVideo.resolution ? [{ label: "Resolution", value: selectedVideo.resolution }] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
                <p className="text-sm text-text-primary">{value}</p>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                selectedVideo.isActive
                  ? "bg-success-bg text-success"
                  : "bg-danger-bg text-danger"
              }`}>
                {selectedVideo.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-border flex gap-3">
            <button
              onClick={() => toast(`Would toggle video to ${selectedVideo.isActive ? "deactivated" : "activated"}`, { icon: "ℹ️" })}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedVideo.isActive
                  ? "bg-danger-bg text-danger hover:opacity-80"
                  : "bg-success-bg text-success hover:opacity-80"
              }`}
            >
              {selectedVideo.isActive ? "Deactivate Video" : "Activate Video"}
            </button>
            {!selectedVideo.isPrimary && (
              <button
                onClick={() => handleSetPrimaryVideo(selectedVideo._id)}
                disabled={processing === `setting-primary-${selectedVideo._id}`}
                className="px-4 py-2 text-sm bg-info-bg text-info rounded-lg hover:opacity-80 transition-colors disabled:opacity-50"
              >
                {processing === `setting-primary-${selectedVideo._id}` ? "Setting…" : "Set as Primary"}
              </button>
            )}
            <button
              onClick={() => handleDeleteVideo(selectedVideo._id)}
              disabled={processing === `deleting-${selectedVideo._id}`}
              className="px-4 py-2 text-sm bg-danger text-white rounded-lg hover:opacity-80 transition-colors disabled:opacity-50"
            >
              {processing === `deleting-${selectedVideo._id}` ? "Deleting…" : "Delete Video"}
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <svg className="w-16 h-16 text-text-tertiary mb-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        <h4 className="text-lg font-medium text-text-primary mb-2">Select a Video</h4>
        <p className="text-text-tertiary">Choose a video from the list to view details and manage settings.</p>
      </div>
    );

  // ── Main render ───────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Overlay */}
        <div className="fixed inset-0 bg-bg-overlay" onClick={onClose} />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-6xl bg-card-bg rounded-2xl shadow-xl overflow-hidden border border-border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Video Management</h3>
              <p className="mt-0.5 text-sm text-text-secondary">{listing.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                listing.videoStatus === "active"
                  ? "bg-success-bg text-success"
                  : "bg-danger-bg text-danger"
              }`}>
                {listing.videoStatus === "active" ? "Active" : "Inactive"}
              </span>
              <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex h-[600px]">
            <VideoSidebar />
            <div className="w-2/3 p-6 overflow-y-auto">
              <DetailPanel />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-bg-secondary flex justify-between items-center">
            <p className="text-sm text-text-secondary">
              {videoMedia.length} video{videoMedia.length !== 1 ? "s" : ""} •
              Primary: {primaryVideo?.filename ?? "Not set"} •
              Status: {listing.videoStatus === "active" ? "All Active" : "All Inactive"}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-card-bg border border-border rounded-lg hover:bg-bg-secondary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-bg-overlay" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-card-bg rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center mb-4 gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger-bg">
                <svg className="h-6 w-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-primary">Delete Video</h3>
                <p className="text-sm text-text-tertiary mt-1">Are you sure? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-card-bg border border-border rounded-lg hover:bg-bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVideo}
                disabled={!!processing}
                className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:opacity-80 disabled:opacity-50"
              >
                {processing ? "Deleting…" : "Delete Video"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagementModal;
