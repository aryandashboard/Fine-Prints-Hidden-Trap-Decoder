import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 25000;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText().finally(() => parser.destroy());
    const text = typeof data.text === 'string' ? data.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: 'No text found in PDF' }, { status: 422 });
    }
    
    return NextResponse.json({
      text: text.slice(0, MAX_EXTRACTED_TEXT_LENGTH),
      truncated: text.length > MAX_EXTRACTED_TEXT_LENGTH,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown PDF extraction error';
    console.error('PDF extraction error:', message);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
