"use client";

import * as React from "react";
import { CheckCircle2, ShieldCheck, Download, Search, X } from "lucide-react";

export function AdminKycClient({ initialRequests, initialAvailableNumbers = [] }: { initialRequests: any[], initialAvailableNumbers?: string[] }) {
  const [requests, setRequests] = React.useState(initialRequests);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pendingRequests = requests.filter(r => r.status === "pending");
  const completedRequests = requests.filter(r => r.status !== "pending");

  const handleAssign = async () => {
    if (!phoneNumber) {
      setToastMessage({ type: 'error', text: 'Please enter a phone number' });
      return;
    }
    
    setIsAssigning(true);
    try {
      const kyc = requests.find(r => r.id === assigningId);
      if (!kyc) return;
      
      const { approveKycAndAssignNumber } = await import("@/app/actions/kyc");
      const res = await approveKycAndAssignNumber(kyc.id, kyc.workspace_id, phoneNumber);
      
      if (res.success) {
        setToastMessage({ type: 'success', text: `Number ${phoneNumber} assigned successfully!` });
        setRequests(prev => prev.map(r => r.id === kyc.id ? { ...r, status: "approved", assigned_number: phoneNumber } : r));
        setAssigningId(null);
        setPhoneNumber("");
      } else {
        setToastMessage({ type: 'error', text: res.error || "Failed to assign number" });
      }
    } catch (e: any) {
      setToastMessage({ type: 'error', text: e.message });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center justify-between gap-4 max-w-sm border ${
          toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <X className="h-5 w-5 text-red-600" />}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow text-neutral-500">// ADMIN PANEL</p>
          <h1 className="text-3xl font-bold tracking-tight text-black mt-1">KYC Review & Assignment</h1>
          <p className="text-sm text-neutral-600">Review user KYC submissions and assign phone numbers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-black flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Pending Review ({pendingRequests.length})
          </h2>
          {pendingRequests.length === 0 ? (
            <div className="p-8 border border-hairline rounded-[10px] text-center text-sm text-neutral-500 bg-surface-soft">
              No pending KYC requests.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(r => (
                <div key={r.id} className="p-4 border border-hairline rounded-[10px] bg-white shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-black">{r.business_name}</h3>
                      <p className="text-xs text-neutral-500">Workspace: {r.workspaces?.name || r.workspace_id}</p>
                      <p className="text-xs text-neutral-500">Requested: {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    {r.verification_method === "setu_pan_and_digilocker" && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Auto-Verified by Setu
                        </span>
                        {r.verified_pan_name && (
                          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                            PAN: <strong className="text-black">{r.verified_pan_name}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {assigningId === r.id ? (
                    <div className="flex flex-col gap-2 mt-2 border-t pt-3">
                      <select 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:border-black/30"
                      >
                        <option value="" disabled>Select an available number...</option>
                        {initialAvailableNumbers.length === 0 ? (
                          <option value="" disabled>No unassigned numbers available</option>
                        ) : (
                          initialAvailableNumbers.map((num: string) => (
                            <option key={num} value={num}>{num}</option>
                          ))
                        )}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleAssign} disabled={isAssigning || !phoneNumber} className="btn-pill-primary text-xs px-3 py-1.5 font-bold flex-1">
                          {isAssigning ? "Assigning..." : "Assign"}
                        </button>
                        <button onClick={() => setAssigningId(null)} className="text-xs px-3 py-1.5 text-neutral-500 hover:text-black border border-hairline rounded bg-white font-medium">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAssigningId(r.id)} className="btn-pill-primary w-full justify-center flex items-center gap-2 px-3 py-2 text-xs font-bold mt-2">
                      <ShieldCheck className="w-3.5 h-3.5" /> Approve & Assign Number
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Requests */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-black flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Recently Completed ({completedRequests.length})
          </h2>
          {completedRequests.length === 0 ? (
            <div className="p-8 border border-hairline rounded-[10px] text-center text-sm text-neutral-500 bg-surface-soft">
              No completed requests yet.
            </div>
          ) : (
            <div className="space-y-4">
              {completedRequests.map(r => (
                <div key={r.id} className="p-4 border border-hairline rounded-[10px] bg-white/50 opacity-80 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-black">{r.business_name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 flex justify-between">
                    <span>Workspace: {r.workspaces?.name || r.workspace_id}</span>
                    {r.assigned_number && <span className="font-mono text-black font-bold ml-2">Assigned: {r.assigned_number}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
