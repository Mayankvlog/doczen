const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

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

router.post('/merge', protect, upload.array('files', 20), merge);
router.post('/split', protect, upload.single('file'), split);
router.post('/compress', protect, upload.single('file'), compress);
router.post('/rotate', protect, upload.single('file'), rotate);
router.post('/protect', protect, upload.single('file'), protectPdf);
router.post('/unlock', protect, upload.single('file'), unlock);
router.post('/add-page-numbers', protect, upload.single('file'), addPageNumbers);
router.post('/add-watermark', protect, upload.single('file'), addWatermark);
router.post('/extract-text', protect, upload.single('file'), extractText);
router.post('/reorder', protect, upload.single('file'), reorder);
router.post('/delete-pages', protect, upload.single('file'), deletePages);
router.post('/pdf-to-jpg', protect, upload.single('file'), pdfToJpg);
router.post('/jpg-to-pdf', protect, upload.array('files', 20), jpgToPdf);
router.post('/pdf-to-txt', protect, upload.single('file'), pdfToTxt);
router.post('/page-count', protect, upload.single('file'), getPageCount);
router.get('/download/:filename', protect, download);
router.post('/repair', protect, upload.single('file'), repair);
router.post('/pdf-to-pdfa', protect, upload.single('file'), pdfToPdfa);
router.post('/read-metadata', protect, upload.single('file'), readMetadata);
router.post('/write-metadata', protect, upload.single('file'), writeMetadata);
router.post('/flatten', protect, upload.single('file'), flatten);
router.post('/html-to-pdf', protect, htmlToPdf);
router.post('/redact', protect, upload.single('file'), redact);
router.post('/remove-annotations', protect, upload.single('file'), removeAnnotations);
router.post('/remove-watermark', protect, upload.single('file'), removeWatermark);
router.post('/compare', protect, upload.array('files', 2), compare);
router.post('/pdf-to-word', protect, upload.single('file'), pdfToWord);
router.post('/pdf-to-excel', protect, upload.single('file'), pdfToExcel);
router.post('/excel-to-pdf', protect, upload.single('file'), excelToPdf);
router.post('/pdf-to-ppt', protect, upload.single('file'), pdfToPpt);
router.post('/ppt-to-pdf', protect, upload.single('file'), pptToPdf);
router.post('/word-to-pdf', protect, upload.single('file'), wordToPdf);
router.post('/edit-pdf', protect, upload.single('file'), editPdf);
router.post('/sign-pdf', protect, upload.single('file'), signPdf);

module.exports = router;
