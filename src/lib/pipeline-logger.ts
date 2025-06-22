/* ==========================================================================*/
// pipeline-logger.ts — Winston-based Pipeline Logging System
/* ==========================================================================*/
// Purpose: Comprehensive logging for pipeline execution with structured output
// Sections: Imports, Configuration, Logger Class, Global Instance, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Core Modules ---
import "server-only"

// External Packages ---
import winston from 'winston'
import path from 'path'

/* ==========================================================================*/
// Winston Configuration
/* ==========================================================================*/

interface PipelineLogData {
  step?: string
  stepNumber?: number
  stepName?: string
  type: 'request' | 'response' | 'prompt' | 'info' | 'error' | 'slug_cleaning' | 'pipeline_start' | 'pipeline_complete'
  message: string
  data?: unknown
  originalSlug?: string
  cleanedSlug?: string
  wasChanged?: boolean
  systemPrompt?: string
  userPrompt?: string
  systemPromptLength?: number
  userPromptLength?: number
  request?: unknown
  response?: unknown
  result?: unknown
  success?: boolean
  finalResponse?: unknown
  error?: unknown
}

/* ==========================================================================*/
// Pipeline Logger Class
/* ==========================================================================*/

class PipelineLogger {
  private logger: winston.Logger
  private sessionId: string
  private logFilePath: string

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `pipeline-${Date.now()}`
    
    // Create timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.logFilePath = path.join(process.cwd(), 'logs', `pipeline-${timestamp}-${this.sessionId}.log`)
    
    // Configure Winston logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.prettyPrint()
      ),
      transports: [
        new winston.transports.File({ 
          filename: this.logFilePath,
          maxsize: 10 * 1024 * 1024, // 10MB max file size
          maxFiles: 5 // Keep 5 old log files
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ level, message, timestamp, step, type }) => {
              return `${timestamp} [${level}] 📝 [${step || 'PIPELINE'}] ${type?.toString().toUpperCase()}: ${message}`
            })
          )
        })
      ]
    })

    this.logger.info('Pipeline Logger initialized', {
      sessionId: this.sessionId,
      logFilePath: this.logFilePath,
      type: 'info',
      message: 'Pipeline Logger initialized'
    })
  }

  /**
   * Log initial pipeline request
   */
  logInitialRequest(request: unknown) {
    const logData: PipelineLogData = {
      step: 'PIPELINE_START',
      type: 'pipeline_start',
      message: 'Initial pipeline request received',
      data: request
    }
    
    this.logger.info('Pipeline started', logData)
  }

  /**
   * Log slug cleaning process
   */
  logSlugCleaning(originalSlug: string, cleanedSlug: string) {
    const logData: PipelineLogData = {
      step: 'SLUG_CLEANING',
      type: 'slug_cleaning',
      message: 'Slug cleaning process',
      originalSlug,
      cleanedSlug,
      wasChanged: originalSlug !== cleanedSlug
    }
    
    this.logger.info('Slug cleaned', logData)
  }

  /**
   * Log formatted prompts for a step
   */
  logStepPrompts(stepNumber: number, stepName: string, systemPrompt: string, userPrompt: string) {
    const logData: PipelineLogData = {
      step: `STEP_${stepNumber}_PROMPTS`,
      stepNumber,
      stepName,
      type: 'prompt',
      message: `Formatted prompts for ${stepName}`,
      systemPrompt,
      userPrompt,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    }
    
    this.logger.info('Step prompts formatted', logData)
  }

  /**
   * Log step request being sent to API
   */
  logStepRequest(stepNumber: number, stepName: string, request: unknown) {
    const logData: PipelineLogData = {
      step: `STEP_${stepNumber}_REQUEST`,
      stepNumber,
      stepName,
      type: 'request',
      message: `API request for ${stepName}`,
      request
    }
    
    this.logger.info('Step request sent', logData)
  }

  /**
   * Log step response from API
   */
  logStepResponse(stepNumber: number, stepName: string, response: unknown) {
    const logData: PipelineLogData = {
      step: `STEP_${stepNumber}_RESPONSE`,
      stepNumber,
      stepName,
      type: 'response',
      message: `API response for ${stepName}`,
      response
    }
    
    this.logger.info('Step response received', logData)
  }

  /**
   * Log step completion with final result
   */
  logStepComplete(stepNumber: number, stepName: string, result: unknown) {
    const logData: PipelineLogData = {
      step: `STEP_${stepNumber}_COMPLETE`,
      stepNumber,
      stepName,
      type: 'info',
      message: `Step completed: ${stepName}`,
      result
    }
    
    this.logger.info('Step completed', logData)
  }

  /**
   * Log pipeline completion
   */
  logPipelineComplete(success: boolean, finalResponse: unknown) {
    const logData: PipelineLogData = {
      step: 'PIPELINE_COMPLETE',
      type: 'pipeline_complete',
      message: 'Pipeline execution completed',
      success,
      finalResponse
    }
    
    this.logger.info('Pipeline completed', logData)
  }

  /**
   * Log errors
   */
  logError(step: string, error: unknown) {
    const logData: PipelineLogData = {
      step,
      type: 'error',
      message: 'Error occurred',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    }
    
    this.logger.error('Pipeline error', logData)
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFilePath
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Close the logger and flush any pending writes
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', () => {
        resolve()
      })
      this.logger.end()
    })
  }
}

/* ==========================================================================*/
// Global Instance Management
/* ==========================================================================*/

let globalLogger: PipelineLogger | null = null

/**
 * Create a new pipeline logger instance
 * 
 * @param sessionId - Optional session identifier
 * @returns New PipelineLogger instance
 */
export function createPipelineLogger(sessionId?: string): PipelineLogger {
  return new PipelineLogger(sessionId)
}

/**
 * Initialize global pipeline logger
 * 
 * @param sessionId - Optional session identifier
 * @returns Global PipelineLogger instance
 */
export function initializeGlobalLogger(sessionId?: string): PipelineLogger {
  globalLogger = new PipelineLogger(sessionId)
  return globalLogger
}

/**
 * Get the global logger instance
 * 
 * @returns Global logger instance or null if not initialized
 */
export function getGlobalLogger(): PipelineLogger | null {
  return globalLogger
}

/**
 * Close and cleanup global logger
 */
export async function closeGlobalLogger(): Promise<void> {
  if (globalLogger) {
    await globalLogger.close()
    globalLogger = null
  }
}

/* ==========================================================================*/
// Public API Exports
/* ==========================================================================*/

export { PipelineLogger } 