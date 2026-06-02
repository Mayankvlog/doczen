const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { protect, optionalAuth } = require('../middleware/auth');
const { csrfCheckToken } = require('../middleware/csrf');

const {
  merge, split, compress, rotate, protect: protectPdf,
  unlock, addPageNumbers, addWatermark, extractText,
  reorder, deletePages, pdfToJpg, jpgToPdf, pdfToTxt,
  download, getPageCount, repair, pdfToPdfa,
  readMetadata, writeMetadata, flatten, htmlToPdf,
  redact, removeAnnotations, removeWatermark, compare,
  pdfToWord, pdfToExcel, excelToPdf, pdfToPpt, pptToPdf, wordToPdf,
  editPdf, signPdf
} = require('../controllers/pdfController');

router.post('/merge', optionalAuth, upload.array('files', 20), csrfCheckToken, merge);
router.post('/split', optionalAuth, upload.single('file'), csrfCheckToken, split);
router.post('/compress', optionalAuth, upload.single('file'), csrfCheckToken, compress);
router.post('/rotate', optionalAuth, upload.single('file'), csrfCheckToken, rotate);
router.post('/protect', optionalAuth, upload.single('file'), csrfCheckToken, protectPdf);
router.post('/unlock', optionalAuth, upload.single('file'), csrfCheckToken, unlock);
router.post('/add-page-numbers', optionalAuth, upload.single('file'), csrfCheckToken, addPageNumbers);
router.post('/add-watermark', optionalAuth, upload.single('file'), csrfCheckToken, addWatermark);
router.post('/extract-text', optionalAuth, upload.single('file'), csrfCheckToken, extractText);
router.post('/reorder', optionalAuth, upload.single('file'), csrfCheckToken, reorder);
router.post('/delete-pages', optionalAuth, upload.single('file'), csrfCheckToken, deletePages);
router.post('/pdf-to-jpg', optionalAuth, upload.single('file'), csrfCheckToken, pdfToJpg);
router.post('/jpg-to-pdf', optionalAuth, upload.array('files', 20), csrfCheckToken, jpgToPdf);
router.post('/pdf-to-txt', optionalAuth, upload.single('file'), csrfCheckToken, pdfToTxt);
router.post('/page-count', optionalAuth, upload.single('file'), csrfCheckToken, getPageCount);
router.get('/download/:filename', optionalAuth, download);
router.post('/repair', optionalAuth, upload.single('file'), csrfCheckToken, repair);
router.post('/pdf-to-pdfa', optionalAuth, upload.single('file'), csrfCheckToken, pdfToPdfa);
router.post('/read-metadata', optionalAuth, upload.single('file'), csrfCheckToken, readMetadata);
router.post('/write-metadata', optionalAuth, upload.single('file'), csrfCheckToken, writeMetadata);
router.post('/flatten', optionalAuth, upload.single('file'), csrfCheckToken, flatten);
router.post('/html-to-pdf', optionalAuth, csrfCheckToken, htmlToPdf);
router.post('/redact', optionalAuth, upload.single('file'), csrfCheckToken, redact);
router.post('/remove-annotations', optionalAuth, upload.single('file'), csrfCheckToken, removeAnnotations);
router.post('/remove-watermark', optionalAuth, upload.single('file'), csrfCheckToken, removeWatermark);
router.post('/compare', optionalAuth, upload.array('files', 2), csrfCheckToken, compare);
router.post('/pdf-to-word', optionalAuth, upload.single('file'), csrfCheckToken, pdfToWord);
router.post('/pdf-to-excel', optionalAuth, upload.single('file'), csrfCheckToken, pdfToExcel);
router.post('/excel-to-pdf', optionalAuth, upload.single('file'), csrfCheckToken, excelToPdf);
router.post('/pdf-to-ppt', optionalAuth, upload.single('file'), csrfCheckToken, pdfToPpt);
router.post('/ppt-to-pdf', optionalAuth, upload.single('file'), csrfCheckToken, pptToPdf);
router.post('/word-to-pdf', optionalAuth, upload.single('file'), csrfCheckToken, wordToPdf);
router.post('/edit-pdf', optionalAuth, upload.single('file'), csrfCheckToken, editPdf);
router.post('/sign-pdf', optionalAuth, upload.single('file'), csrfCheckToken, signPdf);

module.exports = router;
