'use client';

import { useState } from 'react';
import { AIFeatureConfig, ModelOption, AIFeatureKey } from '@/types/aiConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ModelSelector } from './ModelSelector';
import { RefreshCw, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface FeatureConfigCardProps {
  featureKey: AIFeatureKey;
  displayName: string;
  description: string;
  icon: string;
  config: AIFeatureConfig;
  availableModels: ModelOption[];
  onConfigChange: (config: AIFeatureConfig) => void;
  onTest: () => Promise<void>;
  apiKeys: Record<string, boolean>;
  testing?: boolean;
}

export function FeatureConfigCard({
  featureKey,
  displayName,
  description,
  icon,
  config,
  availableModels,
  onConfigChange,
  onTest,
  apiKeys,
  testing = false,
}: FeatureConfigCardProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Get the icon component dynamically
  const IconComponent = (Icons as any)[icon] || Icons.Bot;

  // Get primary and fallback models
  const primaryModels = availableModels;
  const fallbackModels = availableModels.filter((m) => m.model !== config.primaryModel);

  const handlePrimaryModelChange = (model: string) => {
    onConfigChange({
      ...config,
      primaryModel: model,
      primaryProvider: availableModels.find((m) => m.model === model)?.provider || config.primaryProvider,
    });
  };

  const handleFallbackModelChange = (model: string) => {
    if (model === 'none') {
      onConfigChange({
        ...config,
        fallbackModel: undefined,
        fallbackProvider: undefined,
      });
    } else {
      onConfigChange({
        ...config,
        fallbackModel: model,
        fallbackProvider: availableModels.find((m) => m.model === model)?.provider,
      });
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={testing || !config.enabled}
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <Label htmlFor={`${featureKey}-enabled`} className="cursor-pointer">
            Enable this feature
          </Label>
          <Switch
            id={`${featureKey}-enabled`}
            checked={config.enabled}
            onCheckedChange={(enabled) => onConfigChange({ ...config, enabled })}
          />
        </div>

        {config.enabled && (
          <>
            {/* Primary Model Selection */}
            <ModelSelector
              label="Primary Model"
              models={primaryModels}
              value={config.primaryModel}
              onChange={handlePrimaryModelChange}
              apiKeys={apiKeys}
              placeholder="Select primary model"
            />

            {/* Fallback Model Selection */}
            <ModelSelector
              label="Fallback Model (Optional)"
              models={[
                {
                  provider: 'none' as any,
                  model: 'none',
                  displayName: 'No Fallback',
                  description: 'Do not use a fallback model',
                  costPerOperation: 0,
                  speedRating: 'fast',
                  qualityRating: 'standard',
                  recommended: false,
                  requiresApiKey: 'none',
                },
                ...fallbackModels,
              ]}
              value={config.fallbackModel || 'none'}
              onChange={handleFallbackModelChange}
              apiKeys={apiKeys}
              placeholder="Select fallback model"
            />

            {/* Advanced Settings */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Settings2 className="w-4 h-4" />
                <span>Advanced Settings</span>
                {advancedOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 pt-4 border-t">
                {/* Temperature */}
                {config.temperature !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${featureKey}-temp`}>
                        Temperature
                      </Label>
                      <span className="text-sm text-muted-foreground font-mono">
                        {config.temperature}
                      </span>
                    </div>
                    <Input
                      id={`${featureKey}-temp`}
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower = more consistent, Higher = more creative
                    </p>
                  </div>
                )}

                {/* Max Tokens */}
                {config.maxTokens !== undefined && (
                  <div className="space-y-2">
                    <Label htmlFor={`${featureKey}-tokens`}>
                      Max Tokens
                    </Label>
                    <Input
                      id={`${featureKey}-tokens`}
                      type="number"
                      min="10"
                      max="4000"
                      step="10"
                      value={config.maxTokens}
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          maxTokens: parseInt(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum length of generated content
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}
