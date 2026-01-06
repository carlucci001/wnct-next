'use client';

import { useState, useEffect } from 'react';
import {
  Edit, Save, RotateCcw, Lightbulb, Copy, Check, ChevronDown, ChevronUp,
  Sparkles, AlertCircle, Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  AgentPromptData,
  getAgentPrompt,
  updateAgentPrompt,
  resetAgentPrompt,
  PROMPT_BUILDING_TIPS,
  PROMPT_TEMPLATES,
} from '@/lib/agentPrompts';
import { AgentType, AGENT_PROMPTS } from '@/data/prompts';

interface AgentPromptEditorProps {
  agentType: AgentType;
  userId: string;
  onSave?: () => void;
}

export default function AgentPromptEditor({ agentType, userId, onSave }: AgentPromptEditorProps) {
  const [prompt, setPrompt] = useState<AgentPromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInstruction, setEditedInstruction] = useState('');
  const [editedLabel, setEditedLabel] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedTip, setCopiedTip] = useState<number | null>(null);

  useEffect(() => {
    loadPrompt();
  }, [agentType]);

  async function loadPrompt() {
    setLoading(true);
    try {
      const data = await getAgentPrompt(agentType);
      setPrompt(data);
      setEditedInstruction(data.instruction);
      setEditedLabel(data.label);
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast.error('Failed to load prompt');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!prompt) return;

    setSaving(true);
    try {
      await updateAgentPrompt(agentType, {
        instruction: editedInstruction,
        label: editedLabel,
      }, userId);

      setPrompt({
        ...prompt,
        instruction: editedInstruction,
        label: editedLabel,
        customized: true,
      });
      setIsEditing(false);
      toast.success('Prompt saved successfully');
      onSave?.();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    try {
      await resetAgentPrompt(agentType);
      const defaultPrompt = AGENT_PROMPTS[agentType];
      setPrompt({
        id: agentType,
        agentType,
        label: defaultPrompt.label,
        scope: defaultPrompt.scope as 'TENANT' | 'PLATFORM',
        instruction: defaultPrompt.instruction,
        customized: false,
      });
      setEditedInstruction(defaultPrompt.instruction);
      setEditedLabel(defaultPrompt.label);
      setIsEditing(false);
      setShowResetModal(false);
      toast.success('Prompt reset to default');
    } catch (error) {
      console.error('Error resetting prompt:', error);
      toast.error('Failed to reset prompt');
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string, tipIndex: number) {
    navigator.clipboard.writeText(text);
    setCopiedTip(tipIndex);
    setTimeout(() => setCopiedTip(null), 2000);
  }

  function insertTemplate(templateKey: keyof typeof PROMPT_TEMPLATES) {
    setEditedInstruction(PROMPT_TEMPLATES[templateKey]);
    setShowTemplates(false);
    toast.success('Template inserted - customize the [PLACEHOLDERS]');
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prompt) return null;

  const wordCount = editedInstruction.trim().split(/\s+/).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={20} className="text-purple-500" />
                Agent Prompt Configuration
              </CardTitle>
              <CardDescription>
                Customize how this agent behaves and responds
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {prompt.customized && (
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  Customized
                </Badge>
              )}
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit size={16} className="mr-2" />
                  Edit Prompt
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setEditedInstruction(prompt.instruction);
                    setEditedLabel(prompt.label);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agent Label */}
          <div className="space-y-2">
            <Label>Agent Name/Label</Label>
            {isEditing ? (
              <Input
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                placeholder="e.g., Sports Reporter, Local News Journalist"
              />
            ) : (
              <div className="text-lg font-medium">{prompt.label}</div>
            )}
          </div>

          {/* Instruction/Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>System Prompt (Instructions)</Label>
              {isEditing && (
                <span className="text-xs text-muted-foreground">
                  {wordCount} words
                </span>
              )}
            </div>
            {isEditing ? (
              <Textarea
                value={editedInstruction}
                onChange={(e) => setEditedInstruction(e.target.value)}
                placeholder="Enter the system prompt that defines this agent's behavior..."
                rows={12}
                className="font-mono text-sm"
              />
            ) : (
              <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                {prompt.instruction}
              </div>
            )}
          </div>

          {/* Quick Actions when editing */}
          {isEditing && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <Lightbulb size={14} className="mr-1" />
                Use Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTips(!showTips)}
              >
                <Info size={14} className="mr-1" />
                Writing Tips
              </Button>
              {prompt.customized && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetModal(true)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Reset to Default
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates Section */}
      {isEditing && showTemplates && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb size={18} className="text-purple-500" />
              Prompt Templates
            </CardTitle>
            <CardDescription>
              Start with a template and customize for your publication
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Object.entries(PROMPT_TEMPLATES).map(([key, template]) => (
              <Button
                key={key}
                variant="outline"
                className="h-auto py-3 px-4 justify-start text-left"
                onClick={() => insertTemplate(key as keyof typeof PROMPT_TEMPLATES)}
              >
                <div>
                  <div className="font-medium capitalize">{key} Template</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {template.substring(0, 60)}...
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      {isEditing && showTips && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info size={18} className="text-blue-500" />
              Prompt Building Tips
            </CardTitle>
            <CardDescription>
              Best practices for creating effective agent prompts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PROMPT_BUILDING_TIPS.map((tip, index) => (
              <Collapsible key={index}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-sm">{tip.title}</span>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 px-3 pb-3">
                  <p className="text-sm text-muted-foreground mb-2">{tip.tip}</p>
                  <div className="flex items-start justify-between gap-2 bg-muted/50 p-2 rounded text-xs font-mono">
                    <span className="flex-1">{tip.example}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(tip.example, index)}
                    >
                      {copiedTip === index ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20} />
              Reset to Default?
            </DialogTitle>
            <DialogDescription>
              This will reset the prompt to the original default. Your customizations will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={saving}>
              {saving ? 'Resetting...' : 'Reset to Default'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
