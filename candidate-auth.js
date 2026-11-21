"use strict";

window.proofOfSkillCandidateAuth = (() => {
  const {url="",publishableKey="",emailMode="",googleEnabled=false} = window.proofOfSkillAuthConfig ?? {};
  const configured = Boolean(url || publishableKey);
  const teamEmailTest = configured && emailMode==="team-test";
  let clientPromise;

  function createClient() {
    const endpoint = new URL(url);
    if (endpoint.protocol!=="https:" || endpoint.origin!==url || !publishableKey.startsWith("sb_publishable_")) {
      throw Error("Candidate sign-in configuration is incomplete.");
    }
    return new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src="vendor/supabase-2.119.2.js";
      script.addEventListener("error",()=>reject(Error("Candidate sign-in could not load.")),{once:true});
      script.addEventListener("load",()=>{
        try {
          resolve(window.supabase.createClient(url,publishableKey,{
            auth:{flowType:"pkce",detectSessionInUrl:false,storageKey:"proof-of-skill-candidate-auth"}
          }));
        } catch (error) { reject(error); }
      },{once:true});
      document.head.append(script);
    });
  }

  const client = () => clientPromise ??= Promise.resolve().then(createClient);
  function result({data,error}) {
    if (error) throw error;
    return data;
  }

  function callbackUrl() {
    return new URL("?candidate-auth=1",location.href).href;
  }

  async function initialize() {
    const {auth}=await client();
    const address=new URL(location.href);
    const returning=address.searchParams.get("candidate-auth")==="1";
    if (returning) {
      history.replaceState(null,"",address.pathname + "#login");
      const code=address.searchParams.get("code");
      if (!code) throw Error("The sign-in link did not complete.");
      result(await auth.exchangeCodeForSession(code));
    }
    const {session}=result(await auth.getSession());
    if (!session) return null;
    const {user}=result(await auth.getUser());
    auth.onAuthStateChange((event,next)=>{
      if (event==="SIGNED_OUT" || (event==="SIGNED_IN" && next?.user.id!==user.id)) {
        window.dispatchEvent(new Event("candidate-session-changed"));
      }
    });
    return user;
  }

  async function sendEmail(email,name,register) {
    const {auth}=await client();
    result(await auth.signInWithOtp({
      email,
      options:{emailRedirectTo:callbackUrl(),shouldCreateUser:register,data:register ? {display_name:name} : undefined}
    }));
  }

  async function signInWithGoogle(recruiter=false) {
    const {auth}=await client();
    const options={redirectTo:callbackUrl()};
    if (recruiter) options.queryParams={prompt:"select_account"};
    result(await auth.signInWithOAuth({provider:"google",options}));
  }

  async function recruiterAccess() {
    const db=await client();
    return result(await db.rpc("recruiter_demo_access"));
  }

  async function createRecruiterInvite(recipient) {
    const db=await client();
    return result(await db.rpc("issue_recruiter_demo_invite",{recipient}));
  }

  async function acceptRecruiterInvite(inviteToken) {
    const db=await client();
    return result(await db.rpc("accept_recruiter_demo_invite",{invite_token:inviteToken}));
  }

  async function sendRecruiterInvite(email,token) {
    const db=await client();
    const {data,error}=await db.functions.invoke("send-recruiter-invite",{body:{email,token}});
    if (!error) return data?.code;
    if (error.context instanceof Response) {
      const body=await error.context.json().catch(()=>null);
      if (body?.code) return body.code;
    }
    throw error;
  }

  async function loadRolloutReviews(userId) {
    const db=await client();
    return result(await db.from("rollout_reviews").select("sample_id,scores,strengths,improvements").eq("user_id",userId));
  }

  async function loadCandidate(userId) {
    const db=await client();
    const [profile,samples,draft,openingDrafts,reviewer,reviews]=await Promise.all([
      db.from("candidate_profiles").select("profile").eq("user_id",userId).maybeSingle(),
      db.from("candidate_work_samples").select("sample").eq("user_id",userId).order("created_at",{ascending:false}),
      db.from("candidate_rollout_drafts").select("id,revision,answers").eq("user_id",userId).maybeSingle(),
      db.from("candidate_opening_drafts").select("opening_id,id,revision,answers,company_responses").eq("user_id",userId),
      db.from("rollout_reviewers").select("user_id").eq("user_id",userId).maybeSingle(),
      loadRolloutReviews(userId)
    ]);
    return {profile:result(profile)?.profile,samples:result(samples).map(row=>row.sample),
      rolloutDraft:result(draft),openingDrafts:result(openingDrafts),canReviewRollout:Boolean(result(reviewer)),reviews};
  }

  async function saveRolloutDraft(userId,{id,revision},answers) {
    const db=await client();
    const drafts=db.from("candidate_rollout_drafts");
    const write=revision===null ?
      drafts.upsert({user_id:userId,id,answers},{onConflict:"user_id",ignoreDuplicates:true}) :
      drafts.update({answers,revision:revision+1}).eq("user_id",userId).eq("id",id).eq("revision",revision);
    return result(await write.select("id,revision,answers").maybeSingle());
  }

  async function submitRollout({id,revision},answers) {
    const db=await client();
    return result(await db.rpc("submit_rollout_work",{attempt_id:id,expected_revision:revision,responses:answers}));
  }

  async function saveOpeningDraft(userId,openingId,{id,revision},answers,companyResponses) {
    const db=await client();
    const drafts=db.from("candidate_opening_drafts");
    const fields={answers,company_responses:companyResponses};
    const write=revision===null ?
      drafts.upsert({user_id:userId,opening_id:openingId,id,...fields},{onConflict:"user_id,opening_id",ignoreDuplicates:true}) :
      drafts.update({...fields,revision:revision+1}).eq("user_id",userId).eq("opening_id",openingId).eq("id",id).eq("revision",revision);
    return result(await write.select("id,revision").maybeSingle());
  }

  async function clearOpeningDraft(userId,openingId,{id,revision}) {
    const db=await client();
    result(await db.from("candidate_opening_drafts").delete().eq("user_id",userId).eq("opening_id",openingId).eq("id",id).eq("revision",revision));
  }

  async function loadRolloutQueue(offset,limit) {
    const db=await client();
    return result(await db.from("candidate_work_samples")
      .select("user_id,id,sample,rollout_reviews(scores,strengths,improvements)")
      .eq("sample->>assessmentId","rollout").is("sample->>jobId",null)
      .order("created_at",{ascending:false}).order("id").order("user_id").range(offset,offset+limit));
  }

  async function publishRolloutReview(userId,sampleId,scores,strengths,improvements) {
    const db=await client();
    return result(await db.from("rollout_reviews")
      .upsert({user_id:userId,sample_id:sampleId,scores,strengths,improvements})
      .select("scores,strengths,improvements").single());
  }

  async function saveProfile(userId,profile) {
    const db=await client();
    const row=result(await db.from("candidate_profiles").upsert({user_id:userId,profile}).select("profile").single());
    return row.profile;
  }

  async function saveSample(userId,sample) {
    const db=await client();
    const inserted=result(await db.from("candidate_work_samples").upsert(
      {user_id:userId,id:sample.id,sample},
      {onConflict:"user_id,id",ignoreDuplicates:true}
    ).select("sample").maybeSingle());
    return inserted?.sample ?? result(await db.from("candidate_work_samples").select("sample").eq("user_id",userId).eq("id",sample.id).single()).sample;
  }

  async function signOut() {
    const {auth}=await client();
    result(await auth.signOut({scope:"local"}));
  }

  return {configured,teamEmailTest,googleEnabled:configured && googleEnabled,initialize,sendEmail,signInWithGoogle,
    recruiterAccess,createRecruiterInvite,acceptRecruiterInvite,sendRecruiterInvite,
    loadCandidate,saveProfile,saveSample,saveRolloutDraft,submitRollout,saveOpeningDraft,clearOpeningDraft,
    loadRolloutReviews,loadRolloutQueue,publishRolloutReview,signOut};
})();
