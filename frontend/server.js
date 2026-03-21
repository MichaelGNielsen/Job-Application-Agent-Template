
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Indlæs .env for at få initialer og personlig info
dotenv.config({ path: path.join(rootDir, '.env') });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/applications', express.static(rootDir));

// Funktion til at kalde din lokale Gemini CLI (OpenCode)
async function callLocalGemini(prompt) {
    const tmpFile = path.join(__dirname, 'current_prompt.txt');
    fs.writeFileSync(tmpFile, prompt);
    
    console.log("Sender prompt til lokal Gemini CLI...");
    
    try {
        // Vi bruger -p flaget for headless mode
        const { stdout, stderr } = await execPromise(`gemini -p "$(cat ${tmpFile})"`);
        
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        
        if (stderr && !stdout) throw new Error(stderr);
        return stdout;
    } catch (error) {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        throw error;
    }
}

app.post('/api/generate', async (req, res) => {
  const { jobText, companyUrl } = req.body;
  
  if (!jobText) return res.status(400).json({ error: 'Ingen jobtekst' });

  try {
    console.log("=== Starter LOKAL generering via CLI ===");

    // 1. Ekstraher Info
    const extractPrompt = `Udtræk firmanavn og jobtitel fra dette opslag: ${jobText}. 
    Svar KUN med JSON: {"company": "Navn", "title": "Job"}`;
    
    const extractRaw = await callLocalGemini(extractPrompt);
    const jsonMatch = extractRaw.match(/\{[\s\S]*\}/);
    const info = jsonMatch ? JSON.parse(jsonMatch[0]) : { company: "job", title: "application" };
    
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const initials = process.env.MINE_INITIALER || 'mgn';
    const folderName = `${date}_${initials}_${info.company.toLowerCase()}_${info.title.toLowerCase()}`.replace(/\s+/g, '_');
    const folderPath = path.join(rootDir, folderName);

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(path.join(folderPath, 'job.md'), jobText);

    // 2. Generer indhold
    const generatePrompt = `Du er en ekspert karriererådgiver. 
    Baseret på dette jobopslag: """${jobText}"""
    MINE DATA: Navn: ${process.env.MIT_NAVN}, Email: ${process.env.MIN_EMAIL}, Tlf: ${process.env.MIN_TELEFON}
    
    Generer 3 dokumenter i Markdown format adskilt af "---DOCUMENT_SEPARATOR---":
    1. Ansøgning | 2. CV | 3. ICAN+ Pitch`;

    const contentRaw = await callLocalGemini(generatePrompt);
    const docs = contentRaw.split('---DOCUMENT_SEPARATOR---');

    // Gem filer
    fs.writeFileSync(path.join(folderPath, `ansøgning.md`), docs[0] || '');
    fs.writeFileSync(path.join(folderPath, `cv.md`), docs[1] || '');
    fs.writeFileSync(path.join(folderPath, `ican.md`), docs[2] || '');

    // Lav HTML Previews
    const wrap = (t, c) => `<html><body style="font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6"><button onclick="window.print()">Print PDF</button><pre style="white-space:pre-wrap">${c}</pre></body></html>`;
    fs.writeFileSync(path.join(folderPath, 'ansøgning.html'), wrap('Ansøgning', docs[0]));
    fs.writeFileSync(path.join(folderPath, 'cv.html'), wrap('CV', docs[1]));
    fs.writeFileSync(path.join(folderPath, 'ican.html'), wrap('ICAN+', docs[2]));

    res.json({
      folder: folderName,
      links: [
        { name: 'Ansøgning', url: `/applications/${folderName}/ansøgning.html` },
        { name: 'CV', url: `/applications/${folderName}/cv.html` },
        { name: 'ICAN+', url: `/applications/${folderName}/ican.html` }
      ]
    });

  } catch (error) {
    console.error('CLI Fejl:', error);
    res.status(500).json({ error: 'Lokal fejl: ' + error.message });
  }
});

app.listen(3002, () => console.log(`LOKAL CLI SERVER køre på http://localhost:3002`));
