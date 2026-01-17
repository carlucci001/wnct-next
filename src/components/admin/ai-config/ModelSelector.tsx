'use client';

import { ModelOption } from '@/types/aiConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Zap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModelSelectorProps {
  models: ModelOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  apiKeys?: Record<string, boolean>; // Map of API key names to whether they exist
  placeholder?: string;
  label?: string;
}

export function ModelSelector({
  models,
  value,
  onChange,
  disabled = false,
  apiKeys = {},
  placeholder = 'Select a model',
  label,
}: ModelSelectorProps) {
  const getSpeedIcon = (rating: string) => {
    switch (rating) {
      case 'fast':
        return '⚡⚡⚡';
      case 'medium':
        return '⚡⚡';
      case 'slow':
        return '⚡';
      default:
        return '';
    }
  };

  const getQualityStars = (rating: string) => {
    switch (rating) {
      case 'premium':
        return '★★★★★';
      case 'high':
        return '★★★★';
      case 'standard':
        return '★★★';
      default:
        return '';
    }
  };

  const isApiKeyAvailable = (model: ModelOption) => {
    if (model.requiresApiKey === 'none') return true;
    return apiKeys[model.requiresApiKey] === true;
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => {
            const hasApiKey = isApiKeyAvailable(model);

            return (
              <SelectItem
                key={model.model}
                value={model.model}
                disabled={!hasApiKey || model.deprecated}
                className="py-3"
              >
                <div className="flex items-start justify-between w-full gap-4">
                  {/* Left: Model name and details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {model.displayName}
                      </span>
                      {model.recommended && (
                        <Badge
                          variant="default"
                          className="bg-green-600 text-white text-xs"
                        >
                          Recommended
                        </Badge>
                      )}
                      {model.deprecated && (
                        <Badge variant="destructive" className="text-xs">
                          Deprecated
                        </Badge>
                      )}
                      {!hasApiKey && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Requires {model.requiresApiKey} to be configured
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {model.description}
                    </p>
                  </div>

                  {/* Right: Ratings and cost */}
                  <div className="text-xs text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <span>{getSpeedIcon(model.speedRating)}</span>
                      <span className="text-muted-foreground capitalize">
                        {model.speedRating}
                      </span>
                    </div>
                    <div className="text-amber-500">
                      {getQualityStars(model.qualityRating)}
                    </div>
                    <div className="text-muted-foreground font-mono">
                      ${model.costPerOperation.toFixed(4)}
                    </div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Show warning if selected model's API key is missing */}
      {value && models.find((m) => m.model === value) && !isApiKeyAvailable(models.find((m) => m.model === value)!) && (
        <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
          <AlertCircle className="w-4 h-4" />
          <span>
            API key required: Configure{' '}
            {models.find((m) => m.model === value)!.requiresApiKey} in API
            settings
          </span>
        </div>
      )}
    </div>
  );
}
