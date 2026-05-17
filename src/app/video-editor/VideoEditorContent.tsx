"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FaFileUpload, FaTrash, FaVolumeUp, FaVolumeMute, FaFont } from "react-icons/fa";
import AudioUploader from "@/components/videoeditor/AudioUploader";
import VideoDownloader from "@/components/videoeditor/VideoDownloader";
import Filters from "@/components/videoeditor/Filters";

const CANVAS_SIZE = { width: 1000, height: 500 };

type FabricCanvas = {
  add: (obj: unknown) => void;
  remove: (obj: unknown) => void;
  setActiveObject: (obj: unknown) => void;
  getActiveObject: () => { type?: string } | null;
  dispose: () => void;
};

const S = {
  editorWrap: {
    display: "flex",
    height: "100vh",
    backgroundColor: "var(--color-bg-tertiary)",
  } as React.CSSProperties,
  canvasArea: {
    flex: 3,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--color-bg-secondary)",
    padding: "16px",
  } as React.CSSProperties,
  canvasInner: {
    position: "relative" as const,
    width: CANVAS_SIZE.width,
    height: CANVAS_SIZE.height,
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
  } as React.CSSProperties,
  videoEl: (filter: string): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    borderRadius: "12px",
    filter,
    width: CANVAS_SIZE.width,
    height: CANVAS_SIZE.height,
  }),
  canvasEl: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    zIndex: 2,
    borderRadius: "12px",
  } as React.CSSProperties,
  tools: {
    padding: "16px 12px",
    backgroundColor: "var(--color-bg-elevated)",
    color: "var(--color-text-primary)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "12px",
    borderLeft: "1px solid var(--color-divider)",
    minWidth: "80px",
  } as React.CSSProperties,
  toolsTitle: {
    textAlign: "center" as const,
    fontSize: "0.75rem",
    fontWeight: 600,
    fontFamily: "var(--font-heading)",
    color: "var(--color-accent-primary)",
    marginTop: "12px",
    marginBottom: "4px",
  } as React.CSSProperties,
  toolBtn: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--color-bg-tertiary)",
    border: "1px solid var(--color-border-secondary)",
    color: "var(--color-text-secondary)",
    padding: "10px",
    borderRadius: "9999px",
    width: "44px",
    height: "44px",
    transition: "all 0.15s",
  } as React.CSSProperties,
  volumeSlider: {
    width: "80px",
    accentColor: "var(--color-accent-primary)",
  } as React.CSSProperties,
  mobileMsg: {
    textAlign: "center" as const,
    padding: "60px 24px",
    backgroundColor: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  } as React.CSSProperties,
  mobileTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    fontFamily: "var(--font-heading)",
    color: "var(--color-text-primary)",
  } as React.CSSProperties,
  mobileSub: {
    fontSize: "0.875rem",
    color: "var(--color-text-tertiary)",
  } as React.CSSProperties,
};

export default function VideoEditorContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [filter, setFilter] = useState("none");
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const textColor = "#ffffff";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1206);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile || !canvasRef.current) return;
    let disposed = false;
    let canvas: FabricCanvas | null = null;
    (async () => {
      const fabric = await import("fabric");
      if (disposed || !canvasRef.current) return;
      canvas = new fabric.Canvas(canvasRef.current, { selection: true }) as unknown as FabricCanvas;
      fabricCanvasRef.current = canvas;
    })();
    return () => {
      disposed = true;
      canvas?.dispose();
      fabricCanvasRef.current = null;
    };
  }, [isMobile]);

  const handleVideoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setVideoFile(URL.createObjectURL(file));
  };

  const adjustVolume = (event: ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const v = parseFloat(event.target.value);
      videoRef.current.volume = v;
      setVolume(v);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const addText = async () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;
    const fabric = await import("fabric");
    const text = new fabric.IText("Editable Text", {
      left: 50,
      top: 50,
      fontSize: 20,
      fill: textColor,
      selectable: true,
      editingBorderColor: "blue",
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    text.enterEditing();
  };

  const removeText = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (obj && obj.type === "i-text") fabricCanvas.remove(obj);
  };

  if (isMobile) {
    return (
      <div style={S.mobileMsg}>
        <h2 style={S.mobileTitle}>Desktop Only</h2>
        <p style={S.mobileSub}>Video editing is available only on desktop browsers.</p>
      </div>
    );
  }

  return (
    <div style={S.editorWrap}>
      {/* Canvas area */}
      <div style={S.canvasArea}>
        <div style={S.canvasInner}>
          <video
            ref={videoRef}
            controls
            width={CANVAS_SIZE.width}
            height={CANVAS_SIZE.height}
            src={videoFile ?? undefined}
            style={S.videoEl(filter)}
          />
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE.width}
            height={CANVAS_SIZE.height}
            style={S.canvasEl}
          />
        </div>
      </div>

      {/* Tools panel */}
      <div style={S.tools}>
        <h3 style={S.toolsTitle}>Editor Tools</h3>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={adjustVolume}
          style={S.volumeSlider}
          aria-label="Volume"
        />

        <button onClick={toggleMute} style={S.toolBtn} aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
        </button>

        <label style={{ ...S.toolBtn, cursor: "pointer" }} aria-label="Upload video">
          <FaFileUpload size={18} />
          <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: "none" }} />
        </label>

        <AudioUploader
          videoRef={videoRef}
          onUpload={(event: ChangeEvent<HTMLInputElement>) => {
            const f = event.target.files?.[0];
            if (f) setAudioFile(URL.createObjectURL(f));
          }}
        />

        <button onClick={addText} style={S.toolBtn} aria-label="Add text">
          <FaFont size={18} />
        </button>

        <button onClick={removeText} style={S.toolBtn} aria-label="Remove text">
          <FaTrash size={18} />
        </button>

        <VideoDownloader
          videoFile={videoFile}
          canvasRef={canvasRef}
          videoRef={videoRef}
          filter={filter}
          audioFile={audioFile}
        />

        <Filters setFilter={setFilter} />
      </div>
    </div>
  );
}
