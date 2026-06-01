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
      <html>
        <body>
          <h1>Content Not Found</h1>
          <p>The content file "{page}.json" does not exist.</p>
        </body>
      </html>
    );
  }
  
  // Read the JSON file
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const jsonData = JSON.parse(fileContent);
  
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AI-accessible content for learning platform" />
        <title>AI Content - {page}</title>
      </head>
      <body>
        <div id="ai-content" style={{ display: 'none' }}>
          {JSON.stringify(jsonData, null, 2)}
        </div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Content for AI Analysis</h1>
          <p>This page contains the full content in JSON format for AI tools to analyze.</p>
          
          <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0 }}>
              {JSON.stringify(jsonData, null, 2)}
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
        </div>
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonData),
          }}
        />
      </body>
    </html>
  );
}
