import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export async function generateMetadata({ params }: { params: { page: string } }) {
  return {
    title: `AI Content - ${params.page}`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function AIContentPage({ params }: { params: { page: string } }) {
  const { page } = params;
  
  // Construct the file path
  const filePath = path.join(CONTENT_DIR, `${page}.json`);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    return (
      <div>
        <h1>Content Not Found</h1>
        <p>The content file "{page}.json" does not exist.</p>
      </div>
    );
  }
  
  // Read the JSON file
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const jsonData = JSON.parse(fileContent);
  const jsonString = JSON.stringify(jsonData, null, 2);
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0 }}>
          {jsonString}
        </pre>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Instructions for AI:</h2>
        <p>You can analyze the JSON content above to provide:</p>
        <ul>
          <li>Summaries of the content</li>
          <li>Explanations of concepts</li>
          <li>Practice questions with answers</li>
          <li>Test preparation materials</li>
          <li>Any other educational support</li>
        </ul>
      </div>
      
      {/* Hidden div for AI scrapers that look for specific IDs */}
      <div id="ai-content" style={{ display: 'none' }}>
        {jsonString}
      </div>
      
      {/* JSON-LD for structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonString,
        }}
      />
    </div>
  );
}
