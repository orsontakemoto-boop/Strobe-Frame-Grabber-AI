import React from 'react';
import { Camera, StopCircle, Play, Upload, FolderOpen, ExternalLink, CheckCircle } from 'lucide-react';

interface ControlPanelProps {
  interval: number;
  setInterval: (val: number) => void;
  isCapturing: boolean;
  onToggleCapture: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: () => void;
  hasVideo: boolean;
  capturedCount: number;
  onSelectFolder: () => void;
  folderName: string | null;
  onOpenBatchCrop: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  interval,
  setInterval,
  isCapturing,
  onToggleCapture,
  onUpload,
  onLoadSample,
  hasVideo,
  capturedCount,
  onSelectFolder,
  folderName,
  onOpenBatchCrop
}) => {
  return (
    <div className="bg-[#1f1f1f] p-6 rounded-xl border border-[#333] shadow-lg space-y-6">
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Camera className="text-yt-red" /> Painel de Controle
        </h2>
        <p className="text-gray-400 text-xs mt-1">Configure a pasta e inicie a captura.</p>
      </div>

      {/* Upload Section */}
      <div className="space-y-3">
        <label className="block w-full cursor-pointer bg-[#2a2a2a] hover:bg-[#333] transition-colors border-2 border-dashed border-gray-600 rounded-lg p-3 text-center group">
          <input 
            type="file" 
            accept="video/mp4,video/webm" 
            onChange={onUpload} 
            className="hidden" 
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-5 w-5 text-gray-400 group-hover:text-white" />
            <span className="text-xs text-gray-300 font-medium">Carregar MP4</span>
          </div>
        </label>
        
        <button 
          onClick={onLoadSample}
          className="w-full text-[10px] text-gray-500 hover:text-white underline decoration-dotted"
        >
          Carregar exemplo (Big Buck Bunny)
        </button>
      </div>

      <hr className="border-gray-700" />

      {/* Folder Selection (Auto Save) */}
      <div className="space-y-2">
        <label className="text-sm text-gray-300 font-medium">Destino do Salvamento</label>
        <button 
          onClick={onSelectFolder}
          disabled={isCapturing}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
            folderName 
              ? 'bg-green-900/20 border-green-600 text-green-400' 
              : 'bg-[#2a2a2a] border-gray-600 text-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {folderName ? <CheckCircle size={18} /> : <FolderOpen size={18} />}
            <span className="truncate text-xs font-mono">
              {folderName ? folderName : 'Selecionar Pasta...'}
            </span>
          </div>
          {folderName && <span className="text-[10px] uppercase font-bold tracking-wider">Auto-Save</span>}
        </button>
        <p className="text-[10px] text-gray-500">
          {folderName 
            ? "Os frames serão salvos automaticamente nesta pasta." 
            : "Selecione uma pasta para ativar o salvamento automático."}
        </p>
      </div>

      {/* Interval Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-300">
          <label>Intervalo</label>
          <span className="font-mono text-yt-red bg-red-900/30 px-2 rounded">{interval} frames</span>
        </div>
        <input
          type="range"
          min="1"
          max="60"
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          disabled={!hasVideo}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yt-red disabled:opacity-50"
        />
      </div>

      {/* Capture Button */}
      <div className="pt-2">
        <button
          onClick={onToggleCapture}
          disabled={!hasVideo}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold transition-all text-sm ${
            isCapturing
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
              : 'bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isCapturing ? (
            <>
              <StopCircle className="w-5 h-5" /> PARAR
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" /> INICIAR
            </>
          )}
        </button>
      </div>

      <hr className="border-gray-700" />

      {/* BatchCrop Button */}
      <button
        onClick={onOpenBatchCrop}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#333] hover:bg-[#444] text-gray-200 border border-gray-600 transition-colors text-xs font-medium"
      >
        <ExternalLink size={14} /> Abrir BatchCrop A4
      </button>

      {/* Status Info */}
      <div className="text-[10px] text-gray-500 pt-2 flex justify-between items-center">
        <span>v2.5 Auto-Save</span>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasVideo ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{hasVideo ? 'Pronto' : 'Aguardando'}</span>
        </div>
      </div>
    </div>
  );
};