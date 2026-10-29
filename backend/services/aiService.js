const { GoogleGenAI } = require('@google/genai');

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

const DEFAULT_DISCLAIMER =
  '⚠️ Educational tool only. Not a medical diagnosis. Always consult a certified physician.';

/**
 * Normalizes test status to strict enum values: 'HIGH' | 'LOW' | 'NORMAL' | 'UNKNOWN'.
 *
 * @param {string} rawStatus
 * @returns {'HIGH' | 'LOW' | 'NORMAL' | 'UNKNOWN'}
 */
function normalizeStatus(rawStatus) {
  if (!rawStatus || typeof rawStatus !== 'string') return 'UNKNOWN';
  const upper = rawStatus.trim().toUpperCase();
  if (['HIGH', 'ELEVATED', 'ABOVE NORMAL', 'CRITICAL HIGH'].includes(upper)) {
    return 'HIGH';
  }
  if (['LOW', 'DECREASED', 'BELOW NORMAL', 'CRITICAL LOW'].includes(upper)) {
    return 'LOW';
  }
  if (['NORMAL', 'IN RANGE', 'NEGATIVE', 'DESIRABLE'].includes(upper)) {
    return 'NORMAL';
  }
  return 'UNKNOWN';
}

/**
 * Deterministic fallback extractor in case of offline/unavailable LLM API.
 * Ensures the pipeline always returns valid structured data.
 *
 * @param {string} text - Extracted raw report text
 * @returns {object} - Structured analysis fallback object
 */
function fallbackRuleBasedAnalysis(text) {
  const tests = [];
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);

  let detectedPatient = '';
  for (const line of lines) {
    const patientMatch = line.match(/patient\s*(?:name)?[:\-\s]+([a-zA-Z\s]+)/i);
    if (patientMatch && !detectedPatient) {
      detectedPatient = patientMatch[1].trim();
    }

    // Pattern: Test Name followed by numbers/units/status
    const match = line.match(
      /^([A-Za-z0-9\s\(\)\/\-\+\%]+?)\s{2,}(\d+(?:\.\d+)?|\bpositive\b|\bnegative\b)\s*([a-zA-Z\/\%]+)?\s*([<>0-9\.\-\s]+)?\s*(HIGH|LOW|NORMAL)?$/i
    );
    if (match) {
      const testName = match[1].trim();
      const value = match[2] ? match[2].trim() : '';
      const unit = match[3] ? match[3].trim() : '';
      const referenceRange = match[4] ? match[4].trim() : '';
      const rawStatus = match[5] ? match[5].trim() : 'UNKNOWN';

      if (testName.length > 2 && !testName.toUpperCase().includes('TEST NAME')) {
        tests.push({
          testName,
          value,
          unit,
          referenceRange,
          status: normalizeStatus(rawStatus),
        });
      }
    }
  }

  const hasHighOrLow = tests.some((t) => t.status === 'HIGH' || t.status === 'LOW');
  const explanationEnglish = hasHighOrLow
    ? 'Several laboratory parameters in your report are outside standard reference intervals. Please review these highlighted markers with your primary care physician.'
    : 'Your laboratory report has been scanned. Most identified markers appear within regular reference boundaries. Consult your doctor for comprehensive clinical evaluation.';

  const explanationUrdu = hasHighOrLow
    ? 'آپ کی میڈیکل رپورٹ میں چند ٹیسٹ نتائج معمول کے معیار سے مختلف (زیادہ یا کم) ہیں۔ براہ کرم ان نتائج کے مطابق حتمی تشخیص اور علاج کے لیے اپنے معالج سے مشورہ کریں۔'
    : 'آپ کی میڈیکل رپورٹ سکین ہو چکی ہے۔ زیادہ تر ٹیسٹ معمول کے مطابق معلوم ہوتے ہیں۔ مزید رہنمائی کے لیے اپنے ڈاکٹر سے رجوع فرمائیں۔';

  return {
    patientName: detectedPatient || '',
    tests,
    explanationEnglish,
    explanationUrdu,
    disclaimer: DEFAULT_DISCLAIMER,
  };
}

/**
 * Sends extracted clinical text to Gemini LLM with a strict JSON system prompt
 * to extract structured test markers and generate patient-friendly bilingual summaries.
 *
 * @param {string} extractedText - Raw OCR/PDF text from lab report
 * @returns {Promise<object>} - Structured analysis object
 */
async function analyzeReportText(extractedText) {
  if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length === 0) {
    return {
      patientName: '',
      tests: [],
      explanationEnglish: 'No readable text was available for medical analysis.',
      explanationUrdu: 'طبی تجزیہ کے لیے کوئی پڑھنے کے قابل متن موجود نہیں تھا۔',
      disclaimer: DEFAULT_DISCLAIMER,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI Service] GEMINI_API_KEY not configured. Using rule-based fallback analysis.');
    return fallbackRuleBasedAnalysis(extractedText);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert clinical pathologist and bilingual patient communicator for "LabWise Urdu".
Analyze the provided medical laboratory report text and output a strictly valid JSON object.

EXTRACTION INSTRUCTIONS:
1. "patientName": Identify patient's full name if found, or empty string.
2. "tests": Extract every clinical biomarker, analyte, or test item present into an array of objects:
   - "testName": Exact test name (e.g., "Hemoglobin (Hb)", "Total Cholesterol", "Platelet Count")
   - "value": Measured value as string (e.g., "11.2", "245", "Negative")
   - "unit": Measurement unit (e.g., "g/dL", "mg/dL", "/mcL", "%")
   - "referenceRange": Biological reference interval or normal baseline (e.g., "13.5 - 17.5", "< 200")
   - "status": Evaluate against normal reference range: STRICTLY one of "HIGH", "LOW", "NORMAL", "UNKNOWN"
3. "explanationEnglish": A clear, compassionate, non-jargon explanation in plain English for the patient. Explain abnormal markers simply, their clinical context, and dietary or lifestyle considerations.
4. "explanationUrdu": A clear, natural, and respectful explanation written in authentic Urdu (اردو رسم الخط). Explain abnormal test results in simple, understandable Urdu for the patient and family.
5. "disclaimer": Always set to "${DEFAULT_DISCLAIMER}".

STRICT JSON SCHEMA:
{
  "patientName": "string",
  "tests": [
    {
      "testName": "string",
      "value": "string",
      "unit": "string",
      "referenceRange": "string",
      "status": "HIGH" | "LOW" | "NORMAL" | "UNKNOWN"
    }
  ],
  "explanationEnglish": "string",
  "explanationUrdu": "string",
  "disclaimer": "string"
}

RAW MEDICAL REPORT TEXT:
${extractedText.slice(0, 12000)}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`[AI Service] Analyzing report with model: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const rawJson = response.text || '';
      const cleanedJson = rawJson
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedJson);

      // Validate and sanitize the structured tests array
      const sanitizedTests = Array.isArray(parsed.tests)
        ? parsed.tests.map((t) => ({
            testName: String(t.testName || 'Unknown Test').trim(),
            value: String(t.value ?? '').trim(),
            unit: String(t.unit ?? '').trim(),
            referenceRange: String(t.referenceRange ?? '').trim(),
            status: normalizeStatus(t.status),
          }))
        : [];

      const analysisResult = {
        patientName: String(parsed.patientName || '').trim(),
        tests: sanitizedTests,
        explanationEnglish: String(parsed.explanationEnglish || '').trim(),
        explanationUrdu: String(parsed.explanationUrdu || '').trim(),
        disclaimer: String(parsed.disclaimer || DEFAULT_DISCLAIMER).trim(),
      };

      console.log(
        `[AI Service] Successfully generated analysis (${analysisResult.tests.length} tests, English & Urdu explanations) using ${model}.`
      );
      return analysisResult;
    } catch (err) {
      console.warn(`[AI Service] Model ${model} generation failed (${err.message}). Trying next candidate...`);
    }
  }

  console.error('[AI Service] All Gemini model candidates failed. Activating intelligent fallback analysis.');
  return fallbackRuleBasedAnalysis(extractedText);
}

module.exports = {
  analyzeReportText,
  normalizeStatus,
  fallbackRuleBasedAnalysis,
};
