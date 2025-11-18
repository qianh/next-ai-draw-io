"use client";

import React, { useState, useEffect } from 'react';
import { LLMConfig, LLMProviderConfig, LLMModel, LLMProvider } from '@/types/llm';
import { LLMConfigManager } from '@/lib/llm-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings, Plus, Trash2, Download, Upload, RotateCcw, Edit, Key, Check, X } from 'lucide-react';

export function LLMManagement() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [activeTab, setActiveTab] = useState('providers');

  // Provider editing state
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState({
    id: '',
    name: '',
    provider: 'custom' as LLMProvider,
    baseUrl: '',
    apiKey: '',
  });

  // Custom model form state
  const [editingModel, setEditingModel] = useState<{ providerId: string; modelId: string } | null>(null);
  const [modelForm, setModelForm] = useState({
    providerId: '',
    id: '',
    name: '',
    modelId: '',
    description: '',
  });

  useEffect(() => {
    // Load config immediately on mount
    loadConfig();
  }, []);

  useEffect(() => {
    // Reload config when dialog opens
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = () => {
    const currentConfig = LLMConfigManager.getConfig();
    setConfig(currentConfig);
  };

  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    if (!config) return;

    try {
      LLMConfigManager.updateProvider(providerId, { enabled });
      loadConfig();
    } catch (error) {
      console.error('Error updating provider:', error);
      alert('Failed to update provider');
    }
  };

  const handleToggleModel = (providerId: string, modelId: string, enabled: boolean) => {
    try {
      LLMConfigManager.updateModel(providerId, modelId, { enabled });
      loadConfig();
    } catch (error) {
      console.error('Error updating model:', error);
      alert('Failed to update model');
    }
  };

  const handleSetActiveModel = (modelId: string) => {
    try {
      LLMConfigManager.setActiveModel(modelId);
      loadConfig();
    } catch (error) {
      console.error('Error setting active model:', error);
      alert('Failed to set active model');
    }
  };

  const startEditProvider = (provider?: LLMProviderConfig) => {
    if (provider) {
      setProviderForm({
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        baseUrl: provider.baseUrl || '',
        apiKey: provider.apiKey || '',
      });
      setEditingProvider(provider.id);
    } else {
      setProviderForm({
        id: '',
        name: '',
        provider: 'custom',
        baseUrl: '',
        apiKey: '',
      });
      setEditingProvider('new');
    }
  };

  const cancelEditProvider = () => {
    setEditingProvider(null);
    setProviderForm({
      id: '',
      name: '',
      provider: 'custom',
      baseUrl: '',
      apiKey: '',
    });
  };

  const saveProvider = () => {
    if (!providerForm.id || !providerForm.name) {
      alert('Please fill in required fields (ID and Name)');
      return;
    }

    try {
      if (editingProvider === 'new') {
        // Add new provider
        const provider: LLMProviderConfig = {
          id: providerForm.id,
          name: providerForm.name,
          provider: providerForm.provider,
          baseUrl: providerForm.baseUrl || undefined,
          apiKey: providerForm.apiKey || undefined,
          models: [],
          enabled: true,
          isCustom: true,
        };
        LLMConfigManager.addProvider(provider);
      } else {
        // Update existing provider
        LLMConfigManager.updateProvider(editingProvider!, {
          name: providerForm.name,
          baseUrl: providerForm.baseUrl || undefined,
          apiKey: providerForm.apiKey || undefined,
        });
      }

      cancelEditProvider();
      loadConfig();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      alert(error.message || 'Failed to save provider');
    }
  };

  const handleDeleteProvider = (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider? All its models will be deleted too.')) {
      return;
    }

    try {
      LLMConfigManager.deleteProvider(providerId);
      loadConfig();
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      alert(error.message || 'Cannot delete built-in providers');
    }
  };

  const startEditModel = (providerId: string, model?: LLMModel) => {
    if (model) {
      setModelForm({
        providerId,
        id: model.id,
        name: model.name,
        modelId: model.modelId,
        description: model.description || '',
      });
      setEditingModel({ providerId, modelId: model.id });
    } else {
      setModelForm({
        providerId,
        id: '',
        name: '',
        modelId: '',
        description: '',
      });
      setEditingModel({ providerId, modelId: 'new' });
    }
  };

  const cancelEditModel = () => {
    setEditingModel(null);
    setModelForm({
      providerId: '',
      id: '',
      name: '',
      modelId: '',
      description: '',
    });
  };

  const saveModel = () => {
    if (!modelForm.id || !modelForm.name || !modelForm.modelId || !modelForm.providerId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const provider = config?.providers.find(p => p.id === modelForm.providerId);
      if (!provider) {
        alert('Provider not found');
        return;
      }

      if (editingModel?.modelId === 'new') {
        // Add new model
        const model: LLMModel = {
          id: modelForm.id,
          name: modelForm.name,
          provider: provider.provider,
          modelId: modelForm.modelId,
          description: modelForm.description,
          supportsVision: true,
          supportsTools: true,
          enabled: true,
        };
        LLMConfigManager.addModel(modelForm.providerId, model);
      } else {
        // Update existing model
        LLMConfigManager.updateModel(modelForm.providerId, editingModel!.modelId, {
          name: modelForm.name,
          modelId: modelForm.modelId,
          description: modelForm.description,
        });
      }

      cancelEditModel();
      loadConfig();
    } catch (error: any) {
      console.error('Error saving model:', error);
      alert(error.message || 'Failed to save model');
    }
  };

  const handleDeleteModel = (providerId: string, modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }

    try {
      LLMConfigManager.deleteModel(providerId, modelId);
      loadConfig();
    } catch (error: any) {
      console.error('Error deleting model:', error);
      alert(error.message || 'Failed to delete model');
    }
  };

  const handleExport = () => {
    const json = LLMConfigManager.exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llm-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          LLMConfigManager.importConfig(json);
          loadConfig();
          alert('Configuration imported successfully');
        } catch (error) {
          console.error('Error importing config:', error);
          alert('Failed to import configuration');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (!confirm('Are you sure you want to reset to default configuration? This will delete all custom providers and models.')) {
      return;
    }

    LLMConfigManager.resetToDefault();
    loadConfig();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="LLM Settings" className="gap-2">
          <Settings className="h-4 w-4" />
          <span>LLM Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        {!config ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading configuration...</p>
          </div>
        ) : (
          <>
        <DialogHeader>
          <DialogTitle>LLM Provider Management</DialogTitle>
          <DialogDescription>
            Configure AI model providers, API keys, and available models
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">Providers & Keys</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="settings">Import/Export</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">LLM Providers</h3>
                <p className="text-sm text-gray-500">Manage provider API keys and configurations</p>
              </div>
              <Button onClick={() => startEditProvider()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Provider
              </Button>
            </div>

            <div className="space-y-3">
              {config.providers.map(provider => (
                <Card key={provider.id} className={!provider.enabled ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{provider.name}</CardTitle>
                          {provider.isCustom && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Custom</span>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          <div className="space-y-1 text-xs">
                            <div>Provider ID: <code className="bg-gray-100 px-1 rounded">{provider.id}</code></div>
                            {provider.baseUrl && (
                              <div>Base URL: <code className="bg-gray-100 px-1 rounded">{provider.baseUrl}</code></div>
                            )}
                            <div className="flex items-center gap-2">
                              <Key className="h-3 w-3" />
                              <span>
                                {provider.apiKey
                                  ? 'API Key: Configured ✓'
                                  : 'API Key: Using environment variable'}
                              </span>
                            </div>
                            <div>{provider.models.length} model(s) configured</div>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditProvider(provider)}
                          title="Edit provider"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {provider.isCustom && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProvider(provider.id)}
                            title="Delete provider"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {editingProvider && (
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle>{editingProvider === 'new' ? 'Add New Provider' : 'Edit Provider'}</CardTitle>
                  <CardDescription>
                    {editingProvider === 'new'
                      ? 'Configure a new LLM provider with API credentials'
                      : 'Update provider configuration and API key'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Provider ID *</Label>
                      <Input
                        value={providerForm.id}
                        onChange={(e) => setProviderForm({ ...providerForm, id: e.target.value })}
                        placeholder="e.g., my-openai"
                        disabled={editingProvider !== 'new'}
                      />
                      <p className="text-xs text-gray-500 mt-1">Unique identifier, cannot be changed after creation</p>
                    </div>
                    <div>
                      <Label>Provider Name *</Label>
                      <Input
                        value={providerForm.name}
                        onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                        placeholder="e.g., My OpenAI Account"
                      />
                      <p className="text-xs text-gray-500 mt-1">Display name for this provider</p>
                    </div>
                  </div>

                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={providerForm.apiKey}
                      onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                      placeholder="sk-..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your API key. Leave empty to use environment variables (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, etc.)
                    </p>
                  </div>

                  <div>
                    <Label>Base URL (Optional)</Label>
                    <Input
                      value={providerForm.baseUrl}
                      onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value })}
                      placeholder="https://api.openai.com/v1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Custom API endpoint. For OpenAI-compatible APIs only.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="font-semibold mb-1">Provider Types:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>bedrock</strong>: AWS Bedrock (uses AWS credentials from env)</li>
                      <li><strong>openai</strong>: OpenAI GPT models</li>
                      <li><strong>google</strong>: Google Gemini models</li>
                      <li><strong>openrouter</strong>: OpenRouter proxy service</li>
                      <li><strong>custom</strong>: OpenAI-compatible API (requires Base URL)</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelEditProvider}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={saveProvider}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Provider
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="models" className="space-y-4 mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Available Models</h3>
              <p className="text-sm text-gray-500">Manage and configure models for each provider</p>
            </div>

            <div className="space-y-6">
              {config.providers.map(provider => (
                <div key={provider.id} className={!provider.enabled ? 'opacity-50' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">{provider.name}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditModel(provider.id)}
                      disabled={!provider.enabled}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Model
                    </Button>
                  </div>

                  {provider.models.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-sm text-gray-500">
                        No models configured. Click "Add Model" to add one.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {provider.models.map(model => (
                        <Card key={model.id} className={model.id === config.activeModelId ? 'border-blue-500 border-2' : ''}>
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium">{model.name}</h5>
                                  {model.id === config.activeModelId && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Active</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Model ID: <code className="bg-gray-100 px-1 rounded">{model.modelId}</code>
                                </p>
                                {model.description && (
                                  <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={model.enabled}
                                  onCheckedChange={(checked) => handleToggleModel(provider.id, model.id, checked)}
                                />
                                {model.id === config.activeModelId ? (
                                  <Button size="sm" variant="default" disabled>Active</Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSetActiveModel(model.id)}
                                    disabled={!model.enabled || !provider.enabled}
                                  >
                                    Use
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditModel(provider.id, model)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {provider.isCustom && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteModel(provider.id, model.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {editingModel && (
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle>{editingModel.modelId === 'new' ? 'Add New Model' : 'Edit Model'}</CardTitle>
                  <CardDescription>Configure model details and display name</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Model ID (Unique) *</Label>
                      <Input
                        value={modelForm.id}
                        onChange={(e) => setModelForm({ ...modelForm, id: e.target.value })}
                        placeholder="e.g., my-gpt4"
                        disabled={editingModel.modelId !== 'new'}
                      />
                      <p className="text-xs text-gray-500 mt-1">Internal identifier</p>
                    </div>
                    <div>
                      <Label>Display Name *</Label>
                      <Input
                        value={modelForm.name}
                        onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                        placeholder="e.g., GPT-4 Turbo"
                      />
                      <p className="text-xs text-gray-500 mt-1">Name shown in UI</p>
                    </div>
                  </div>

                  <div>
                    <Label>Provider Model ID *</Label>
                    <Input
                      value={modelForm.modelId}
                      onChange={(e) => setModelForm({ ...modelForm, modelId: e.target.value })}
                      placeholder="e.g., gpt-4-turbo or anthropic.claude-v2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The actual model identifier used by the provider API
                    </p>
                  </div>

                  <div>
                    <Label>Description (Optional)</Label>
                    <Input
                      value={modelForm.description}
                      onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                      placeholder="e.g., Fast and cost-effective model"
                    />
                  </div>

                  <div className="bg-yellow-50 p-3 rounded text-sm">
                    <p className="font-semibold mb-1">Common Model IDs:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo</li>
                      <li>Bedrock: anthropic.claude-v2, anthropic.claude-sonnet-4-*</li>
                      <li>Google: gemini-2.5-pro, gemini-2.5-flash</li>
                      <li>OpenRouter: anthropic/claude-sonnet-4-5, openai/gpt-4o</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelEditModel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={saveModel}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Model
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Management</CardTitle>
                <CardDescription>Import, export, or reset your LLM configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleExport} variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration (JSON)
                </Button>
                <Button onClick={handleImport} variant="outline" className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Configuration
                </Button>
                <Button onClick={handleReset} variant="destructive" className="w-full justify-start">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default Configuration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Active Model:</div>
                    <div><code className="bg-gray-100 px-2 py-1 rounded">{config.activeModelId}</code></div>

                    <div className="font-medium">Total Providers:</div>
                    <div>{config.providers.length}</div>

                    <div className="font-medium">Enabled Providers:</div>
                    <div>{config.providers.filter(p => p.enabled).length}</div>

                    <div className="font-medium">Total Models:</div>
                    <div>{config.providers.reduce((acc, p) => acc + p.models.length, 0)}</div>

                    <div className="font-medium">Custom Providers:</div>
                    <div>{config.providers.filter(p => p.isCustom).length}</div>

                    <div className="font-medium">Last Updated:</div>
                    <div>{new Date(config.lastUpdated).toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">Environment Variables</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="font-medium">To use environment variables instead of storing keys in the browser:</p>
                <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                  <li><code>OPENAI_API_KEY</code> - For OpenAI provider</li>
                  <li><code>GOOGLE_GENERATIVE_AI_API_KEY</code> - For Google Gemini</li>
                  <li><code>AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION</code> - For AWS Bedrock</li>
                  <li><code>OPENROUTER_API_KEY</code> - For OpenRouter</li>
                  <li><code>CUSTOM_API_KEY</code> - For custom providers</li>
                </ul>
                <p className="text-xs mt-2 text-gray-600">
                  API keys set in the UI will override environment variables for that specific provider.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
