/**
 * LLM Configuration Service
 * Manages LLM providers and models configuration
 */

import { LLMConfig, LLMProviderConfig, LLMModel, LLMProvider } from '@/types/llm';

const STORAGE_KEY = 'llm_config';

// Default configuration with mainstream providers
export const defaultLLMConfig: LLMConfig = {
  providers: [
    {
      id: 'bedrock',
      name: 'AWS Bedrock',
      provider: 'bedrock',
      enabled: true,
      isCustom: false,
      models: [
        {
          id: 'bedrock-claude-sonnet-4-5',
          name: 'Claude Sonnet 4.5',
          provider: 'bedrock',
          modelId: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
          description: 'Most intelligent model, best for complex tasks',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
        {
          id: 'bedrock-claude-sonnet-4',
          name: 'Claude Sonnet 4',
          provider: 'bedrock',
          modelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
          description: 'Previous generation Claude Sonnet',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
      ],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      provider: 'openai',
      enabled: true,
      isCustom: false,
      models: [
        {
          id: 'openai-gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          modelId: 'gpt-4o',
          description: 'Fast and intelligent multimodal model',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
        {
          id: 'openai-gpt-4o-mini',
          name: 'GPT-4o Mini',
          provider: 'openai',
          modelId: 'gpt-4o-mini',
          description: 'Cost-efficient model for simple tasks',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
        {
          id: 'openai-gpt-4-turbo',
          name: 'GPT-4 Turbo',
          provider: 'openai',
          modelId: 'gpt-4-turbo',
          description: 'Previous generation GPT-4',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
      ],
    },
    {
      id: 'google',
      name: 'Google Gemini',
      provider: 'google',
      enabled: true,
      isCustom: false,
      models: [
        {
          id: 'google-gemini-2-5-pro',
          name: 'Gemini 2.5 Pro',
          provider: 'google',
          modelId: 'gemini-2.5-pro',
          description: 'Most capable Gemini model',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
        {
          id: 'google-gemini-2-5-flash',
          name: 'Gemini 2.5 Flash',
          provider: 'google',
          modelId: 'gemini-2.5-flash-preview-05-20',
          description: 'Fast and cost-efficient',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
      ],
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      provider: 'openrouter',
      enabled: true,
      isCustom: false,
      models: [
        {
          id: 'openrouter-claude-sonnet-4-5',
          name: 'Claude Sonnet 4.5 (via OpenRouter)',
          provider: 'openrouter',
          modelId: 'anthropic/claude-sonnet-4-5',
          description: 'Claude Sonnet 4.5 via OpenRouter',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
        {
          id: 'openrouter-gpt-4o',
          name: 'GPT-4o (via OpenRouter)',
          provider: 'openrouter',
          modelId: 'openai/gpt-4o',
          description: 'GPT-4o via OpenRouter',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
        {
          id: 'openrouter-gemini-2-5-pro',
          name: 'Gemini 2.5 Pro (via OpenRouter)',
          provider: 'openrouter',
          modelId: 'google/gemini-2.5-pro',
          description: 'Gemini 2.5 Pro via OpenRouter',
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        },
      ],
    },
  ],
  activeModelId: 'bedrock-claude-sonnet-4-5',
  lastUpdated: Date.now(),
};

/**
 * LLM Configuration Manager
 */
export class LLMConfigManager {
  /**
   * Get the current LLM configuration
   */
  static getConfig(): LLMConfig {
    if (typeof window === 'undefined') {
      return defaultLLMConfig;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored) as LLMConfig;
        // Validate config structure
        if (config.providers && config.activeModelId) {
          return config;
        }
      }
    } catch (error) {
      console.error('Error loading LLM config:', error);
    }

    return defaultLLMConfig;
  }

  /**
   * Save the LLM configuration
   */
  static saveConfig(config: LLMConfig): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      config.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving LLM config:', error);
      throw error;
    }
  }

  /**
   * Get the active model configuration
   */
  static getActiveModel(): LLMModel | null {
    const config = this.getConfig();
    for (const provider of config.providers) {
      const model = provider.models.find(m => m.id === config.activeModelId);
      if (model) {
        return model;
      }
    }
    return null;
  }

  /**
   * Set the active model
   */
  static setActiveModel(modelId: string): void {
    const config = this.getConfig();

    // Verify the model exists
    let modelFound = false;
    for (const provider of config.providers) {
      if (provider.models.some(m => m.id === modelId)) {
        modelFound = true;
        break;
      }
    }

    if (!modelFound) {
      throw new Error(`Model ${modelId} not found`);
    }

    config.activeModelId = modelId;
    this.saveConfig(config);
  }

  /**
   * Add a new provider
   */
  static addProvider(provider: LLMProviderConfig): void {
    const config = this.getConfig();

    // Check if provider already exists
    const existingIndex = config.providers.findIndex(p => p.id === provider.id);
    if (existingIndex >= 0) {
      throw new Error(`Provider ${provider.id} already exists`);
    }

    config.providers.push(provider);
    this.saveConfig(config);
  }

  /**
   * Update an existing provider
   */
  static updateProvider(providerId: string, updates: Partial<LLMProviderConfig>): void {
    const config = this.getConfig();
    const providerIndex = config.providers.findIndex(p => p.id === providerId);

    if (providerIndex < 0) {
      throw new Error(`Provider ${providerId} not found`);
    }

    config.providers[providerIndex] = {
      ...config.providers[providerIndex],
      ...updates,
    };

    this.saveConfig(config);
  }

  /**
   * Delete a provider (only custom providers can be deleted)
   */
  static deleteProvider(providerId: string): void {
    const config = this.getConfig();
    const providerIndex = config.providers.findIndex(p => p.id === providerId);

    if (providerIndex < 0) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const provider = config.providers[providerIndex];
    if (!provider.isCustom) {
      throw new Error('Cannot delete built-in providers');
    }

    config.providers.splice(providerIndex, 1);
    this.saveConfig(config);
  }

  /**
   * Add a model to a provider
   */
  static addModel(providerId: string, model: LLMModel): void {
    const config = this.getConfig();
    const provider = config.providers.find(p => p.id === providerId);

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Check if model already exists
    if (provider.models.some(m => m.id === model.id)) {
      throw new Error(`Model ${model.id} already exists in provider ${providerId}`);
    }

    provider.models.push(model);
    this.saveConfig(config);
  }

  /**
   * Update a model
   */
  static updateModel(providerId: string, modelId: string, updates: Partial<LLMModel>): void {
    const config = this.getConfig();
    const provider = config.providers.find(p => p.id === providerId);

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const modelIndex = provider.models.findIndex(m => m.id === modelId);
    if (modelIndex < 0) {
      throw new Error(`Model ${modelId} not found in provider ${providerId}`);
    }

    provider.models[modelIndex] = {
      ...provider.models[modelIndex],
      ...updates,
    };

    this.saveConfig(config);
  }

  /**
   * Delete a model
   */
  static deleteModel(providerId: string, modelId: string): void {
    const config = this.getConfig();
    const provider = config.providers.find(p => p.id === providerId);

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const modelIndex = provider.models.findIndex(m => m.id === modelId);
    if (modelIndex < 0) {
      throw new Error(`Model ${modelId} not found in provider ${providerId}`);
    }

    provider.models.splice(modelIndex, 1);
    this.saveConfig(config);
  }

  /**
   * Reset to default configuration
   */
  static resetToDefault(): void {
    this.saveConfig(defaultLLMConfig);
  }

  /**
   * Get all enabled models
   */
  static getEnabledModels(): LLMModel[] {
    const config = this.getConfig();
    const models: LLMModel[] = [];

    for (const provider of config.providers) {
      if (provider.enabled) {
        models.push(...provider.models.filter(m => m.enabled));
      }
    }

    return models;
  }

  /**
   * Export configuration as JSON
   */
  static exportConfig(): string {
    const config = this.getConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  static importConfig(jsonString: string): void {
    try {
      const config = JSON.parse(jsonString) as LLMConfig;

      // Basic validation
      if (!config.providers || !Array.isArray(config.providers)) {
        throw new Error('Invalid configuration format');
      }

      this.saveConfig(config);
    } catch (error) {
      console.error('Error importing config:', error);
      throw new Error('Failed to import configuration');
    }
  }
}
