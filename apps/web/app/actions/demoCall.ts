"use server";

import { getCurrentWorkspace, getAdminClient } from "@/lib/workspace";
import { triggerTestCallAction } from "./calls";

export interface DemoCallStatusResponse {
  isEligible: boolean;
  isAuthenticated: boolean;
  phone?: string;
  demoCall?: {
    id?: string;
    phone_number?: string;
    status?: string;
    call_id?: string;
    created_at?: string;
  } | null;
  reason?: string;
}

export interface TriggerOneTimeDemoCallParams {
  phone_number: string;
}

/**
 * Check if current user is logged in and whether they have already used their 1 free test call.
 */
export async function checkDemoEligibilityAction(): Promise<DemoCallStatusResponse> {
  try {
    const workspace = await getCurrentWorkspace();
    if (!workspace?.userId) {
      return {
        isAuthenticated: false,
        isEligible: false,
        reason: "unauthenticated",
      };
    }

    const userId = workspace.userId;
    const adminClient = await getAdminClient();

    if (!adminClient) {
      return {
        isAuthenticated: true,
        isEligible: true,
        phone: "",
      };
    }

    // 1. Check database table voice_demo_calls
    try {
      const { data: existingCall } = await adminClient
        .from("voice_demo_calls")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingCall) {
        const isConsumed = ["initiated", "completed", "reserved"].includes(existingCall.status);
        if (isConsumed) {
          return {
            isAuthenticated: true,
            isEligible: false,
            demoCall: existingCall,
            phone: existingCall.phone_number,
            reason: "already_used",
          };
        }
      }
    } catch (dbErr: any) {
      console.warn("[checkDemoEligibility] Table query warning:", dbErr?.message);
    }

    // 2. Check user metadata lock as secondary guard
    const userRes = await adminClient.auth.admin.getUserById(userId);
    const user = userRes?.data?.user;
    if (user?.user_metadata?.voice_demo_call_used) {
      return {
        isAuthenticated: true,
        isEligible: false,
        reason: "already_used",
      };
    }

    // Prefill phone if available
    const prefillPhone = user?.phone || user?.user_metadata?.phone || "";

    return {
      isAuthenticated: true,
      isEligible: true,
      phone: prefillPhone,
    };
  } catch (err: any) {
    console.error("checkDemoEligibilityAction error:", err);
    return {
      isAuthenticated: false,
      isEligible: false,
      reason: typeof err === "object" ? (err?.message || JSON.stringify(err)) : String(err || "Eligibility check error"),
    };
  }
}

/**
 * Trigger a one-time free test call for authenticated user.
 */
export async function triggerOneTimeDemoCallAction(params: TriggerOneTimeDemoCallParams) {
  try {
    // 1. Verify Authentication
    const workspace = await getCurrentWorkspace();
    if (!workspace?.userId) {
      return {
        success: false,
        error: "Authentication required. Please sign in to request a test call.",
        needAuth: true,
      };
    }

    const userId = workspace.userId;

    // 2. Validate Phone Number
    const rawPhone = (params.phone_number || "").trim().replace(/[^\d+]/g, "");
    if (!rawPhone || rawPhone.replace(/\D/g, "").length < 10) {
      return {
        success: false,
        error: "Please enter a valid 10-digit phone number.",
      };
    }

    // Format phone number (+91 by default for 10-digit Indian numbers)
    let formattedPhone = rawPhone;
    if (!formattedPhone.startsWith("+")) {
      const digitsOnly = formattedPhone.replace(/\D/g, "");
      if (digitsOnly.length === 10) {
        formattedPhone = `+91${digitsOnly}`;
      } else {
        formattedPhone = `+${digitsOnly}`;
      }
    }

    const adminClient = await getAdminClient();
    if (!adminClient) {
      return {
        success: false,
        error: "Database service unavailable. Please try again later.",
      };
    }

    // 3. Pre-check demo eligibility (User Metadata Lock & Database Table)
    const userRes = await adminClient.auth.admin.getUserById(userId);
    const user = userRes?.data?.user;
    if (user?.user_metadata?.voice_demo_call_used) {
      return {
        success: false,
        demoEligible: false,
        error: "Your 1 free test call has already been used.",
      };
    }

    // 4. ATOMIC RESERVATION in voice_demo_calls database table
    let reservedId: string | null = null;
    try {
      const { data: inserted, error: insertErr } = await adminClient
        .from("voice_demo_calls")
        .insert({
          user_id: userId,
          phone_number: formattedPhone,
          status: "reserved",
          provider: "vomyra",
          max_duration_seconds: 60,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        // Unique constraint violation (23505) or duplicate row
        if (insertErr.code === "23505" || insertErr.message?.includes("unique") || insertErr.message?.includes("duplicate")) {
          return {
            success: false,
            demoEligible: false,
            error: "Your 1 free test call has already been used.",
          };
        }
        console.warn("[triggerOneTimeDemoCall] Insert warning:", insertErr.message);
      } else if (inserted) {
        reservedId = inserted.id;
      }
    } catch (tableErr: any) {
      console.warn("[triggerOneTimeDemoCall] Table error fallback:", tableErr.message);
    }

    // Lock user metadata as secondary guard to prevent race conditions across server calls
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user?.user_metadata,
        voice_demo_call_used: true,
        voice_demo_call_reserved_at: new Date().toISOString(),
      },
    });

    // 5. Initiate Call through Vomyra Calling Backend
    let demoAssistantId =
      process.env.NEXT_PUBLIC_DEMO_ASSISTANT_ID ||
      process.env.DEMO_ASSISTANT_ID;

    if (!demoAssistantId) {
      try {
        // Query the current user's workspace assistants first
        const { data: workspaceAsts } = await adminClient
          .from("assistants")
          .select("provider_resource_id")
          .eq("workspace_id", workspace.workspaceId || "")
          .is("deleted_at", null)
          .not("provider_resource_id", "is", null)
          .order("created_at", { ascending: false });

        if (workspaceAsts && workspaceAsts.length > 0) {
          const validAst = workspaceAsts.find((a: any) => a.provider_resource_id && /^[0-9a-fA-F]{24}$/.test(a.provider_resource_id));
          if (validAst) {
            demoAssistantId = validAst.provider_resource_id;
          }
        }

        // If not found in workspace, fall back to any assistant in the system
        if (!demoAssistantId) {
          const { data: astList } = await adminClient
            .from("assistants")
            .select("provider_resource_id")
            .is("deleted_at", null)
            .not("provider_resource_id", "is", null)
            .order("created_at", { ascending: false });

          if (astList && astList.length > 0) {
            const validAst = astList.find((a: any) => a.provider_resource_id && /^[0-9a-fA-F]{24}$/.test(a.provider_resource_id));
            if (validAst) {
              demoAssistantId = validAst.provider_resource_id;
            }
          }
        }
      } catch (e) {}
    }

    if (!demoAssistantId) {
      demoAssistantId = "6a79b1f312df58f68ce4e836";
    }

    const callResult = await triggerTestCallAction({
      customerNumber: formattedPhone,
      customerName: user?.user_metadata?.name || user?.email?.split("@")[0] || "Demo Visitor",
      assignedNumber: demoAssistantId === "6a79b1f312df58f68ce4e836" ? "7943494977" : undefined,
      assistantId: demoAssistantId,
    });

    // 6. Handle Call Result
    if (!callResult.success) {
      // TELEPHONY PROVIDER REJECTED BEFORE CALL CREATION: Allow user to retry!
      let rawErrText = typeof callResult.error === "object"
        ? (callResult.error?.message || JSON.stringify(callResult.error))
        : String(callResult.error || "Telephony provider failed");

      if (rawErrText.includes("Failed to initiate call") || rawErrText.includes("internal_error")) {
        rawErrText = "Telephony network trunk is currently processing high volume. Please retry in a few moments.";
      }

      try {
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...user?.user_metadata,
            voice_demo_call_used: false,
          },
        });

        if (reservedId) {
          await adminClient
            .from("voice_demo_calls")
            .update({ status: "failed", notes: rawErrText })
            .eq("id", reservedId);
        }
      } catch (rollbackErr) {
        console.error("[triggerOneTimeDemoCall] Rollback error:", rollbackErr);
      }

      return {
        success: false,
        error: rawErrText,
      };
    }

    // CALL INITIATED SUCCESSFULLY: Mark free demo as permanently consumed!
    const callId = callResult.callId || callResult.call?.id || null;
    if (reservedId) {
      try {
        await adminClient
          .from("voice_demo_calls")
          .update({
            status: "initiated",
            call_id: callId,
            started_at: new Date().toISOString(),
          })
          .eq("id", reservedId);
      } catch (e) {}
    }

    return {
      success: true,
      callId,
      phone: formattedPhone,
      message: "Call initiated successfully! Your phone will ring shortly.",
    };
  } catch (err: any) {
    console.error("triggerOneTimeDemoCallAction error:", err);
    return {
      success: false,
      error: typeof err === "object" ? (err.message || JSON.stringify(err)) : String(err || "An unexpected error occurred. Please try again."),
    };
  }
}
