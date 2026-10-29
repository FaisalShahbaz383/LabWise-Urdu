const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/upload');
const Report = require('../models/Report');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/reports/health
 * @desc    API Health Check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LabWise Urdu API is running healthy',
    features: [
      'User Authentication (JWT & bcrypt)',
      'Report History Dashboard',
      'OCR Text Extraction (pdf2json & tesseract)',
      'Bilingual AI Analysis (English & Urdu)',
    ],
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/reports/my-history
 * @desc    Fetch all reports belonging to authenticated user, sorted by date descending
 * @access  Private (JWT Protected)
 */
router.get('/my-history', protect, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (err) {
    console.error('Error fetching user report history:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report history.',
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Fetch single report by ID
 * @access  Public / Optional Auth
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (err) {
    console.error('Error retrieving report:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report.',
      error: err.message,
    });
  }
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete a report by ID (must belong to authenticated user)
 * @access  Private (JWT Protected)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or unauthorized to delete.',
      });
    }

    await report.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully.',
    });
  } catch (err) {
    console.error('Error deleting report:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete report.',
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/reports/upload
 * @desc    Upload medical report file, run OCR extraction, trigger LLM analysis, and persist to MongoDB
 *          Optionally associates report with authenticated user if Bearer token is provided
 * @access  Public / Optional Auth
 */
router.post('/upload', optionalAuth, (req, res) => {
  // Execute upload middleware with customized error handling
  upload.single('report')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the 5MB limit. Please upload a smaller file.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Error occurred during file upload.',
      });
    }

    // Validate that a file was attached
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide a report file in the "report" field.',
      });
    }

    // Normalize relative file path for database storage and cross-platform static access
    const relativeFilePath = `uploads/${req.file.filename}`;
    const absoluteFilePath = path.resolve(req.file.path);
    const userId = req.user ? req.user._id : null;

    let report;

    try {
      // 1. Initial MongoDB persistence with 'processing' status and userId
      report = new Report({
        userId,
        filePath: relativeFilePath,
        originalFileName: req.file.originalname,
        fileType: req.file.mimetype,
        status: 'processing',
        extractedText: '',
        analysis: {
          patientName: '',
          tests: [],
          explanationEnglish: '',
          explanationUrdu: '',
          disclaimer: 'Educational tool only. Not a medical diagnosis. Always consult a certified physician.',
        },
      });

      await report.save();
    } catch (dbError) {
      console.error('Error saving initial report record to MongoDB:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize report record in database.',
        error: dbError.message,
      });
    }

    // 2. Perform text extraction (Images via tesseract.js, PDFs via pure JS pdf2json)
    let ocrResult = { text: '', method: '' };
    let isExtractionSuccessful = false;

    try {
      ocrResult = await ocrService.extractText(
        absoluteFilePath,
        req.file.mimetype,
        req.file.originalname
      );

      const extractedLength = (ocrResult.text || '').trim().length;

      if (extractedLength > 0) {
        report.extractedText = ocrResult.text;
        isExtractionSuccessful = true;
      } else {
        report.extractedText = '';
        report.status = 'failed';
        isExtractionSuccessful = false;
        console.warn(`[Upload Route] No readable text found in file: ${req.file.originalname}`);
      }
    } catch (extractionError) {
      console.error(`[Upload Route] Extraction failed for file ${req.file.originalname}:`, extractionError.message);
      report.status = 'failed';
      report.extractedText = '';
      isExtractionSuccessful = false;
    }

    // 3. Trigger Bilingual LLM Structuring & Analysis if text is available
    if (isExtractionSuccessful && report.extractedText.length > 0) {
      try {
        console.log(`[Upload Route] Initiating LLM analysis for report ID: ${report._id}...`);
        const analysisData = await aiService.analyzeReportText(report.extractedText);
        report.analysis = analysisData;
        report.status = 'completed';
      } catch (aiError) {
        console.error('[Upload Route] AI structuring failed, applying rule-based fallback:', aiError);
        const fallback = aiService.fallbackRuleBasedAnalysis(report.extractedText);
        report.analysis = fallback;
        report.status = 'completed';
      }
    }

    // 4. Update the MongoDB document and return complete payload to frontend
    try {
      await report.save();

      return res.status(201).json({
        success: isExtractionSuccessful,
        message: isExtractionSuccessful
          ? 'Medical report uploaded, OCR parsed, and AI analyzed successfully.'
          : 'Report uploaded, but text extraction could not detect readable content.',
        reportId: report._id,
        _id: report._id,
        userId: report.userId,
        filePath: relativeFilePath,
        status: report.status,
        extractedText: report.extractedText,
        analysis: report.analysis,
        ocrMethod: ocrResult.method || null,
        report: {
          _id: report._id,
          userId: report.userId,
          filePath: report.filePath,
          originalFileName: report.originalFileName,
          fileType: report.fileType,
          status: report.status,
          extractedText: report.extractedText,
          analysis: report.analysis,
          createdAt: report.createdAt,
        },
      });
    } catch (updateError) {
      console.error('Error updating report status in MongoDB:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update report record with extraction results.',
        error: updateError.message,
      });
    }
  });
});

/**
 * @route   POST /api/reports/:id/analyze
 * @desc    Explicitly re-run or trigger AI analysis for an existing report
 * @access  Public
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    if (!report.extractedText || report.extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This report does not contain any extracted text to analyze.',
      });
    }

    const analysis = await aiService.analyzeReportText(report.extractedText);
    report.analysis = analysis;
    report.status = 'completed';
    await report.save();

    return res.status(200).json({
      success: true,
      message: 'Report analysis completed successfully.',
      reportId: report._id,
      analysis: report.analysis,
      report,
    });
  } catch (err) {
    console.error('Error running manual report analysis:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze report.',
      error: err.message,
    });
  }
});

module.exports = router;
