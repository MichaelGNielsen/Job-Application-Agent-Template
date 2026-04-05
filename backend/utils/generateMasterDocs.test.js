const generateMasterDocs = require('./generateMasterDocs');
const fs = require('fs');
const child_process = require('child_process');

jest.mock('fs', () => ({
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(() => '<html><body>{{CONTENT}}</body></html>'),
    existsSync: jest.fn(() => true),
    unlinkSync: jest.fn(),
    copyFileSync: jest.fn()
}));

jest.mock('child_process', () => ({
    exec: jest.fn((cmd, options, cb) => {
        const callback = typeof options === 'function' ? options : cb;
        callback(null, { stdout: 'Mocked output', stderr: '' });
    })
}));

jest.mock('./logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

describe('generateMasterDocs()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('bør køre hele flowet og returnere succes', async () => {
        const result = await generateMasterDocs('## Mit Master CV');
        expect(result.success).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(child_process.exec).toHaveBeenCalled();
    });
});
