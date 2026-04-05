/**
 * useApplication.ts
 * Hook til håndtering af job-generering og resultater med integreret logger.
 */

import { useState } from 'react';
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

  const handleGenerate = async () => {
    setIsLoading(true); 
    setError(null); 
    setStatusMessage('Starter...');
    logger.info("useApplication", "Starter ny genererings-proces", { companyUrl, hintLength: hint.length });
    try {
      const { jobId } = await apiService.generate({ jobText, companyUrl, hint });
      logger.info("useApplication", "Job sendt til kø", { jobId });
      if (socket) socket.emit('join_job', jobId);
    } catch (err: any) { 
      logger.error("useApplication", "Kunne ikke starte generering", undefined, err);
      setError(err.message); 
      setIsLoading(false); 
    }
  };

  const handleRefine = async (type: string, useAi: boolean = false) => {
    if (!results) return;
    setIsLoading(true); 
    setStatusMessage(useAi ? 'AI forfiner...' : `Opdaterer ${type}...`);
    logger.info("useApplication", `Forfiner dokument: ${type}`, { useAi });
    
    try {
      const response = await apiService.refine({ 
        folder: results.folder, type, markdown: results.markdown[type], useAi, hint 
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
      logger.info("useApplication", "Session genoprettet");
    } catch (e) { 
      logger.warn("useApplication", "Kunne ikke genoprette session", { folder: lastFolder });
      localStorage.removeItem('activeJobFolder'); 
    }
    finally { setIsLoading(false); }
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
    handleGenerate,
    handleRefine,
    restoreSession
  };
};
