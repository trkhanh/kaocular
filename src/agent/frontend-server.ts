import { StagehandWithBrowserTools } from './stagehand-browser-tools';
import { getStagehandConfig, getProviderInfo } from './config';
import { WebSocketServer } from 'ws';
import http from 'http';

/**
 * Backend server that integrates Stagehand with the frontend
 * Provides WebSocket API for real-time communication
 */
class FrontendServer {
  private stagehand: StagehandWithBrowserTools | null = null;
  private wss: WebSocketServer | null = null;
  private server: http.Server | null = null;
  private clients: Set<any> = new Set();

  async start(port: number = 8080) {
    console.log('Starting Frontend Integration Server...');
    
    // Create HTTP server
    this.server = http.createServer();
    
    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.server });
    
    // Handle WebSocket connections
    this.wss.on('connection', (ws) => {
      console.log('Frontend client connected');
      this.clients.add(ws);
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });
      
      ws.on('close', () => {
        console.log('Frontend client disconnected');
        this.clients.delete(ws);
      });
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Stagehand backend'
      }));
    });
    
    // Start server
    this.server.listen(port, () => {
      console.log(`Frontend Integration Server running on port ${port}`);
    });
    
    // Initialize Stagehand
    await this.initializeStagehand();
  }

  private async initializeStagehand() {
    try {
      const providerInfo = getProviderInfo();
      console.log(`Initializing Stagehand with ${providerInfo.name} (${providerInfo.model})`);
      
      this.stagehand = new StagehandWithBrowserTools({
        env: 'LOCAL',
        localBrowserLaunchOptions: {
          headless: false,
          devtools: true,
        },
        ...getStagehandConfig(),
      });

      await this.stagehand.init();
      await this.stagehand.startMonitoring();
      
      // Set up event listeners for real-time updates
      this.setupStagehandListeners();
      
      console.log('Stagehand initialized successfully');
      this.broadcast({
        type: 'stagehand_ready',
        message: 'Stagehand is ready for automation'
      });
      
    } catch (error) {
      console.error('Failed to initialize Stagehand:', error);
      this.broadcast({
        type: 'error',
        message: `Failed to initialize Stagehand: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private setupStagehandListeners() {
    if (!this.stagehand) return;

    // Monitor console logs in real-time
    const originalGetConsoleLogs = this.stagehand.getConsoleLogs.bind(this.stagehand);
    let lastConsoleLogCount = 0;
    
    setInterval(() => {
      const logs = originalGetConsoleLogs();
      if (logs.length > lastConsoleLogCount) {
        const newLogs = logs.slice(lastConsoleLogCount);
        newLogs.forEach(log => {
          this.broadcast({
            type: 'console_log',
            payload: log
          });
        });
        lastConsoleLogCount = logs.length;
      }
    }, 500);

    // Monitor network requests in real-time
    const originalGetNetworkLogs = this.stagehand.getNetworkLogs.bind(this.stagehand);
    let lastNetworkLogCount = 0;
    
    setInterval(() => {
      const logs = originalGetNetworkLogs();
      if (logs.length > lastNetworkLogCount) {
        const newLogs = logs.slice(lastNetworkLogCount);
        newLogs.forEach(log => {
          this.broadcast({
            type: log.type === 'request' ? 'network_request' : 'network_response',
            payload: log
          });
        });
        lastNetworkLogCount = logs.length;
      }
    }, 500);
  }

  private async handleMessage(ws: any, message: any) {
    if (!this.stagehand) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Stagehand not initialized'
      }));
      return;
    }

    switch (message.command) {
      case 'start_run':
        await this.handleStartRun(ws, message.params);
        break;
      
      case 'stop_run':
        await this.handleStopRun(ws, message.params);
        break;
      
      case 'clear_logs':
        this.stagehand.clearLogs();
        this.broadcast({
          type: 'logs_cleared',
          message: 'All logs cleared'
        });
        break;
      
      case 'export_logs':
        const logs = this.stagehand.exportLogs();
        ws.send(JSON.stringify({
          type: 'logs_exported',
          payload: logs
        }));
        break;
      
      case 'navigate':
        await this.stagehand.page.goto(message.params.url);
        this.broadcast({
          type: 'navigation',
          payload: { url: message.params.url }
        });
        break;
      
      case 'act':
        await this.stagehand.act(message.params.instruction);
        this.broadcast({
          type: 'action_completed',
          payload: { instruction: message.params.instruction }
        });
        break;
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown command: ${message.command}`
        }));
    }
  }

  private async handleStartRun(ws: any, params: any) {
    try {
      const { taskId, instruction } = params;
      
      this.broadcast({
        type: 'run_started',
        payload: { taskId, instruction, startTime: new Date() }
      });
      
      // Navigate to test app
      await this.stagehand!.page.goto('http://localhost:3000');
      
      // Execute the instruction
      await this.stagehand!.act(instruction);
      
      this.broadcast({
        type: 'run_completed',
        payload: { taskId, instruction, endTime: new Date() }
      });
      
    } catch (error) {
      this.broadcast({
        type: 'run_failed',
        payload: { 
          taskId: params.taskId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      });
    }
  }

  private async handleStopRun(ws: any, params: any) {
    // Implementation for stopping runs
    this.broadcast({
      type: 'run_stopped',
      payload: { runId: params.runId }
    });
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr);
      }
    });
  }

  async stop() {
    if (this.stagehand) {
      await this.stagehand.close();
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.server) {
      this.server.close();
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new FrontendServer();
  
  server.start(8080).catch(console.error);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await server.stop();
    process.exit(0);
  });
}

export { FrontendServer };
