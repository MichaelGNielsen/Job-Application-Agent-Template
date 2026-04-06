/**
 * useApplication.ts
 * Hook til håndtering af job-generering og resultater med integreret logger.
 */

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { logger } from '../utils/logger';

export const useApplication = (socket: any) => {
  const [jobText, setJobText] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [hint, setHint] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dirtyDocs, setDirtyDocs] = useState<{ [key: string]: boolean }>({});
  const [aiProvider, setAiProvider] = useState<'default' | 'gemini' | 'ollama' | 'opencode'>('default');
  const [aiModel, setAiModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<{gemini: string[], ollama: string[]}>({ gemini: [], ollama: [] });
  const [aiPrefs, setAiPrefs] = useState<any>(null);

  // Load models once
  React.useEffect(() => {
    Promise.all([apiService.getModels(), apiService.getAiPrefs()]).then(([models, prefs]) => {
      setAvailableModels(models);
      setAiPrefs(prefs);
      if (prefs.activeProvider) setAiProvider(prefs.activeProvider);
      if (prefs.providers?.[prefs.activeProvider]?.model) setAiModel(prefs.providers[prefs.activeProvider].model);
    }).catch(() => {});
  }, []);

  // Sync state to backend
  const updateAiPrefs = async (provider: any, model: string) => {
    const newPrefs = {
      activeProvider: provider,
      providers: {
        ...(aiPrefs?.providers || {}),
        [provider]: { model }
      }
    };
    setAiPrefs(newPrefs);
    await apiService.saveAiPrefs(newPrefs);
  };

  const handleGenerate = async () => {
    setIsLoading(true); 
    setError(null); 
    setStatusMessage('Starter...');
    setResults(null); // Ryd tidligere resultater ved ny generering
    logger.info("useApplication", "Starter ny genererings-proces", { companyUrl, hintLength: hint.length, aiProvider, aiModel });
    
    // Gem præferencer ved generering
    await updateAiPrefs(aiProvider, aiModel);

    try {
      const { jobId } = await apiService.generate({ jobText, companyUrl, hint, aiProvider, aiModel });
      logger.info("useApplication", "Job sendt til kø", { jobId });
      if (socket) socket.emit('join_job', jobId);
    } catch (err: any) { 
      logger.error("useApplication", "Kunne ikke starte generering", undefined, err);
      setError(err.message); 
      setIsLoading(false); 
    }
  };

  const handleRefine = async (type: string, useAi: boolean = false, customHint?: string) => {
    if (!results) return;
    setIsLoading(true); 
    const finalHint = customHint || hint;
    setStatusMessage(useAi ? 'AI forfiner...' : `Opdaterer ${type}...`);
    logger.info("useApplication", `Forfiner dokument: ${type}`, { useAi, aiProvider, aiModel, hasCustomHint: !!customHint });
    
    // Gem præferencer
    await updateAiPrefs(aiProvider, aiModel);
    
    try {
      const response = await apiService.refine({ 
        folder: results.folder, type, markdown: results.markdown[type], useAi, hint: finalHint, aiProvider, aiModel 
      });
      if (useAi) { 
        logger.info("useApplication", "Refine-job sendt til AI", { jobId: response.jobId });
        if (socket) socket.emit('join_job', response.jobId); 
      }
      else {
        if (response.success) {
          logger.info("useApplication", "Manuel rettelse gemt", { type });
          setResults({ ...results, html: { ...results.html, [type]: response.html } });
          setDirtyDocs(prev => ({ ...prev, [type]: false }));
          setIsLoading(false); 
          setStatusMessage('Gemt!');
          setTimeout(() => setStatusMessage(''), 2000);
        }
      }
    } catch (err: any) { 
      logger.error("useApplication", "Refine fejlede", { type }, err);
      setError(err.message); 
      setIsLoading(false); 
    }
  };

  const restoreSession = async () => {
    const lastFolder = localStorage.getItem('activeJobFolder');
    if (!lastFolder) return;
    setIsLoading(true); 
    setStatusMessage('Genopretter session...');
    logger.info("useApplication", "Forsøger at genoprette forrige session", { folder: lastFolder });
    try {
      const data = await apiService.getResults(lastFolder);
      setResults(data);
      if (data.jobText) setJobText(data.jobText);
      logger.info("useApplication", "Session genoprettet");
    } catch (e) { 
      logger.warn("useApplication", "Kunne ikke genoprette session", { folder: lastFolder });
      localStorage.removeItem('activeJobFolder'); 
    }
    finally { setIsLoading(false); }
  };

  const resetSession = () => {
    logger.info("useApplication", "Nulstiller session og rydder alle felter");
    setResults(null);
    setJobText('');
    setCompanyUrl('');
    setHint('');
    setError(null);
    setDirtyDocs({});
    localStorage.removeItem('activeJobFolder');
  };

  const setProviderAndModel = (provider: any) => {
    setAiProvider(provider);
    
    // Find gemt model i prefs eller brug hardcoded fallback
    let model = aiPrefs?.providers?.[provider]?.model || '';
    if (!model) {
      if (provider === 'gemini') model = 'gemini-3.1-flash-lite-preview';
      else if (provider === 'ollama') {
          // Tag den første fra listen som fallback
          model = availableModels.ollama.length > 0 ? availableModels.ollama[0] : 'llama3.2';
      }
      else if (provider === 'opencode') model = 'agent';
    }
    setAiModel(model);
  };

  return {
    jobText, setJobText,
    companyUrl, setCompanyUrl,
    hint, setHint,
    results, setResults,
    isLoading, setIsLoading,
    statusMessage, setStatusMessage,
    error, setError,
    dirtyDocs, setDirtyDocs,
    aiProvider, setAiProvider,
    setProviderAndModel,
    aiModel, setAiModel,
    availableModels,
    handleGenerate,
    handleRefine,
    restoreSession,
    resetSession
  };
};
