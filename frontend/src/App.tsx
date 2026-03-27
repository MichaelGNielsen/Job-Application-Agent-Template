/**
 * Job Application Agent Template
 * 
 * Designer: MGN (mgn@mgnielsen.dk)
 * Copyright (c) 2026 MGN. All rights reserved.
 * 
 * BEMÆRK: Denne kode anvender AI til generering og behandling.
 * Brugeren skal selv verificere, at resultatet er som forventet.
 * Softwaren leveres "som den er", uden nogen form for garanti.
 * Brug af softwaren sker på eget ansvar.
 */

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io();
const THEME_COLOR = "cyan";

type ViewMode = 'html' | 'markdown' | 'meta';

const App: React.FC = () => {
  const [version, setVersion] = useState('v3.6.8');
  const [instanceName, setInstanceName] = useState('');
  const [jobText, setJobText] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [hint, setHint] = useState('');
  
  // Kartotek States
  const [activeTab, setActiveTab] = useState<'brutto' | 'ai' | 'layout'>('brutto');
  const [bruttoCv, setBruttoCv] = useState('');
  const [originalBruttoCv, setOriginalBruttoCv] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [originalAiInstructions, setOriginalAiInstructions] = useState('');
  const [masterLayout, setMasterLayout] = useState('');
  const [originalMasterLayout, setOriginalMasterLayout] = useState('');
  const [isAiRefined, setIsAiRefined] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isMasterLoading, setIsMasterLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [viewModes, setViewModes] = useState<{ [key: string]: ViewMode }>({
    ansøgning: 'html', cv: 'html', match: 'html', ican: 'html'
  });
  const [results, setResults] = useState<{ 
    folder: string, 
    lang?: string,
    aiNotes?: string,
    markdown: { [key: string]: string },
    html: { [key: string]: string },
    links: { [key: string]: { md: string, html: string, pdf: string } }
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [brutto, ai, layout] = await Promise.all([
        fetch('/api/brutto').then(r => r.json()),
        fetch('/api/config/instructions').then(r => r.json()),
        fetch('/api/config/layout').then(r => r.json())
      ]);
      setBruttoCv(brutto.content);
      setOriginalBruttoCv(brutto.content);
      setAiInstructions(ai.content);
      setOriginalAiInstructions(ai.content);
      setMasterLayout(layout.content);
      setOriginalMasterLayout(layout.content);
      setIsAiRefined(false);
      
      const verRes = await fetch('/api/version').then(r => r.json());
      setVersion(verRes.version);
      // Vask IDENTITY_ og eventuelle # eller whitespace væk
      const cleanName = verRes.instance?.replace(/^#\s*/, '').replace(/IDENTITY_/i, '').trim() || 'MGN';
      setInstanceName(cleanName);
    } catch (e) { console.error("Fejl ved hentning af konfig:", e); }
  };

  useEffect(() => {
    fetchData();
    socket.on('job_status_update', (data) => {
      setStatusMessage(data.status);
      if (data.status === 'Færdig!') {
        setResults(data);
        setIsLoading(false);
      }
      if (data.status === 'Fejl') {
        setError(data.error);
        setIsLoading(false);
      }
    });
    return () => { socket.off('job_status_update'); };
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true); setError(null); setStatusMessage('Starter...');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobText, companyUrl, hint }),
      });
      const { jobId } = await res.json();
      socket.emit('join_job', jobId);
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const handleSaveConfig = async (type: typeof activeTab) => {
    setIsLoading(true); setStatusMessage(`Gemmer ${type}...`);
    let url = '/api/brutto';
    let body = { content: bruttoCv };

    if (type === 'ai') { url = '/api/config/instructions'; body = { content: aiInstructions }; }
    else if (type === 'layout') { url = '/api/config/layout'; body = { content: masterLayout }; }

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      // Opdater originalerne efter gem
      if (type === 'brutto') { setOriginalBruttoCv(bruttoCv); setIsAiRefined(false); }
      else if (type === 'ai') setOriginalAiInstructions(aiInstructions);
      else if (type === 'layout') setOriginalMasterLayout(masterLayout);

      setIsLoading(false); setStatusMessage('Gemt!');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const handleRefineMaster = async () => {
    const userHint = window.prompt("Indtast dit specielle fokus for optimering (f.eks. 'Opdatér kun Kernekompetencer' eller 'Gør profiltekst mere formel'):", hint || "Stram op og fjern floskler");
    if (userHint === null) return; // Brugeren afbrød

    setIsMasterLoading(true); setStatusMessage('AI optimerer Master CV (tager ca. 30 sek)...');
    try {
      const res = await fetch('/api/brutto/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: bruttoCv, hint: userHint }),
      });
      const data = await res.json();
      setBruttoCv(data.refined);
      setIsAiRefined(true); // Marker at AI har lavet ændringer

      setIsMasterLoading(false); 
      // Vis AI'ens log i en alert eller en specifik boks
      if (data.log) {
          window.alert("AI RÆSONNEMENT (MASTER CV):\n\n" + data.log);
      }
      setStatusMessage('Optimeret!');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err: any) { setError(err.message); setIsMasterLoading(false); }
  };
  const handleRenderMaster = async () => {
    setIsLoading(true); setStatusMessage('Genererer visning...');
    try {
      const res = await fetch('/api/brutto/render');
      const data = await res.json();
      if (data.success) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(data.html);
          win.document.close();
        }
      }
      setIsLoading(false); setStatusMessage('Visning klar!');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const handleRefine = async (type: string, useAi: boolean = false) => {
    if (!results) return;
    setIsLoading(true); setStatusMessage(useAi ? 'AI forfiner dokumenterne...' : `Opdaterer ${type}...`);
    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          folder: results.folder, 
          type, 
          markdown: results.markdown[type],
          useAi,
          hint
        }),
      });
      
      if (useAi) {
        const { jobId } = await response.json();
        socket.emit('join_job', jobId);
      } else {
        const data = await response.json();
        if (data.success) {
          setResults({
            ...results,
            html: { ...results.html, [type]: data.html }
          });
          setIsLoading(false);
          setStatusMessage('Gemt!');
          setTimeout(() => setStatusMessage(''), 2000);
        }
      }
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  // --- ROBUST SPLIT LOGIK (v3.6.8) ---
  const splitMarkdown = (fullMd: string) => {
    const sections = fullMd.split(/---([A-ZÆØÅ0-9_+]+)---/);
    let meta = "";
    let body = fullMd;
    let currentTag = "";

    for (let i = 1; i < sections.length; i += 2) {
        const tag = sections[i];
        const content = sections[i+1] ? sections[i+1].trim() : "";
        
        if (tag === 'LAYOUT_METADATA') {
            meta = content;
        } else if (['ANSØGNING', 'CV', 'MATCH_ANALYSE', 'ICAN+_PITCH'].includes(tag.toUpperCase())) {
            body = content;
            currentTag = tag;
            break; // Vi har fundet den primære sektion
        }
    }
    
    return { meta, body, tag: currentTag };
  };

  const updateMetadata = (id: string, newMeta: string) => {
    if (!results) return;
    const { body, tag } = splitMarkdown(results.markdown[id]);
    const finalTag = tag || id.toUpperCase();
    const newFullMd = `---LAYOUT_METADATA---\n${newMeta}\n\n---${finalTag}---\n${body}`;
    setResults({ ...results, markdown: { ...results.markdown, [id]: newFullMd } });
  };

  const updateBody = (id: string, newBody: string) => {
    if (!results) return;
    const { meta, tag } = splitMarkdown(results.markdown[id]);
    const finalTag = tag || id.toUpperCase();
    const newFullMd = `---LAYOUT_METADATA---\n${meta}\n\n---${finalTag}---\n${newBody}`;
    setResults({ ...results, markdown: { ...results.markdown, [id]: newFullMd } });
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-gray-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-16 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tighter text-white">
              Job Application Agent <span className="text-cyan-500">{instanceName}</span>
            </h1>
            <p className="text-gray-400 font-mono text-sm tracking-widest">{version} | AUTOMATION ENGINE</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowConfig(!showConfig)} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${showConfig ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
              ⚙️ System Kartotek
            </button>
          </div>
        </header>

        <main className="space-y-12">
          {/* KONFIGURATIONSPANEL */}
          <section className={`transition-all duration-500 overflow-hidden ${showConfig ? 'max-h-[1000px] opacity-100 mb-12' : 'max-h-0 opacity-0'}`}>
            <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-lg w-fit">
              {(['brutto', 'ai', 'layout'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#112240] text-cyan-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab === 'brutto' ? '📜 Master CV' : tab === 'ai' ? '🧠 AI Prompts' : '🎨 Design'}
                </button>
              ))}
            </div>
            {activeTab === 'brutto' && <textarea className="w-full h-96 bg-[#112240] border border-white/10 rounded-xl p-6 font-mono text-sm text-cyan-50 focus:border-cyan-500/50 outline-none shadow-inner" value={bruttoCv} onChange={(e) => setBruttoCv(e.target.value)} />}
            {activeTab === 'ai' && <textarea className="w-full h-96 bg-[#112240] border border-white/10 rounded-xl p-6 font-mono text-sm text-cyan-50 focus:border-cyan-500/50 outline-none shadow-inner" value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} />}
            {activeTab === 'layout' && <textarea className="w-full h-96 bg-[#112240] border border-white/10 rounded-xl p-6 font-mono text-sm text-cyan-50 focus:border-cyan-500/50 outline-none shadow-inner" value={masterLayout} onChange={(e) => setMasterLayout(e.target.value)} />}
            <div className="mt-4 flex flex-wrap gap-4 items-center">
              {/* TRAFIKLYS MODEL FOR GEM-KNAP */}
              {(() => {
                const isBruttoDirty = bruttoCv !== originalBruttoCv;
                const isAiDirty = aiInstructions !== originalAiInstructions;
                const isLayoutDirty = masterLayout !== originalMasterLayout;
                
                let isDirty = false;
                if (activeTab === 'brutto') isDirty = isBruttoDirty || isAiRefined;
                else if (activeTab === 'ai') isDirty = isAiDirty;
                else if (activeTab === 'layout') isDirty = isLayoutDirty;

                if (!isDirty) {
                  return <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest px-8 py-3 bg-white/5 rounded-lg border border-green-500/20">✅ Alt er synkroniseret</span>;
                }

                if (activeTab === 'brutto' && isAiRefined) {
                  return (
                    <button 
                      onClick={() => handleSaveConfig('brutto')} 
                      className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-orange-500/40 animate-pulse border-2 border-orange-400"
                    >
                      ✨ GEM AI-OPDATERING (IKKE GEMT!)
                    </button>
                  );
                }

                return (
                  <button 
                    onClick={() => handleSaveConfig(activeTab)} 
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20"
                  >
                    💾 Gem {activeTab} konfiguration
                  </button>
                );
              })()}
              
              {activeTab === 'brutto' && (
                <>
                  <button onClick={handleRenderMaster} className="bg-[#112240] hover:bg-[#1d355e] text-white px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-cyan-500/30">👁️ Vis HTML</button>
                  <a href="/api/brutto/pdf" target="_blank" rel="noreferrer" className="bg-[#112240] hover:bg-[#1d355e] text-white px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-cyan-500/30">📄 Åben PDF</a>
                  <button onClick={handleRefineMaster} disabled={isMasterLoading} className="bg-cyan-900/40 hover:bg-cyan-600/40 text-cyan-400 px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-cyan-500/20 flex items-center gap-2">
                    {isMasterLoading ? (
                      <>
                        <span className="inline-block [transform:scaleX(-1)]">
                          <span className="inline-block animate-spin [animation-direction:reverse]">🌀</span>
                        </span> Optimering i gang...
                      </>
                    ) : '✨ Optimér med AI'}
                  </button>
                  <button onClick={async () => {
                      setIsLoading(true); setStatusMessage('Oversætter...');
                      const res = await fetch('/api/brutto/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: bruttoCv }) });
                      const data = await res.json();
                      setBruttoCv(data.translated);
                      setIsLoading(false); setStatusMessage('Oversat!');
                  }} className="bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-cyan-500/20 ml-auto">🌐 Oversæt CV</button>
                </>
              )}
            </div>
          </section>

          {/* JOB INPUT */}
          <section className="bg-[#112240] p-8 rounded-2xl shadow-2xl border border-white/5 relative">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Firma URL (Valgfrit)</label>
                <input type="text" placeholder="https://firma.dk/job" className="w-full bg-[#0a192f] border border-white/10 rounded-xl p-4 text-gray-300 focus:border-cyan-500/50 outline-none transition-all" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Personligt Hint (Valgfrit)</label>
                <input type="text" placeholder="F.eks. Læg vægt på min ledelseserfaring..." className="w-full bg-[#0a192f] border border-white/10 rounded-xl p-4 text-gray-300 focus:border-cyan-500/50 outline-none transition-all" value={hint} onChange={(e) => setHint(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2 mb-8">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Jobopslag (Indsæt tekst)</label>
              <textarea className="w-full h-64 bg-[#0a192f] border border-white/10 rounded-2xl p-6 text-gray-300 focus:border-cyan-500/50 outline-none transition-all resize-none" value={jobText} onChange={(e) => setJobText(e.target.value)} />
            </div>
            <button onClick={results ? () => handleRefine('all', true) : handleGenerate} disabled={isLoading} className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all text-sm ${isLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-500/20'}`}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="inline-block [transform:scaleX(-1)]">
                    <span className="inline-block animate-spin [animation-direction:reverse] text-xl">🌀</span>
                  </span> {statusMessage}
                </span>
              ) : (results ? '✨ Forfin alt med AI' : '🚀 Start Automatisering')}
            </button>
          </section>

          {/* RESULTATER */}
          {results && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {/* AI LOGBOG */}
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <h3 className="text-cyan-400 font-black mb-4 flex items-center gap-3 uppercase tracking-tighter italic">
                  <span className="text-2xl">🧠</span> AI Ræsonnement (Redaktørens noter)
                </h3>
                <p className="text-gray-300 leading-relaxed italic text-sm group-hover:text-gray-100 transition-colors">
                  {results.aiNotes ? `"${results.aiNotes}"` : "AI'en har optimeret dokumenterne baseret på din profil og jobopslaget."}
                </p>
              </div>

              {/* DOKUMENTER */}
              <div className="grid grid-cols-1 gap-12">
                {['ansøgning', 'cv', 'match', 'ican'].map((id) => {
                  const title = id === 'ansøgning' ? 'Ansøgning' : id === 'cv' ? 'CV' : id === 'match' ? 'Match Analyse' : 'ICAN+ Pitch';
                  const { meta, body } = splitMarkdown(results.markdown[id] || "");
                  
                  return (
                    <div key={id} className="bg-[#112240] rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[700px]">
                      <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Dokument</span>
                          <span className="text-sm font-bold text-white uppercase">{title}</span>
                        </div>
                        <div className="flex gap-1 bg-[#0a192f] p-1 rounded-xl">
                          <button onClick={() => setViewModes(p => ({...p, [id]: 'html'}))} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${viewModes[id] === 'html' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>PREVIEW</button>
                          <button onClick={() => setViewModes(p => ({...p, [id]: 'markdown'}))} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${viewModes[id] === 'markdown' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>RET INDHOLD</button>
                          <button onClick={() => setViewModes(p => ({...p, [id]: 'meta'}))} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${viewModes[id] === 'meta' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>KONTAKT (META)</button>
                        </div>
                        <div className="flex gap-3 ml-4 border-l border-white/10 pl-4">
                          <a href={results.links[id]?.pdf} target="_blank" rel="noreferrer" className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-[10px] font-bold px-4 py-2 rounded-lg transition-all border border-red-500/20">PDF</a>
                        </div>
                      </div>

                      <div className="flex-1 p-6 relative">
                        {viewModes[id] === 'html' && (
                          <iframe srcDoc={results.html[id]} title={`Preview ${id}`} className="w-full h-full border-none rounded-xl bg-white shadow-2xl" />
                        )}
                        {viewModes[id] === 'markdown' && (
                          <textarea 
                            className="w-full h-full bg-[#0a192f] text-cyan-50 font-mono text-sm p-8 rounded-xl outline-none focus:ring-2 ring-cyan-500/20 resize-none shadow-inner" 
                            value={body} 
                            onChange={(e) => updateBody(id, e.target.value)} 
                          />
                        )}
                        {viewModes[id] === 'meta' && (
                          <div className="h-full flex flex-col space-y-4">
                            <div className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded-xl">
                              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">Info</p>
                              <p className="text-xs text-gray-400 italic">Her kan du rette dine kontaktdata og firmaets adresse. Disse data styrer brevhovedet i din PDF.</p>
                            </div>
                            <textarea 
                              className="flex-1 bg-[#0a192f] text-yellow-200/80 font-mono text-sm p-8 rounded-xl outline-none focus:ring-2 ring-cyan-500/20 resize-none shadow-inner" 
                              value={meta} 
                              onChange={(e) => updateMetadata(id, e.target.value)} 
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-6 pt-0">
                        <button onClick={() => handleRefine(id, false)} className="w-full py-4 bg-white/5 hover:bg-cyan-600/20 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all border border-white/10 hover:border-cyan-500/50">
                          💾 Gem alle rettelser i {title}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        <footer className="mt-24 pb-16 border-t border-white/5 pt-12 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold mb-4">
            Job Application Agent MGN &copy; 2026
          </p>
          <p className="text-[9px] text-gray-600 italic max-w-lg mx-auto leading-loose">
            Denne AI-drevne platform er skabt til at hjælpe dig med at lande dit drømmejob. 
            Husk altid at læse dine dokumenter igennem før afsendelse. Held og lykke! 🚀
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
