"use client";

import React, { useState, useEffect } from 'react';
import { LLMConfigManager } from '@/lib/llm-config';
import { LLMModel } from '@/types/llm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LLMSelectorProps {
  onModelChange?: (modelId: string) => void;
}

export function LLMSelector({ onModelChange }: LLMSelectorProps) {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>('');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = () => {
    const enabledModels = LLMConfigManager.getEnabledModels();
    const config = LLMConfigManager.getConfig();
    setModels(enabledModels);
    setActiveModelId(config.activeModelId);
  };

  const handleModelChange = (modelId: string) => {
    try {
      LLMConfigManager.setActiveModel(modelId);
      setActiveModelId(modelId);
      if (onModelChange) {
        onModelChange(modelId);
      }
    } catch (error) {
      console.error('Error changing model:', error);
    }
  };

  if (models.length === 0) {
    return null;
  }

  return (
    <Select value={activeModelId} onValueChange={handleModelChange}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
