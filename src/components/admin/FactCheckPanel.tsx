'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Circle,
  Copy,
  RefreshCw,
  Loader2,
  Search
} from 'lucide-react';
import {
  FactCheckResult,
  DetailedFactCheckResult,
  QuickFactCheckResult,
  FACT_CHECK_STATUS_CONFIG,
  CLAIM_STATUS_CONFIG,
  FactCheckMode
} from '@/types/factCheck';

interface FactCheckPanelProps {
  isOpen: boolean;
  onClose: () => void;
  articleId?: string;
  title: string;
  content: string;
  sourceTitle?: string;
  sourceSummary?: string;
  sourceUrl?: string;
  initialResult?: FactCheckResult;
  onResultUpdate?: (result: FactCheckResult) => void;
}

const FactCheckPanel: React.FC<FactCheckPanelProps> = ({
  isOpen,
  onClose,
  articleId,
  title,
  content,
  sourceTitle,
  sourceSummary,
  sourceUrl,
  initialResult,
  onResultUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(initialResult || null);
  const [mode, setMode] = useState<FactCheckMode>(initialResult?.mode || 'quick');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runFactCheck = async (checkMode: FactCheckMode) => {
    setIsLoading(true);
    setError(null);
    setMode(checkMode);

    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: checkMode,
          articleId,
          title,
          content,
          sourceTitle,
          sourceSummary,
          sourceUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fact-check failed');
      }

      setResult(data);
      onResultUpdate?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReport = () => {
    if (!result) return;

    let report = `FACT-CHECK REPORT\n`;
    report += `================\n\n`;
    report += `Article: ${title}\n`;
    report += `Status: ${FACT_CHECK_STATUS_CONFIG[result.status].label}\n`;
    report += `Confidence: ${result.confidence}%\n`;
    report += `Checked: ${new Date(result.checkedAt).toLocaleString()}\n\n`;
    report += `SUMMARY\n-------\n${result.summary}\n`;

    if (result.mode === 'detailed') {
      const detailed = result as DetailedFactCheckResult;

      if (detailed.claims.length > 0) {
        report += `\nCLAIMS ANALYSIS\n---------------\n`;
        detailed.claims.forEach((claim, i) => {
          report += `${i + 1}. [${claim.status.toUpperCase()}] "${claim.text}"\n`;
          report += `   ${claim.explanation}\n\n`;
        });
      }

      if (detailed.recommendations.length > 0) {
        report += `RECOMMENDATIONS\n---------------\n`;
        detailed.recommendations.forEach((rec) => {
          report += `- ${rec}\n`;
        });
      }
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const StatusIcon = result ? {
    passed: CheckCircle,
    review_recommended: AlertTriangle,
    caution: AlertCircle,
    high_risk: XCircle,
    not_checked: Circle,
  }[result.status] : Circle;

  const ClaimIcon = (status: string) => {
    const icons = {
      verified: CheckCircle,
      unverified: AlertTriangle,
      disputed: XCircle,
      opinion: Circle,
    };
    return icons[status as keyof typeof icons] || Circle;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-lg">Fact Check</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Article Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{title}</h3>
            {sourceTitle && (
              <p className="text-xs text-gray-500 mt-1">Source: {sourceTitle}</p>
            )}
          </div>

          {/* Mode Selection (if no result yet) */}
          {!result && !isLoading && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Choose fact-check type:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => runFactCheck('quick')}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">Quick Check</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Summary assessment with pass/fail status
                  </div>
                </button>
                <button
                  onClick={() => runFactCheck('detailed')}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">Detailed Check</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Claim-by-claim analysis with recommendations
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600 mt-3">
                Running {mode === 'detailed' ? 'detailed' : 'quick'} fact-check...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => runFactCheck(mode)}
                className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 ${FACT_CHECK_STATUS_CONFIG[result.status].bgColor}`}>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-5 h-5 ${FACT_CHECK_STATUS_CONFIG[result.status].color}`} />
                  <span className={`font-semibold ${FACT_CHECK_STATUS_CONFIG[result.status].color}`}>
                    {FACT_CHECK_STATUS_CONFIG[result.status].label}
                  </span>
                  <span className="text-sm opacity-70">
                    ({result.confidence}% confidence)
                  </span>
                </div>
                <p className="text-sm mt-2 text-gray-700">{result.summary}</p>
              </div>

              {/* Detailed Claims */}
              {result.mode === 'detailed' && (result as DetailedFactCheckResult).claims.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-900">Claim Analysis</h4>
                  <div className="space-y-2">
                    {(result as DetailedFactCheckResult).claims.map((claim, index) => {
                      const ClaimStatusIcon = ClaimIcon(claim.status);
                      const claimConfig = CLAIM_STATUS_CONFIG[claim.status];
                      return (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 border-l-4"
                          style={{
                            borderLeftColor: claim.status === 'verified' ? '#16a34a'
                              : claim.status === 'unverified' ? '#ca8a04'
                              : claim.status === 'disputed' ? '#dc2626'
                              : '#3b82f6'
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <ClaimStatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${claimConfig.color}`} />
                            <div>
                              <p className="text-sm font-medium text-gray-900">"{claim.text}"</p>
                              <p className="text-xs text-gray-600 mt-1">{claim.explanation}</p>
                              <span className={`text-xs font-medium ${claimConfig.color} mt-1 inline-block`}>
                                {claimConfig.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.mode === 'detailed' && (result as DetailedFactCheckResult).recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-900">Recommendations</h4>
                  <ul className="space-y-1">
                    {(result as DetailedFactCheckResult).recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-400">
                Checked: {new Date(result.checkedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            {result && (
              <>
                <button
                  onClick={copyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Report'}
                </button>
                <button
                  onClick={() => runFactCheck(mode)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Re-run
                </button>
                {result.mode === 'quick' && (
                  <button
                    onClick={() => runFactCheck('detailed')}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Run Detailed
                  </button>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FactCheckPanel;
