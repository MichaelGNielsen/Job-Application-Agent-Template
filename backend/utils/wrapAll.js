const wrap = require('./wrap');

/**
 * Kombinerer flere dokumenter til én samlet HTML fil (til internt brug).
 * @param {Array} docs 
 * @param {object} meta 
 * @returns {string}
 */
const wrapAll = (docs, meta = {}) => {
    const combinedContent = docs.map((doc, idx) => `
        <div class="page-container" style="${idx < docs.length - 1 ? 'page-break-after: always;' : ''}">
            <div class="content">${doc.body}</div>
        </div>
    `).join('');
    return wrap('Internt Materiale', combinedContent, 'internal', meta);
};

module.exports = wrapAll;
