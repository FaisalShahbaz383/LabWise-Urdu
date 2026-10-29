const mongoose = require('mongoose');

const testItemSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      default: '',
    },
    referenceRange: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['HIGH', 'LOW', 'NORMAL', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      default: '',
      trim: true,
    },
    tests: {
      type: [testItemSchema],
      default: [],
    },
    explanationEnglish: {
      type: String,
      default: '',
    },
    explanationUrdu: {
      type: String,
      default: '',
    },
    disclaimer: {
      type: String,
      default: 'Educational tool only. Not a medical diagnosis. Always consult a certified physician.',
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
  },
  originalFileName: {
    type: String,
    required: [true, 'Original file name is required'],
  },
  fileType: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded',
  },
  extractedText: {
    type: String,
    default: '',
  },
  analysis: {
    type: analysisSchema,
    default: () => ({}),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Report', reportSchema);
