const OllamaProvider = require('./services/ai/OllamaProvider');
const logger = require('./utils/logger');
const dotenv = require('dotenv');
const path = require('path');

async function test() {
    dotenv.config({ path: '/app/shared/.env' });
    
    const provider = new OllamaProvider({ 
        logger,
        model: process.env.OLLAMA_MODEL || "llama3.2:3b",
        baseUrl: "http://host.docker.internal:11434"
    });

    console.log("🚀 Tester Ollama DIREKTE (udenom kø)...");
    try {
        const result = await provider.call("Hvad er 2+2? Svar kun med tallet.", "direct_test");
        console.log("✅ Succes! Svar:", result);
    } catch (error) {
        console.error("❌ Fejl under direkte kald:", error.message);
    }
    process.exit(0);
}

test();
