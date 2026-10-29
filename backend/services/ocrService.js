const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const PDFParser = require('pdf2json');

/**
 * Safely decodes URI-encoded component strings from pdf2json text runs.
 * Correctly decodes table characters, units (e.g., mg/dL, g/dL, /mcL),
 * symbols, and numerical values, while gracefully handling unencoded '%' symbols.
 *
 * @param {string} str - Raw or percent-encoded string
 * @returns {string} - Decoded string
 */
function safeDecodeURIComponent(str) {
  if (!str || typeof str !== 'string') return '';
  try {
    return decodeURIComponent(str);
  } catch (err) {
    try {
      // Escape raw percent signs not part of a valid hex sequence and retry
      return decodeURIComponent(str.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
    } catch {
      return str;
    }
  }
}

/**
 * Normalizes and cleans raw extracted OCR/PDF text.
 * Preserves paragraphs and indentation while removing null characters
 * and condensing excessive blank lines.
 *
 * @param {string} text - Raw extracted text string
 * @returns {string} - Cleaned text string
 */
function cleanExtractedText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/\0/g, '') // Remove null characters
    .replace(/\r\n/g, '\n') // Normalize Windows line breaks
    .replace(/\r/g, '\n') // Normalize legacy Mac line breaks
    .replace(/\n{3,}/g, '\n\n') // Compress 3+ consecutive newlines to 2
    .trim();
}

/**
 * Extracts text from an image file using Tesseract.js OCR.
 *
 * @param {string} absoluteFilePath - Full filesystem path to the image
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(absoluteFilePath) {
  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`Image file not found at path: ${absoluteFilePath}`);
  }

  console.log(`[OCR Service] Starting Tesseract image OCR on: ${path.basename(absoluteFilePath)}`);

  const { data } = await Tesseract.recognize(absoluteFilePath, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && m.progress % 0.25 === 0) {
        console.log(`[OCR Service] Tesseract progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  const cleanedText = cleanExtractedText(data.text);
  console.log(`[OCR Service] Image OCR completed. Extracted ${cleanedText.length} characters.`);
  return cleanedText;
}

/**
 * Extracts text from a PDF document using pure JavaScript pdf2json (PDFParser).
 * Avoids native C++ compilation dependencies and decodes URI text elements to
 * faithfully capture clinical tables, units, and numeric results.
 *
 * Wrapped in a Promise to smoothly handle async PDF reading.
 *
 * @param {string} absoluteFilePath - Full filesystem path to the PDF
 * @returns {Promise<string>} - Extracted text
 */
function extractTextFromPdf(absoluteFilePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(absoluteFilePath)) {
      return reject(new Error(`PDF file not found at path: ${absoluteFilePath}`));
    }

    console.log(`[OCR Service] Starting pure JS pdf2json extraction on: ${path.basename(absoluteFilePath)}`);

    try {
      const pdfParser = new PDFParser();

      // Handle parser errors
      pdfParser.on('pdfParser_dataError', (errData) => {
        const errorMsg =
          errData?.parserError || errData?.message || 'pdf2json parsing error occurred';
        console.error(`[OCR Service] pdf2json error on ${path.basename(absoluteFilePath)}:`, errorMsg);
        reject(new Error(errorMsg));
      });

      // Handle parsed data
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          if (!pdfData || !Array.isArray(pdfData.Pages) || pdfData.Pages.length === 0) {
            console.warn('[OCR Service] PDF has no pages or empty structure.');
            return resolve('');
          }

          const extractedPages = [];

          for (const page of pdfData.Pages) {
            if (!page.Texts || !Array.isArray(page.Texts) || page.Texts.length === 0) {
              continue;
            }

            // Group text elements by vertical coordinate (y) with small vertical tolerance (0.35)
            // to reconstruct table rows and lines accurately
            const lineGroups = [];
            const sortedTexts = [...page.Texts].sort((a, b) => a.y - b.y || a.x - b.x);

            for (const textItem of sortedTexts) {
              let targetLine = lineGroups.find((g) => Math.abs(g.y - textItem.y) < 0.35);
              if (!targetLine) {
                targetLine = { y: textItem.y, items: [] };
                lineGroups.push(targetLine);
              }
              targetLine.items.push(textItem);
            }

            // Sort lines vertically
            lineGroups.sort((a, b) => a.y - b.y);

            // Construct lines horizontally by x coordinate
            const pageLines = lineGroups
              .map((group) => {
                group.items.sort((a, b) => a.x - b.x);
                return group.items
                  .map((item) => {
                    if (!item.R || !Array.isArray(item.R)) return '';
                    return item.R
                      .map((run) => safeDecodeURIComponent(run.T))
                      .join('');
                  })
                  .join('   ');
              })
              .filter((line) => line.trim().length > 0);

            if (pageLines.length > 0) {
              extractedPages.push(pageLines.join('\n'));
            }
          }

          let fullExtractedText = extractedPages.join('\n\n');

          // Fallback to getRawTextContent() if line grouping yielded nothing
          if (!fullExtractedText.trim() && typeof pdfParser.getRawTextContent === 'function') {
            const rawContent = pdfParser.getRawTextContent();
            if (rawContent) {
              fullExtractedText = safeDecodeURIComponent(rawContent);
            }
          }

          const cleanedText = cleanExtractedText(fullExtractedText);
          console.log(`[OCR Service] pdf2json completed. Extracted ${cleanedText.length} characters.`);
          resolve(cleanedText);
        } catch (innerError) {
          console.error('[OCR Service] Error processing pdfData payload:', innerError);
          reject(innerError);
        } finally {
          if (typeof pdfParser.destroy === 'function') {
            pdfParser.destroy();
          }
        }
      });

      // Load and parse the PDF file
      pdfParser.loadPDF(absoluteFilePath);
    } catch (launchError) {
      console.error('[OCR Service] Failed to initialize PDFParser:', launchError);
      reject(launchError);
    }
  });
}

/**
 * Primary routing function for text extraction based on file type.
 *
 * @param {string} absoluteFilePath - Absolute filesystem path to the file
 * @param {string} mimeType - MIME type of the uploaded file
 * @param {string} originalFileName - Original filename
 * @returns {Promise<{ text: string, method: string }>} - Extraction result
 */
async function extractText(absoluteFilePath, mimeType = '', originalFileName = '') {
  const extension = path.extname(originalFileName || absoluteFilePath).toLowerCase();
  const isPdf = extension === '.pdf' || mimeType === 'application/pdf';
  const isImage =
    ['.jpg', '.jpeg', '.png'].includes(extension) ||
    mimeType.startsWith('image/');

  if (!isPdf && !isImage) {
    throw new Error(
      `Unsupported file type for extraction (${extension || mimeType}). Only PDF, PNG, JPG, and JPEG are supported.`
    );
  }

  if (isPdf) {
    const text = await extractTextFromPdf(absoluteFilePath);
    return {
      text,
      method: 'pdf2json',
    };
  } else {
    const text = await extractTextFromImage(absoluteFilePath);
    return {
      text,
      method: 'tesseract.js',
    };
  }
}

module.exports = {
  extractText,
  extractTextFromImage,
  extractTextFromPdf,
  cleanExtractedText,
  safeDecodeURIComponent,
};
