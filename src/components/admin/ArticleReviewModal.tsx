'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Eye,
  Edit3,
  Save,
  Send,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { QuickFactCheckResult, FACT_CHECK_STATUS_CONFIG } from '@/types/factCheck';

export interface GeneratedArticleData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  categoryId?: string;
  tags: string[];
  imageUrl?: string;
  sourceTitle?: string;
  sourceSummary?: string;
  sourceUrl?: string;
}

interface ArticleReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: GeneratedArticleData;
  factCheckResult: QuickFactCheckResult | null;
  authorName: string;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  onEdit: () => void;
  isLoading?: boolean;
}

const ArticleReviewModal: React.FC<ArticleReviewModalProps> = ({
  isOpen,
  onClose,
  article,
  factCheckResult,
  authorName,
  onSaveDraft,
  onPublish,
  onEdit,
  isLoading = false,
}) => {
  const [actionLoading, setActionLoading] = useState<'draft' | 'publish' | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleSaveDraft = async () => {
    setActionLoading('draft');
    try {
      await onSaveDraft();
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async () => {
    setActionLoading('publish');
    try {
      await onPublish();
    } finally {
      setActionLoading(null);
    }
  };

  const StatusIcon = factCheckResult ? {
    passed: CheckCircle,
    review_recommended: AlertTriangle,
    caution: AlertCircle,
    high_risk: XCircle,
    not_checked: AlertTriangle,
  }[factCheckResult.status] : AlertTriangle;

  const statusConfig = factCheckResult
    ? FACT_CHECK_STATUS_CONFIG[factCheckResult.status]
    : FACT_CHECK_STATUS_CONFIG.not_checked;

  // Strip HTML tags for preview
  const plainContent = article.content.replace(/<[^>]*>/g, '');
  const contentPreview = plainContent.slice(0, 500);
  const hasMoreContent = plainContent.length > 500;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-lg text-gray-900">Article Generated</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || actionLoading !== null}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Article Preview */}
          <div className="space-y-4">
            {/* Image Preview */}
            {article.imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  AI Generated
                </div>
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 leading-tight">
              {article.title}
            </h3>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {article.category}
              </span>
              <span>By {authorName}</span>
              {article.tags.length > 0 && (
                <div className="flex gap-1">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {article.tags.length > 3 && (
                    <span className="text-gray-400 text-xs">+{article.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-gray-700 italic border-l-4 border-gray-200 pl-4">
                {article.excerpt}
              </p>
            )}

            {/* Content Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Content Preview</span>
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {showFullContent ? 'Show Less' : 'Show Full'}
                </button>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {showFullContent ? plainContent : contentPreview}
                {!showFullContent && hasMoreContent && '...'}
              </p>
            </div>

            {/* Source Info */}
            {article.sourceTitle && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-800 uppercase mb-1">Source Material</p>
                <p className="text-sm text-amber-900">{article.sourceTitle}</p>
                {article.sourceUrl && (
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 mt-1"
                  >
                    View Original <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Fact Check Results */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Quick Fact Check
            </h4>

            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Running fact-check...</span>
              </div>
            ) : factCheckResult ? (
              <div className={`rounded-lg p-4 ${statusConfig.bgColor}`}>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                  <span className={`font-semibold ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  <span className={`text-sm ${statusConfig.color} opacity-70`}>
                    ({factCheckResult.confidence}% confidence)
                  </span>
                </div>
                <p className="text-sm mt-2 text-gray-700">{factCheckResult.summary}</p>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-gray-600 text-sm">
                Fact-check not available
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onEdit}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Edit3 className="w-4 h-4" />
            Edit First
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading === 'draft' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading === 'publish' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleReviewModal;
