/**
 * @module Utils/Logger
 * @description Avanceret logger til backend med ANSI farver og kolonneformat.
 * 
 * 🛡️ DET GYLDNE PRINCIP FOR LOGGING (MGN STANDARD):
 * 1. Der må ALDRIG bruges substring/slice/truncation på data FØR det sendes til denne logger.
 * 2. Al filtrering og begrænsning SKAL ske centralt HER.
 * 3. Formål: Sikre at man altid kan se det fulde rå output ved brug af -vv uden at skulle rette i koden 117 steder.
 */

const path = require('path');
const { getLocalISOTime } = require('./timeUtils');

const chalk = {
    red: (msg) => `\x1b[31m${msg}\x1b[0m`,
    yellow: (msg) => `\x1b[33m${msg}\x1b[0m`,
    green: (msg) => `\x1b[32m${msg}\x1b[0m`,
    cyan: (msg) => `\x1b[36m${msg}\x1b[0m`,
    gray: (msg) => `\x1b[90m${msg}\x1b[0m`,
    magenta: (msg) => `\x1b[35m${msg}\x1b[0m`,
    white: (msg) => `\x1b[37m${msg}\x1b[0m`,
    brightGreen: (msg) => `\x1b[92m${msg}\x1b[0m`,
    brightCyan: (msg) => `\x1b[96m${msg}\x1b[0m`,
    brightMagenta: (msg) => `\x1b[95m${msg}\x1b[0m`
};

const logger = {
    getLevel: () => {
        const v = (process.env.VERBOSE || "").toLowerCase();
        if (!v.startsWith("-v")) return 0;
        const count = (v.match(/v/g) || []).length;
        return Math.min(count, 2);
    },
    getCaller: () => {
        try {
            const stack = new Error().stack.split('\n');
            const line = stack[3] || '';
            const match = line.match(/\((.*):(\d+):(\d+)\)$/) || line.match(/at (.*):(\d+):(\d+)$/);
            if (match) {
                return { file: path.basename(match[1]), line: match[2] };
            }
        } catch (e) {}
        return { file: 'unknown', line: '0' };
    },
    pad: (str, len, char = ' ') => {
        if (!str) str = "";
        if (str.length > len) return str.substring(0, len);
        return str.padEnd(len, char);
    },
    format: (type, funcName, msg, ...dataArgs) => {
        const v = logger.getLevel();
        const ts = getLocalISOTime() + 'Z';
        const caller = logger.getCaller();
        let levelLabel = 'INFO0';
        if (type === 'warn')  levelLabel = 'WARNI';
        else if (type === 'error') levelLabel = 'ERROR';
        else if (type === 'fatal') levelLabel = 'FATAL';
        else {
            if (v === 1) levelLabel = 'INFO1';
            if (v >= 2) levelLabel = 'INFO2';
        }
        const fTS = `[${ts}]`;
        const fLVL = `[${levelLabel}]`;
        const fLine = `[${caller.line.padStart(5, '0')}]`;
        const fFunc = `[${logger.pad(funcName, 15)}]`;
        const fFile = `[${logger.pad(caller.file, 12)}]`;
        let output = `${fTS}${fLVL}${fLine}${fFunc}${fFile} - ${msg}`;
        
        if (v >= 1 && dataArgs.length > 0) {
            const combinedData = dataArgs.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' | ');
            
            // CENTRALISERET FILTRERINGS-LOGIK:
            if (v === 1 && combinedData.length > 500) {
                output += ` | DATA: ${combinedData.substring(0, 500)}... (truncated)`;
            } else {
                output += ` | DATA: ${combinedData}`;
            }
        }
        return output;
    },
    info: (func, msg, ...data) => {
        console.log(chalk.white(logger.format('info', func, msg, ...data)));
    },
    warn: (func, msg, ...data) => {
        console.warn(chalk.yellow(logger.format('warn', func, msg, ...data)));
    },
    error: (func, msg, ...data) => {
        // Hvis det sidste argument er et Error objekt, behandles det specielt
        const lastArg = data[data.length - 1];
        let errStr = "";
        if (lastArg instanceof Error) {
            errStr = ` | ERROR: ${lastArg.message}`;
            data.pop(); // Fjern den fra dataArgs så den ikke stringifies dobbelt
        }
        console.error(chalk.red(logger.format('error', func, msg, ...data) + errStr));
    },
    assert: (cond, func, msg, data) => {
        if (!cond) {
            let line = logger.format('fatal', func, `ASSERT FAILED: ${msg}`, data, 2);
            console.error(chalk.red(line));
        }
    }
};

module.exports = logger;
