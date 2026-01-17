'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AIConfigSettings, AIFeatureKey, AIFeatureConfig } from '@/types/aiConfig';
import { getDefaultAIConfigs } from '@/lib/aiConfigService';
import {
  MODEL_RECOMMENDATIONS,
  FEATURE_METADATA,
  getFeaturesByCategory,
} from '@/data/aiModelRecommendations';
import { FeatureConfigCard } from './ai-config/FeatureConfigCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

type CategoryType = 'content' | 'quality' | 'media' | 'engagement' | 'research';

export default function AIConfigurator() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<CategoryType>('content');
  const [config, setConfig] = useState<AIConfigSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingFeature, setTestingFeature] = useState<AIFeatureKey | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, boolean>>({});

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // Load existing config from Firestore
      const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
      const settings = settingsDoc.data();

      // Check which API keys are configured
      const keys: Record<string, boolean> = {
        geminiApiKey: Boolean(settings?.geminiApiKey),
        claudeCodeApiKey: Boolean(settings?.claudeCodeApiKey),
        openaiApiKey: Boolean(settings?.openaiApiKey),
        perplexityApiKey: Boolean(settings?.perplexityApiKey),
        elevenLabsApiKey: Boolean(settings?.elevenLabsApiKey),
        pexelsApiKey: Boolean(settings?.pexelsApiKey),
      };
      setApiKeys(keys);

      // Use existing config or create from defaults
      if (settings?.aiConfig) {
        setConfig(settings.aiConfig as AIConfigSettings);
      } else {
        const defaults = getDefaultAIConfigs();
        setConfig({
          ...defaults,
          lastUpdated: new Date().toISOString(),
          updatedBy: user?.uid || 'system',
        } as AIConfigSettings);
      }
    } catch (error) {
      console.error('Failed to load AI configuration:', error);
      toast.error('Failed to load AI configuration. Using defaults.');

      const defaults = getDefaultAIConfigs();
      setConfig({
        ...defaults,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.uid || 'system',
      } as AIConfigSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (featureKey: AIFeatureKey, newConfig: AIFeatureConfig) => {
    if (!config) return;
    setConfig({
      ...config,
      [featureKey]: newConfig,
    });
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      // Update metadata
      const updatedConfig = {
        ...config,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.uid || 'system',
      };

      // Save to Firestore
      const settingsRef = doc(getDb(), 'settings', 'config');
      await setDoc(
        settingsRef,
        {
          aiConfig: updatedConfig,
        },
        { merge: true }
      );

      setConfig(updatedConfig);

      toast.success('AI configuration has been saved successfully.');
    } catch (error) {
      console.error('Failed to save AI configuration:', error);
      toast.error('Failed to save AI configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (featureKey: AIFeatureKey) => {
    setTestingFeature(featureKey);
    try {
      const featureConfig = config?.[featureKey];
      if (!featureConfig) return;

      const response = await fetch('/api/admin/test-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: featureKey,
          config: featureConfig,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${FEATURE_METADATA[featureKey].displayName} Test Passed - Response time: ${result.responseTime}ms | Cost: $${result.cost?.toFixed(4) || '0.0000'}`);
      } else {
        toast.error(`${FEATURE_METADATA[featureKey].displayName} Test Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to test configuration');
    } finally {
      setTestingFeature(null);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default configuration? This cannot be undone.')) {
      const defaults = getDefaultAIConfigs();
      setConfig({
        ...defaults,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.uid || 'system',
      } as AIConfigSettings);
      toast.success('Configuration has been reset to defaults.');
    }
  };

  const calculateEstimatedCost = () => {
    if (!config) return 0;
    // Simple estimation - would be more sophisticated with usage stats
    let total = 0;
    Object.entries(config).forEach(([key, featureConfig]) => {
      if (key === 'lastUpdated' || key === 'updatedBy' || key === 'costLimit') return;
      if (featureConfig.enabled) {
        const models = MODEL_RECOMMENDATIONS[key as AIFeatureKey];
        const model = models?.find((m) => m.model === featureConfig.primaryModel);
        if (model) {
          // Estimate 100 operations per month per feature
          total += model.costPerOperation * 100;
        }
      }
    });
    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load configuration</p>
      </div>
    );
  }

  const estimatedMonthlyCost = calculateEstimatedCost();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master AI Configurator</h1>
          <p className="text-muted-foreground">
            Configure AI models for each feature across your platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <CheckCircle size={14} className="mr-1" /> Auto-Save Enabled
          </Badge>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="animate-spin mr-2" size={16} />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Cost Estimate Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Estimated Monthly Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">
              ${estimatedMonthlyCost.toFixed(2)}
            </span>
            <span className="text-muted-foreground text-sm">
              / month (estimated based on 100 ops per feature)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Actual costs will vary based on usage. This is an estimate only.
          </p>
        </CardContent>
      </Card>

      {/* Tabs for Feature Categories */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryType)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content">Content Generation</TabsTrigger>
          <TabsTrigger value="quality">Quality Assurance</TabsTrigger>
          <TabsTrigger value="media">Media Generation</TabsTrigger>
          <TabsTrigger value="engagement">Reader Engagement</TabsTrigger>
          <TabsTrigger value="research">Research & Data</TabsTrigger>
        </TabsList>

        {/* Content Generation Tab */}
        <TabsContent value="content" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {getFeaturesByCategory('content').map((featureKey) => (
              <FeatureConfigCard
                key={featureKey}
                featureKey={featureKey}
                displayName={FEATURE_METADATA[featureKey].displayName}
                description={FEATURE_METADATA[featureKey].description}
                icon={FEATURE_METADATA[featureKey].icon}
                config={config[featureKey]}
                availableModels={MODEL_RECOMMENDATIONS[featureKey]}
                onConfigChange={(newConfig) => handleConfigChange(featureKey, newConfig)}
                onTest={() => handleTest(featureKey)}
                apiKeys={apiKeys}
                testing={testingFeature === featureKey}
              />
            ))}
          </div>
        </TabsContent>

        {/* Quality Assurance Tab */}
        <TabsContent value="quality" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {getFeaturesByCategory('quality').map((featureKey) => (
              <FeatureConfigCard
                key={featureKey}
                featureKey={featureKey}
                displayName={FEATURE_METADATA[featureKey].displayName}
                description={FEATURE_METADATA[featureKey].description}
                icon={FEATURE_METADATA[featureKey].icon}
                config={config[featureKey]}
                availableModels={MODEL_RECOMMENDATIONS[featureKey]}
                onConfigChange={(newConfig) => handleConfigChange(featureKey, newConfig)}
                onTest={() => handleTest(featureKey)}
                apiKeys={apiKeys}
                testing={testingFeature === featureKey}
              />
            ))}
          </div>
        </TabsContent>

        {/* Media Generation Tab */}
        <TabsContent value="media" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {getFeaturesByCategory('media').map((featureKey) => (
              <FeatureConfigCard
                key={featureKey}
                featureKey={featureKey}
                displayName={FEATURE_METADATA[featureKey].displayName}
                description={FEATURE_METADATA[featureKey].description}
                icon={FEATURE_METADATA[featureKey].icon}
                config={config[featureKey]}
                availableModels={MODEL_RECOMMENDATIONS[featureKey]}
                onConfigChange={(newConfig) => handleConfigChange(featureKey, newConfig)}
                onTest={() => handleTest(featureKey)}
                apiKeys={apiKeys}
                testing={testingFeature === featureKey}
              />
            ))}
          </div>
        </TabsContent>

        {/* Reader Engagement Tab */}
        <TabsContent value="engagement" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {getFeaturesByCategory('engagement').map((featureKey) => (
              <FeatureConfigCard
                key={featureKey}
                featureKey={featureKey}
                displayName={FEATURE_METADATA[featureKey].displayName}
                description={FEATURE_METADATA[featureKey].description}
                icon={FEATURE_METADATA[featureKey].icon}
                config={config[featureKey]}
                availableModels={MODEL_RECOMMENDATIONS[featureKey]}
                onConfigChange={(newConfig) => handleConfigChange(featureKey, newConfig)}
                onTest={() => handleTest(featureKey)}
                apiKeys={apiKeys}
                testing={testingFeature === featureKey}
              />
            ))}
          </div>
        </TabsContent>

        {/* Research & Data Tab */}
        <TabsContent value="research" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {getFeaturesByCategory('research').map((featureKey) => (
              <FeatureConfigCard
                key={featureKey}
                featureKey={featureKey}
                displayName={FEATURE_METADATA[featureKey].displayName}
                description={FEATURE_METADATA[featureKey].description}
                icon={FEATURE_METADATA[featureKey].icon}
                config={config[featureKey]}
                availableModels={MODEL_RECOMMENDATIONS[featureKey]}
                onConfigChange={(newConfig) => handleConfigChange(featureKey, newConfig)}
                onTest={() => handleTest(featureKey)}
                apiKeys={apiKeys}
                testing={testingFeature === featureKey}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-purple-50/50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-purple-900">Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-purple-800 space-y-2 list-disc list-inside">
            <li>
              <strong>Test Before Saving:</strong> Use the Test button to verify each model works with your API keys
            </li>
            <li>
              <strong>Configure Fallbacks:</strong> Set fallback models to ensure continuous operation if primary fails
            </li>
            <li>
              <strong>Monitor Costs:</strong> Check estimated monthly costs and adjust models to fit your budget
            </li>
            <li>
              <strong>Start with Recommendations:</strong> Recommended models are optimized for cost and quality
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
