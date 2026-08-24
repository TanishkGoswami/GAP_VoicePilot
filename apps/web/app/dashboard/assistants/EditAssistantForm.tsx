"use client";

import * as React from "react";
import AssistantTestModal from "@/components/AssistantTestModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { VOMYRA_CATALOG, VoiceOption } from "@/lib/catalog";
import { updateAssistantAction, toggleAssistantToolAction, generatePromptAction } from "@/app/actions/assistants";
import { getConnectorsAction } from "@/app/actions/connectors";
import { getToolCallingDefaults } from "@/lib/toolCallingDefaults";
import { Play, Pause, Volume2, Check, Wrench, Sparkles, PhoneCall, Wand2, X, Plus, Trash2, Bot, Cpu, Mic, Settings2, Copy, Share2, CheckCircle2, Settings, ExternalLink, AlertTriangle, Lock } from "lucide-react";
import { AgentIntegrationsPermissions } from "@/components/connectors/AgentIntegrationsPermissions";
import { AssistantToolConfigDrawer, ToolAssignmentConfig } from "@/components/assistants/AssistantToolConfigDrawer";

interface EditAssistantFormProps {
  assistant: {
    id: string;
    name: string;
    status: string;
    provider_resource_id?: string;
    config_snapshot?: any;
    assigned_tool_ids?: string[];
    tool_assignments?: any[];
    workspace_connectors?: any[];
  };
  workspaceTools?: Array<{ id: string; name: string; type: string; description?: string; config?: any }>;
}

export function EditAssistantForm({ assistant, workspaceTools = [] }: EditAssistantFormProps) {
  const [activeTab, setActiveTab] = React.useState<"model" | "speech" | "voice" | "tools" | "integrations" | "advance">("model");

  const [isUpdating, setIsUpdating] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = React.useState(false);

  const initialCfg = assistant.config_snapshot || {};
  const initialTransfer = initialCfg.transfer_call_settings || {};

  // Model state
  const [name, setName] = React.useState(assistant.name || initialCfg.name || "Untitled Assistant");
  const [aiProvider, setAiProvider] = React.useState(initialCfg.ai_provider || "openai");
  const [model, setModel] = React.useState(initialCfg.model || "gpt-4.1-mini");
  const [maxTokens, setMaxTokens] = React.useState<number>(initialCfg.max_tokens ?? 256);
  const [temperature, setTemperature] = React.useState<number>(initialCfg.temperature ?? 0.3);
  const [dynamicWelcomeEnabled, setDynamicWelcomeEnabled] = React.useState<boolean>(!!initialCfg.dynamic_welcome_enabled);
  const [welcomeMessage, setWelcomeMessage] = React.useState(initialCfg.welcome_message || "Welcome, how can I assist you?");
  const [dynamicWelcomeMessage, setDynamicWelcomeMessage] = React.useState(initialCfg.dynamic_welcome_message || "");
  const [systemPrompt, setSystemPrompt] = React.useState(initialCfg.system_prompt || "");
  const [whatsappSummaryPrompt, setWhatsappSummaryPrompt] = React.useState(initialCfg.whatsapp_summary_prompt || "Demo Call Hotel\nGenerate a clear concise brief summary of important key points discussed in conversation between user and assistant without including any details from prompt .\nSummary should in a easy to read format.\nCapture all key points that are important for follow-up conversation .\nAnd highlight questions that assistant is not able to answer but user enquired about. \nIf the conversation was incomplete, briefly summarize what was discussed by both parties.\nPhone Number should always be in numeric digits.\nIf no interaction occurred during the call, simply return: \"No conversation happened.\"");
  const [whatsappSummaryPhone, setWhatsappSummaryPhone] = React.useState(initialCfg.whatsapp_summary_phone || "");
  const [outcomePrompt, setOutcomePrompt] = React.useState(initialCfg.outcome_prompt || "You are a call impact evaluator.\n\nTask:\nAnalyze the conversation between user and assistant and determine the BUSINESS IMPACT of the call.\n\nRules:\n- Output ONLY ONE WORD\n- Choose from: POSITIVE, NEUTRAL, NEGATIVE\n- POSITIVE = business value created or progress made\n- NEUTRAL = no clear progress or loss\n- NEGATIVE = lost opportunity, failure, or harmful call");
  const [maintainContext, setMaintainContext] = React.useState<boolean>(!!initialCfg.maintain_context);

  // Modals & Transfer Call Settings
  const [isPromptModalOpen, setIsPromptModalOpen] = React.useState(false);
  const [promptTopic, setPromptTopic] = React.useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState(false);

  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = React.useState(false);
  const [excludeWhatsappSummaryNumber, setExcludeWhatsappSummaryNumber] = React.useState(!!initialTransfer.exclude_whatsapp_summary_number);
  const [countryCode, setCountryCode] = React.useState("+91");
  const [transferPhoneInput, setTransferPhoneInput] = React.useState("");
  const [transferPhoneNumbers, setTransferPhoneNumbers] = React.useState<string[]>(initialTransfer.phone_numbers || []);

  // Speech (STT) state
  const initialTrans = initialCfg.transcription || {};
  const [transcriptionProvider, setTranscriptionProvider] = React.useState(initialTrans.provider || "deepgram");
  const [transcriptionLanguage, setTranscriptionLanguage] = React.useState(initialTrans.language || "hi-IN");
  const [transcriptionMode, setTranscriptionMode] = React.useState(initialTrans.mode || "live");
  const initialDg = initialTrans.deepgram || {};
  const [dgModel, setDgModel] = React.useState(initialDg.model || "nova-2");
  const [dgUtteranceEnd, setDgUtteranceEnd] = React.useState<number>(initialDg.utterance_end_ms ?? 1000);
  const [dgEndpointing, setDgEndpointing] = React.useState<number>(initialDg.endpointing ?? 300);
  const [dgVadEvents, setDgVadEvents] = React.useState<boolean>(initialDg.vad_events ?? true);
  const [dgDiarize, setDgDiarize] = React.useState<boolean>(initialDg.diarize ?? false);

  // Voice (TTS) state
  const initialVoiceObj = typeof initialCfg.voice === "object" && initialCfg.voice !== null ? initialCfg.voice : {};
  const [voiceProvider, setVoiceProvider] = React.useState(initialCfg.voice_provider || initialVoiceObj.provider || "azure");
  const [voiceName, setVoiceName] = React.useState(initialVoiceObj.name || initialCfg.voice || "hi-IN-AartiNeural");
  const [voiceLanguage, setVoiceLanguage] = React.useState(initialVoiceObj.language || "hi-IN");
  const [voiceSpeed, setVoiceSpeed] = React.useState<number>(initialVoiceObj.speed ?? 1.0);
  const [voiceStability, setVoiceStability] = React.useState<number>(initialVoiceObj.stability ?? 0.75);
  const [voiceSimilarityBoost, setVoiceSimilarityBoost] = React.useState<number>(initialVoiceObj.similarity_boost ?? 0.8);
  const [ttsModel, setTtsModel] = React.useState(initialVoiceObj.tts_model || "");
  const [voiceInstructions, setVoiceInstructions] = React.useState(initialVoiceObj.instructions || "Indian Accent");

  // Advance Settings state (1:1 Vomyra Parity)
  const [maximumDuration, setMaximumDuration] = React.useState<number>(initialCfg.maximum_duration ?? 600);
  const [silenceTimeout, setSilenceTimeout] = React.useState<number>(initialCfg.silence_timeout ?? 12);
  const [inactivityMessage, setInactivityMessage] = React.useState(initialCfg.inactivity_message || "Are you still there?");
  const [timeoutEndMessage, setTimeoutEndMessage] = React.useState(initialCfg.timeout_end_message || "Thank you for calling. Goodbye!");
  const [timeoutEndMessageDelay, setTimeoutEndMessageDelay] = React.useState<number>(initialCfg.timeout_end_message_delay ?? 5);
  const [fillerWordsEnabled, setFillerWordsEnabled] = React.useState<boolean>(initialCfg.filler_words_enabled ?? true);
  const [fillerWords, setFillerWords] = React.useState(initialCfg.filler_words || "हाँ, ठीक है जी, ठीक है, बिलकुल, जी, हाँ जी, अच्छा जी, अच्छा, हाँ ठीक hai");
  const [callDetailsWebhookEnabled, setCallDetailsWebhookEnabled] = React.useState<boolean>(!!initialCfg.call_details_webhook_enabled);
  const [callDetailsWebhookUrl, setCallDetailsWebhookUrl] = React.useState(initialCfg.call_details_webhook_url || "");

  // Audio Preview State
  const [playingVoiceId, setPlayingVoiceId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = (voice: VoiceOption) => {
    if (playingVoiceId === voice.name) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoiceId(null);
      return;
    }

    if (voice.preview_url) {
      if (audioRef.current) {
        audioRef.current.src = voice.preview_url;
        audioRef.current.play().catch((err) => console.warn("Failed to play preview audio:", err));
      }
      setPlayingVoiceId(voice.name);
      if (audioRef.current) {
        audioRef.current.onended = () => {
          setPlayingVoiceId(null);
        };
      }
    } else {
      setPlayingVoiceId(voice.name);
      setTimeout(() => {
        setPlayingVoiceId(null);
      }, 2000);
    }
  };

  // Tools state & Configuration Drawer
  const [assignedToolIds, setAssignedToolIds] = React.useState<string[]>(assistant.assigned_tool_ids || []);
  const [workspaceConnectors, setWorkspaceConnectors] = React.useState<any[]>(assistant.workspace_connectors || []);
  const [toolAssignmentsMap, setToolAssignmentsMap] = React.useState<Record<string, ToolAssignmentConfig>>(() => {
    const map: Record<string, ToolAssignmentConfig> = {};
    (assistant.tool_assignments || []).forEach((ta: any) => {
      map[ta.tool_name] = ta;
    });
    return map;
  });
  const [activeDrawerConfig, setActiveDrawerConfig] = React.useState<ToolAssignmentConfig | null>(null);

  React.useEffect(() => {
    getConnectorsAction().then((res) => {
      if (res && res.success && res.connectedAccounts) {
        setWorkspaceConnectors((prev) => {
          const map = new Map();
          prev.forEach((item: any) => map.set(item.id || item.provider || item.provider_slug || item.slug, item));
          res.connectedAccounts.forEach((item: any) => {
            const key = item.provider || item.provider_slug || item.slug || item.id;
            map.set(key, {
              ...item,
              provider: item.provider || item.provider_slug || key,
              provider_slug: item.provider_slug || item.provider || key,
              slug: item.slug || item.provider || key,
              status: item.status || "connected",
              connected_account_email: item.connected_account_email || item.connectedAccountEmail,
              connected_account_name: item.connected_account_name || item.connectedAccountName,
            });
          });
          return Array.from(map.values());
        });
      }
    }).catch((e) => console.warn("Failed to fetch live connectors:", e));
  }, []);

  const getToolConfig = React.useCallback((t: any): ToolAssignmentConfig => {
    const toolName = t.id || t.name;
    const existing = toolAssignmentsMap[toolName];
    const providerSlug = t.config?.provider || (toolName ? toolName.split('.')[0] : 'connector');

    const googleSlugs = new Set(['gmail', 'google_workspace', 'google_calendar', 'google_sheets', 'google_contacts', 'google_drive', 'google_meet']);
    const isGoogleTool = googleSlugs.has(providerSlug) || toolName.startsWith('google_') || toolName.startsWith('gmail.');
    const isSlackTool = providerSlug === 'slack' || toolName.startsWith('slack.');

    // Check workspace connector authorization
    let isAuthorized = true;
    let connectedEmail: string | null = null;

    if (isGoogleTool || isSlackTool || ['notion', 'linear', 'salesforce', 'hubspot'].includes(providerSlug)) {
      const connList = workspaceConnectors;
      const conn = connList.find((c: any) => {
        const cSlug = (
          c.provider ||
          c.provider_slug ||
          c.slug ||
          (typeof c.connector_definitions === 'object' ? c.connector_definitions?.slug : '') ||
          (Array.isArray(c.connector_definitions) ? c.connector_definitions[0]?.slug : '') ||
          ''
        )?.toLowerCase();

        const status = (c.status || '').toLowerCase();
        const isConnActive = status === 'connected' || status === 'active' || status === '';

        if (isGoogleTool) {
          return isConnActive && (cSlug === 'gmail' || cSlug === 'google_workspace' || googleSlugs.has(cSlug) || !cSlug);
        }

        if (isSlackTool) {
          return isConnActive && (cSlug === 'slack' || cSlug.includes('slack'));
        }

        return isConnActive && cSlug === providerSlug.toLowerCase();
      });

      if (isGoogleTool) {
        const anyGoogleConn = conn || connList.find((c: any) => c.status === 'connected' || c.status === 'active' || c.connected_account_email);
        if (anyGoogleConn) {
          isAuthorized = true;
          connectedEmail = anyGoogleConn.connected_account_email || anyGoogleConn.connected_account_name || 'shwetchourey3@gmail.com';
        } else {
          isAuthorized = false;
        }
      } else if (isSlackTool) {
        const anySlackConn = conn || connList.find((c: any) => {
          const s = (c.provider || c.provider_slug || c.slug || c.name || '').toLowerCase();
          return (s === 'slack' || s.includes('slack')) && (c.status === 'connected' || c.status === 'active' || !c.status);
        });

        if (anySlackConn || connList.some((c: any) => (c.provider || c.provider_slug || '').toLowerCase().includes('slack'))) {
          const target = anySlackConn || connList.find((c: any) => (c.provider || c.provider_slug || '').toLowerCase().includes('slack'));
          isAuthorized = true;
          connectedEmail = target?.connected_account_email || target?.connectedAccountEmail || target?.connected_account_name || target?.connectedAccountName || 'GAP@workspace.com';
        } else {
          isAuthorized = false;
          connectedEmail = null;
        }
      } else if (conn && (conn.status === 'connected' || conn.status === 'active')) {
        isAuthorized = true;
        connectedEmail = conn.connected_account_email || conn.connected_account_name || 'Active Account';
      } else {
        isAuthorized = false;
        connectedEmail = null;
      }
    }

    const defaults = getToolCallingDefaults(toolName);

    return {
      assistant_id: assistant.id,
      tool_name: toolName,
      tool_title: t.name || defaults.tool_title,
      description: t.description || defaults.when_to_use,
      provider_slug: providerSlug,
      category: existing?.category || defaults.category,
      enabled: existing?.enabled !== false,
      when_to_use: existing?.when_to_use || defaults.when_to_use,
      requires_confirmation: existing?.requires_confirmation !== undefined
        ? (defaults.category !== 'READ' ? true : existing.requires_confirmation)
        : defaults.requires_confirmation,
      timeout_ms: existing?.timeout_ms || defaults.timeout_ms,
      failure_message: existing?.failure_message || defaults.failure_message,
      allowed_during_call: existing?.allowed_during_call !== undefined ? existing.allowed_during_call : defaults.allowed_during_call,
      connected_account_email: connectedEmail,
      is_connector_authorized: isAuthorized,
      sync_status: existing?.sync_status || 'synced',
      sync_error: existing?.sync_error
    };
  }, [assistant.id, workspaceConnectors, toolAssignmentsMap]);

  const handleToggleTool = async (toolId: string) => {
    const isAssigned = assignedToolIds.includes(toolId);
    const newAssigned = isAssigned
      ? assignedToolIds.filter((id) => id !== toolId)
      : [...assignedToolIds, toolId];

    setAssignedToolIds(newAssigned);

    try {
      await toggleAssistantToolAction(assistant.id, toolId, !isAssigned);
    } catch (err: any) {
      console.warn("Failed to toggle tool on server:", err.message);
    }
  };

  const handleAddTransferNumber = () => {
    if (!transferPhoneInput.trim()) return;
    const fullNumber = transferPhoneInput.startsWith("+")
      ? transferPhoneInput.trim()
      : `${countryCode}${transferPhoneInput.trim()}`;

    if (!transferPhoneNumbers.includes(fullNumber)) {
      setTransferPhoneNumbers([...transferPhoneNumbers, fullNumber]);
    }
    setTransferPhoneInput("");
  };

  const handleRemoveTransferNumber = (numToRemove: string) => {
    setTransferPhoneNumbers(transferPhoneNumbers.filter((n) => n !== numToRemove));
  };

  const handleGeneratePrompt = async (presetTopic?: string) => {
    const topic = presetTopic || promptTopic;
    if (!topic.trim()) {
      alert("Please enter a business description or instructions.");
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const generated = await generatePromptAction(topic);
      if (generated) {
        setSystemPrompt(generated);
        setIsPromptModalOpen(false);
      }
    } catch (err: any) {
      alert("Failed to synthesize prompt: " + err.message);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handlePreviewVoice = (e: React.MouseEvent, language: string) => {
    e.preventDefault();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance();
    msg.text = language.includes('hi') ? "नमस्ते, मैं आपकी वॉइस असिस्टेंट हूँ।" : "Hello, I am your voice assistant.";
    msg.lang = language;

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.includes(language.substring(0, 2)));
    if (match) {
      msg.voice = match;
    }

    window.speechSynthesis.speak(msg);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setErrorMessage(null);

    const payload = {
      name,
      ai_provider: aiProvider,
      model,
      max_tokens: Number(maxTokens),
      temperature: Number(temperature),
      welcome_message: welcomeMessage,
      dynamic_welcome_enabled: dynamicWelcomeEnabled,
      dynamic_welcome_message: dynamicWelcomeMessage,
      system_prompt: systemPrompt,
      whatsapp_summary_prompt: whatsappSummaryPrompt,
      whatsapp_summary_phone: whatsappSummaryPhone,
      outcome_prompt: outcomePrompt,
      maintain_context: maintainContext,
      transfer_call_settings: {
        exclude_whatsapp_summary_number: excludeWhatsappSummaryNumber,
        phone_numbers: transferPhoneNumbers
      },
      voice: {
        provider: voiceProvider,
        name: voiceName,
        language: voiceLanguage,
        speed: Number(voiceSpeed),
        stability: Number(voiceStability),
        similarity_boost: Number(voiceSimilarityBoost),
        tts_model: ttsModel,
        instructions: voiceInstructions
      },
      transcription: {
        provider: transcriptionProvider,
        language: transcriptionLanguage,
        mode: transcriptionMode
      },
      deepgram: {
        model: dgModel,
        utterance_end_ms: Number(dgUtteranceEnd),
        endpointing: Number(dgEndpointing),
        vad_events: dgVadEvents,
        diarize: dgDiarize
      },
      maximum_duration: Number(maximumDuration),
      silence_timeout: Number(silenceTimeout),
      inactivity_message: inactivityMessage,
      timeout_end_message: timeoutEndMessage,
      timeout_end_message_delay: Number(timeoutEndMessageDelay),
      filler_words_enabled: fillerWordsEnabled,
      filler_words: fillerWords,
      call_details_webhook_enabled: callDetailsWebhookEnabled,
      call_details_webhook_url: callDetailsWebhookUrl,
      selected_tools: assignedToolIds
    };

    try {
      const result = await updateAssistantAction(assistant.id, payload);
      if (result && result.success !== false) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(result?.error || "Failed to update assistant. Please check your settings and try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while updating the assistant.");
    } finally {
      setIsUpdating(false);
    }
  };

  const aiProviders = Object.keys(VOMYRA_CATALOG.ai.models);
  const currentModels = VOMYRA_CATALOG.ai.models[aiProvider as keyof typeof VOMYRA_CATALOG.ai.models] || [];
  const voiceProviderOptions = VOMYRA_CATALOG.voice.providers;
  const currentVoices: VoiceOption[] = VOMYRA_CATALOG.voice.featured_voices.filter(v => v.provider === voiceProvider);

  return (
    <form onSubmit={handleUpdate} className="space-y-6 animate-fadeIn pb-12">
      {errorMessage && (
        <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 text-red-700 font-bold text-xs shadow-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black tracking-tight">{name}</h1>
            <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {assistant.status || "active"}
            </span>
            {assistant.provider_resource_id && (
              <span className="font-mono text-[10px] bg-surface-soft border border-hairline text-neutral-500 px-2 py-0.5 rounded">
                Resource ID: {assistant.provider_resource_id.slice(-6)}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Configure speech pipeline, prompt engineering, custom function tools, and advance telephony settings.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="btn-pill-primary rounded-[10px] text-xs px-4 py-2 flex items-center gap-2 shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Test Voice & Phone</span>
          </Button>

          <Button
            type="submit"
            disabled={isUpdating}
            className="bg-black hover:bg-neutral-800 text-white rounded-[10px] text-xs px-5 py-2 font-bold transition-transform active:scale-95 shadow-sm"
          >
            {isUpdating ? "Saving..." : saveSuccess ? "Saved ✓" : "Update Assistant"}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border border-hairline rounded-[12px] bg-surface-soft p-1 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("model")}
          className={`flex-1 py-2 px-3 rounded-[8px] font-semibold flex items-center justify-center gap-1.5 transition-all ${activeTab === "model" ? "bg-white text-black shadow-xs font-bold" : "text-neutral-500 hover:text-black"
            }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Model & Prompts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("speech")}
          className={`flex-1 py-2 px-3 rounded-[8px] font-semibold flex items-center justify-center gap-1.5 transition-all ${activeTab === "speech" ? "bg-white text-black shadow-xs font-bold" : "text-neutral-500 hover:text-black"
            }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Speech Input (STT)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("voice")}
          className={`flex-1 py-2 px-3 rounded-[8px] font-semibold flex items-center justify-center gap-1.5 transition-all ${activeTab === "voice" ? "bg-white text-black shadow-xs font-bold" : "text-neutral-500 hover:text-black"
            }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Voice Output (TTS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tools")}
          className={`flex-1 py-2 px-3 rounded-[8px] font-semibold flex items-center justify-center gap-1.5 transition-all ${activeTab === "tools" ? "bg-white text-black shadow-xs font-bold" : "text-neutral-500 hover:text-black"
            }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Tools ({assignedToolIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("integrations")}
          className={`flex-1 py-2 px-3 rounded-[8px] font-semibold flex items-center justify-center gap-1.5 transition-all ${activeTab === "integrations" ? "bg-white text-black shadow-xs font-bold" : "text-neutral-500 hover:text-black"
            }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Integrations & Permissions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("advance")}
          className={`flex-1 py-2 px-3 rounded-[8px] font-semibold flex items-center justify-center gap-1.5 transition-all ${activeTab === "advance" ? "bg-white text-black shadow-xs font-bold" : "text-neutral-500 hover:text-black"
            }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Advance Settings</span>
        </button>
      </div>

      {/* Integrations & Permissions Tab */}
      {activeTab === "integrations" && (
        <div className="bg-white border border-hairline rounded-[14px] p-6 space-y-6 shadow-sm">
          <AgentIntegrationsPermissions assistantId={assistant.id} />
        </div>
      )}

      {/* Model & Prompts Tab */}
      {activeTab === "model" && (

        <div className="bg-white border border-hairline rounded-[14px] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-black">Model & Prompt Configuration</h3>
            <p className="text-xs text-neutral-500">Configure AI Model, Prompts, Dynamic Welcome Messages, Summary Prompts, and Transfer Call Settings.</p>
          </div>

          <div className="space-y-2">
            <Label className="eyebrow text-neutral-500">ASSISTANT NAME *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-soft border border-hairline rounded-[10px] px-4 py-2 text-xs font-semibold text-black"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="eyebrow text-neutral-500">AI PROVIDER</Label>
              <select
                value={aiProvider}
                onChange={(e) => {
                  setAiProvider(e.target.value);
                  const avail = VOMYRA_CATALOG.ai.models[e.target.value as keyof typeof VOMYRA_CATALOG.ai.models] || [];
                  if (avail && avail.length > 0 && avail[0]) setModel(avail[0].id);
                }}
                className="w-full bg-surface-soft border border-hairline rounded-[10px] px-3 py-2 text-xs font-semibold text-black capitalize"
              >
                {aiProviders.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="eyebrow text-neutral-500">MODEL</Label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-[10px] px-3 py-2 text-xs font-semibold text-black"
              >
                {currentModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="eyebrow text-neutral-500">MAX TOKENS</Label>
                <span className="font-mono text-xs font-bold text-black">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="64"
                max="2048"
                step="32"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 256)}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Dynamic Welcome Message */}
          <div className="space-y-3 pt-4 border-t border-hairline">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-black uppercase tracking-wider">Dynamic Welcome Message</Label>
                <p className="text-xs text-neutral-500">When enabled, the assistant greets dynamically based on conversation context or lead data.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600">{dynamicWelcomeEnabled ? "Enabled" : "Disabled"}</span>
                <button
                  type="button"
                  onClick={() => setDynamicWelcomeEnabled(!dynamicWelcomeEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${dynamicWelcomeEnabled ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${dynamicWelcomeEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {dynamicWelcomeEnabled ? (
              <div className="space-y-2">
                <Label className="eyebrow text-neutral-500">DYNAMIC GREETING INSTRUCTIONS</Label>
                <Textarea
                  rows={2}
                  value={dynamicWelcomeMessage}
                  onChange={(e) => setDynamicWelcomeMessage(e.target.value)}
                  placeholder="Greet the caller warmly in Hindi and ask how you can help them today with room bookings..."
                  className="bg-surface-soft border border-hairline rounded-[10px] p-3 text-xs text-black font-semibold resize-y"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="eyebrow text-neutral-500">STATIC FIRST MESSAGE (WELCOME MESSAGE)</Label>
                <Input
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Welcome, how can I assist you?"
                  className="bg-surface-soft border border-hairline rounded-[10px] px-4 py-2.5 text-xs text-black font-semibold"
                />
              </div>
            )}
          </div>

          {/* System Prompt */}
          <div className="space-y-2 pt-4 border-t border-hairline">
            <div className="flex items-center justify-between">
              <div>
                <Label className="eyebrow text-neutral-500">SYSTEM PROMPT (AGENT INSTRUCTIONS)</Label>
                <p className="text-xs text-neutral-500">Define the personality, operational rules, role, and conversation flow.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsPromptModalOpen(true)}
                className="btn-pill-secondary rounded-full text-xs px-3 py-1.5 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Prompt Generator</span>
              </button>
            </div>

            <Textarea
              rows={8}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are an expert AI Voice Assistant..."
              className="bg-surface-soft border border-hairline rounded-[10px] p-3.5 text-xs text-black font-mono leading-relaxed resize-y"
            />
          </div>

          {/* Action Modals Trigger Bar */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="btn-pill-secondary rounded-[10px] text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Transfer Call Settings ({transferPhoneNumbers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWhatsappModalOpen(true)}
              className="btn-pill-secondary rounded-[10px] text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>WhatsApp Summary Phone ({whatsappSummaryPhone || "Not set"})</span>
            </button>
          </div>
        </div>
      )}

      {/* Speech Input (STT) Tab */}
      {activeTab === "speech" && (
        <div className="bg-white border border-hairline rounded-[14px] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-black">Speech Input (STT Engine)</h3>
            <p className="text-xs text-neutral-500">Deepgram Neural Transcription, Real-time VAD, Language, and Utterance Delays.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="eyebrow text-neutral-500">TRANSCRIPTION PROVIDER</Label>
              <select
                value={transcriptionProvider}
                onChange={(e) => setTranscriptionProvider(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-[10px] px-3 py-2 text-xs font-semibold text-black"
              >
                <option value="deepgram">Deepgram Nova-2</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="eyebrow text-neutral-500">LANGUAGE</Label>
              <select
                value={transcriptionLanguage}
                onChange={(e) => setTranscriptionLanguage(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-[10px] px-3 py-2 text-xs font-semibold text-black"
              >
                <option value="hi-IN">Hindi (hi-IN)</option>
                <option value="en-US">English (en-US)</option>
                <option value="en-IN">Indian English (en-IN)</option>
                <option value="multi">Multilingual</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="eyebrow text-neutral-500">MODEL TIER</Label>
              <select
                value={dgModel}
                onChange={(e) => setDgModel(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-[10px] px-3 py-2 text-xs font-semibold text-black"
              >
                <option value="nova-2">Nova-2 (Ultra-fast & accurate)</option>
                <option value="nova-2-general">Nova-2 General</option>
                <option value="nova-2-conversationalai">Nova-2 Conversational AI</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-hairline">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="eyebrow text-neutral-500">UTTERANCE END DELAY (MS)</Label>
                <span className="font-mono text-xs font-bold text-black">{dgUtteranceEnd} ms</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={dgUtteranceEnd}
                onChange={(e) => setDgUtteranceEnd(parseInt(e.target.value) || 1000)}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="eyebrow text-neutral-500">ENDPOINTING (MS)</Label>
                <span className="font-mono text-xs font-bold text-black">{dgEndpointing} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={dgEndpointing}
                onChange={(e) => setDgEndpointing(parseInt(e.target.value) || 300)}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Voice Output Tab (Vomyra Parity) */}
      {activeTab === "voice" && (
        <div className="bg-white border border-hairline rounded-[14px] p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-black">Voice</h3>
              <p className="text-xs text-neutral-500 mt-1">Configure voice settings for the Assistant.</p>
            </div>
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-6 py-2 rounded-md shadow-sm"
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-black">Voice Provider</Label>
              <select
                value={voiceProvider}
                onChange={(e) => setVoiceProvider(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-[8px] px-4 py-3 text-sm font-semibold text-black appearance-none"
              >
                {voiceProviderOptions.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-black">Voice</Label>
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-[8px] px-4 py-3 text-sm font-semibold text-black appearance-none"
              >
                {currentVoices.map((v: VoiceOption) => (
                  <option key={v.name} value={v.name}>{v.title || v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-black">Language <span className="text-red-500">*</span></Label>
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-[8px] px-4 py-3 text-sm font-semibold text-black appearance-none"
              >
                <option value="hi-IN">Hindi (India)</option>
                <option value="en-IN">English (India)</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-black">Voice Rate</Label>
                <span className="text-black font-bold text-sm">{(voiceSpeed * 20).toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={voiceSpeed * 20}
                onChange={(e) => setVoiceSpeed(parseInt(e.target.value) / 20)}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Featured Voices Cards */}
          <div className="pt-6">
            <h3 className="text-xl font-bold text-black mb-4">Featured Voices</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: Aarti Hindi */}
              <div className="bg-surface-soft/40 rounded-[12px] p-5 flex flex-col justify-between border border-hairline hover:border-emerald-500/50 transition-colors cursor-pointer group">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-lg text-black">Aarti - Azure</h4>
                    <div className="w-8 h-8 rounded-full bg-white border border-hairline flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-500 mt-1">hi-IN-AartiNeural</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Azure</span>
                    <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Hindi</span>
                  </div>

                  {voiceName === "hi-IN-AartiNeural" && (
                    <div className="mt-3 bg-black text-white px-3 py-1 rounded-full w-fit text-[10px] font-bold">
                      Selected
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between mt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const v = VOMYRA_CATALOG.voice.featured_voices.find((x) => x.name === "hi-IN-AartiNeural");
                      if (v) handlePlayVoice(v);
                    }}
                    className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-sm"
                  >
                    {playingVoiceId === "hi-IN-AartiNeural" ? (
                      <Pause className="w-4 h-4 text-black" />
                    ) : (
                      <Play className="w-4 h-4 text-black ml-0.5" />
                    )}
                  </button>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500">Details:</p>
                    <p className="text-xs font-bold text-black">IN • female</p>
                    <p className="text-[10px] text-neutral-500">general</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Arjun Hindi */}
              <div className="bg-surface-soft/40 rounded-[12px] p-5 flex flex-col justify-between border border-hairline hover:border-emerald-500/50 transition-colors cursor-pointer group">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-lg text-black">Arjun - Azure</h4>
                    <div className="w-8 h-8 rounded-full bg-white border border-hairline flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-500 mt-1">hi-IN-ArjunNeural</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Azure</span>
                    <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Hindi</span>
                    <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold">male</span>
                  </div>

                  {voiceName === "hi-IN-ArjunNeural" && (
                    <div className="mt-3 bg-black text-white px-3 py-1 rounded-full w-fit text-[10px] font-bold">
                      Selected
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between mt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const v = VOMYRA_CATALOG.voice.featured_voices.find((x) => x.name === "hi-IN-ArjunNeural");
                      if (v) handlePlayVoice(v);
                    }}
                    className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-sm"
                  >
                    {playingVoiceId === "hi-IN-ArjunNeural" ? (
                      <Pause className="w-4 h-4 text-black" />
                    ) : (
                      <Play className="w-4 h-4 text-black ml-0.5" />
                    )}
                  </button>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500">Details:</p>
                    <p className="text-xs font-bold text-black">IN • male</p>
                    <p className="text-[10px] text-neutral-500">general</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Aarti English */}
              <div className="bg-surface-soft/40 rounded-[12px] p-5 flex flex-col justify-between border border-hairline hover:border-emerald-500/50 transition-colors cursor-pointer group">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-lg text-black">Aarti - Azure</h4>
                    <div className="w-8 h-8 rounded-full bg-white border border-hairline flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-500 mt-1">en-IN-AartiNeural</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Azure</span>
                    <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold">English</span>
                    <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold">female</span>
                  </div>

                  {voiceName === "en-IN-AartiNeural" && (
                    <div className="mt-3 bg-black text-white px-3 py-1 rounded-full w-fit text-[10px] font-bold">
                      Selected
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between mt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const v = VOMYRA_CATALOG.voice.featured_voices.find((x) => x.name === "en-IN-AartiNeural");
                      if (v) handlePlayVoice(v);
                    }}
                    className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-sm"
                  >
                    {playingVoiceId === "en-IN-AartiNeural" ? (
                      <Pause className="w-4 h-4 text-black" />
                    ) : (
                      <Play className="w-4 h-4 text-black ml-0.5" />
                    )}
                  </button>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500">Details:</p>
                    <p className="text-xs font-bold text-black">IN • female</p>
                    <p className="text-[10px] text-neutral-500">general</p>
                  </div>
                </div>
              </div>

              {/* Card 4: Arjun English */}
              <div className="bg-surface-soft/40 rounded-[12px] p-5 flex flex-col justify-between border border-hairline hover:border-emerald-500/50 transition-colors cursor-pointer group">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-lg text-black">Arjun - Azure</h4>
                    <div className="w-8 h-8 rounded-full bg-white border border-hairline flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-500 mt-1">en-IN-ArjunNeural</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Azure</span>
                    <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold">English</span>
                    <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold">male</span>
                  </div>

                  {voiceName === "en-IN-ArjunNeural" && (
                    <div className="mt-3 bg-black text-white px-3 py-1 rounded-full w-fit text-[10px] font-bold">
                      Selected
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between mt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const v = VOMYRA_CATALOG.voice.featured_voices.find((x) => x.name === "en-IN-ArjunNeural");
                      if (v) handlePlayVoice(v);
                    }}
                    className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-sm"
                  >
                    {playingVoiceId === "en-IN-ArjunNeural" ? (
                      <Pause className="w-4 h-4 text-black" />
                    ) : (
                      <Play className="w-4 h-4 text-black ml-0.5" />
                    )}
                  </button>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500">Details:</p>
                    <p className="text-xs font-bold text-black">IN • male</p>
                    <p className="text-[10px] text-neutral-500">general</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="eyebrow text-neutral-500">SPEED ({voiceSpeed}x)</Label>
              <span className="font-mono text-xs font-bold text-black">{voiceSpeed}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value) || 1.0)}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Voice Sample List */}
          <div className="space-y-3 pt-4 border-t border-hairline">
            <Label className="eyebrow text-neutral-500">AVAILABLE VOICES FOR {voiceProvider.toUpperCase()}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentVoices.map((voice) => {
                const isSelected = voiceName === voice.name;
                const isPlaying = playingVoiceId === voice.name;

                return (
                  <div
                    key={voice.name}
                    onClick={() => {
                      setVoiceName(voice.name);
                      setVoiceLanguage(voice.language);
                    }}
                    className={`p-3.5 rounded-[12px] border transition-all cursor-pointer flex items-center justify-between ${isSelected
                        ? "border-emerald-500 bg-emerald-50/30 shadow-xs"
                        : "border-hairline bg-surface-soft hover:bg-white"
                      }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-black">{voice.title || voice.name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {voice.language} • {voice.gender}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVoice(voice);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlaying
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-hairline text-black hover:bg-neutral-100"
                        }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tools & Connectors Tab */}
      {activeTab === "tools" && (
        <div className="bg-white border border-hairline rounded-[14px] p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <h3 className="text-xl font-bold text-black flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                <span>Function Tools & Enterprise Connectors</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Attach and configure real-time tools, OAuth connectors, and safety rules for this AI Assistant.
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-xs px-3.5 py-1.5 rounded-full font-bold border border-emerald-200 shadow-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{assignedToolIds.length} Connected</span>
            </span>
          </div>

          <div className="space-y-4">
            {workspaceTools.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 border-2 border-dashed border-hairline rounded-[14px] bg-surface-soft/50">
                <Wrench className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="font-bold text-neutral-700">No Connectors Found</p>
                <p className="text-neutral-500 mt-1">Create API Request tools or Knowledge Base connectors to link with this assistant.</p>
              </div>
            ) : (
              workspaceTools.map((t) => {
                const toolConfig = getToolConfig(t);
                const isAssigned = assignedToolIds.includes(t.id || t.name);
                const isAuthorized = toolConfig.is_connector_authorized;

                return (
                  <div
                    key={t.id || t.name}
                    className={`p-5 border rounded-[14px] transition-all ${isAssigned
                        ? "border-emerald-500/40 bg-emerald-50/20 shadow-xs"
                        : "border-hairline bg-surface-soft/40 hover:bg-white"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* Title & Metadata Badges (No Internal POST URL exposed to customer) */}
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-bold text-sm text-black">{t.name}</h4>

                          <Badge className={`text-[10px] font-mono font-bold uppercase ${toolConfig.category === "READ"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : toolConfig.category === "WRITE"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}>
                            {toolConfig.category}
                          </Badge>

                          {toolConfig.requires_confirmation ? (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold gap-1">
                              <Lock className="w-2.5 h-2.5" /> Confirmation Required
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                              Automatic
                            </Badge>
                          )}

                          {toolConfig.sync_status === "failed" && (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-mono font-bold gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> SYNC ERROR
                            </Badge>
                          )}
                        </div>

                        {t.description && (
                          <p className="text-xs text-neutral-600 leading-relaxed">{t.description}</p>
                        )}

                        {/* Connected Account & Authorization Indicator */}
                        <div className="flex items-center gap-3 pt-1 text-xs">
                          {isAuthorized ? (
                            <div className="flex items-center gap-1.5 text-neutral-600 font-mono text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-bold text-black">{toolConfig.provider_slug?.toUpperCase()}</span>
                              <span>•</span>
                              <span>{toolConfig.connected_account_email || "Active Account"}</span>
                            </div>
                          ) : (
                            <a
                              href="/dashboard/connectors"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] hover:bg-rose-100 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Connect {toolConfig.provider_slug?.toUpperCase()} first</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right Hand Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isAssigned && (
                          <Button
                            type="button"
                            onClick={() => setActiveDrawerConfig(toolConfig)}
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs font-bold gap-1.5 bg-white border-hairline hover:bg-surface-soft shadow-xs"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Configure</span>
                          </Button>
                        )}

                        <Button
                          type="button"
                          disabled={!isAuthorized}
                          onClick={() => handleToggleTool(t.id || t.name)}
                          className={`text-xs font-bold px-4 py-2 rounded-full shrink-0 shadow-xs transition-all ${isAssigned
                              ? "bg-black hover:bg-neutral-800 text-white"
                              : isAuthorized
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                            }`}
                        >
                          {isAssigned ? "Connected ✓" : "+ Connect Tool"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Assistant Tool Configuration Drawer */}
      {activeDrawerConfig && (
        <AssistantToolConfigDrawer
          isOpen={!!activeDrawerConfig}
          onClose={() => setActiveDrawerConfig(null)}
          config={activeDrawerConfig}
          onSaved={(updatedConfig) => {
            setToolAssignmentsMap((prev) => ({
              ...prev,
              [updatedConfig.tool_name]: updatedConfig
            }));
          }}
        />
      )}

      {/* Advance Settings Tab (1:1 Vomyra UI Parity) */}
      {activeTab === "advance" && (
        <div className="bg-white border border-hairline rounded-[14px] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-black">Advance Settings</h3>
            <p className="text-xs text-neutral-500">Configure timeout, silence limits, filler words, and call termination messages.</p>
          </div>

          {/* 1. Wait Time Before Asking Again (Silence Timeout Slider) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-black uppercase tracking-wider">Wait Time Before Asking Again</Label>
                <p className="text-xs text-neutral-500">How long the system waits when the customer is silent before prompting them.</p>
              </div>
              <span className="font-mono text-xs font-bold text-black px-3 py-1 rounded bg-surface-soft border border-hairline">
                {silenceTimeout} sec
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              step="1"
              value={silenceTimeout}
              onChange={(e) => setSilenceTimeout(parseInt(e.target.value) || 12)}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>2 (sec)</span>
              <span>60 (sec)</span>
            </div>
          </div>

          {/* 2. Max Call Length (Maximum Duration Slider) */}
          <div className="space-y-2 pt-4 border-t border-hairline">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-black uppercase tracking-wider">Max Call Length</Label>
                <p className="text-xs text-neutral-500">The longest time a call can last.</p>
              </div>
              <span className="font-mono text-xs font-bold text-black px-3 py-1 rounded bg-surface-soft border border-hairline">
                {maximumDuration} sec
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="3600"
              step="30"
              value={maximumDuration}
              onChange={(e) => setMaximumDuration(parseInt(e.target.value) || 600)}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>30 (sec)</span>
              <span>3600 (sec)</span>
            </div>
          </div>

          {/* 3. Prompt Message */}
          <div className="space-y-1.5 pt-4 border-t border-hairline">
            <Label className="text-xs font-bold text-black uppercase tracking-wider">Prompt Message</Label>
            <p className="text-xs text-neutral-500">The message played to check if the customer is still there, e.g. "Are you there?"</p>
            <Input
              value={inactivityMessage}
              onChange={(e) => setInactivityMessage(e.target.value)}
              placeholder="Are you still there?"
              className="bg-surface-soft border border-hairline rounded-[10px] px-4 py-2.5 text-xs text-black font-semibold"
            />
          </div>

          {/* 4. Goodbye Message & Timeout Delay */}
          <div className="space-y-3 pt-4 border-t border-hairline">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold text-black uppercase tracking-wider">Goodbye Message</Label>
                <p className="text-xs text-neutral-500">The final message before the call ends, e.g. "Thank you for calling. Goodbye!"</p>
                <Input
                  value={timeoutEndMessage}
                  onChange={(e) => setTimeoutEndMessage(e.target.value)}
                  placeholder="Thank you for calling. Goodbye!"
                  className="bg-surface-soft border border-hairline rounded-[10px] px-4 py-2.5 text-xs text-black font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-black uppercase">Timeout End Message Delay</Label>
                  <span className="font-mono text-[11px] font-bold text-black px-2 py-0.5 rounded bg-surface-soft border border-hairline">
                    {timeoutEndMessageDelay} sec
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">Wait time after prompt before goodbye.</p>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={timeoutEndMessageDelay}
                  onChange={(e) => setTimeoutEndMessageDelay(parseInt(e.target.value) || 5)}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-1"
                />
                <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                  <span>5 sec</span>
                  <span>300 sec</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Instant Filler Words */}
          <div className="space-y-3 pt-4 border-t border-hairline">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-black uppercase tracking-wider">Instant Filler Words</Label>
                <p className="text-xs text-neutral-500">Play short acknowledgements (e.g., "hmm...", "okay...") while the assistant thinks.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600">{fillerWordsEnabled ? "Enabled" : "Disabled"}</span>
                <button
                  type="button"
                  onClick={() => setFillerWordsEnabled(!fillerWordsEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${fillerWordsEnabled ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${fillerWordsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {fillerWordsEnabled && (
              <div className="space-y-1.5">
                <Textarea
                  rows={3}
                  value={fillerWords}
                  onChange={(e) => setFillerWords(e.target.value)}
                  placeholder="हाँ, ठीक है जी, ठीक है, बिलकुल, जी, हाँ जी, अच्छा जी, अच्छा, हाँ ठीक hai"
                  className="bg-surface-soft border border-hairline rounded-[10px] p-3 text-xs text-black font-semibold leading-relaxed resize-y"
                />
                <p className="text-[11px] text-neutral-500">
                  Separate phrases with commas or new lines. Defaults adapt to your transcription language.
                </p>
              </div>
            )}
          </div>

          {/* 6. Call Details Webhook */}
          <div className="space-y-3 pt-4 border-t border-hairline">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-black uppercase tracking-wider">Call Details Webhook</Label>
                <p className="text-xs text-neutral-500">Send call details to an external webhook after the call ends.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600">{callDetailsWebhookEnabled ? "Enabled" : "Disabled"}</span>
                <button
                  type="button"
                  onClick={() => setCallDetailsWebhookEnabled(!callDetailsWebhookEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${callDetailsWebhookEnabled ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${callDetailsWebhookEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {callDetailsWebhookEnabled && (
              <div className="space-y-1.5">
                <Input
                  type="url"
                  value={callDetailsWebhookUrl}
                  onChange={(e) => setCallDetailsWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/api/webhook"
                  className="bg-surface-soft border border-hairline rounded-[10px] px-4 py-2.5 text-xs text-black font-semibold"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Prompt Generator Modal */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-[16px] max-w-lg w-full p-6 shadow-2xl space-y-5 text-black text-left">
            <div className="flex items-start justify-between gap-3 border-b border-hairline pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black">AI Voice Prompt Generator</h3>
                  <p className="text-xs text-neutral-500 font-medium">Describe your business or select a preset to auto-generate a structured system prompt.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPromptModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-full hover:bg-surface-soft transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="eyebrow text-neutral-500">QUICK BUSINESS PRESETS</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "🏨 Hotel Reservation", topic: "Hotel Reservation Desk Agent for Jolly Hotel Delhi" },
                  { label: "🏠 Real Estate Sales", topic: "Real Estate Sales Representative qualifying leads for 2BHK and 3BHK luxury apartments" },
                  { label: "📞 Customer Support", topic: "Tech Support Representative resolving customer queries" },
                  { label: "🩺 Clinic Booking", topic: "Dental Clinic Assistant scheduling patient appointments" },
                  { label: "🛍️ E-Commerce", topic: "Online Store Assistant checking order tracking status" }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPromptTopic(preset.topic);
                      handleGeneratePrompt(preset.topic);
                    }}
                    className="px-3 py-1.5 rounded-full bg-surface-soft hover:bg-black hover:text-white border border-hairline text-xs font-semibold transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="eyebrow text-neutral-500">CUSTOM PROMPT TOPIC & INSTRUCTIONS</Label>
              <Textarea
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                placeholder="e.g. Call center agent for Jolly Hotel handling room reservations, INR 5400/night prices..."
                className="min-h-[90px] bg-surface-soft border border-hairline rounded-[10px] p-3 text-xs text-black font-medium"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isGeneratingPrompt}
                onClick={() => setIsPromptModalOpen(false)}
                className="flex-1 py-2.5 rounded-[10px] border border-hairline text-xs font-semibold hover:bg-surface-soft text-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingPrompt}
                onClick={() => handleGeneratePrompt()}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-[10px] text-xs py-2.5 shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                {isGeneratingPrompt ? "Synthesizing AI Prompt..." : "✨ Synthesize System Prompt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Call Setting Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-hairline rounded-[16px] max-w-lg w-full p-6 shadow-2xl space-y-6 text-black text-left">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <h3 className="font-bold text-lg text-black">Transfer Call Setting</h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-full hover:bg-surface-soft transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-black">Exclude Whatsapp Summary Number</Label>
              <button
                type="button"
                onClick={() => setExcludeWhatsappSummaryNumber(!excludeWhatsappSummaryNumber)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${excludeWhatsappSummaryNumber ? 'bg-emerald-500' : 'bg-neutral-300'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${excludeWhatsappSummaryNumber ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-surface-soft border border-hairline rounded-[10px] px-3 py-2.5 text-xs font-bold text-black focus:outline-none focus:border-black"
              >
                <option value="+91">IN +91</option>
                <option value="+1">US +1</option>
                <option value="+44">UK +44</option>
                <option value="+971">UAE +971</option>
              </select>

              <Input
                type="text"
                value={transferPhoneInput}
                onChange={(e) => setTransferPhoneInput(e.target.value)}
                placeholder="Phone number"
                className="bg-surface-soft border border-hairline rounded-[10px] px-4 py-2.5 text-xs text-black placeholder-neutral-400 focus:border-black flex-1 font-semibold"
              />

              <button
                type="button"
                onClick={handleAddTransferNumber}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shrink-0 font-bold transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-hairline rounded-[10px] overflow-hidden bg-surface-soft">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline text-xs font-bold text-neutral-600">
                <span>Phone Number</span>
                <span>Action</span>
              </div>

              <div className="divide-y divide-hairline bg-white">
                {transferPhoneNumbers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500 font-medium">
                    No phone numbers added yet.
                  </div>
                ) : (
                  transferPhoneNumbers.map((num) => (
                    <div key={num} className="flex items-center justify-between px-4 py-3 text-xs font-mono font-semibold text-black">
                      <span>{num}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTransferNumber(num)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-surface-soft transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold rounded-full py-3 text-xs shadow-md transition-all"
            >
              Save Transfer Settings
            </button>
          </div>
        </div>
      )}

      {/* Whatsapp Summary Phone Modal */}
      {isWhatsappModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-hairline rounded-[16px] max-w-md w-full p-6 shadow-2xl space-y-4 text-black text-left">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-bold text-base text-black">Whatsapp Summary Phone Number</h3>
              <button
                type="button"
                onClick={() => setIsWhatsappModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-full hover:bg-surface-soft"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="eyebrow text-neutral-500">PHONE NUMBER (WITH COUNTRY CODE)</Label>
              <Input
                type="text"
                value={whatsappSummaryPhone}
                onChange={(e) => setWhatsappSummaryPhone(e.target.value)}
                placeholder="e.g. +919876543210"
                className="bg-surface-soft border border-hairline rounded-[10px] px-3 py-2 text-xs text-black font-semibold"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsWhatsappModalOpen(false)}
                className="flex-1 py-2 rounded-[10px] border border-hairline text-xs font-semibold text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsWhatsappModalOpen(false)}
                className="flex-1 bg-black hover:bg-neutral-800 text-white font-bold rounded-[10px] text-xs py-2 shadow-sm"
              >
                Save Number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assistant Voice & Phone Test Modal */}
      <AssistantTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        assistant={{
          id: assistant.id,
          name: name,
          provider_resource_id: assistant.provider_resource_id,
          config_snapshot: {
            welcome_message: dynamicWelcomeEnabled ? dynamicWelcomeMessage : welcomeMessage,
            system_prompt: systemPrompt,
            voice: { name: voiceName, language: voiceLanguage, provider: voiceProvider }
          },
          welcome_message: dynamicWelcomeEnabled ? dynamicWelcomeMessage : welcomeMessage,
          system_prompt: systemPrompt
        }}
      />
      {/* Floating Action Button (Vomyra Parity) */}
      <button
        type="button"
        onClick={() => setIsTestModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#10b981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all hover:scale-110 z-40 group border-2 border-emerald-400/30"
        title="Test Assistant"
      >
        <Bot className="w-6 h-6 text-white group-hover:animate-pulse" />
      </button>
      <audio ref={audioRef} className="hidden" />
    </form>
  );
}
