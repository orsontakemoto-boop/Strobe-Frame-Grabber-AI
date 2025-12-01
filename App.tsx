import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CapturedFrame } from './types';
import { ControlPanel } from './components/ControlPanel';
import { Gallery } from './components/Gallery';
import { analyzeFrameContent } from './services/geminiService';
import { Clapperboard, Film } from 'lucide-react';

// Helper to convert dataURL to Blob
const dataURLToBlob = (dataURL: string): Blob => {
  try {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Error converting DataURL to Blob", e);
    return new Blob([], { type: 'image/png' });
  }
};

const App: React.FC = () => {
  // State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [interval, setInterval] = useState(30);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [capturedCount, setCapturedCount] = useState(0);
  
  // File System State
  const [dirHandle, setDirHandle] = useState<any | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const isCapturingRef = useRef(isCapturing);
  const intervalRef = useRef(interval);
  const dirHandleRef = useRef<any | null>(null);

  // Sync refs
  useEffect(() => { isCapturingRef.current = isCapturing; }, [isCapturing]);
  useEffect(() => { intervalRef.current = interval; }, [interval]);
  useEffect(() => { dirHandleRef.current = dirHandle; }, [dirHandle]);

  // Clean up URL object when component unmounts or source changes
  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setFrames([]);
      setCapturedCount(0);
      setIsCapturing(false);
    }
  };

  const handleLoadSample = () => {
    setVideoSrc("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
    setFrames([]);
    setCapturedCount(0);
    setIsCapturing(false);
  };

  // Directory Selection
  const handleSelectFolder = async () => {
    try {
        // @ts-ignore
        if (typeof window.showDirectoryPicker !== 'function') {
            alert("Seu navegador não suporta a API de Sistema de Arquivos (File System Access API).\n\nUse o Google Chrome ou Edge em Desktop.");
            return;
        }

        // @ts-ignore
        const handle = await window.showDirectoryPicker({
            mode: 'readwrite'
        });
        
        // Verify permission if needed (though showDirectoryPicker usually implies it initially)
        if (handle.requestPermission) {
             const status = await handle.requestPermission({ mode: 'readwrite' });
             if (status !== 'granted') {
                 alert("Permissão de escrita negada na pasta.");
                 return;
             }
        }

        setDirHandle(handle);
        setFolderName(handle.name);
    } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled
        if (err.name === 'SecurityError') {
             alert("Erro de Segurança: A API de arquivos foi bloqueada. Se estiver em um iframe/preview, tente abrir em uma nova aba.");
        } else {
             console.error("Error selecting folder:", err);
             alert(`Erro ao selecionar pasta: ${err.message || err}`);
        }
    }
  };

  // Save specific file to disk (Fire and forget style)
  const saveFrameToDisk = async (handle: any, blob: Blob, timestamp: number) => {
    try {
        const fileName = `frame_${timestamp.toFixed(2).replace('.', '_')}.png`;
        const fileHandle = await handle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
    } catch (err) {
        console.error("Auto-save failed for frame:", timestamp, err);
    }
  };

  const handleOpenBatchCrop = () => {
      window.open('https://batchcrop-a4-848831664964.us-west1.run.app/', '_blank');
  };

  // Determine if we need crossOrigin="anonymous"
  const isRemote = videoSrc?.startsWith('http');

  // Capture Loop
  const captureFrameLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Safety checks
    if (!video || !canvas || !isCapturingRef.current) {
        return; 
    }

    // Ensure video has data
    if (video.readyState < 2) { 
        if ('requestVideoFrameCallback' in video) {
            // @ts-ignore
            video.requestVideoFrameCallback(captureFrameLoop);
        } else {
            requestRef.current = requestAnimationFrame(captureFrameLoop);
        }
        return;
    }

    frameCountRef.current += 1;

    if (frameCountRef.current % intervalRef.current === 0) {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              try {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL('image/png');
                  const blob = dataURLToBlob(dataUrl);
                  
                  const newFrame: CapturedFrame = {
                    id: Date.now().toString() + Math.random().toString().slice(2),
                    timestamp: video.currentTime,
                    dataUrl: dataUrl,
                    blob: blob,
                  };

                  setFrames(prev => [newFrame, ...prev]);
                  setCapturedCount(c => c + 1);

                  // AUTO SAVE
                  if (dirHandleRef.current) {
                      saveFrameToDisk(dirHandleRef.current, blob, video.currentTime);
                  }

              } catch (err) {
                  console.error("Frame capture failed:", err);
                  setIsCapturing(false);
              }
          }
      }
    }

    if (!video.paused && !video.ended) {
        if ('requestVideoFrameCallback' in video) {
            // @ts-ignore
            video.requestVideoFrameCallback(captureFrameLoop);
        } else {
            requestRef.current = requestAnimationFrame(captureFrameLoop);
        }
    }
  }, []);

  const handleToggleCapture = () => {
      const video = videoRef.current;
      if (!video) return;

      if (!isCapturing && !dirHandle && !videoSrc?.startsWith('blob:')) {
          // Optional warning if no folder selected, but we let them proceed to gallery-only mode
          // alert("Nota: Nenhuma pasta selecionada. As imagens ficarão apenas na Galeria.");
      }

      const newState = !isCapturing;
      setIsCapturing(newState);
      
      if (newState) {
          frameCountRef.current = 0;
          if (!video.paused) {
             if ('requestVideoFrameCallback' in video) {
                 // @ts-ignore
                 video.requestVideoFrameCallback(captureFrameLoop);
             } else {
                 requestRef.current = requestAnimationFrame(captureFrameLoop);
             }
          } else {
            video.play();
          }
      } else {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          video.pause();
      }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
        if (isCapturingRef.current) {
            if ('requestVideoFrameCallback' in video) {
                // @ts-ignore
                video.requestVideoFrameCallback(captureFrameLoop);
            } else {
                requestRef.current = requestAnimationFrame(captureFrameLoop);
            }
        }
    };

    video.addEventListener('play', handlePlay);
    return () => video.removeEventListener('play', handlePlay);
  }, [captureFrameLoop]);

  // AI & Data Handlers
  const handleAnalyze = async (id: string, base64: string) => {
      setFrames(prev => prev.map(f => f.id === id ? { ...f, isAnalyzing: true } : f));
      const description = await analyzeFrameContent(base64);
      setFrames(prev => prev.map(f => f.id === id ? { ...f, isAnalyzing: false, description } : f));
  };

  const handleDelete = (id: string) => {
      setFrames(prev => prev.filter(f => f.id !== id));
      setCapturedCount(prev => prev - 1);
  }

  const copyBlobToClipboard = async (blob: Blob) => {
      try {
          await navigator.clipboard.write([
              new ClipboardItem({
                  [blob.type]: blob
              })
          ]);
      } catch (err) {
          console.error('Failed to copy: ', err);
          alert("Erro de Clipboard: " + err);
      }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-[#272727] flex items-center px-6 bg-[#0f0f0f] sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <Clapperboard className="text-yt-red w-6 h-6" />
           <h1 className="text-xl font-bold tracking-tight">StrobeFrame <span className="text-gray-400 font-normal">Grabber AI</span></h1>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
           <span>v2.6 Stable</span>
           {process.env.API_KEY && <span className="text-green-600 bg-green-900/20 px-2 py-0.5 rounded">AI Connected</span>}
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1800px] mx-auto w-full">
        
        {/* Left Column: Controls & Video */}
        <div className="lg:col-span-8 flex flex-col gap-6">
           
           {/* Video Player Container */}
           <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-[#333] group">
              {videoSrc ? (
                <video 
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  crossOrigin={isRemote ? "anonymous" : undefined}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                   <Film className="w-16 h-16 mb-4 opacity-50" />
                   <p className="text-sm">Nenhum vídeo carregado</p>
                </div>
              )}
              
              {isCapturing && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse pointer-events-none z-10">
                  <div className="w-2 h-2 bg-white rounded-full"></div> REC {folderName && <span className="opacity-75 font-normal ml-1">Saving...</span>}
                </div>
              )}
           </div>

           {/* Stats Bar */}
           {videoSrc && (
             <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#333]">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Frames Capturados</div>
                  <div className="text-2xl font-mono text-white">{capturedCount}</div>
                  {folderName && <div className="text-[10px] text-green-500 mt-1">Salvando em: {folderName}</div>}
                </div>
                <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#333]">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Intervalo Atual</div>
                  <div className="text-2xl font-mono text-yt-red">{interval} <span className="text-sm text-gray-500">f</span></div>
                </div>
                <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#333]">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status AI</div>
                  <div className="text-2xl font-mono text-blue-400">
                    {frames.filter(f => f.description).length} <span className="text-sm text-gray-500">analisados</span>
                  </div>
                </div>
             </div>
           )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-[calc(100vh-8rem)] sticky top-24">
           {/* Controls */}
           <ControlPanel 
              interval={interval}
              setInterval={setInterval}
              isCapturing={isCapturing}
              onToggleCapture={handleToggleCapture}
              onUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              hasVideo={!!videoSrc}
              capturedCount={capturedCount}
              onSelectFolder={handleSelectFolder}
              folderName={folderName}
              onOpenBatchCrop={handleOpenBatchCrop}
           />

           {/* Gallery */}
           <div className="flex-1 bg-[#1f1f1f] rounded-xl border border-[#333] shadow-lg flex flex-col overflow-hidden">
             <div className="p-4 border-b border-[#333] flex justify-between items-center">
               <h3 className="font-bold text-sm text-gray-200">Galeria (Cache)</h3>
               <span className="text-xs text-gray-500">{frames.length} itens</span>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                <Gallery 
                  frames={frames} 
                  onAnalyze={handleAnalyze} 
                  onDelete={handleDelete}
                  onCopy={copyBlobToClipboard}
                />
             </div>
           </div>
        </div>
      </main>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;