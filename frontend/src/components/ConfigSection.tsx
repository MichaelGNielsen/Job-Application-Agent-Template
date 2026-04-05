/**
 * ConfigSection.tsx
 * UI-komponent til system-kartoteket (Master CV, AI Prompts, Design).
 */

import React from 'react';

interface ConfigSectionProps {
  activeTab: 'brutto' | 'ai' | 'layout' | 'radar';
  setActiveTab: (t: any) => void;
  bruttoCv: string;
  setBruttoCv: (v: string) => void;
  aiInstructions: string;
  setAiInstructions: (v: string) => void;
  masterLayout: string;
  setMasterLayout: (v: string) => void;
  isLoading: boolean;
  isMasterLoading: boolean;
  statusMessage: string;
  dirtyBrutto: boolean;
  bruttoViewMode: 'markdown' | 'html';
  setBruttoViewMode: (m: 'markdown' | 'html') => void;
  masterPreviewHtml: string | null;
  onSave: (type: string) => void;
  onRefineMaster: () => void;
  onRenderMaster: () => void;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  activeTab, setActiveTab, bruttoCv, setBruttoCv, 
  aiInstructions, setAiInstructions, masterLayout, setMasterLayout,
  isLoading, isMasterLoading, statusMessage, dirtyBrutto,
  bruttoViewMode, setBruttoViewMode, masterPreviewHtml,
  onSave, onRefineMaster, onRenderMaster
}) => {
  return (
    <section className="transition-all duration-500 overflow-hidden opacity-100 mb-12">
      <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-lg w-fit">
        {(['brutto', 'ai', 'layout', 'radar'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#112240] text-cyan-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
            {tab === 'brutto' ? '📜 Master CV' : tab === 'ai' ? '🧠 AI Prompts' : tab === 'layout' ? '🎨 Design' : '🎯 Job-Radar'}
          </button>
        ))}
      </div>
      
      {activeTab === 'brutto' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <button onClick={() => onSave('brutto')} className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg ${dirtyBrutto ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
              {dirtyBrutto ? '💾 Gem Master CV *' : '💾 Gem Master CV'}
            </button>
            <a href="/api/brutto/pdf" target="_blank" rel="noreferrer" className="bg-[#112240] hover:bg-[#1d355e] text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase border border-cyan-500/30">📄 PDF</a>
            <button onClick={onRefineMaster} disabled={isMasterLoading} className="bg-cyan-900/40 hover:bg-cyan-600/40 text-cyan-400 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase border border-cyan-500/20">
              {isMasterLoading ? '🌀 Optimering...' : '✨ AI Optimér'}
            </button>
            <div className="flex gap-1 bg-[#0a192f] p-1 rounded-lg ml-auto border border-white/10">
              <button onClick={() => setBruttoViewMode('markdown')} className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase ${bruttoViewMode === 'markdown' ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}>REDIGÉR MD</button>
              <button onClick={onRenderMaster} className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase ${bruttoViewMode === 'html' ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}>VIS PREVIEW</button>
            </div>
          </div>
          <div className="h-[700px] flex flex-col">
            {bruttoViewMode === 'markdown' ? (
              <textarea className="w-full flex-1 bg-[#112240] border border-white/10 rounded-xl p-8 font-mono text-sm text-cyan-50 outline-none resize-none" value={bruttoCv} onChange={(e) => setBruttoCv(e.target.value)} />
            ) : (
              <div className="w-full flex-1 bg-white border border-white/10 rounded-xl overflow-hidden">
                <iframe srcDoc={masterPreviewHtml || ''} title="Master CV Preview" className="w-full h-full border-none" />
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="flex bg-white/5 p-3 rounded-xl border border-white/5">
            <button onClick={() => onSave('ai')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase">💾 Gem AI Prompts</button>
          </div>
          <textarea className="w-full h-[600px] bg-[#112240] border border-white/10 rounded-xl p-8 font-mono text-sm text-cyan-50 outline-none resize-none" value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} />
        </div>
      )}

      {activeTab === 'layout' && (
        <div className="space-y-4">
          <div className="flex bg-white/5 p-3 rounded-xl border border-white/5">
            <button onClick={() => onSave('layout')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase">💾 Gem Design</button>
          </div>
          <textarea className="w-full h-[600px] bg-[#112240] border border-white/10 rounded-xl p-8 font-mono text-sm text-cyan-50 outline-none resize-none" value={masterLayout} onChange={(e) => setMasterLayout(e.target.value)} />
        </div>
      )}
    </section>
  );
};
