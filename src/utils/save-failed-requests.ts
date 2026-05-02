import fs from 'fs';
import path from 'path';
import { NetworkLog } from '../agent/stagehand-browser-tools';

/**
 * Format and save failed requests to a text file
 */
export function saveFailedRequestsToFile(
  failedRequests: NetworkLog[],
  filename: string = 'failed-requests.txt'
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filepath = path.join(process.cwd(), `${timestamp}-${filename}`);
  
  let content = '===========================================\n';
  content += 'FAILED NETWORK REQUESTS REPORT\n';
  content += `Generated: ${new Date().toISOString()}\n`;
  content += `Total Failed Requests: ${failedRequests.length}\n`;
  content += '===========================================\n\n';

  if (failedRequests.length === 0) {
    content += 'No failed requests detected.\n';
  } else {
    failedRequests.forEach((request, index) => {
      content += `--- Request #${index + 1} ---\n`;
      content += `URL: ${request.url}\n`;
      content += `Status: ${request.status} ${request.statusText || ''}\n`;
      content += `Method: ${request.method || 'N/A'}\n`;
      content += `Timestamp: ${request.timestamp}\n`;
      content += `Type: ${request.type}\n`;
      
      if (request.headers) {
        content += '\nHeaders:\n';
        Object.entries(request.headers).forEach(([key, value]) => {
          content += `  ${key}: ${value}\n`;
        });
      }
      
      if (request.postData) {
        content += '\nRequest Body:\n';
        try {
          const parsed = JSON.parse(request.postData);
          content += JSON.stringify(parsed, null, 2) + '\n';
        } catch {
          content += request.postData + '\n';
        }
      }
      
      if (request.responseBody) {
        content += '\nResponse Body:\n';
        try {
          const parsed = JSON.parse(request.responseBody);
          content += JSON.stringify(parsed, null, 2) + '\n';
        } catch {
          content += request.responseBody + '\n';
        }
      }
      
      content += '\n' + '='.repeat(50) + '\n\n';
    });
  }

  // Save to file
  fs.writeFileSync(filepath, content, 'utf-8');
  
  return filepath;
}

/**
 * Format failed requests for console output (shorter version)
 */
export function formatFailedRequestsSummary(failedRequests: NetworkLog[]): string {
  if (failedRequests.length === 0) {
    return 'No failed requests detected.';
  }
  
  let summary = `Found ${failedRequests.length} failed request(s):\n`;
  failedRequests.forEach((request, index) => {
    summary += `  ${index + 1}. [${request.status}] ${request.method || 'GET'} ${request.url}\n`;
  });
  
  return summary;
}
