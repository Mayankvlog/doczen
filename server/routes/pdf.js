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

router.post('/merge', optionalAuth, csrfCheckToken, upload.array('files', 20), merge);
router.post('/split', optionalAuth, csrfCheckToken, upload.single('file'), split);
router.post('/compress', optionalAuth, csrfCheckToken, upload.single('file'), compress);
router.post('/rotate', optionalAuth, csrfCheckToken, upload.single('file'), rotate);
router.post('/protect', optionalAuth, csrfCheckToken, upload.single('file'), protectPdf);
router.post('/unlock', optionalAuth, csrfCheckToken, upload.single('file'), unlock);
router.post('/add-page-numbers', optionalAuth, csrfCheckToken, upload.single('file'), addPageNumbers);
router.post('/add-watermark', optionalAuth, csrfCheckToken, upload.single('file'), addWatermark);
router.post('/extract-text', optionalAuth, csrfCheckToken, upload.single('file'), extractText);
router.post('/reorder', optionalAuth, csrfCheckToken, upload.single('file'), reorder);
router.post('/delete-pages', optionalAuth, csrfCheckToken, upload.single('file'), deletePages);
router.post('/pdf-to-jpg', optionalAuth, csrfCheckToken, upload.single('file'), pdfToJpg);
router.post('/jpg-to-pdf', optionalAuth, csrfCheckToken, upload.array('files', 20), jpgToPdf);
router.post('/pdf-to-txt', optionalAuth, csrfCheckToken, upload.single('file'), pdfToTxt);
router.post('/page-count', optionalAuth, csrfCheckToken, upload.single('file'), getPageCount);
router.get('/download/:filename', optionalAuth, download);
router.post('/repair', optionalAuth, csrfCheckToken, upload.single('file'), repair);
router.post('/pdf-to-pdfa', optionalAuth, csrfCheckToken, upload.single('file'), pdfToPdfa);
router.post('/read-metadata', optionalAuth, csrfCheckToken, upload.single('file'), readMetadata);
router.post('/write-metadata', optionalAuth, csrfCheckToken, upload.single('file'), writeMetadata);
router.post('/flatten', optionalAuth, csrfCheckToken, upload.single('file'), flatten);
router.post('/html-to-pdf', optionalAuth, csrfCheckToken, htmlToPdf);
router.post('/redact', optionalAuth, csrfCheckToken, upload.single('file'), redact);
router.post('/remove-annotations', optionalAuth, csrfCheckToken, upload.single('file'), removeAnnotations);
router.post('/remove-watermark', optionalAuth, csrfCheckToken, upload.single('file'), removeWatermark);
router.post('/compare', optionalAuth, csrfCheckToken, upload.array('files', 2), compare);
router.post('/pdf-to-word', optionalAuth, csrfCheckToken, upload.single('file'), pdfToWord);
router.post('/pdf-to-excel', optionalAuth, csrfCheckToken, upload.single('file'), pdfToExcel);
router.post('/excel-to-pdf', optionalAuth, csrfCheckToken, upload.single('file'), excelToPdf);
router.post('/pdf-to-ppt', optionalAuth, csrfCheckToken, upload.single('file'), pdfToPpt);
router.post('/ppt-to-pdf', optionalAuth, csrfCheckToken, upload.single('file'), pptToPdf);
router.post('/word-to-pdf', optionalAuth, csrfCheckToken, upload.single('file'), wordToPdf);
router.post('/edit-pdf', optionalAuth, csrfCheckToken, upload.single('file'), editPdf);
router.post('/sign-pdf', optionalAuth, csrfCheckToken, upload.single('file'), signPdf);

module.exports = router;
