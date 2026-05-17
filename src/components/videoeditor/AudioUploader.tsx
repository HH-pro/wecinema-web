"use client";

import { useRef, useState, type RefObject, type ChangeEvent } from "react";
import { FaMusic } from "react-icons/fa";

interface AudioUploaderProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function AudioUploader({ videoRef, onUpload }: AudioUploaderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(1);

  const handleAudioUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    }
    onUpload(event);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const syncAudioWithVideo = () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (v && a) {
      v.ontimeupdate = () => {
        if (Math.abs(v.currentTime - a.currentTime) > 0.1) {
          a.currentTime = v.currentTime;
        }
      };
      v.onplay = () => a.play();
      v.onpause = () => a.pause();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <label
        onMouseEnter={(e) => (e.currentTarget.style.background = "#ffb300")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#444")}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#444",
          color: "#fff",
          padding: "10px",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
        }}
        aria-label="Upload audio"
      >
        <FaMusic size={20} />
        <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: "none" }} />
      </label>
      {audioFile && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <audio ref={audioRef} controls onLoadedMetadata={syncAudioWithVideo} style={{ width: "100%" }} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            style={{ width: "100px", marginTop: "5px" }}
            aria-label="Audio volume"
          />
        </div>
      )}
    </div>
  );
}
