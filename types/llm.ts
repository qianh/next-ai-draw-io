/**
 * LLM Provider Types and Configuration
 */

export type LLMProvider = 'bedrock' | 'openai' | 'google' | 'openrouter' | 'custom';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  modelId: string; // The actual model ID used by the provider
  description?: string;
  maxTokens?: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
  customEndpoint?: string; // For custom providers
  enabled: boolean;
}

export interface LLMProviderConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  apiKey?: string; // Optional, can be set in env
  baseUrl?: string; // For custom providers
  models: LLMModel[];
  enabled: boolean;
  isCustom: boolean;
}

export interface LLMConfig {
  providers: LLMProviderConfig[];
  activeModelId: string; // The currently selected model ID
  lastUpdated: number;
}
