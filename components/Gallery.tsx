import React from 'react';
import { CapturedFrame } from '../types';
import { Sparkles, Trash2, Copy } from 'lucide-react';

interface GalleryProps {
  frames: CapturedFrame[];
  onAnalyze: (id: string, base64: string) => void;
  onDelete: (id: string) => void;
  onCopy: (blob: Blob) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ frames, onAnalyze, onDelete, onCopy }) => {
  if (frames.length === 0) {
    return (
      <div className="h-32 flex flex-col items-center justify-center text-gray-600 text-xs p-4 text-center">
        <p>A galeria está vazia.</p>
        <p className="mt-1 opacity-70">Inicie a captura enquanto o vídeo reproduz.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {frames.map((frame) => (
        <div key={frame.id} className="group relative bg-[#1f1f1f] rounded border border-gray-800 overflow-hidden shadow-sm">
          {/* Image Container with checkerboard background to show transparency */}
          <div 
            className="w-full relative bg-[#000]"
            style={{ 
              paddingBottom: '56.25%', // 16:9 aspect ratio
              backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px' 
            }} 
          >
            <img 
              src={frame.dataUrl} 
              alt={`T=${frame.timestamp}`} 
              className="absolute inset-0 w-full h-full object-contain"
              loading="lazy"
            />
          </div>

          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
             <button 
                onClick={() => onCopy(frame.blob)}
                className="p-1.5 bg-gray-600 rounded text-white hover:bg-gray-500 shadow-lg"
                title="Copiar para Clipboard"
             >
                <Copy size={16} />
             </button>
             <button 
                onClick={() => {
                    const base64 = frame.dataUrl.split(',')[1];
                    onAnalyze(frame.id, base64);
                }}
                disabled={frame.isAnalyzing || !!frame.description}
                className="p-1.5 bg-blue-600 rounded text-white hover:bg-blue-500 shadow-lg"
                title="IA Analisar"
             >
                <Sparkles size={16} />
             </button>
             <button 
                onClick={() => onDelete(frame.id)}
                className="p-1.5 bg-red-600 rounded text-white hover:bg-red-500 shadow-lg"
                title="Excluir"
             >
                <Trash2 size={16} />
             </button>
          </div>

          {/* Time Badge */}
          <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white z-0 pointer-events-none">
            {frame.timestamp.toFixed(1)}s
          </div>

          {/* AI Result indicator */}
          {frame.description && (
             <div className="absolute top-1 left-1 z-10">
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" title="Analyzed"></div>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};