"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  PhoneCall,
  RefreshCw,
  CheckCircle2,
  Share2,
  Zap,
  Globe,
  Loader2,
  X,
  Phone,
  Sparkles,
  Building2,
  Calendar,
  Tag,
} from "lucide-react";
import { triggerTestCallAction } from "@/app/actions/calls";

export interface VoiceContact {
  id: string;
  name: string | null;
  phone: string;
  metadata: Record<string, any> | null;
  canonical_contact_id: string | null;
  ecosystem_sync_source: string | null;
  ecosystem_sync_status: string;
  ecosystem_synced_at: string | null;
  created_at: string;
}

export interface AssistantOption {
  id: string;
  name: string;
  phone_number?: string;
}

interface ContactsClientProps {
  initialContacts: VoiceContact[];
  assistants: AssistantOption[];
}

export function ContactsClient({ initialContacts, assistants }: ContactsClientProps) {
  const [contacts, setContacts] = useState<VoiceContact[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<VoiceContact | null>(null);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(assistants[0]?.id || "");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatusMessage, setCallStatusMessage] = useState<string | null>(null);

  const filteredContacts = contacts.filter((c) => {
    const textMatch =
      !search ||
      `${c.name || ""} ${c.phone} ${JSON.stringify(c.metadata || {})}`
        .toLowerCase()
        .includes(search.toLowerCase());

    if (!textMatch) return false;

    if (filterSource === "crm") {
      return c.ecosystem_sync_source === "crm" || c.ecosystem_sync_status === "synced";
    }
    if (filterSource === "local") {
      return !c.ecosystem_sync_source || c.ecosystem_sync_status === "local";
    }
    return true;
  });

  const syncedCount = contacts.filter(
    (c) => c.ecosystem_sync_status === "synced" || c.ecosystem_sync_source === "crm"
  ).length;
  const localCount = contacts.length - syncedCount;

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !selectedAssistantId) return;

    setIsCalling(true);
    setCallStatusMessage("Connecting to Voice AI Engine...");

    try {
      const res = await triggerTestCallAction({
        customerNumber: selectedContact.phone,
        customerName: selectedContact.name || "Valued Lead",
        assistantId: selectedAssistantId,
      });

      if (res.success) {
        setCallStatusMessage("Call successfully initiated! Check Call Logs for real-time transcript.");
        setTimeout(() => {
          setSelectedContact(null);
          setCallStatusMessage(null);
        }, 3000);
      } else {
        setCallStatusMessage(`Call initiation failed: ${res.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setCallStatusMessage(`Error: ${err.message || "Failed to trigger call"}`);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Contacts & Ecosystem Sync
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Plane Synced
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your Voice AI contacts synced seamlessly across GetAiPilot CRM, WhatsApp, and Social DM.
          </p>
        </div>
      </div>

      {/* Control / Stats Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Contacts</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">{contacts.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Synced from CRM</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">{syncedCount}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-500/10 text-neutral-500 flex items-center justify-center font-bold">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Local Voice Contacts</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">{localCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search contacts by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Contacts" },
            { id: "crm", label: "Synced from CRM" },
            { id: "local", label: "Local Only" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterSource(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                filterSource === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        {filteredContacts.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No contacts found</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
              {search || filterSource !== "all"
                ? "Try adjusting your search query or source filter."
                : "Contacts created in CRM or Hub will automatically appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="py-3.5 px-4 pl-6">Contact Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Ecosystem Source</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right pr-6">Voice AI Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-sm">
                {filteredContacts.map((c) => {
                  const isSynced =
                    c.ecosystem_sync_status === "synced" || c.ecosystem_sync_source === "crm";
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors group">
                      {/* Name */}
                      <td className="py-3.5 px-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {c.name ? c.name[0].toUpperCase() : "C"}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-white leading-tight">
                              {c.name || "Unnamed Contact"}
                            </p>
                            {c.metadata?.company && (
                              <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3" /> {c.metadata.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        {c.phone}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isSynced
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          {isSynced ? <Share2 className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                          {c.ecosystem_sync_source ? c.ecosystem_sync_source.toUpperCase() : "Local"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isSynced
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isSynced ? "Synced" : "Local"}
                        </span>
                      </td>

                      {/* Call Action */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        <button
                          onClick={() => setSelectedContact(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-600/25"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          Call Now
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Call Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Initiate AI Voice Call
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setCallStatusMessage(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Recipient</p>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                {selectedContact.name || "Contact"}
              </p>
              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{selectedContact.phone}</p>
            </div>

            <form onSubmit={handleStartCall} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-2">
                  Select Voice AI Assistant
                </label>
                <select
                  value={selectedAssistantId}
                  onChange={(e) => setSelectedAssistantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {assistants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.phone_number || "Default caller ID"})
                    </option>
                  ))}
                </select>
              </div>

              {callStatusMessage && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {callStatusMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCalling || !selectedAssistantId}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                >
                  {isCalling ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                  {isCalling ? "Dispatching Call..." : "Start AI Call Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
