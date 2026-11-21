"use strict";

const employerDemoCompany = "Northline Field Systems";
const recruiterIntentKey = "proof-of-skill-recruiter-intent";
const employerWorkspaceIntent = "workspace";
const recruiterInviteHash = /^#recruiter-invite=([a-f0-9]{64})$/;
let employerAccess = null;
let pendingRecruiterToken = "";
let recruiterNotice = "";
let preparedRecruiterInvite = null;

function rememberRecruiterSignIn() {
  try {
    sessionStorage.setItem(recruiterIntentKey,pendingRecruiterToken || employerWorkspaceIntent);
    return true;
  } catch {
    return false;
  }
}
function recruiterSignInIntent() {
  try { return sessionStorage.getItem(recruiterIntentKey) || ""; }
  catch { return ""; }
}
function clearRecruiterSignInIntent() {
  try { sessionStorage.removeItem(recruiterIntentKey); } catch {}
}
function applyRecruiterInviteHash() {
  const match=recruiterInviteHash.exec(location.hash);
  if (!match) return false;
  pendingRecruiterToken=match[1];
  recruiterNotice="";
  if (rememberRecruiterSignIn()) history.replaceState(null,"","#recruiter-login");
  return true;
}

function employerDashboardAccess() {
  return employerAccess?.company_id==="northline" || Boolean(employerAccess?.can_invite);
}
function accountLandingPage() {
  if (employerAccess?.can_invite) return "adminConsole";
  if (employerDashboardAccess()) return "employerWorkspace";
  return "home";
}

function employerWorkspace() {
  const preview=employerAccess?.company_id!=="northline";
  return northlineDemoPage(`
    ${header(employerDemoCompany,preview ? "Employer demo · Admin preview" : "Employer demo · Recruiter access",
      '<a class="btn" href="#northline-application">Candidate view</a>')}
    <p class="notice">This is a fictional opening. Work samples, reviews, and decisions stay in this browser.</p>
    <section class="panel panel-pad flow" aria-labelledby="demo-employer-opening">
      <div><h2 id="demo-employer-opening">${starter.role}</h2><p class="subtle">Work sample · ${starter.title}</p></div>
    </section>
    ${northlineReviewQueue()}
  `,true);
}
function adminConsole() {
  const invite=preparedRecruiterInvite;
  return `<div class="account-shell">
    <header class="account-header">${brand()}${accountMenu()}</header>
    <main id="main" class="page reading flow" tabindex="-1">
      ${header("Admin console","Manage access to the recruiter demo.")}
      <form class="panel panel-pad form" data-form="recruiter-invite" aria-labelledby="recruiter-invite-heading">
        <div><h2 id="recruiter-invite-heading">Invite a recruiter</h2>
          <p class="subtle">Grant access to the ${employerDemoCompany} demo workspace.</p></div>
        <div class="field"><label for="recruiter-email">Recruiter’s Google email</label><input id="recruiter-email" type="email" name="email" required maxlength="254" autocomplete="email" value="${safe(invite?.email)}"></div>
        <p class="subtle">The invite link expires after seven days. Give the same email viewer access to the private site.</p>
        <p class="error" data-error hidden></p>
        <div class="actions"><button class="btn primary">Prepare invitation</button></div>
      </form>
      ${invite ? `<section class="panel panel-pad flow" aria-labelledby="recruiter-invite-ready">
        <h2 id="recruiter-invite-ready">Invitation ready</h2><p>Recipient ${safe(invite.email)}</p>
        <p class="subtle" id="recruiter-delivery-status" role="status">${safe(invite.status)}</p>
        <div class="actions">${invite.sent ? "" : button("Send email","send-recruiter-invite","","primary")}
          <a class="btn" href="${safe(invite.emailDraft)}">Open email draft</a>${button("Copy invite link","copy-recruiter-invite")}</div>
      </section>` : ""}
    </main>
  </div>`;
}
async function prepareRecruiterInvite(form,data) {
  if (!employerAccess?.can_invite) return;
  const user=signedInCandidate;
  const email=clean(data.get("email"));
  if (!fits(email,3,254) || !form.elements.email.validity.valid) return fail(form,"Enter the email address for the recruiter’s Google account.");
  const submit=form.querySelector("button");
  if (submit.disabled) return;
  submit.disabled=true;
  try {
    const invite=await candidateAuth.createRecruiterInvite(email);
    if (signedInCandidate!==user || !form.isConnected) return;
    if (!recruiterInviteHash.test("#recruiter-invite="+invite.token)) throw Error("Invalid invitation response");
    const link=new URL("/",location.origin);
    link.hash="recruiter-invite="+invite.token;
    const subject=`Recruiter invitation from ${employerDemoCompany} (Proof of Skill demo)`;
    const body=`Hi,\n\nNorthline Field Systems invites you to try its fictional recruiter workspace on Proof of Skill.\n\nAccept your invitation: ${link.href}\n\nUse the Google email that received this message. If the private site asks you to sign in first, sign in with your viewer account and reopen this link.\n\nThis invitation expires after seven days.\n\nNorthline Field Systems\nProof of Skill demo`;
    const emailDraft=`mailto:${encodeURIComponent(invite.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    preparedRecruiterInvite={email:invite.email,token:invite.token,link:link.href,emailDraft,status:""};
    render();
    notify("Invitation prepared.");
  } catch (error) {
    if (form.isConnected) fail(form,error.code==="23505" ? "This address already has recruiter access." : "The invitation couldn’t be prepared. Try again.");
  } finally { submit.disabled=false; }
}
async function sendPreparedRecruiterInvite(control) {
  const invite=preparedRecruiterInvite;
  if (!employerAccess?.can_invite || !invite || invite.sent || control.disabled) return;
  control.disabled=true;
  try {
    const code=await candidateAuth.sendRecruiterInvite(invite.email,invite.token);
    if (code==="sent") {
      invite.sent=true;
      invite.status="Invitation sent.";
    } else if (code==="sender_not_configured") {
      invite.status="Automatic delivery needs a verified email sender. You can send this invitation from your email app.";
    } else invite.status="The email service couldn’t confirm delivery. Try again or open the email draft.";
  } catch {
    invite.status="The email service couldn’t confirm delivery. Try again or open the email draft.";
  } finally {
    control.disabled=false;
  }
  if (preparedRecruiterInvite===invite && page==="adminConsole") {
    const statusLine=app.querySelector("#recruiter-delivery-status");
    if (statusLine) statusLine.textContent=invite.status;
    if (invite.sent) control.hidden=true;
  }
}
async function acceptRecruiterInvite(token) {
  try {
    const companyId=await candidateAuth.acceptRecruiterInvite(token);
    if (companyId!=="northline") throw Error("Unknown employer");
    return companyId;
  } catch {
    return null;
  }
}
async function claimRecruiterInvite(control) {
  const user=signedInCandidate;
  const token=pendingRecruiterToken;
  if (!user || !token || control.disabled) return;
  control.disabled=true;
  const companyId=await acceptRecruiterInvite(token);
  if (signedInCandidate!==user || pendingRecruiterToken!==token) return;
  if (finishRecruiterAcceptance(companyId)) go("employerWorkspace");
  else if (page==="employerSignIn") render();
}
async function switchRecruiterAccount(control) {
  if (!signedInCandidate || page!=="employerSignIn" || control.disabled) return;
  control.disabled=true;
  const error=app.querySelector("#google-error");
  try {
    await candidateAuth.signOut();
    recruiterNotice="";
    if (signedInCandidate) leaveCandidateAccount("employerSignIn");
    else go("employerSignIn");
  } catch {
    if (!signedInCandidate) go("employerSignIn");
    else {
      control.disabled=false;
      error.textContent="Couldn’t switch accounts. Try again.";
      error.hidden=false;
    }
  }
}
function finishRecruiterAcceptance(companyId) {
  if (!companyId) {
    recruiterNotice="This invitation is unavailable for the Google account you used. Try the invited email or ask for a new link.";
    return false;
  }
  employerAccess={...employerAccess,company_id:companyId};
  pendingRecruiterToken="";
  recruiterNotice="";
  clearRecruiterSignInIntent();
  return true;
}
function accountAccessPage(next) {
  if (next==="adminConsole" && !employerAccess?.can_invite) return signedInCandidate ? accountLandingPage() : "login";
  if ((next==="employerWorkspace" || northlineReviewPages.has(next)) && !employerDashboardAccess()) return "employerSignIn";
  if (next==="northlineApplication" && !signedInCandidate) return "login";
  if (next==="employerSignIn" && employerDashboardAccess() && !pendingRecruiterToken) return "employerWorkspace";
  if ((next==="login" || next==="register") && signedInCandidate) return accountLandingPage();
  return next;
}
