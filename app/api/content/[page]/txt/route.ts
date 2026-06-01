import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export async function GET(
  request: NextRequest,
  { params }: { params: { page: string } }
) {
  try {
    const { page } = params;
    
    // Construct the file path
    const filePath = path.join(CONTENT_DIR, `${page}.json`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Content file not found' },
        { status: 404 }
      );
    }
    
    // Read the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    // Return as plain text with proper headers for AI accessibility
    return new NextResponse(JSON.stringify(jsonData, null, 2), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error serving plain text content:', error);
    return NextResponse.json(
      { error: 'Failed to load content' },
      { status: 500 }
    );
  }
}
