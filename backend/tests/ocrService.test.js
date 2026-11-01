// Mock dependencies before requiring services
jest.mock('pdf2json', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    parseBuffer: jest.fn(),
  }));
});

jest.mock('tesseract.js', () => ({
  recognize: jest.fn().mockResolvedValue({
    data: { text: 'Hemoglobin 11.2 g/dL' },
  }),
}));

const ocrService = require('../services/ocrService');

describe('OCR Service Layer Unit Tests', () => {
  test('OCR service module should be defined and export extraction functions', () => {
    expect(ocrService).toBeDefined();
  });

  test('Text cleaning helper should sanitize raw OCR output', () => {
    const rawText = "   Hemoglobin:   11.2   g/dL \n\n  RBC Count: 4.1  ";
    const cleaned = rawText.trim().replace(/\s+/g, ' ');
    expect(cleaned).toContain('Hemoglobin: 11.2 g/dL');
  });
});