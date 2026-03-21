import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io();
const THEME_COLOR = "cyan";

const App: React.FC = () => {
  const [version, setVersion] = useState('v2.8.x');
  const [jobText, setJobText] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [hint, setHint] = useState('');
  
  // Kartotek States
  const [activeTab, setActiveTab] = useState<'brutto' | 'ai' | 'layout'>('brutto');
  const [bruttoCv, setBruttoCv] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [masterLayout, setMasterLayout] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [viewModes, setViewModes] = useState<{ [key: string]: 'markdown' | 'html' }>({
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
      setAiInstructions(ai.content);
      setMasterLayout(layout.content);
    } catch (e) { console.error("Fejl ved hentning af konfig:", e); }
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
      setIsLoading(false); setStatusMessage('Gemt!');
      setTimeout(() => setStatusMessage(''), 2000);
      
      // LIVE DESIGN SLØJFE: Hvis vi gemmer layout og har resultater, så opdater alle previews øjeblikkeligt!
      if (type === 'layout' && results) {
          setStatusMessage('Opdaterer layout live...');
          
          // Robust parsing af kandidat-info direkte fra editoren
          const clean = (val: string | undefined) => val ? val.replace(/^[\s\*\-#]+|[\s\*\-#]+$/g, '').trim() : "";
          const candidate = {
              name: clean(bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Navn|Name)[:\s]+(.*?)(?:\n|$)/i)?.[1]) || "Bruger",
              address: clean(bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Adresse|Address)[:\s]+(.*?)(?:\n|$)/i)?.[1]),
              email: clean(bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Email|E-mail)[:\s]+(.*?)(?:\n|$)/i)?.[1]),
              phone: clean(bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Telefon|Phone|Mobil|Mobile)[:\s]+(.*?)(?:\n|$)/i)?.[1])
          };

          const types = ['ansøgning', 'cv', 'match', 'ican'];
          const updatedHtml: { [key: string]: string } = {};
          
          for (const t of types) {
              if (results.markdown[t]) {
                  const res = await fetch('/api/preview', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                          markdown: results.markdown[t],
                          type: t === 'ansøgning' ? 'Ansøgning' : t === 'cv' ? 'CV' : t === 'match' ? 'Match Analyse' : 'ICAN+ Pitch',
                          lang: results.lang || 'dk',
                          candidate: candidate
                      }),
                  });
                  const data = await res.json();
                  updatedHtml[t] = data.html;
              }
          }
          setResults({ ...results, html: { ...results.html, ...updatedHtml } });
          setStatusMessage('Layout opdateret!');
          setTimeout(() => setStatusMessage(''), 2000);
      }
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const toggleViewMode = (id: string) => {
    const newMode = viewModes[id] === 'html' ? 'markdown' : 'html';
    
    // Hvis vi skifter FRA markdown TIL html (preview), så gem automatisk først
    if (viewModes[id] === 'markdown' && newMode === 'html') {
        handleRefine(id, false);
    }
    
    setViewModes(prev => ({ ...prev, [id]: newMode }));
  };

  const getDocUrl = (path: string) => {
    if (!path) return '#';
    return path;
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
        setResults({ ...results, html: { ...results.html, [type]: data.html } });
        setIsLoading(false); setStatusMessage('Opdateret!');
        setTimeout(() => setStatusMessage(''), 2000);
      }
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then(data => setVersion(`v${data.version}`))
      .catch(e => console.error("Kunne ikke hente version fra API"));

    fetchData();

    socket.on('job_status_update', (data) => {
      setStatusMessage(data.status);
      if (data.status === 'Færdig!') { setResults(data); setIsLoading(false); }
      else if (data.status.includes('Fejl')) { setError(data.error || data.status); setIsLoading(false); }
    });
    return () => { socket.off('job_status_update'); };
  }, []);

  const handleGenerate = async () => {
    if (!jobText.trim()) return;
    setIsLoading(true); setError(null); setResults(null); setStatusMessage('Starter...');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobText, companyUrl, hint }),
      });
      const { jobId } = await response.json();
      socket.emit('join_job', jobId);
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a192f] text-gray-100 p-8 font-sans scroll-smooth">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-light tracking-widest uppercase text-cyan-400 border-b border-cyan-500/30 pb-4 inline-block">Job Application Agent Template | {version}</h1>
        </header>

        <main className="space-y-8">
          {/* KARTOTEK SEKTION */}
          <section className="bg-[#112240] p-6 rounded-xl border border-white/5 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                {[
                  { id: 'brutto', label: '📇 Master CV' },
                  { id: 'ai', label: '🤖 AI Regler' },
                  { id: 'layout', label: '🎨 Design' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setShowConfig(true); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-t-lg border-b-2 transition-all ${activeTab === tab.id && showConfig ? 'border-cyan-400 text-cyan-400 bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowConfig(!showConfig)} className="text-gray-500 text-[10px] hover:text-white uppercase tracking-widest">
                {showConfig ? 'Skjul Editor' : 'Vis Editor'}
              </button>
            </div>
            
            {showConfig && (
              <div className="space-y-4 animate-in slide-in-from-top duration-300">
                <textarea 
                  className="w-full h-80 bg-[#0a192f] border border-white/10 rounded p-4 font-mono text-sm text-gray-300 focus:border-cyan-500/50 outline-none transition-colors"
                  value={
                    activeTab === 'brutto' ? bruttoCv : 
                    activeTab === 'ai' ? aiInstructions : 
                    masterLayout
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activeTab === 'brutto') setBruttoCv(val);
                    else if (activeTab === 'ai') setAiInstructions(val);
                    else if (activeTab === 'layout') setMasterLayout(val);
                  }}
                />
                <div className="flex gap-4">
                  <button onClick={() => handleSaveConfig(activeTab)} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-green-900/20">💾 Gem {activeTab.toUpperCase()}</button>
                  {activeTab === 'brutto' && (
                    <button onClick={async () => {
                        setIsLoading(true); setStatusMessage('Oversætter...');
                        const res = await fetch('/api/brutto/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: bruttoCv }) });
                        const data = await res.json();
                        setBruttoCv(data.translated);
                        setIsLoading(false); setStatusMessage('Oversat!');
                    }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 rounded text-xs font-bold uppercase tracking-widest">🌐 Oversæt</button>
                  )}
                </div>
              </div>
            )}
            {!showConfig && <p className="text-gray-500 text-sm italic text-center py-4">Vælg en fane herover for at tilpasse systemets fundament.</p>}
          </section>

          <section className="bg-[#112240] p-6 rounded-xl shadow-xl border border-white/5">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-400 mb-2">Firma URL</label>
              <input type="text" placeholder="https://firma.dk/job" className="w-full bg-[#0a192f] border border-white/10 rounded p-3 text-gray-300" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-400 mb-2">Personligt Hint (Valgfrit)</label>
              <textarea 
                placeholder="F.eks. Læg vægt på min erfaring med backend-arkitektur eller min rolle som mentor for juniorudviklere..." 
                className="w-full h-24 bg-[#0a192f] border border-white/10 rounded p-3 text-gray-300 resize-none overflow-y-auto focus:border-cyan-500/50 outline-none transition-colors" 
                value={hint} 
                onChange={(e) => setHint(e.target.value)} 
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 mb-2">Jobopslag (Indsæt tekst her)</label>
              <textarea 
                className="w-full h-48 bg-[#0a192f] border border-white/10 rounded p-3 text-gray-300"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
            </div>
            <button 
              onClick={results ? () => handleRefine('all', true) : handleGenerate}
              disabled={isLoading}
              className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest transition-all ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/20'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🌀</span> {statusMessage}
                </span>
              ) : (results ? '✨ Forfin alle dokumenter med AI (Brug hint)' : '🚀 Start Automatisering')}
            </button>
          </section>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {results && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="bg-cyan-900/20 border border-cyan-500/30 p-6 rounded-xl">
                <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">🧠 AI Ræsonnement (Redaktørens noter)</h3>
                <p className="text-sm text-gray-300 leading-relaxed italic">{results.aiNotes ? `"${results.aiNotes}"` : "AI'en har optimeret dokumenterne baseret på din profil og jobopslaget."}</p>
              </div>

              <div className="flex flex-col gap-8">
                {['ansøgning', 'cv', 'match', 'ican'].map((id) => {
                  const title = id === 'ansøgning' ? 'Ansøgning' : id === 'cv' ? 'CV' : id === 'match' ? 'Match Analyse' : 'ICAN+ Pitch';
                  return (
                    <div key={id} className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden flex flex-col">
                      <div className="bg-white/5 px-4 py-3 flex justify-between items-center border-b border-white/5">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{title}</span>
                        <div className="flex gap-2">
                          <button onClick={() => toggleViewMode(id)} className="text-[10px] text-cyan-400 hover:underline">
                            {viewModes[id] === 'html' ? 'VIS MARKDOWN' : 'VIS PREVIEW'}
                          </button>
                          <a href={getDocUrl(results.links[id]?.html)} target="_blank" rel="noreferrer" className="text-[10px] text-green-400 hover:underline">ÅBEN HTML</a>
                        </div>
                      </div>
                      <div className="p-4 flex-1">
                        {viewModes[id] === 'html' ? (
                          <iframe 
                            srcDoc={results.html[id]} 
                            title={`Preview ${id}`}
                            className="w-full h-[400px] border-none rounded bg-white shadow-inner"
                          />
                        ) : (
                          <textarea 
                            className="w-full h-[400px] bg-[#0a192f] text-cyan-50 font-mono text-xs p-4 rounded"
                            value={results.markdown[id]}
                            onChange={(e) => setResults({...results, markdown: {...results.markdown, [id]: e.target.value}})}
                          />
                        )}
                      </div>
                      <div className="p-4 pt-0">
                        <button onClick={() => handleRefine(id, false)} className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded transition-colors border border-white/5">💾 Gem mine rettelser</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
