/**
 * @parserator/core - Production HTTP Client
 * Adapted from Jules' architecture patterns but using our 95% accuracy production API
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ParseRequest,
  ParseResponse,
  ParseMetadata,
  ApiError,
  ClientConfig,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT,
  ERROR_CODES
} from '@parserator/types';

export class ParseClient {
  private axiosInstance: AxiosInstance;
  private apiKey?: string;

  constructor(config: ClientConfig = {}) {
    const {
      baseURL = DEFAULT_BASE_URL,
      apiKey,
      timeout = DEFAULT_TIMEOUT,
      headers = {},
      retry = { attempts: 3, delay: 1000 }
    } = config;

    this.apiKey = apiKey;
    
    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });

    // Response interceptor for error handling (adapted from Jules)
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Check if response contains an API error (even with 200 status)
        if (response.data && typeof response.data === 'object' && response.data.success === false) {
          throw this.normalizeError({
            response: {
              status: response.status,
              data: response.data
            }
          });
        }
        return response;
      },
      (error) => {
        throw this.normalizeError(error);
      }
    );
  }

  /**
   * Parse unstructured text using production Architect-Extractor API
   * This calls your REAL 95% accuracy production endpoint
   */
  async parse(request: ParseRequest): Promise<ParseResponse> {
    try {
      const response = await this.axiosInstance.post<ParseResponse>('/v1/parse', request);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      // Your production API returns the response directly
      return response.data;
      
    } catch (error) {
      // Generate intelligent error recovery suggestions
      const recovery = this.generateErrorRecovery(error, request);
      
      // If auto-retry is recommended and we have a suggested fix, try once more
      if (recovery.autoRetryRecommended && (recovery.suggestedSchema || recovery.suggestedInput)) {
        try {
          const retryRequest = {
            ...request,
            ...(recovery.suggestedSchema && { outputSchema: recovery.suggestedSchema }),
            ...(recovery.suggestedInput && { inputData: recovery.suggestedInput })
          };
          
          const retryResponse = await this.axiosInstance.post<ParseResponse>('/v1/parse', retryRequest);
          
          if (retryResponse.data && typeof retryResponse.data === 'object') {
            // Success! Return with recovery metadata
            return {
              ...retryResponse.data,
              recovery: {
                ...recovery,
                suggestions: [
                  ...recovery.suggestions,
                  {
                    type: 'retry_strategy',
                    description: 'Auto-recovery successful with suggested modifications',
                    confidence: 0.9
                  }
                ]
              }
            };
          }
        } catch (retryError) {
          // Retry failed, continue to error handling
        }
      }
      
      // Return structured error response with recovery suggestions
      // Don't throw - always return a response with recovery info
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError(
          'Parse operation failed',
          ERROR_CODES.PROCESSING_ERROR,
          500,
          { originalError: error }
        ),
        recovery
      };
    }
  }

  /**
   * Generate intelligent error recovery suggestions using Architect-Extractor pattern
   */
  private generateErrorRecovery(error: any, originalRequest: ParseRequest): any {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const suggestions: any[] = [];
    let suggestedSchema: Record<string, any> | undefined;
    let suggestedInput: string | undefined;
    let autoRetryRecommended = false;
    let explanation = 'An unexpected error occurred during parsing.';

    // JSON Parsing Errors (API returning malformed response)
    if (errorMessage.includes('Unexpected token') || errorMessage.includes('JSON')) {
      explanation = 'The API returned a malformed response. This usually indicates high server load or a temporary issue.';
      suggestions.push({
        type: 'retry_strategy',
        description: 'Wait a few moments and try again. The server may be experiencing high load.',
        confidence: 0.8
      });
      autoRetryRecommended = true;
    }
    
    // SearchPlan Errors (Architect stage failed)
    else if (errorMessage.includes('SearchPlan') || errorMessage.includes('Architect')) {
      explanation = 'The parsing strategy generator had trouble creating a plan for your data. Try simplifying your schema or data.';
      
      // Suggest simpler schema
      const simpleSchema: Record<string, any> = {};
      let fieldCount = 0;
      for (const [key, value] of Object.entries(originalRequest.outputSchema)) {
        if (fieldCount < 3) { // Limit to 3 fields for simple retry
          simpleSchema[key] = typeof value === 'string' ? value : 'string';
          fieldCount++;
        }
      }
      
      suggestedSchema = simpleSchema;
      suggestions.push({
        type: 'schema_simplification',
        description: `Try with fewer fields: ${Object.keys(simpleSchema).join(', ')}`,
        action: {
          type: 'use_schema',
          parameters: { schema: simpleSchema }
        },
        confidence: 0.7
      });
      
      // Suggest data chunking if input is very long
      if (originalRequest.inputData.length > 1000) {
        const chunkSize = 500;
        suggestedInput = originalRequest.inputData.substring(0, chunkSize) + '...';
        suggestions.push({
          type: 'data_chunking',
          description: `Your input is ${originalRequest.inputData.length} characters. Try parsing smaller chunks.`,
          action: {
            type: 'chunk_data',
            parameters: { maxLength: chunkSize }
          },
          confidence: 0.6
        });
      }
      
      autoRetryRecommended = true;
    }
    
    // Network/Timeout Errors
    else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
      explanation = 'Network connectivity issue. Check your internet connection and try again.';
      suggestions.push({
        type: 'retry_strategy',
        description: 'Check your network connection and retry the request.',
        confidence: 0.9
      });
    }
    
    // Rate Limiting
    else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      explanation = 'API rate limit exceeded. Please wait before making another request.';
      suggestions.push({
        type: 'retry_strategy',
        description: 'Wait 30 seconds before trying again. Consider implementing request throttling.',
        confidence: 0.95
      });
    }
    
    // Generic suggestions if no specific pattern matched
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'schema_simplification',
        description: 'Try with a simpler schema (fewer fields, basic types like "string")',
        confidence: 0.5
      });
      
      suggestions.push({
        type: 'format_preprocessing',
        description: 'Clean your input data: remove special characters, normalize spacing',
        confidence: 0.4
      });
    }

    return {
      suggestions,
      suggestedSchema,
      suggestedInput,
      autoRetryRecommended,
      explanation
    };
  }

  /**
   * Test API connectivity and authentication
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Update API key for authenticated requests
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * Remove API key (for testing with public endpoints)
   */
  clearApiKey(): void {
    this.apiKey = undefined;
    delete this.axiosInstance.defaults.headers['Authorization'];
  }

  /**
   * Get current configuration
   */
  getConfig(): Partial<ClientConfig> {
    return {
      baseURL: this.axiosInstance.defaults.baseURL,
      timeout: this.axiosInstance.defaults.timeout,
      apiKey: this.apiKey ? '***' : undefined
    };
  }

  /**
   * Normalize different error types into consistent ApiError
   * Adapted from Jules' error handling pattern
   */
  private normalizeError(error: any): ApiError {
    // Network/connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new ApiError(
        'Unable to connect to Parserator API',
        ERROR_CODES.NETWORK_ERROR,
        0,
        { code: error.code }
      );
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      return new ApiError(
        'Request timed out',
        ERROR_CODES.TIMEOUT,
        408,
        { timeout: this.axiosInstance.defaults.timeout }
      );
    }

    // HTTP response errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Your production API error format
      if (data && typeof data === 'object' && data.error) {
        return new ApiError(
          data.error.message || 'API request failed',
          data.error.code || ERROR_CODES.UNKNOWN_ERROR,
          status,
          data.error.details
        );
      }

      // Standard HTTP errors
      const message = this.getHttpErrorMessage(status);
      const code = this.getHttpErrorCode(status);
      
      return new ApiError(message, code, status, { response: data });
    }

    // Request setup errors
    if (error.request) {
      return new ApiError(
        'Request could not be sent',
        ERROR_CODES.NETWORK_ERROR,
        0,
        { request: error.request }
      );
    }

    // Unknown errors
    return new ApiError(
      error.message || 'An unknown error occurred',
      ERROR_CODES.UNKNOWN_ERROR,
      500,
      { originalError: error }
    );
  }

  private getHttpErrorMessage(status: number): string {
    switch (status) {
      case 400: return 'Invalid request data';
      case 401: return 'Authentication required';
      case 403: return 'Access forbidden';
      case 404: return 'Endpoint not found';
      case 429: return 'Rate limit exceeded';
      case 500: return 'Internal server error';
      case 502: return 'Bad gateway';
      case 503: return 'Service unavailable';
      case 504: return 'Gateway timeout';
      default: return `HTTP error ${status}`;
    }
  }

  private getHttpErrorCode(status: number): string {
    switch (status) {
      case 400: return ERROR_CODES.INVALID_INPUT;
      case 401: return ERROR_CODES.UNAUTHORIZED;
      case 403: return ERROR_CODES.UNAUTHORIZED;
      case 429: return ERROR_CODES.RATE_LIMITED;
      case 408:
      case 504: return ERROR_CODES.TIMEOUT;
      default: return ERROR_CODES.UNKNOWN_ERROR;
    }
  }
}

/**
 * Convenience factory function for creating configured clients
 */
export function createParseClient(apiKey?: string, config?: Partial<ClientConfig>): ParseClient {
  return new ParseClient({
    apiKey,
    ...config
  });
}

export default ParseClient;