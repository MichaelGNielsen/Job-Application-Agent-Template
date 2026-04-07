/**
 * RadarSection.tsx
 * UI-komponent til Job-Radaren.
 */

import React from 'react';
import { RadarJob } from '../hooks/useRadar';

interface RadarSectionProps {
  jobs: RadarJob[];
  radius: number;
  setRadius: (v: number) => void;
  baseCity: string;
  setBaseCity: (v: string) => void;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  sortMode: string;
  setSortMode: (m: any) => void;
  manualUrl: string;
  setManualUrl: (v: string) => void;
  isLoading: boolean;
  statusMessage: string;
  onAddJob: () => void;
  onRefresh: () => void;
  onMaintenance: () => void;
  onSaveConfig: () => void;
  onIgnoreJob: (id: string) => void;
  onStartAutomation: (job: RadarJob) => void;
}

export const RadarSection: React.FC<RadarSectionProps> = ({
  jobs, radius, setRadius, baseCity, setBaseCity, 
  selectedJobId, setSelectedJobId, sortMode, setSortMode,
  manualUrl, setManualUrl, isLoading, statusMessage,
  onAddJob, onRefresh, onMaintenance, onSaveConfig, 
  onIgnoreJob, onStartAutomation
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-cyan-900/10 border border-cyan-500/20 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">Proaktiv Job-Radar</h3>
          <p className="text-gray-400 text-sm">Udgangspunkt: <span className="text-cyan-400 font-bold">{baseCity}</span></p>
        </div>
        <div className="flex items-center gap-4 bg-[#0a192f] p-3 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest whitespace-nowrap">Hjemby</label>
            <input type="text" className="w-32 bg-[#112240] border border-cyan-500/30 rounded-lg p-2 text-white text-xs font-bold text-center outline-none" value={baseCity} onChange={(e) => setBaseCity(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest whitespace-nowrap">Radius (km)</label>
            <input type="number" className="w-16 bg-[#112240] border border-cyan-500/30 rounded-lg p-2 text-white text-xs font-bold text-center outline-none" value={radius} onChange={(e) => setRadius(parseInt(e.target.value) || 0)} />
          </div>
          <button 
            onClick={onSaveConfig} 
            disabled={isLoading}
            className={`bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase shadow-lg flex items-center gap-2 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading && statusMessage.includes('radar') ? (
              <span className="flex items-center gap-2">
                <span className="inline-block [transform:scaleX(-1)]">
                  <span className="inline-block animate-spin [animation-direction:reverse]">🌀</span>
                </span> Gemmer...
              </span>
            ) : 'Gem'}
          </button>
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          <div className="flex-1 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Indsæt job-link..." 
              className="flex-1 bg-[#112240] border border-cyan-500/30 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-400"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddJob()}
            />
            <button 
              onClick={onAddJob}
              disabled={isLoading || !manualUrl}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${isLoading || !manualUrl ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20'}`}
            >
              {isLoading && statusMessage.includes('Analyserer') ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block [transform:scaleX(-1)]">
                    <span className="inline-block animate-spin [animation-direction:reverse]">🌀</span>
                  </span> Analyserer...
                </span>
              ) : 'Tilføj'}
            </button>
          </div>
          <button 
            onClick={onMaintenance} 
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${isLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border-amber-500/20'}`}
          >
            🧹 Vask
          </button>
          <button 
            onClick={onRefresh} 
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all whitespace-nowrap flex items-center gap-3 ${isLoading ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border-cyan-500/20'}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block [transform:scaleX(-1)]">
                  <span className="inline-block animate-spin [animation-direction:reverse]">🌀</span>
                </span> Søger...
              </span>
            ) : '🚀 Søg nye job'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[750px]">
        <div className="lg:col-span-7 bg-[#0a192f] rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-2xl">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-4 text-[9px] font-black text-cyan-500/50 uppercase tracking-[0.2em]">
            <button onClick={() => setSortMode('score')} className={sortMode === 'score' ? 'text-cyan-400' : ''}>Score</button>
            <button onClick={() => setSortMode('distance')} className={sortMode === 'distance' ? 'text-cyan-400' : ''}>KM</button>
            <button onClick={() => setSortMode('title')} className={`flex-1 text-left ${sortMode === 'title' ? 'text-cyan-400' : ''}`}>Stilling</button>
            <button onClick={() => setSortMode('company')} className={`w-32 text-left ${sortMode === 'company' ? 'text-cyan-400' : ''}`}>Firma</button>
            <button onClick={() => setSortMode('date')} className={sortMode === 'date' ? 'text-cyan-400' : ''}>Udløb</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {jobs.map(job => (
              <div key={job.id} className={`px-4 py-2 border-b border-white/5 cursor-pointer transition-all flex items-center gap-4 group text-[11px] ${selectedJobId === job.id ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}>
                <div onClick={() => setSelectedJobId(job.id)} className={`w-10 text-center font-black ${job.matchScore > 90 ? 'text-cyan-400' : 'text-gray-500'}`}>{job.matchScore}%</div>
                <div onClick={() => setSelectedJobId(job.id)} className="w-10 text-center font-mono text-gray-500">{job.distance}</div>
                <div onClick={() => setSelectedJobId(job.id)} className={`flex-1 truncate font-bold ${selectedJobId === job.id ? 'text-white' : 'text-gray-300'}`}>{job.title}</div>
                <div onClick={() => setSelectedJobId(job.id)} className="w-32 truncate text-cyan-600/70 font-medium">{job.company}</div>
                <button onClick={() => onIgnoreJob(job.id)} className="w-6 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                <div className="w-16 text-right text-gray-600 font-mono">{new Date(job.expiryDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#112240] rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
          {selectedJobId ? (() => {
            const job = jobs.find(j => j.id === selectedJobId);
            if (!job) return null;
            return (
              <>
                <div className="bg-white/5 p-8 border-b border-white/5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-white">{job.title}</h2>
                        <p className="text-cyan-500 font-bold">{job.company} • {job.location}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => onStartAutomation(job)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest">🚀 Automatisér</button>
                        <button onClick={() => onIgnoreJob(job.id)} className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/20 px-6 py-2 rounded-lg font-black uppercase text-[10px] text-center">📁 Arkivér</button>
                        <a href={job.url} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-black text-[10px] uppercase text-center">🔗 Link</a>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="text-3xl font-black text-cyan-400">{job.matchScore}% <span className="text-[10px] text-gray-500 uppercase font-mono">Match</span></div>
                  </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto space-y-6">
                  {job.reasons.map((r, i) => (
                    <div key={i} className="bg-[#0a192f] p-4 rounded-xl text-xs text-gray-300 italic border border-white/5"><span className="text-cyan-500 mr-2">▹</span>{r}</div>
                  ))}
                </div>
              </>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="italic">Vælg et job fra listen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
