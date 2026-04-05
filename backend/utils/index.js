/**
 * @module Utils/Index
 * @description Central eksport-fil for utils biblioteket.
 * Hver funktion er nu splittet ud i sin egen fil for maksimal overskuelighed.
 */

const logger = require('./logger');
const getInitials = require('./getInitials');
const callLocalGemini = require('./callLocalGemini');
const parseCandidateInfo = require('./parseCandidateInfo');
const extractSection = require('./extractSection');
const printToPdf = require('./printToPdf');
const mdToHtml = require('./mdToHtml');
const wrap = require('./wrap');
const wrapAll = require('./wrapAll');
const fetchCompanyContent = require('./fetchCompanyContent');
const saveUrlToPdf = require('./saveUrlToPdf');
const generateMasterDocs = require('./generateMasterDocs');

module.exports = {
    logger,
    getInitials,
    callLocalGemini,
    parseCandidateInfo,
    extractSection,
    printToPdf,
    mdToHtml,
    wrap,
    wrapAll,
    fetchCompanyContent,
    saveUrlToPdf,
    generateMasterDocs
};
