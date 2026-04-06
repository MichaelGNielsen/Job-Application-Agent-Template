/**
 * ResultSection.tsx
 * UI-komponent til visning af genererede dokumenter (Ansøgning, CV etc.).
 */

import React from 'react';

interface ResultSectionProps {
  results: {
    folder: string;
    aiNotes?: string;
    markdown: { [key: string]: string };
    html: { [key: string]: string };
    links: { [key: string]: { md: string, html: string, pdf: string } };
  };
  viewModes: { [key: string]: 'html' | 'markdown' };
  setViewMode: (id: string, mode: 'html' | 'markdown') => void;
  dirtyDocs: { [key: string]: boolean };
  onRefine: (id: string, useAi: boolean, hint?: string) => void;
  onUpdateBody: (id: string, body: string) => void;
  isLoading: boolean;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  results, viewModes, setViewMode, dirtyDocs, onRefine, onUpdateBody, isLoading
}) => {
  const [docHints, setDocHints] = React.useState<{ [key: string]: string }>({});

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="bg-cyan-950/20 border border-cyan-500/20 p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
        <h3 className="text-cyan-400 font-black mb-4 flex items-center gap-3 uppercase italic">
          <span className="text-2xl">🧠</span> AI Ræsonnement (Redaktørens noter)
        </h3>
        <p className="text-gray-300 leading-relaxed italic text-sm">
          {results.aiNotes ? `"${results.aiNotes}"` : "AI'en har optimeret dokumenterne."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {['ansøgning', 'cv', 'match', 'ican'].map((id) => {
          if (!results.markdown[id]) return null;
          const title = id === 'ansøgning' ? 'Ansøgning' : id === 'cv' ? 'CV' : id === 'match' ? 'Match Analyse' : 'ICAN+ Pitch';
          const body = results.markdown[id];
          const mode = viewModes[id] || 'html';

          return (
            <div key={id} className="bg-[#112240] rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[700px]">
              <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-cyan-500 uppercase">Dokument</span>
                  <span className="text-sm font-bold text-white uppercase">{title}</span>
                </div>
                <div className="flex gap-1 bg-[#0a192f] p-1 rounded-xl">
                  {(['html', 'markdown'] as const).map(m => (
                    <button key={m} onClick={() => setViewMode(id, m)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${mode === m ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}>
                      {m === 'html' ? 'PREVIEW' : 'RET INDHOLD'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-4">
                  <input 
                    type="text" 
                    placeholder="Hint til AI (f.eks. gør kortere...)" 
                    className="bg-[#0a192f] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-gray-300 focus:border-cyan-500/50 outline-none w-48 transition-all"
                    value={docHints[id] || ''}
                    onChange={(e) => setDocHints({ ...docHints, [id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && onRefine(id, true, docHints[id])}
                  />
                  <button 
                    onClick={() => onRefine(id, true, docHints[id])} 
                    disabled={isLoading}
                    className={`text-[10px] font-bold px-4 py-2 rounded-lg border flex items-center gap-2 whitespace-nowrap transition-all ${isLoading ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border-cyan-500/20'}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block [transform:scaleX(-1)]">
                          <span className="inline-block animate-spin [animation-direction:reverse] text-sm">🌀</span>
                        </span> Forfiner...
                      </span>
                    ) : '✨ AI Forfin'}
                  </button>
                  <a href={results.links[id]?.pdf} target="_blank" rel="noreferrer" className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-[10px] font-bold px-4 py-2 rounded-lg border border-red-500/20">PDF</a>
                </div>
              </div>
              <div className="flex-1 p-6 relative">
                {mode === 'html' && <iframe srcDoc={results.html[id]} className="w-full h-full border-none rounded-xl bg-white shadow-2xl" />}
                {mode === 'markdown' && <textarea className="w-full h-full bg-[#0a192f] text-cyan-50 font-mono text-sm p-8 rounded-xl outline-none" value={body} onChange={(e) => onUpdateBody(id, e.target.value)} />}
              </div>
              <div className="p-6 pt-0">
                <button onClick={() => onRefine(id, false)} className={`w-full py-4 text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all border ${dirtyDocs[id] ? 'bg-orange-600 text-white border-orange-400 shadow-lg' : 'bg-white/5 text-white border-white/10 hover:border-cyan-500/50'}`}>
                  {dirtyDocs[id] ? `💾 Gem ændringer i ${title} *` : `💾 Gem alle rettelser i ${title}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
