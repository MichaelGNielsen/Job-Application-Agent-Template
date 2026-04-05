/**
 * useRadar.ts
 * Hook til håndtering af Job-Radar logik og state med integreret logger.
 * @category Frontend
 */

import { useState } from 'react';
import { apiService } from '../services/apiService';
import { logger } from '../utils/logger';

export interface RadarJob {
  id: string;
  title: string;
  company: string;
  location: string;
  distance: number;
  matchScore: number;
  expiryDate: string;
  reasons: string[];
  url: string;
  source?: string;
  status?: 'new' | 'applied' | 'ignored';
}

export const useRadar = () => {
  const [jobs, setRadarJobs] = useState<RadarJob[]>([]);
  const [radius, setRadarRadius] = useState(30);
  const [baseCity, setRadarBaseCity] = useState('Aalborg');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'score' | 'distance' | 'date' | 'title' | 'company'>('score');
  const [manualUrl, setManualUrl] = useState('');

  const loadRadar = async () => {
    logger.info("useRadar", "Henter radar data...");
    try {
      const data = await apiService.getRadar();
      setRadarJobs(data.jobs || []);
      setRadarRadius(data.config?.radius || 30);
      setRadarBaseCity(data.config?.baseCity || 'Aalborg');
      logger.info("useRadar", "Radar data indlæst", { jobsCount: data.jobs?.length });
    } catch (e) {
      logger.error("useRadar", "Kunne ikke indlæse radar", undefined, e);
    }
  };

  const handleAddJob = async (setIsLoading: (v: boolean) => void, setStatus: (s: string) => void) => {
    if (!manualUrl) return;
    const url = manualUrl;
    setManualUrl('');
    setIsLoading(true);
    setStatus('Analyserer link...');
    logger.info("useRadar", "Tilføjer job manuelt", { url });
    try {
      await apiService.addRadarJob(url);
      await loadRadar();
    } catch (e) {
      logger.error("useRadar", "Fejl ved tilføjelse af job", { url }, e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIgnore = async (id: string) => {
    if (!window.confirm("Vil du fjerne dette job?")) return;
    logger.warn("useRadar", "Sletter job", { id });
    try {
      await apiService.deleteRadarJob(id);
      setRadarJobs(prev => prev.filter(j => j.id !== id));
      if (selectedJobId === id) setSelectedJobId(null);
    } catch (e) {
      logger.error("useRadar", "Kunne ikke slette job", { id }, e);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    logger.info("useRadar", "Opdaterer job status", { id, status });
    try {
      await apiService.updateRadarStatus(id, status);
      setRadarJobs(prev => prev.map(j => j.id === id ? { ...j, status: status as any } : j));
    } catch (e) {
      logger.error("useRadar", "Kunne ikke opdatere status", { id }, e);
    }
  };

  const handleRefresh = async (setIsLoading: (v: boolean) => void, setStatus: (s: string) => void) => {
    setIsLoading(true);
    setStatus('Radar søger...');
    logger.info("useRadar", "Starter radar-refresh (crawling)...");
    try {
      const res = await apiService.refreshRadar();
      logger.info("useRadar", "Refresh færdig", { nyeJobs: res.count });
      await loadRadar();
    } catch (e) {
      logger.error("useRadar", "Radar refresh fejlede", undefined, e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaintenance = async (setIsLoading: (v: boolean) => void, setStatus: (s: string) => void) => {
    setIsLoading(true);
    setStatus('Vasker radar...');
    logger.info("useRadar", "Kører vedligeholdelse (link-tjek)...");
    try {
      const res = await apiService.maintenanceRadar();
      alert(res.message);
      await loadRadar();
    } catch (e) {
      logger.error("useRadar", "Maintenance fejlede", undefined, e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (setIsLoading: (v: boolean) => void, setStatus: (s: string) => void) => {
    setIsLoading(true);
    setStatus('Gemmer radar...');
    logger.info("useRadar", "Gemmer konfiguration", { radius, baseCity });
    try {
      await apiService.saveRadarConfig(radius, baseCity);
      setStatus('Gemt!');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      logger.error("useRadar", "Kunne ikke gemme config", undefined, e);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedJobs = [...jobs]
    .filter(job => job.distance <= radius)
    .sort((a, b) => {
      if (sortMode === 'score') return b.matchScore - a.matchScore;
      if (sortMode === 'distance') return a.distance - b.distance;
      if (sortMode === 'title') return a.title.localeCompare(b.title);
      if (sortMode === 'company') return a.company.localeCompare(b.company);
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

  return {
    jobs: sortedJobs,
    radius, setRadarRadius,
    baseCity, setRadarBaseCity,
    selectedJobId, setSelectedJobId,
    sortMode, setSortMode,
    manualUrl, setManualUrl,
    loadRadar,
    handleAddJob,
    handleIgnore,
    handleStatusUpdate,
    handleRefresh,
    handleMaintenance,
    handleSaveConfig
  };
};
