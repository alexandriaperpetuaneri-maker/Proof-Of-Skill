const company = "Northline Field Systems";
const configuredSite = Deno.env.get("RECRUITER_SITE_ORIGIN");
const site = configuredSite ? new URL(configuredSite).origin : "";
const headers = {
  "Access-Control-Allow-Origin":site,
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type, x-region",
  "Cache-Control":"no-store",
  "Content-Type":"application/json",
  "Vary":"Origin"
};

function respond(status: number, code: string) {
  return new Response(JSON.stringify({code}),{status,headers});
}

Deno.serve(async request => {
  if (!site) return respond(503,"site_origin_not_configured");
  if (request.headers.get("origin")!==site) return respond(403,"invalid_origin");
  if (request.method==="OPTIONS") return new Response(null,{status:204,headers});
  if (request.method!=="POST") return respond(405,"method_not_allowed");
  const authorization=request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return respond(401,"sign_in_required");

  try {
    const body=await request.text();
    if (body.length>4096) return respond(400,"invalid_invite");
    const {email,token}=JSON.parse(body) ?? {};
    if (typeof email!=="string" || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof token!=="string" || !/^[a-f0-9]{64}$/.test(token)) return respond(400,"invalid_invite");

    const endpoint=Deno.env.get("SUPABASE_URL");
    const publishableKey=Deno.env.get("SUPABASE_ANON_KEY");
    if (!endpoint || !publishableKey) return respond(503,"delivery_unavailable");
    const access=await fetch(`${endpoint}/rest/v1/rpc/can_send_recruiter_demo_invite`,{
      method:"POST",headers:{authorization,apikey:publishableKey,"Content-Type":"application/json"},
      body:JSON.stringify({recipient:email,invite_token:token})
    });
    if (!access.ok || await access.json()!==true) return respond(403,"invite_unavailable");

    const resendKey=Deno.env.get("RESEND_API_KEY");
    const from=Deno.env.get("RECRUITER_EMAIL_FROM");
    if (!resendKey || !from || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from)) {
      return respond(503,"sender_not_configured");
    }
    const link=new URL("/",site);
    link.hash="recruiter-invite="+token;
    const fingerprint=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
    const idempotencyKey=Array.from(new Uint8Array(fingerprint),byte=>byte.toString(16).padStart(2,"0")).join("");
    const result=await fetch("https://api.resend.com/emails",{
      method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json","Idempotency-Key":`northline-invite/${idempotencyKey}`},
      body:JSON.stringify({
        from:`${company} via Proof of Skill <${from}>`,to:[email],
        subject:`Recruiter invitation from ${company} (Proof of Skill demo)`,
        text:`Hi,\n\n${company} invites you to its fictional recruiter demo on Proof of Skill.\n\nAccept your invitation: ${link.href}\n\nUse the Google email that received this message. If the private site asks you to sign in first, sign in with your viewer account and reopen this link. The invitation expires after seven days.\n\n${company}\nProof of Skill demo`
      })
    });
    return result.ok ? respond(200,"sent") : respond(502,"email_not_sent");
  } catch {
    return respond(502,"delivery_unavailable");
  }
});
