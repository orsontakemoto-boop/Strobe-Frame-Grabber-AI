export interface CapturedFrame {
  id: string;
  timestamp: number;
  dataUrl: string;
  blob: Blob;
  description?: string;
  isAnalyzing?: boolean;
}

export interface FrameSettings {
  interval: number; // Capture every N frames (1-60)
  isCapturing: boolean;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
}
