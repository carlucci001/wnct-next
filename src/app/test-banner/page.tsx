'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

export default function TestBannerPage() {
  const [businessSource, setBusinessSource] = useState<'url' | 'directory'>('url');
  const [businessUrl, setBusinessUrl] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/advertise/generate-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessSource,
          businessUrl: businessSource === 'url' ? businessUrl : undefined,
          businessId: businessSource === 'directory' ? businessId : undefined,
          regenerate: false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to generate banner');
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate banner');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/advertise/generate-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessSource,
          businessUrl: businessSource === 'url' ? businessUrl : undefined,
          businessId: businessSource === 'directory' ? businessId : undefined,
          regenerate: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to regenerate banner');
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate banner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">AI Banner Generator Test</h1>
      <p className="text-muted-foreground mb-8">
        Test the AI-powered banner generation using Gemini + DALL-E 3 for advertiser onboarding
      </p>

      <div className="grid gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Provide a business website URL or directory ID to analyze and generate a banner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Source</Label>
              <RadioGroup
                value={businessSource}
                onValueChange={(value) => setBusinessSource(value as 'url' | 'directory')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url" />
                  <Label htmlFor="url" className="font-normal cursor-pointer">
                    Website URL
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="directory" id="directory" />
                  <Label htmlFor="directory" className="font-normal cursor-pointer">
                    Directory Business ID
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {businessSource === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="businessUrl">Business Website URL</Label>
                <Input
                  id="businessUrl"
                  type="url"
                  placeholder="https://example.com or example.com"
                  value={businessUrl}
                  onChange={(e) => setBusinessUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Try: asheville.com, biltmore.com, or any local business website
                </p>
              </div>
            )}

            {businessSource === 'directory' && (
              <div className="space-y-2">
                <Label htmlFor="businessId">Business ID from Directory</Label>
                <Input
                  id="businessId"
                  type="text"
                  placeholder="Firestore document ID"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading || (businessSource === 'url' && !businessUrl) || (businessSource === 'directory' && !businessId)}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Banner
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            {/* Business Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Business Analysis</CardTitle>
                <CardDescription>Extracted information from the source</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-semibold">Business Name</dt>
                    <dd className="text-muted-foreground">{result.analysis.businessName}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Industry</dt>
                    <dd className="text-muted-foreground">{result.analysis.industry}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-semibold">Description</dt>
                    <dd className="text-muted-foreground">{result.analysis.description}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Brand Colors</dt>
                    <dd className="flex gap-2">
                      {result.analysis.colors.map((color: string) => (
                        <div
                          key={color}
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Keywords</dt>
                    <dd className="text-muted-foreground">{result.analysis.keywords.join(', ')}</dd>
                  </div>
                  {result.analysis.logoUrl && (
                    <div className="col-span-2">
                      <dt className="font-semibold">Logo</dt>
                      <dd className="text-muted-foreground text-xs break-all">{result.analysis.logoUrl}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Generated Banner */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Banner</CardTitle>
                <CardDescription>AI-generated advertising banner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={result.imageData}
                    alt="Generated Banner"
                    className="w-full h-auto"
                  />
                </div>

                <Button onClick={handleRegenerate} disabled={loading} variant="outline" className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Regenerate (New Variation)
                </Button>

                <details className="text-sm">
                  <summary className="font-semibold cursor-pointer">View Gemini Prompt</summary>
                  <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto text-xs whitespace-pre-wrap">
                    {result.prompt}
                  </pre>
                </details>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
