const { logger } = require('./utils');

console.log("\n--- STARTER LOG-VERIFICERINGSTEST (v3.5) ---\n");

// Test Niveau 0 (Standard Info)
process.env.VERBOSE = "";
console.log("TESTER NIVEAU 0 (Standard)");
logger.info("TestFunc0", "Dette er en standard milepæl (INFO0)");

// Test Niveau 1 (-v)
process.env.VERBOSE = "-v";
console.log("\nTESTER NIVEAU 1 (-v)");
logger.info("TestFunc1", "Dette er detaljeret info (INFO1)");
logger.info("TestFunc1", "Data forkortes her", { langTekst: "A".repeat(600) });

// Test Niveau 2 (-vv eller mere)
process.env.VERBOSE = "-vv";
console.log("\nTESTER NIVEAU 2 (-vv)");
logger.info("TestFunc2", "Dette er insane niveau (INFO2)");
logger.info("TestFunc2", "Fuld data vises her", { fuldTekst: "B".repeat(600) });

// Test Auto-Expand på Fejl
process.env.VERBOSE = ""; // Skru ned til 0
console.log("\nTESTER AUTO-EXPAND PÅ FEJL (Selvom VERBOSE er tom)");
logger.warn("WarnFunc", "Dette er en advarsel - bør have filnavn og fuldt format");
logger.error("ErrorFunc", "Dette er en fejl", { fejldata: "vigtig info" }, new Error("Simuleret fejl"));

console.log("\n--- LOG-VERIFICERINGSTEST SLUT ---\n");
