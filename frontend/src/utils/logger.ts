/**
 * logger.ts
 * Frontend-logger der matcher backend formatet.
 * Bruger CSS-styling til browser konsollen.
 */

const colors = {
    info: 'color: #00ffff; font-weight: bold;', // Cyan
    warn: 'color: #ffaa00; font-weight: bold;', // Amber
    error: 'color: #ff0000; font-weight: bold;', // Red
    fatal: 'color: #ff00ff; font-weight: bold; background: #220022;', // Magenta
    dim: 'color: #666666;',
    text: 'color: #e0e0e0;'
};

const pad = (str: string, len: number) => {
    if (!str) str = "";
    return str.length > len ? str.substring(0, len) : str.padEnd(len, ' ');
};

export const logger = {
    getLevel: () => {
        // Vi kan styre dette via localStorage i FE (f.eks. localStorage.setItem('verbose', '2'))
        const v = localStorage.getItem('verbose');
        return v ? parseInt(v) : 1; // Standard til INFO1 i FE
    },

    format: (type: string, funcName: string, msg: string, data?: any) => {
        const v = logger.getLevel();
        const ts = new Date().toISOString();
        
        let levelLabel = 'INFO0';
        if (type === 'warn') levelLabel = 'WARNI';
        else if (type === 'error') levelLabel = 'ERROR';
        else if (type === 'fatal') levelLabel = 'FATAL';
        else {
            if (v === 1) levelLabel = 'INFO1';
            if (v >= 2) levelLabel = 'INFO2';
        }

        const fTS = `[${ts}]`;
        const fLVL = `[${levelLabel}]`;
        const fFunc = `[${pad(funcName, 15)}]`;
        
        let output = `%c${fTS}%c${fLVL}%c${fFunc} %c- ${msg}`;
        const styles = [colors.dim, colors[type as keyof typeof colors] || colors.info, colors.info, colors.text];

        if (v >= 1 && data !== undefined) {
            const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
            output += ` %c| DATA: ${dataStr}`;
            styles.push(colors.dim);
        }

        return { output, styles };
    },

    info: (func: string, msg: string, data?: any) => {
        const { output, styles } = logger.format('info', func, msg, data);
        console.log(output, ...styles);
    },

    warn: (func: string, msg: string, data?: any) => {
        const { output, styles } = logger.format('warn', func, msg, data);
        console.warn(output, ...styles);
    },

    error: (func: string, msg: string, data?: any, err?: any) => {
        let { output, styles } = logger.format('error', func, msg, data);
        if (err) output += ` | ERROR: ${err.message || err}`;
        console.error(output, ...styles);
    },

    assert: (cond: any, func: string, msg: string, data?: any) => {
        if (!cond) {
            const { output, styles } = logger.format('fatal', func, `ASSERT FAILED: ${msg}`, data);
            console.error(output, ...styles);
        }
    }
};
