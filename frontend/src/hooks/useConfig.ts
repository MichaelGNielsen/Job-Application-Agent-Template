/**
 * useConfig.ts
 * Hook til system-konfiguration og Master CV med integreret logger.
 */

import { useState } from 'react';
import { apiService } from '../services/apiService';
import { logger } from '../utils/logger';

export const useConfig = () => {
  const [version, setVersion] = useState('v6.0.0');
  const [instanceName, setInstanceName] = useState('');
  const [initials, setInitials] = useState('');
  const [modelName, setModelName] = useState('');
  const [bruttoCv, setBruttoCv] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [masterLayout, setMasterLayout] = useState('');
  const [isMasterLoading, setIsMasterLoading] = useState(false);
  const [dirtyBrutto, setDirtyBrutto] = useState(false);
  const [masterPreviewHtml, setMasterPreviewHtml] = useState<string | null>(null);
  const [bruttoViewMode, setBruttoViewMode] = useState<'markdown' | 'html'>('markdown');

  const updateBruttoCv = (val: string) => {
    setBruttoCv(val);
    setDirtyBrutto(true);
  };

  const loadConfig = async () => {
    logger.info("useConfig", "Indlæser system-konfiguration...");
    try {
      const [brutto, ai, layout, ver] = await Promise.all([
        apiService.getBrutto(),
        apiService.getInstructions(),
        apiService.getLayout(),
        apiService.getVersion()
      ]);
      setBruttoCv(brutto.content);
      setAiInstructions(ai.content);
      setMasterLayout(layout.content);
      setVersion(ver.version);
      setModelName(ver.model || 'Auto-detecting...');
      setInstanceName(ver.instance || 'MGN');
      setInitials(ver.initials || 'JAA');
      logger.info("useConfig", "Konfiguration indlæst", { version: ver.version, instance: ver.instance, model: ver.model });
    } catch (e) {
      logger.error("useConfig", "Kunne ikke indlæse konfiguration", undefined, e);
    }
  };

  const handleSave = async (type: string, setIsLoading: (v: boolean) => void, setStatus: (s: string) => void) => {
    setIsLoading(true);
    setStatus(`Gemmer ${type}...`);
    logger.info("useConfig", `Gemmer ændringer: ${type}`);
    try {
      if (type === 'brutto') { await apiService.saveBrutto(bruttoCv); setDirtyBrutto(false); }
      if (type === 'ai') await apiService.saveInstructions(aiInstructions);
      if (type === 'layout') await apiService.saveLayout(masterLayout);
      logger.info("useConfig", "Ændringer gemt succesfuldt");
      setStatus('Gemt!');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      logger.error("useConfig", `Kunne ikke gemme ${type}`, undefined, e);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleRefineMaster = async (hint: string, setStatus: (s: string) => void) => {
    const userHint = window.prompt("Optimering:", hint || "Stram op og fjern floskler");
    if (!userHint) return;
    setIsMasterLoading(true);
    logger.info("useConfig", "Starter AI optimering af Master CV", { hint: userHint });
    try {
      const data = await apiService.refineBrutto(bruttoCv, userHint);
      setBruttoCv(data.refined);
      logger.info("useConfig", "Master CV optimeret af AI");
      if (data.log) alert("AI RÆSONNEMENT:\n\n" + data.log);
    } catch (e) {
      logger.error("useConfig", "AI optimering fejlede", undefined, e);
    } finally { 
      setIsMasterLoading(false); 
    }
  };

  const handleRenderMaster = async (setIsLoading: (v: boolean) => void) => {
    setIsLoading(true);
    logger.info("useConfig", "Genererer HTML-preview af Master CV...");
    try {
      const data = await apiService.renderBrutto();
      if (data.html) {
        setMasterPreviewHtml(data.html);
        setBruttoViewMode('html');
        logger.info("useConfig", "Preview genereret");
        return true;
      }
      return false;
    } catch (e) {
      logger.error("useConfig", "Kunne ikke generere preview", undefined, e);
      return false;
    } finally { 
      setIsLoading(false); 
    }
  };

  return {
    version, instanceName, initials, modelName,
    bruttoCv, setBruttoCv: updateBruttoCv,
    aiInstructions, setAiInstructions,
    masterLayout, setMasterLayout,
    isMasterLoading, dirtyBrutto, setDirtyBrutto,
    masterPreviewHtml, bruttoViewMode, setBruttoViewMode,
    loadConfig,
    handleSave,
    handleRefineMaster,
    handleRenderMaster
  };
};
