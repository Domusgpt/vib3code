/**
 * @parserator/core - Production HTTP Client
 * Adapted from Jules' architecture patterns but using our 95% accuracy production API
 */
import { ParseRequest, ParseResponse, ClientConfig } from '@parserator/types';
export declare class ParseClient {
    private axiosInstance;
    private apiKey?;
    constructor(config?: ClientConfig);
    /**
     * Parse unstructured text using production Architect-Extractor API
     * This calls your REAL 95% accuracy production endpoint
     */
    parse(request: ParseRequest): Promise<ParseResponse>;
    /**
     * Generate intelligent error recovery suggestions using Architect-Extractor pattern
     */
    private generateErrorRecovery;
    /**
     * Test API connectivity and authentication
     */
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
    /**
     * Update API key for authenticated requests
     */
    setApiKey(apiKey: string): void;
    /**
     * Remove API key (for testing with public endpoints)
     */
    clearApiKey(): void;
    /**
     * Get current configuration
     */
    getConfig(): Partial<ClientConfig>;
    /**
     * Normalize different error types into consistent ApiError
     * Adapted from Jules' error handling pattern
     */
    private normalizeError;
    private getHttpErrorMessage;
    private getHttpErrorCode;
}
/**
 * Convenience factory function for creating configured clients
 */
export declare function createParseClient(apiKey?: string, config?: Partial<ClientConfig>): ParseClient;
export default ParseClient;
//# sourceMappingURL=client.d.ts.map