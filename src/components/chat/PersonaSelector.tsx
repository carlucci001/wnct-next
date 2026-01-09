'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, UserCircle2, Check } from 'lucide-react';
import { Persona } from '@/types/persona';

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersonaId: string | null;
  onSelectPersona: (personaId: string) => void;
}

export default function PersonaSelector({
  personas,
  selectedPersonaId,
  onSelectPersona,
}: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);

  if (personas.length <= 1) {
    // Don't show selector if only one persona available
    return null;
  }

  return (
    <div className="relative">
      {/* Selected Persona Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
      >
        {selectedPersona ? (
          <>
            {selectedPersona.photoURL ? (
              <Image
                src={selectedPersona.photoURL}
                alt={selectedPersona.name}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-xs font-medium text-white">
                {selectedPersona.name[0]}
              </div>
            )}
            <span className="max-w-[100px] truncate">{selectedPersona.name}</span>
          </>
        ) : (
          <>
            <UserCircle2 size={18} />
            <span>Select...</span>
          </>
        )}
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Chat with...
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    onSelectPersona(persona.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    persona.id === selectedPersonaId
                      ? 'bg-violet-50 dark:bg-violet-900/20'
                      : ''
                  }`}
                >
                  {/* Avatar */}
                  {persona.photoURL ? (
                    <Image
                      src={persona.photoURL}
                      alt={persona.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-sm font-medium text-white">
                      {persona.name[0]}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-slate-900 dark:text-white text-sm">
                      {persona.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {persona.title}
                    </div>
                  </div>

                  {/* Check mark */}
                  {persona.id === selectedPersonaId && (
                    <Check size={16} className="text-violet-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
