/**
 * apiService.ts
 * Centraliseret API-håndtering for frontend.
 */

export const apiService = {
  // System
  async getVersion() {
    const res = await fetch('/api/version');
    return res.json();
  },
  async getModels() {
    const res = await fetch('/api/models');
    return res.json();
  },

  // Master CV & Config
  async getBrutto() {
    const res = await fetch('/api/brutto');
    return res.json();
  },
  async saveBrutto(content: string) {
    const res = await fetch('/api/brutto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.json();
  },
  async refineBrutto(content: string, hint: string) {
    const res = await fetch('/api/brutto/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, hint }),
    });
    return res.json();
  },
  async renderBrutto() {
    const res = await fetch('/api/brutto/render');
    return res.json();
  },

  // AI Config
  async getInstructions() {
    const res = await fetch('/api/config/instructions');
    return res.json();
  },
  async saveInstructions(content: string) {
    const res = await fetch('/api/config/instructions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.json();
  },
  async getLayout() {
    const res = await fetch('/api/config/layout');
    return res.json();
  },
  async saveLayout(content: string) {
    const res = await fetch('/api/config/layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.json();
  },
  async getAiPrefs() {
    const res = await fetch('/api/config/ai-prefs');
    return res.json();
  },
  async saveAiPrefs(prefs: any) {
    const res = await fetch('/api/config/ai-prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    return res.json();
  },

  // Radar
  async getRadar() {
    const res = await fetch('/api/radar');
    return res.json();
  },
  async refreshRadar() {
    const res = await fetch('/api/radar/refresh', { method: 'POST' });
    return res.json();
  },
  async addRadarJob(url: string) {
    const res = await fetch('/api/radar/job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.json();
  },
  async updateRadarStatus(id: string, status: string) {
    const res = await fetch('/api/radar/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    return res.json();
  },
  async deleteRadarJob(id: string) {
    const res = await fetch(`/api/radar/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async maintenanceRadar() {
    const res = await fetch('/api/radar/maintenance', { method: 'POST' });
    return res.json();
  },
  async saveRadarConfig(radius: number, baseCity: string) {
    const res = await fetch('/api/radar/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ radius, baseCity }),
    });
    return res.json();
  },

  // Generation & Refine
  async generate(data: any) {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async refine(data: any) {
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getResults(folder: string) {
    const res = await fetch(`/api/results/${folder}`);
    if (!res.ok) throw new Error("Resultater ikke fundet");
    return res.json();
  }
};
