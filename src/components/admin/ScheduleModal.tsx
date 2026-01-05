'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, AlertCircle, Zap } from 'lucide-react';
import {
  AIJournalist,
  AgentSchedule,
  AgentTaskConfig,
  US_TIMEZONES,
  DAYS_OF_WEEK,
  SCHEDULE_FREQUENCIES,
} from '@/types/aiJournalist';
import { Category } from '@/types/category';
import { updateAIJournalistSchedule, formatNextRun, calculateNextRunTime } from '@/lib/aiJournalists';

interface ScheduleModalProps {
  journalist: AIJournalist;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ScheduleModal({ journalist, categories, onClose, onSaved }: ScheduleModalProps) {
  // Schedule state
  const [isEnabled, setIsEnabled] = useState(journalist.schedule?.isEnabled ?? false);
  const [frequency, setFrequency] = useState<AgentSchedule['frequency']>(journalist.schedule?.frequency ?? 'daily');
  const [time, setTime] = useState(journalist.schedule?.time ?? '09:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(journalist.schedule?.daysOfWeek ?? [1, 3, 5]); // Mon, Wed, Fri
  const [dayOfMonth, setDayOfMonth] = useState(journalist.schedule?.dayOfMonth ?? 1);
  const [timezone, setTimezone] = useState(journalist.schedule?.timezone ?? 'America/New_York');

  // Task config state
  const [autoPublish, setAutoPublish] = useState(journalist.taskConfig?.autoPublish ?? false);
  const [maxArticlesPerRun, setMaxArticlesPerRun] = useState(journalist.taskConfig?.maxArticlesPerRun ?? 1);
  const [categoryId, setCategoryId] = useState(journalist.taskConfig?.categoryId ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runImmediately, setRunImmediately] = useState(false);

  // Track if this is a new schedule being enabled
  const wasNotEnabled = !journalist.schedule?.isEnabled;

  // Calculate preview of next run
  const [nextRunPreview, setNextRunPreview] = useState<string>('');

  useEffect(() => {
    if (isEnabled) {
      const schedule: AgentSchedule = {
        isEnabled: true,
        frequency,
        time,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        timezone,
      };
      const nextRun = calculateNextRunTime(schedule);
      setNextRunPreview(formatNextRun(nextRun, timezone));
    } else {
      setNextRunPreview('Not scheduled');
    }
  }, [isEnabled, frequency, time, daysOfWeek, dayOfMonth, timezone]);

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        // Don't allow empty selection
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Build schedule object without undefined values (Firestore doesn't like undefined)
      const schedule: AgentSchedule = {
        isEnabled,
        frequency,
        time,
        timezone,
      };

      // Only add optional fields if they have values
      if (frequency === 'weekly' && daysOfWeek.length > 0) {
        schedule.daysOfWeek = daysOfWeek;
      }
      if (frequency === 'monthly') {
        schedule.dayOfMonth = dayOfMonth;
      }

      // Build taskConfig without undefined values
      const taskConfig: AgentTaskConfig = {
        autoPublish,
        maxArticlesPerRun,
      };

      if (categoryId) {
        taskConfig.categoryId = categoryId;
      }

      await updateAIJournalistSchedule(journalist.id, schedule, taskConfig);

      // Trigger immediate run if requested
      if (isEnabled && runImmediately) {
        try {
          const response = await fetch('/api/scheduled/run-agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: journalist.id, force: true }),
          });
          const result = await response.json();
          if (!response.ok) {
            console.error('Immediate run failed:', result.error);
          }
        } catch (runError) {
          console.error('Error triggering immediate run:', runError);
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to save schedule: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center sticky top-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock size={20} />
            Schedule: {journalist.name}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Enable Autopilot</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Automatically generate articles on schedule
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isEnabled ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Schedule Configuration (shown when enabled) */}
          {isEnabled && (
            <>
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SCHEDULE_FREQUENCIES.map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setFrequency(freq.value as AgentSchedule['frequency'])}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        frequency === freq.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-slate-200 dark:border-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">{freq.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{freq.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time (for daily, weekly, monthly) */}
              {frequency !== 'hourly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {/* Days of Week (for weekly) */}
              {frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          daysOfWeek.includes(day.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Day of Month
                  </label>
                  <select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                        {day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {US_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Calendar size={18} />
                  Task Settings
                </h3>

                {/* Category Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Category for Articles
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Use agent&apos;s beat ({journalist.beat || 'any'})</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Override the agent&apos;s default category for scheduled runs
                  </p>
                </div>

                {/* Max Articles Per Run */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Articles per Run
                  </label>
                  <select
                    value={maxArticlesPerRun}
                    onChange={(e) => setMaxArticlesPerRun(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {[1, 2, 3, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} article{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-publish Toggle */}
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-200">Auto-publish</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Publish immediately or save as draft for review
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPublish(!autoPublish)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      autoPublish ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        autoPublish ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Next Run Preview */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Clock size={18} />
                  <span className="font-medium">Next run:</span>
                  <span>{nextRunPreview}</span>
                </div>
              </div>

              {/* Run Immediately Option - show when first enabling */}
              {wasNotEnabled && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRunImmediately(!runImmediately)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      runImmediately
                        ? 'bg-green-600 border-green-600'
                        : 'border-green-400 dark:border-green-600'
                    }`}
                  >
                    {runImmediately && <Check size={12} className="text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
                      <Zap size={16} />
                      Run first article now
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Generate an article immediately after saving
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 px-6 py-4 flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
