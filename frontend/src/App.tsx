/**
 * App.tsx
 * Central orkestrator for Job Application Agent.
 * Refaktoreret til modulær arkitektur med Hooks og Komponenter.
 */

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Hooks
import { useRadar } from './hooks/useRadar';
import { useApplication } from './hooks/useApplication';
import { useConfig } from './hooks/useConfig';

// Components
import { RadarSection } from './components/RadarSection';
import { ConfigSection } from './components/ConfigSection';
import { ResultSection } from './components/ResultSection';

// Utils
import { getInitials, splitMarkdown } from './utils/helpers';

const socket = io();

const App: React.FC = () => {
  // 1. Logik & State via Hooks
  const radar = useRadar();
  const config = useConfig();
  const app = useApplication(socket as any);

  // 2. UI States
  const [activeTab, setActiveTab] = useState<'brutto' | 'ai' | 'layout' | 'radar'>('brutto');
  const [showConfig, setShowConfig] = useState(false);
  const [viewModes, setViewModes] = useState<{ [key: string]: 'html' | 'markdown' | 'meta' }>({
    ansøgning: 'html', cv: 'html', match: 'html', ican: 'html'
  });

  // 3. Initial Load & WebSockets
  useEffect(() => {
    config.loadConfig();
    radar.loadRadar();
    app.restoreSession();

    socket.on('job_status_update', (data) => {
      app.setStatusMessage(data.status);
      if (data.status === 'Færdig!') {
        app.setResults((prev: any) => {
          const newResults = !prev ? data : {
            ...prev, ...data,
            markdown: { ...prev.markdown, ...(data.markdown || {}) },
            html: { ...prev.html, ...(data.html || {}) },
            links: { ...prev.links, ...(data.links || {}) }
          };
          if (newResults.folder) localStorage.setItem('activeJobFolder', newResults.folder);
          return newResults;
        });
        app.setIsLoading(false);
      }
      if (data.status === 'Fejl') {
        app.setError(data.error);
        app.setIsLoading(false);
      }
    });

    return () => { socket.off('job_status_update'); };
  }, []);

  // 4. Handlers
  const handleUpdateBody = (id: string, newBody: string) => {
    if (!app.results) return;
    const { meta, tag } = splitMarkdown(app.results.markdown[id]);
    const finalTag = tag || id.toUpperCase();
    const newFullMd = `---LAYOUT_METADATA---\n${meta}\n---${finalTag}---\n${newBody}`;
    app.setResults({ ...app.results, markdown: { ...app.results.markdown, [id]: newFullMd } });
    app.setDirtyDocs((prev: any) => ({ ...prev, [id]: true }));
  };

  const handleUpdateMetadata = (id: string, newMeta: string) => {
    if (!app.results) return;
    const { body, tag } = splitMarkdown(app.results.markdown[id]);
    const finalTag = tag || id.toUpperCase();
    const newFullMd = `---LAYOUT_METADATA---\n${newMeta}\n---${finalTag}---\n${body}`;
    app.setResults({ ...app.results, markdown: { ...app.results.markdown, [id]: newFullMd } });
    app.setDirtyDocs((prev: any) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-gray-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Header */}
        <header className="mb-16 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-white/10 shrink-0">
              {config.initials}
            </div>
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-4xl font-extrabold tracking-tighter text-white leading-none">
                Job Application Agent <span className="text-cyan-500">{config.instanceName}</span>
              </h1>
              <p className="text-gray-400 font-mono text-[10px] tracking-[0.2em] uppercase">
                {config.version} | <span className="text-cyan-500/80">{config.modelName}</span> | AUTOMATION ENGINE
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowConfig(!showConfig)} 
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${showConfig ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
          >
            ⚙️ System Kartotek
          </button>
        </header>

        <main className="space-y-12">
          
          {/* Kartotek Sektion */}
          {showConfig && (
            <ConfigSection 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              bruttoCv={config.bruttoCv}
              setBruttoCv={config.setBruttoCv}
              aiInstructions={config.aiInstructions}
              setAiInstructions={config.setAiInstructions}
              masterLayout={config.masterLayout}
              setMasterLayout={config.setMasterLayout}
              isLoading={app.isLoading}
              isMasterLoading={config.isMasterLoading}
              statusMessage={app.statusMessage}
              dirtyBrutto={config.dirtyBrutto}
              bruttoViewMode={config.masterPreviewHtml ? 'html' : 'markdown'}
              setBruttoViewMode={() => {}}
              masterPreviewHtml={config.masterPreviewHtml}
              onSave={(type) => config.handleSave(type, app.setIsLoading, app.setStatusMessage)}
              onRefineMaster={() => config.handleRefineMaster(app.hint, app.setStatusMessage)}
              onRenderMaster={() => config.handleRenderMaster(app.setIsLoading)}
            />
          )}

          {/* Radar Sektion (inde i Kartotek) */}
          {showConfig && activeTab === 'radar' && (
            <RadarSection 
              jobs={radar.jobs}
              radius={radar.radius}
              setRadius={radar.setRadarRadius}
              baseCity={radar.baseCity}
              setBaseCity={radar.setRadarBaseCity}
              selectedJobId={radar.selectedJobId}
              setSelectedJobId={radar.setSelectedJobId}
              sortMode={radar.sortMode}
              setSortMode={radar.setSortMode}
              manualUrl={radar.manualUrl}
              setManualUrl={radar.setManualUrl}
              isLoading={app.isLoading}
              statusMessage={app.statusMessage}
              onAddJob={() => radar.handleAddJob(app.setIsLoading, app.setStatusMessage)}
              onRefresh={() => radar.handleRefresh(app.setIsLoading, app.setStatusMessage)}
              onMaintenance={() => radar.handleMaintenance(app.setIsLoading, app.setStatusMessage)}
              onSaveConfig={() => radar.handleSaveConfig(app.setIsLoading, app.setStatusMessage)}
              onIgnoreJob={radar.handleIgnore}
              onStartAutomation={(job) => {
                app.setJobText(`URL: ${job.url}\n\nStilling: ${job.title}\nFirma: ${job.company}\n\nBeskrivelse...`);
                app.setCompanyUrl(job.url);
                radar.handleStatusUpdate(job.id, 'applied');
                setShowConfig(false);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
            />
          )}

          {/* Input Form */}
          <section className="bg-[#112240] p-8 rounded-2xl shadow-2xl border border-white/5 relative">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Firma URL (Valgfrit)</label>
                <input type="text" placeholder="https://firma.dk/job" className="w-full bg-[#0a192f] border border-white/10 rounded-xl p-4 text-gray-300 focus:border-cyan-500/50 outline-none transition-all" value={app.companyUrl} onChange={(e) => app.setCompanyUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Personligt Hint (Valgfrit)</label>
                <input type="text" placeholder="F.eks. Fokus på ledelse..." className="w-full bg-[#0a192f] border border-white/10 rounded-xl p-4 text-gray-300 focus:border-cyan-500/50 outline-none transition-all" value={app.hint} onChange={(e) => app.setHint(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2 mb-8">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Jobopslag (Indsæt tekst)</label>
              <textarea className="w-full h-64 bg-[#0a192f] border border-white/10 rounded-2xl p-6 text-gray-300 focus:border-cyan-500/50 outline-none transition-all resize-none" value={app.jobText} onChange={(e) => app.setJobText(e.target.value)} />
            </div>
            <button 
              onClick={app.results ? () => app.handleRefine('all', true) : app.handleGenerate} 
              disabled={app.isLoading} 
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all text-sm ${app.isLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-500/20'}`}
            >
              {app.isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="inline-block [transform:scaleX(-1)]">
                    <span className="inline-block animate-spin [animation-direction:reverse] text-xl">🌀</span>
                  </span> {app.statusMessage}
                </span>
              ) : (app.results ? '✨ Forfin alt med AI' : '🚀 Start Automatisering')}
            </button>
          </section>

          {/* Resultater */}
          {app.results && (
            <ResultSection 
              results={app.results}
              viewModes={viewModes}
              setViewMode={(id, mode) => setViewModes(p => ({...p, [id]: mode}))}
              dirtyDocs={app.dirtyDocs}
              onRefine={app.handleRefine}
              onUpdateBody={handleUpdateBody}
              onUpdateMetadata={handleUpdateMetadata}
              splitMarkdown={splitMarkdown}
            />
          )}
        </main>

        <footer className="mt-24 pb-16 border-t border-white/5 pt-12 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold mb-4">Job Application Agent MGN &copy; 2026 | <span className="text-cyan-600/60">{config.modelName}</span></p>
          <p className="text-[9px] text-gray-600 italic max-w-lg mx-auto leading-loose">Lande dit drømmejob med AI. Husk at verificere alt. Held og lykke! 🚀</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
