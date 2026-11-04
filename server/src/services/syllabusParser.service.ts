import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export interface ExtractionResult {
  text: string;
  ocrApplied: boolean;
  confidence: number;
  pageCount: number;
  warning?: string;
}

export class SyllabusParserService {
  /**
   * Process an uploaded file (PDF or Image) and extract readable text.
   */
  public static async processFile(filePath: string, mimeType: string): Promise<ExtractionResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();

    if (mimeType.includes('pdf') || ext === '.pdf') {
      return await this.extractFromPdf(filePath);
    } else if (ext === '.txt' || mimeType.includes('text/plain')) {
      const text = fs.readFileSync(filePath, 'utf-8').trim();
      return {
        text,
        ocrApplied: false,
        confidence: 100.0,
        pageCount: 1,
      };
    } else if (
      mimeType.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
    ) {
      return await this.extractFromImage(filePath);
    } else {
      throw new Error(`Unsupported file format (${ext}). Supported formats: PDF, JPG, JPEG, PNG, WEBP.`);
    }
  }

  /**
   * Extract text from digital PDF using pdf-parse.
   */
  private static async extractFromPdf(filePath: string): Promise<ExtractionResult> {
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const pdfData = await pdfParse(dataBuffer);
      const cleanedText = pdfData.text ? pdfData.text.replace(/\r\n/g, '\n').trim() : '';

      // Check if text is readable or if it appears to be a scanned document with minimal text
      const charCount = cleanedText.length;
      const numPages = pdfData.numpages || 1;

      if (charCount < 60) {
        // Less than 60 chars in a multi-page or single-page PDF indicates scanned/raster PDF
        return {
          text: cleanedText,
          ocrApplied: false,
          confidence: 25.0,
          pageCount: numPages,
          warning: 'This PDF appears to be a scanned image with minimal machine-readable text. Please verify or upload a text-based document.',
        };
      }

      return {
        text: cleanedText,
        ocrApplied: false,
        confidence: 96.0,
        pageCount: numPages,
      };
    } catch (err: any) {
      throw new Error(`PDF extraction failed: ${err.message || 'Corrupted PDF file.'}`);
    }
  }

  /**
   * Extract text from image (JPG/PNG/WEBP) using Tesseract.js OCR.
   */
  private static async extractFromImage(filePath: string): Promise<ExtractionResult> {
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(filePath);
      await worker.terminate();

      const text = ret.data.text.trim();
      const confidence = ret.data.confidence || 0;

      let warning: string | undefined = undefined;
      if (confidence < 45 || text.length < 40) {
        warning = 'The image quality was low or the syllabus text was unclear. Please review the extracted content or upload a clearer scan.';
      }

      return {
        text,
        ocrApplied: true,
        confidence: Math.round(confidence * 10) / 10,
        pageCount: 1,
        warning,
      };
    } catch (err: any) {
      throw new Error(`OCR processing failed: ${err.message || 'Image could not be parsed.'}`);
    }
  }
}
