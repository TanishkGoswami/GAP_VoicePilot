import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function hmacSign(message: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(message, "utf8")
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodePayload(encoded: string): any {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  const mismatch = bufA.length !== bufB.length ? 1 : 0;
  const compareBuf = mismatch ? bufA : bufB;

  return crypto.timingSafeEqual(bufA, compareBuf) && !mismatch;
}

export async function POST(request: NextRequest) {
  const ssoSecret = process.env.VOICE_PILOT_SSO_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!ssoSecret) {
    console.error("[SSO] VOICE_PILOT_SSO_SECRET is not configured");
    return NextResponse.json(
      { success: false, error: "SSO not configured on server" },
      { status: 503 }
    );
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[SSO] Missing Supabase configuration or SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json(
      { success: false, error: "Server authentication misconfiguration" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing SSO token" },
        { status: 400 }
      );
    }

    // Split at last dot: "<encoded>.<signature>"
    const lastDot = token.lastIndexOf(".");
    if (lastDot < 1 || lastDot === token.length - 1) {
      return NextResponse.json(
        { success: false, error: "Malformed SSO token" },
        { status: 400 }
      );
    }

    const encoded = token.slice(0, lastDot);
    const signature = token.slice(lastDot + 1);

    // Verify HMAC-SHA256 signature
    const expectedSignature = hmacSign(encoded, ssoSecret);
    if (!constantTimeEqual(signature, expectedSignature)) {
      console.warn("[SSO] Signature mismatch — token rejected");
      return NextResponse.json(
        { success: false, error: "Invalid SSO token" },
        { status: 401 }
      );
    }

    // Decode and validate token payload
    const payload = decodePayload(encoded);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unreadable SSO token payload" },
        { status: 400 }
      );
    }

    const { email, aud, iss, exp, jti } = payload;

    if (aud !== "voicepilot") {
      return NextResponse.json(
        { success: false, error: "Invalid token audience" },
        { status: 401 }
      );
    }

    if (iss !== "getaipilot.in") {
      return NextResponse.json(
        { success: false, error: "Invalid token issuer" },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Token missing email" },
        { status: 400 }
      );
    }

    if (!jti) {
      return NextResponse.json(
        { success: false, error: "Token missing nonce (jti)" },
        { status: 400 }
      );
    }

    if (typeof exp !== "number" || Date.now() > exp) {
      return NextResponse.json(
        { success: false, error: "SSO token has expired" },
        { status: 401 }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Replay prevention check via sso_nonces table
    try {
      const { error: nonceError } = await supabaseAdmin
        .from("sso_nonces")
        .insert({ jti, email, expires_at: new Date(exp).toISOString() });

      if (nonceError) {
        if (nonceError.code === "23505") {
          console.warn(`[SSO] Replay detected for jti=${jti} email=${email}`);
          return NextResponse.json(
            { success: false, error: "SSO token already used" },
            { status: 401 }
          );
        }
        // Non-fatal if sso_nonces table doesn't exist yet
        console.warn("[SSO] sso_nonces check warning:", nonceError.message);
      }
    } catch (nonceErr: any) {
      console.warn("[SSO] Nonce insertion skipped/failed:", nonceErr?.message);
    }

    // Determine target redirect URL
    const origin = request.nextUrl.origin;
    const redirectTo = `${origin}/auth/callback`;

    // Generate passwordless magic link for user
    let { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    let actionLink = linkData?.properties?.action_link;

    if (linkError || !actionLink) {
      console.log(`[SSO] generateLink notice (${linkError?.message}), ensuring user ${email} is created...`);
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError && !createError.message?.toLowerCase().includes("already")) {
        console.warn("[SSO] createUser notice:", createError.message);
      }

      const { data: retryLinkData, error: retryError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

      if (retryError || !retryLinkData?.properties?.action_link) {
        console.error("[SSO] generateLink retry error:", retryError?.message);
        return NextResponse.json(
          { success: false, error: retryError?.message || linkError?.message || "Failed to generate authentication link" },
          { status: 500 }
        );
      }

      actionLink = retryLinkData.properties.action_link;
    }

    console.log(`[SSO] ✅ Successfully issued magic link for ${email}`);
    return NextResponse.json({
      success: true,
      magic_link_url: actionLink,
    });
  } catch (err: any) {
    console.error("[SSO] Unexpected error during SSO token processing:", err?.message);
    return NextResponse.json(
      { success: false, error: "Unexpected server error during SSO processing" },
      { status: 500 }
    );
  }
}
