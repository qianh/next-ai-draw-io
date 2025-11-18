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
import { Settings, Plus, Trash2, Download, Upload, RotateCcw } from 'lucide-react';

export function LLMManagement() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [activeTab, setActiveTab] = useState('models');

  // Custom provider form state
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    id: '',
    name: '',
    baseUrl: '',
    apiKey: '',
  });

  // Custom model form state
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [newModel, setNewModel] = useState({
    id: '',
    name: '',
    modelId: '',
    description: '',
  });

  useEffect(() => {
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

  const handleAddCustomProvider = () => {
    if (!newProvider.id || !newProvider.name) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const provider: LLMProviderConfig = {
        id: newProvider.id,
        name: newProvider.name,
        provider: 'custom',
        baseUrl: newProvider.baseUrl,
        apiKey: newProvider.apiKey || undefined,
        models: [],
        enabled: true,
        isCustom: true,
      };

      LLMConfigManager.addProvider(provider);
      setShowAddProvider(false);
      setNewProvider({ id: '', name: '', baseUrl: '', apiKey: '' });
      loadConfig();
    } catch (error: any) {
      console.error('Error adding provider:', error);
      alert(error.message || 'Failed to add provider');
    }
  };

  const handleAddCustomModel = () => {
    if (!selectedProviderId || !newModel.id || !newModel.name || !newModel.modelId) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const provider = config?.providers.find(p => p.id === selectedProviderId);
      if (!provider) {
        alert('Provider not found');
        return;
      }

      const model: LLMModel = {
        id: newModel.id,
        name: newModel.name,
        provider: provider.provider,
        modelId: newModel.modelId,
        description: newModel.description,
        supportsVision: true,
        supportsTools: true,
        enabled: true,
      };

      LLMConfigManager.addModel(selectedProviderId, model);
      setShowAddModel(false);
      setNewModel({ id: '', name: '', modelId: '', description: '' });
      setSelectedProviderId('');
      loadConfig();
    } catch (error: any) {
      console.error('Error adding model:', error);
      alert(error.message || 'Failed to add model');
    }
  };

  const handleDeleteProvider = (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) {
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

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLM Management</DialogTitle>
          <DialogDescription>
            Manage your AI model providers and configurations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Available Models</h3>
              <Button onClick={() => setShowAddModel(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </div>

            <div className="space-y-4">
              {config.providers.map(provider => (
                provider.enabled && provider.models.length > 0 && (
                  <div key={provider.id}>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">{provider.name}</h4>
                    <div className="space-y-2">
                      {provider.models.map(model => (
                        <Card key={model.id} className={model.id === config.activeModelId ? 'border-blue-500' : ''}>
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base">{model.name}</CardTitle>
                                <CardDescription className="text-sm">{model.description || model.modelId}</CardDescription>
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
                                    disabled={!model.enabled}
                                  >
                                    Use
                                  </Button>
                                )}
                                {provider.isCustom && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteModel(provider.id, model.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>

            {showAddModel && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Custom Model</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Provider</Label>
                    <select
                      className="w-full mt-1 p-2 border rounded"
                      value={selectedProviderId}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                    >
                      <option value="">Select a provider</option>
                      {config.providers.map(provider => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Model ID (unique)</Label>
                    <Input
                      value={newModel.id}
                      onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                      placeholder="e.g., my-custom-model"
                    />
                  </div>
                  <div>
                    <Label>Model Name</Label>
                    <Input
                      value={newModel.name}
                      onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                      placeholder="e.g., My Custom Model"
                    />
                  </div>
                  <div>
                    <Label>Provider Model ID</Label>
                    <Input
                      value={newModel.modelId}
                      onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                      placeholder="e.g., gpt-4o"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Input
                      value={newModel.description}
                      onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                      placeholder="Model description"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddModel(false)}>Cancel</Button>
                  <Button onClick={handleAddCustomModel}>Add Model</Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Providers</h3>
              <Button onClick={() => setShowAddProvider(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>

            <div className="space-y-2">
              {config.providers.map(provider => (
                <Card key={provider.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{provider.name}</CardTitle>
                        <CardDescription>
                          {provider.models.length} models
                          {provider.isCustom && ' (Custom)'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                        />
                        {provider.isCustom && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProvider(provider.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {showAddProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Custom Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Provider ID (unique)</Label>
                    <Input
                      value={newProvider.id}
                      onChange={(e) => setNewProvider({ ...newProvider, id: e.target.value })}
                      placeholder="e.g., my-provider"
                    />
                  </div>
                  <div>
                    <Label>Provider Name</Label>
                    <Input
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                      placeholder="e.g., My Custom Provider"
                    />
                  </div>
                  <div>
                    <Label>Base URL (optional)</Label>
                    <Input
                      value={newProvider.baseUrl}
                      onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                      placeholder="e.g., https://api.example.com/v1"
                    />
                  </div>
                  <div>
                    <Label>API Key (optional)</Label>
                    <Input
                      type="password"
                      value={newProvider.apiKey}
                      onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                      placeholder="Your API key"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddProvider(false)}>Cancel</Button>
                  <Button onClick={handleAddCustomProvider}>Add Provider</Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Management</CardTitle>
                <CardDescription>Import, export, or reset your configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleExport} variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
                <Button onClick={handleImport} variant="outline" className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Configuration
                </Button>
                <Button onClick={handleReset} variant="destructive" className="w-full justify-start">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><strong>Active Model:</strong> {config.activeModelId}</p>
                  <p><strong>Total Providers:</strong> {config.providers.length}</p>
                  <p><strong>Enabled Providers:</strong> {config.providers.filter(p => p.enabled).length}</p>
                  <p><strong>Total Models:</strong> {config.providers.reduce((acc, p) => acc + p.models.length, 0)}</p>
                  <p><strong>Last Updated:</strong> {new Date(config.lastUpdated).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
