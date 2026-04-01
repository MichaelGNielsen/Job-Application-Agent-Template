const chalk = require('chalk');
const path = require('path');

const logger = {
    getLevel: () => {
        const lv = process.env.VERBOSE || "";
        if (lv === "-vv") return 2;
        if (lv === "-v") return 1;
        return 0;
    },
    pad: (s, n) => s.length > n ? s.substring(0, n) : s.padEnd(n),
    format: (type, funcName, msg, data, verbosity = 1) => {
        const v = logger.getLevel();
        
        // Hvis anmodet verbosity er højere end hvad der er sat, log ikke (kun for info)
        if (type === 'info' && verbosity > v) return null;
        
        // Fix: Brug lokal tid i stedet for UTC (v4.7.7)
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const ts = new Date(now - offset).toISOString().slice(0, -1);
        
        const stack = new Error().stack;
        const callerLine = stack.split('\n')[3];
        const match = callerLine.match(/\((.*):(\d+):(\d+)\)/) || callerLine.match(/at (.*):(\d+):(\d+)/);
        const caller = match ? { file: path.basename(match[1]), line: match[2] } : { file: 'unknown', line: '0' };
        
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
        if (v >= 1 && data !== undefined) {
            const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
            if (v === 1 && dataStr.length > 500) output += ` | DATA: ${dataStr.substring(0, 500)}... (truncated)`;
            else output += ` | DATA: ${dataStr}`;
        }
        return output;
    },
    info: (func, msg, data, verbosity = 1) => {
        const line = logger.format('info', func, msg, data, verbosity);
        if (line) console.log(chalk.cyan(line));
    },
    warn: (func, msg, data) => {
        console.warn(chalk.yellow(logger.format('warn', func, msg, data, 2)));
    },
    error: (func, msg, data, err) => {
        let line = logger.format('error', func, msg, data, 2);
        if (err) line += ` | ERROR: ${err.message || err}`;
        console.error(chalk.red(line));
    }
};

module.exports = logger;
