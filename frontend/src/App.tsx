import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Eye, 
  Edit3, 
  FileJson, 
  RefreshCw,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  User,
  Settings,
  BrainCircuit,
  Rocket,
  Palette,
  Layout,
  Terminal,
  Save,
  Globe,
  Languages,
  Clock,
  Sparkles,
  Zap,
  Fingerprint
} from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io();

type ViewMode = 'html' | 'markdown' | 'pdf' | 'meta';

interface JobResults {
  folder: string;
  bodies: Record<string, string>;
  metadata: string;
  html: Record<string, string>;
  links: Record<string, { md: string, html: string, pdf: string }>;
  aiNotes: string;
  lang?: string;
}

function App() {
  const [jobText, setJobText] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [hint, setHint] = useState('');
  const [bruttoCv, setBruttoCv] = useState('');
  const [originalBruttoCv, setOriginalBruttoCv] = useState('');
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [originalTemplates, setOriginalTemplates] = useState<Record<string, string>>({});
  const [version, setVersion] = useState('');
  const [aiBrain, setAiBrain] = useState('Gemini 2.5 Flash');
  
  const [activeTab, setActiveTab] = useState<'generate' | 'brutto' | 'ai' | 'layout'>('generate');
  const [selectedLayout, setSelectedLayout] = useState('master_layout.html');
  const [selectedAi, setSelectedAi] = useState('ai_instructions.md');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isMasterLoading, setIsMasterLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [viewModes, setViewModes] = useState<{ [key: string]: ViewMode }>({
    ansøgning: 'html', cv: 'html', match: 'html', ican: 'html'
  });
  const [results, setResults] = useState<JobResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    // Hent version uafhængigt for at sikre den altid vises
    fetch('/api/version')
      .then(r => r.json())
      .then(data => {
        setVersion(data.version);
        if (data.model) {
          const formatted = data.model.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
          setAiBrain(formatted);
        }
      })
      .catch(e => console.error("Kunne ikke hente version:", e));

    try {
      const [brutto, ai, layout, cvHtml, cvMd, masterMd] = await Promise.all([
        fetch('/api/brutto').then(r => r.json()),
        fetch('/api/config/templates/ai_instructions.md').then(r => r.json()),
        fetch('/api/config/templates/master_layout.html').then(r => r.json()),
        fetch('/api/config/templates/cv_layout.html').then(r => r.json()),
        fetch('/api/config/templates/cv_layout.md').then(r => r.json()),
        fetch('/api/config/templates/master_layout.md').then(r => r.json())
      ]);

      setBruttoCv(brutto.content);
      setOriginalBruttoCv(brutto.content);

      const allTemplates = {
        'ai_instructions.md': ai.content,
        'master_layout.html': layout.content,
        'cv_layout.html': cvHtml.content,
        'cv_layout.md': cvMd.content,
        'master_layout.md': masterMd.content
      };
      setTemplates(allTemplates);
      setOriginalTemplates({ ...allTemplates });
    } catch (e) { console.error("Fejl ved hentning af konfig:", e); }
  };

  useEffect(() => {
    fetchData();
    socket.on('job_status_update', (data) => {
      setStatusMessage(data.status);
      if (data.status === 'Færdig!') {
        setResults({
          folder: data.folder,
          bodies: data.bodies,
          metadata: data.metadata,
          html: data.html,
          links: data.links,
          aiNotes: data.aiNotes,
          lang: data.lang
        });
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

  const handleSaveConfig = async (type: string) => {
    setIsLoading(true); 
    let url = '/api/brutto';
    let body = { content: bruttoCv };
    let fileName = "";

    if (type === 'ai') { 
        fileName = selectedAi;
        url = `/api/config/templates/${fileName}`; 
        body = { content: templates[fileName] }; 
    }
    else if (type === 'layout') { 
        fileName = selectedLayout;
        url = `/api/config/templates/${fileName}`; 
        body = { content: templates[fileName] }; 
    }

    setStatusMessage(`Gemmer ${fileName || type}...`);

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (type === 'brutto') { 
          setOriginalBruttoCv(bruttoCv); 
      } else {
          setOriginalTemplates(prev => ({ ...prev, [fileName]: templates[fileName] }));
      }

      setIsLoading(false); setStatusMessage('Gemt!');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const handleRefineMaster = async () => {
    const userHint = window.prompt("Indtast dit specielle fokus for optimering:", hint || "Stram op og fjern floskler");
    if (userHint === null) return;

    setIsMasterLoading(true); setStatusMessage('AI optimerer Master CV...');
    try {
      const res = await fetch('/api/brutto/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: bruttoCv, hint: userHint }),
      });
      const data = await res.json();
      setBruttoCv(data.refined);
      setIsMasterLoading(false); 
      if (data.log) window.alert("AI RÆSONNEMENT:\n\n" + data.log);
      setStatusMessage('Optimeret!');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err: any) { setError(err.message); setIsMasterLoading(false); }
  };

  const handleRefine = async (type: string, useAi: boolean = false) => {
    if (!results) return;
    setIsLoading(true); setStatusMessage(useAi ? 'AI forfiner dokumenterne...' : `Opdaterer ${type}...`);
    
    const currentBody = results.bodies[type];
    
    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          folder: results.folder, 
          type, 
          body: currentBody,
          meta: results.metadata,
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
          setResults(prev => prev ? {
            ...prev,
            html: { ...prev.html, [type]: data.html }
          } : null);
          setStatusMessage('Gemt!');
          setTimeout(() => setStatusMessage(''), 2000);
        }
        setIsLoading(false);
      }
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const updateBody = (id: string, newBody: string) => {
    setResults(prev => prev ? { 
        ...prev, 
        bodies: { ...prev.bodies, [id]: newBody } 
    } : null);
  };

  const updateMetadata = (newMeta: string) => {
    setResults(prev => prev ? { ...prev, metadata: newMeta } : null);
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

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* HEADER */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Fingerprint className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase">Job Application Agent <span className="text-cyan-500">TEMPLATE</span></h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-mono">{version}</span>
                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full border border-white/5 shadow-inner">
                  <BrainCircuit className="w-2.5 h-2.5 text-cyan-500" />
                  <span className="text-[9px] text-cyan-500/70 font-bold tracking-widest uppercase">{aiBrain}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('generate')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'generate' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
              <Zap className="w-3 h-3 inline-block mr-2 mt-[-2px]" /> Generer
            </button>
            <button onClick={() => setActiveTab('brutto')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'brutto' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
              <FileText className="w-3 h-3 inline-block mr-2 mt-[-2px]" /> Master CV
            </button>
            <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'ai' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
              <BrainCircuit className="w-3 h-3 inline-block mr-2 mt-[-2px]" /> AI Instrukser
            </button>
            <button onClick={() => setActiveTab('layout')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'layout' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
              <Palette className="w-3 h-3 inline-block mr-2 mt-[-2px]" /> Layout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        {activeTab === 'generate' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* STABLE VERTICAL STACK (v4.7.3) */}
            <div className="space-y-8">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-1000"></div>
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <Terminal className="w-4 h-4 text-cyan-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Jobopslag / Tekst</span>
                    </div>
                  </div>
                  <textarea value={jobText} onChange={(e) => setJobText(e.target.value)} placeholder="Indsæt jobbeskrivelsen her..." className="w-full h-80 bg-transparent p-8 text-gray-200 placeholder-gray-700 focus:outline-none resize-none text-sm leading-relaxed font-mono" />
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 space-y-8 shadow-2xl">
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Virksomhed URL</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input type="text" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} placeholder="https://virksomhed.dk" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs focus:border-cyan-500/50 focus:outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Personligt Hint</label>
                    <div className="relative">
                      <Sparkles className="absolute left-4 top-4 w-4 h-4 text-gray-600" />
                      <textarea value={hint} onChange={(e) => setHint(e.target.value)} placeholder="F.eks. 'Fokusér på min erfaring med AI'..." className="w-full h-32 bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs focus:border-cyan-500/50 focus:outline-none transition-all resize-none" />
                    </div>
                  </div>
                </div>

                <button onClick={handleGenerate} disabled={isLoading || !jobText} className={`w-full group relative flex items-center justify-center gap-3 py-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}>
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {isLoading ? 'Behandler...' : 'Start Automatisering'}
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="flex items-center justify-center gap-4 py-8 animate-pulse">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">{statusMessage}</div>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold tracking-wide">{error}</p>
              </div>
            )}

            {results && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <BrainCircuit className="w-24 h-24 text-cyan-500" />
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="text-cyan-400 w-4 h-4" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">AI Redaktørens Noter</h3>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-400 prose-p:leading-relaxed font-mono text-[13px]">
                    {results.aiNotes.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                  {[
                    { id: 'ansøgning', title: 'Målrettet Ansøgning', icon: <FileText /> },
                    { id: 'cv', title: 'Skræddersyet CV', icon: <User /> },
                    { id: 'match', title: 'Match Analyse', icon: <Search /> },
                    { id: 'ican', title: 'ICAN+ Interview Pitch', icon: <Languages /> }
                  ].map(({ id, title, icon }) => {
                    const body = results.bodies[id];
                    if (!body) return null;
                    return (
                      <div key={id} className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl group transition-all hover:border-white/20">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                              <div className="text-cyan-500 w-4 h-4">{icon}</div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{title}</span>
                            </div>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                              <button onClick={() => setViewModes(prev => ({ ...prev, [id]: 'html' }))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewModes[id] === 'html' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Eye className="w-3 h-3 inline-block mr-2" /> Preview</button>
                              <button onClick={() => setViewModes(prev => ({ ...prev, [id]: 'markdown' }))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewModes[id] === 'markdown' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Edit3 className="w-3 h-3 inline-block mr-2" /> Ret Indhold</button>
                              <button onClick={() => setViewModes(prev => ({ ...prev, [id]: 'meta' }))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewModes[id] === 'meta' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Settings className="w-3 h-3 inline-block mr-2" /> Metadata</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <a href={results.links[id]?.pdf} target="_blank" className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl border border-red-500/20 text-[10px] font-black uppercase tracking-widest transition-all"><Download className="w-3 h-3" /> PDF</a>
                          </div>
                        </div>
                        <div className="p-8">
                          {viewModes[id] === 'html' && <div className="bg-white rounded-2xl shadow-inner min-h-[600px] overflow-hidden"><iframe srcDoc={results.html[id]} className="w-full h-[800px] border-none" title={title} /></div>}
                          {viewModes[id] === 'markdown' && (
                            <div className="bg-[#050505] rounded-2xl border border-white/5 overflow-hidden">
                              <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Markdown Editor</span>
                                <span className="flex items-center gap-2 text-[9px] text-cyan-500/50 font-mono"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span> FRONT_MATTER_v4.7.0</span>
                              </div>
                              <textarea value={body} onChange={(e) => updateBody(id, e.target.value)} className="w-full h-[600px] bg-transparent p-8 text-gray-300 font-mono text-[13px] leading-relaxed focus:outline-none resize-none" />
                            </div>
                          )}
                          {viewModes[id] === 'meta' && (
                            <div className="bg-[#050505] rounded-2xl border border-white/5 overflow-hidden">
                              <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Dokument Attributter (YAML)</span>
                                <span className="text-[9px] text-gray-600 font-mono italic">Ret din adresse eller hilsen her</span>
                              </div>
                              <textarea value={results.metadata} onChange={(e) => updateMetadata(e.target.value)} className="w-full h-64 bg-transparent p-8 text-cyan-500/70 font-mono text-[12px] leading-relaxed focus:outline-none resize-none" />
                            </div>
                          )}
                        </div>
                        <div className="p-6 pt-0">
                          <button onClick={() => handleRefine(id, false)} disabled={isLoading} className={`w-full py-4 bg-white/5 hover:bg-cyan-600/20 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all border border-white/10 hover:border-cyan-500/50 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isLoading ? '⏳ Gemmer...' : `💾 Gem alle rettelser i ${title}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'brutto' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">Master CV</h2><p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Din kilde til sandhed</p></div>
              <div className="flex gap-3">
                <button onClick={handleRenderMaster} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"><Eye className="w-3 h-3" /> Vis som HTML</button>
                <button onClick={handleRefineMaster} disabled={isMasterLoading} className="flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 px-6 py-2.5 rounded-xl border border-cyan-500/30 text-[10px] font-black uppercase tracking-widest transition-all"><BrainCircuit className="w-3 h-3" /> AI Optimer</button>
                <button onClick={() => handleSaveConfig('brutto')} disabled={isLoading || bruttoCv === originalBruttoCv} className={`flex items-center gap-2 ${bruttoCv === originalBruttoCv ? 'bg-gray-500/10 text-gray-500' : 'bg-green-600 hover:bg-green-500 text-white'} px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all`}><Save className="w-3 h-3" /> Gem Ændringer</button>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <textarea value={bruttoCv} onChange={(e) => setBruttoCv(e.target.value)} className="w-full h-[700px] bg-transparent p-12 text-gray-300 font-mono text-sm leading-relaxed focus:outline-none resize-none" />
            </div>
          </div>
        )}

        {(activeTab === 'ai' || activeTab === 'layout') && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">{activeTab === 'ai' ? 'AI Agent System' : 'Visuelt Design'}</h2><p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">{activeTab === 'ai' ? 'Finjuster agentens personlighed' : 'Rediger HTML/CSS skabeloner'}</p></div>
              <button onClick={() => handleSaveConfig(activeTab)} disabled={isLoading || templates[activeTab === 'ai' ? selectedAi : selectedLayout] === originalTemplates[activeTab === 'ai' ? selectedAi : selectedLayout]} className={`flex items-center gap-2 ${templates[activeTab === 'ai' ? selectedAi : selectedLayout] === originalTemplates[activeTab === 'ai' ? selectedAi : selectedLayout] ? 'bg-gray-500/10 text-gray-500' : 'bg-cyan-600 hover:bg-cyan-500 text-white'} px-8 py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all`}><Save className="w-4 h-4" /> Gem Skabelon</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                {(activeTab === 'ai' ? ['ai_instructions.md'] : ['master_layout.html', 'cv_layout.html', 'cv_layout.md', 'master_layout.md']).map(file => (
                  <button key={file} onClick={() => activeTab === 'ai' ? setSelectedAi(file) : setSelectedLayout(file)} className={`w-full text-left px-6 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${ (activeTab === 'ai' ? selectedAi : selectedLayout) === file ? 'bg-cyan-600/20 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>{file}</button>
                ))}
              </div>
              <div className="lg:col-span-3">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  <textarea value={templates[activeTab === 'ai' ? selectedAi : selectedLayout] || ''} onChange={(e) => { const file = activeTab === 'ai' ? selectedAi : selectedLayout; setTemplates(prev => ({ ...prev, [file]: e.target.value })); }} className="w-full h-[600px] bg-transparent p-12 text-gray-300 font-mono text-sm leading-relaxed focus:outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-24 pb-16 border-t border-white/5 pt-12 text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold mb-4">Job Application Agent MGN &copy; 2026</p>
        <div className="flex items-center justify-center gap-6"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500/30"></span><span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Designed by MGN</span><span className="w-1.5 h-1.5 rounded-full bg-cyan-500/30"></span></div>
      </footer>
    </div>
  );
}

export default App;
