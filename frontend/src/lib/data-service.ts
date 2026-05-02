import { BrowserLog, NetworkLog, StorageData } from '@/types'

/**
 * Data service that integrates with Stagehand browser tools
 * This service can be extended to connect with the actual Stagehand backend
 */
export class DataService {
  private static instance: DataService
  private wsConnection: WebSocket | null = null
  private listeners: Map<string, Function[]> = new Map()

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  /**
   * Connect to backend WebSocket for real-time data
   */
  async connect(url: string = 'ws://localhost:8080'): Promise<void> {
    try {
      this.wsConnection = new WebSocket(url)
      
      this.wsConnection.onopen = () => {
        console.log('Connected to Stagehand backend')
        this.emit('connected', true)
      }

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleBackendMessage(data)
        } catch (error) {
          console.error('Failed to parse backend message:', error)
        }
      }

      this.wsConnection.onclose = () => {
        console.log('Disconnected from Stagehand backend')
        this.emit('connected', false)
        // Auto-reconnect after 5 seconds
        setTimeout(() => this.connect(url), 5000)
      }

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }
    } catch (error) {
      console.error('Failed to connect to backend:', error)
      this.emit('error', error)
    }
  }

  /**
   * Handle messages from Stagehand backend
   */
  private handleBackendMessage(data: any): void {
    switch (data.type) {
      case 'console_log':
        this.emit('console_log', data.payload as BrowserLog)
        break
      case 'network_request':
        this.emit('network_request', data.payload as NetworkLog)
        break
      case 'network_response':
        this.emit('network_response', data.payload as NetworkLog)
        break
      case 'storage_update':
        this.emit('storage_update', data.payload as StorageData)
        break
      case 'run_status':
        this.emit('run_status', data.payload)
        break
      case 'task_complete':
        this.emit('task_complete', data.payload)
        break
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  /**
   * Send command to backend
   */
  async sendCommand(command: string, params?: any): Promise<void> {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to backend')
    }

    const message = {
      type: 'command',
      command,
      params,
      timestamp: new Date().toISOString()
    }

    this.wsConnection.send(JSON.stringify(message))
  }

  /**
   * Start a new test run
   */
  async startRun(taskId: string, instruction: string): Promise<void> {
    await this.sendCommand('start_run', { taskId, instruction })
  }

  /**
   * Stop current run
   */
  async stopRun(runId: string): Promise<void> {
    await this.sendCommand('stop_run', { runId })
  }

  /**
   * Clear all logs
   */
  async clearLogs(): Promise<void> {
    await this.sendCommand('clear_logs')
  }

  /**
   * Export logs from backend
   */
  async exportLogs(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Export timeout'))
      }, 10000)

      this.once('logs_exported', (data: string) => {
        clearTimeout(timeout)
        resolve(data)
      })

      this.sendCommand('export_logs').catch(reject)
    })
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  once(event: string, callback: Function): void {
    const wrappedCallback = (...args: any[]) => {
      callback(...args)
      this.off(event, wrappedCallback)
    }
    this.on(event, wrappedCallback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  /**
   * Disconnect from backend
   */
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
    }
  }
}

// Export singleton instance
export const dataService = DataService.getInstance()
