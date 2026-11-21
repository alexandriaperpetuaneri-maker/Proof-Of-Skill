
"use strict";

const icons = {
  mark: '<path d="M5 12l4 4 10-10M7 6h5M5 21h14"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8m-8 4h6"/>',
  inbox: '<path d="M4 5h16l2 9v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5z"/><path d="M2 14h6l2 3h4l2-3h6"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  rubric: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 4V2h6v2M8 10h8m-8 4h8m-8 4h4"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  check: '<path d="m5 12 5 5L19 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  link: '<path d="m9 15 6-6m-7 8-1 1a3.5 3.5 0 0 1-5-5l5-5a3.5 3.5 0 0 1 5 0m4-1 1-1a3.5 3.5 0 1 1 5 5l-5 5a3.5 3.5 0 0 1-5 0"/>',
  person: '<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const safe = escapeHtml;
const clean = value => String(value ?? "").trim();
const fits = (value, min, max) => typeof value === "string" && value.trim().length >= min && value.length <= max;

const criteria = [
  {name:"Problem framing", prompt:"Identify the main problem. Use facts from the brief to explain why it matters.", strong:"Connects evidence to the core problem and distinguishes symptoms from likely causes."},
  {name:"Prioritization", prompt:"Choose what to do first and what can wait. Explain the trade-off.", strong:"Orders actions by urgency and impact, and explains what can wait and why."},
  {name:"Execution plan", prompt:"Outline a plan with owners, timing, and a way to confirm progress.", strong:"Assigns realistic owners and timing, and specifies a measurable checkpoint."},
  {name:"Communication", prompt:"Write a short update for the customer or project sponsor.", strong:"Explains impact, next steps, and when the reader will receive another update."}
];
const levels = ["", "Missing or off-base", "Partial", "Adequate", "Strong", "Specific and convincing"];
const rolloutGlossary = [
  {term:"Go-live",definition:"when people start using the new system for real work"},
  {term:"Dispatch",definition:"assigning jobs to the people who will do them"},
  {term:"Blocker",definition:"a problem that prevents work from moving forward"},
  {term:"Dependency",definition:"something that needs to happen before another task can proceed"},
  {term:"Fallback",definition:"a backup plan if the original plan fails"},
  {term:"Go/no-go decision",definition:"the decision to proceed as planned or hold off"}
];
const starter = {
  id:"rollout", title:"The rollout rescue", role:"Implementation Coordinator", minutes:25,
  brief:"You're coordinating a rollout of scheduling software for a fictional field-services company. Go-live is Friday. On Tuesday morning, you learn that 14 of 60 imported technician records are missing an assigned region. Payroll says the old system can stay on for one more week if notified by Wednesday at noon. Only 8 of 24 shift leads have finished training. The operations director wants to keep Friday's launch.",
  exhibit:"Your team can spare one engineer for four hours on Wednesday. The customer's staffing lead can confirm region assignments by 10 a.m. Wednesday. A region field is required for dispatch. The training lead can host one additional 30-minute session before Friday.",
  glossary: rolloutGlossary
};
const demoResponses = [
  ["Dispatch readiness is the immediate risk. Without regions, 14 of 60 technicians cannot be routed. Low shift-lead training coverage raises the risk that even a technically clean launch struggles in the field.",
   "Fix region mapping first. Keep the Friday date tentative and tell payroll by noon Wednesday to hold the fallback. Keep noncritical training content for after launch.",
   "The staffing lead confirms regions by Wednesday at 10. The engineer imports fixes and verifies a 60/60 dispatch match by Thursday morning. The training lead runs one live session and collects attendance. Ops makes a go/no-go call at 3 p.m. Thursday.",
   "Friday remains the target. We found 14 region assignments that could block dispatch and are fixing them Wednesday. We will preserve a one-week fallback and confirm the launch decision Thursday at 3 p.m."],
  ["We have a data problem and a training problem. Fourteen people are missing regions. Sixteen leads have not completed training.",
   "Ask the staffing lead to correct the region list before training. Tell payroll we may need to postpone.",
   "I would ask engineering to fix the missing fields by Thursday and check that dispatch works for each technician. The training team can schedule another session.",
   "We are fixing an issue with region assignments and scheduling a training session. We will share an update by Thursday."],
  ["Fourteen technicians can't receive dispatch assignments with the current import. Training is a separate readiness gap because only one-third of leads have completed it.",
   "Preserve the payroll fallback before the deadline. Start region correction Wednesday and use the extra session for leads likely to work on launch day.",
   "Customer staffing confirms regions Wednesday at 10, and engineering runs the correction. Test dispatch for all 60 accounts before committing to Friday. Ask ops to own the final decision.",
   "We are holding Friday as a target while we verify dispatch. Payroll will keep the fallback available. I will update you Thursday with a go/no-go decision."],
  ["The missing regions can block dispatch, and training attendance is low.",
   "I would fix dispatch first because it is required for techs to receive assignments. I would also ask payroll to hold the old system.",
   "Engineering updates the list and I verify the changed records before go-live. Training sends a reminder to the leads.",
   "We have a risk to Friday's launch. We will share a decision once we have checked the corrected data."]
];
const seed = {
  assessments:[starter],
  drafts:{},
  poolDrafts:{},
  companies:[
    {id:"northline",name:"Northline Field Systems",sample:true},
    {id:"civicloop",name:"CivicLoop Software",sample:true}
  ],
  interviewRequests:[],
  applicantIds:[],
  receipt:null,
  submissions:demoResponses.map((answers,index) => ({
    id:`sample-${index}`, assessmentId:starter.id, code:`PS-10${4-index}`,
    date:["2026-11-19T14:20:00Z","2026-11-18T20:50:00Z","2026-11-18T15:12:00Z","2026-11-17T19:00:00Z"][index],
    answers, sample:true,poolOptIn:index>=2,
    review:index < 2 ? null : {
      scores:index === 2 ? [5,4,4,5] : [4,3,3,4],
      notes:index === 2 ? "Clear launch risk and customer update. Add a precise training checkpoint and name the owner for notifying payroll." : "Good recognition of the dispatch risk. Add a time for the fallback request and define what should happen if readiness checks fail."
    }
  }))
};
const invitation = readInvitation();
const key = invitation.mode ? "proof-of-skill-candidate-v1:" + (invitation.assessment?.id ?? "invalid") : "proof-of-skill-v1";
let storageAvailable = true;
function readState() {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : freshState();
  } catch {
    storageAvailable = false;
    return freshState();
  }
}
let state = readState();
const demoWorkspace = state;
const candidateAuth = window.proofOfSkillCandidateAuth;
let signedInCandidate = null;
let candidateAuthNotice = "";
let candidateSessionNotice = "";
let candidateIdleTimer = null;
let canReviewRollout = false;
let rolloutAttempt = null;
let rolloutDraftDirty = false;
let candidateWorkBusy = false;
const openingDrafts = new Map();
const dirtyOpeningDrafts = new Set();
const rolloutQueuePageSize = 25;
let rolloutQueue = {rows:[],offset:0,hasNext:false,loading:false,error:""};
let selectedRolloutReview = null;
const demoRoles = {candidate:"Job Hunter",recruiter:"Recruiter"};
state.poolDrafts ??= {};
state.companyDrafts ??= {};
if (!invitation.mode) {
  state.companies ??= structuredClone(seed.companies);
  state.interviewRequests ??= [];
  state.applicantIds ??= [];
  state.profile ??= {name:"",roles:[],intro:""};
  state.outreach ??= {scope:"off", blocked:[]};
  state.demoAccounts ??= {};
  state.jobs ??= sampleJobs();
  for (const item of state.submissions) {
    if (item.sample && item.poolOptIn === undefined) {
      item.poolOptIn = seed.submissions.find(sample => sample.id === item.id)?.poolOptIn ?? false;
    }
  }
}
function freshState() {
  return invitation.mode ? {drafts:{},receipt:null} : structuredClone(seed);
}
function persist() {
  if (signedInCandidate) return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}
const views = {home:"Home", login:"Sign in", register:"Create account", overview:"Overview", company:"Company workspace", jobs:"Job openings", jobDetail:"Opening details", manageJobs:"Manage openings", jobEditor:"Opening draft", confirmJob:"Confirm opening", pools:"Talent pools", assessments:"Assessments", submissions:"Submissions", candidate:"Candidate view", careers:"Choose a career", profile:"My profile", candidacy:"My candidacy", rubric:"Review rubric", create:"New assessment", review:"Review submission", complete:"Submission receipt"};
const publicRoutes = new Map([["#home","home"],["#login","login"],["#create-account","register"],["#recruiter-login","employerSignIn"],["#recruiter-create-account","recruiterRegister"],["#workspace","overview"],["#company-workspace","company"],["#jobs","jobs"],["#manage-openings","manageJobs"],["#work-samples","assessments"],["#choose-a-career","careers"],["#talent-pools","pools"],["#my-profile","profile"],["#my-candidacy","candidacy"]]);
Object.assign(views,{employerWorkspace:"Employer workspace",employerSignIn:"Employer sign in",adminConsole:"Admin console",recruiterDemo:"Recruiter demo",recruiterRegister:"Create recruiter account"});
publicRoutes.set("#employer-workspace","employerWorkspace");
publicRoutes.set("#admin","adminConsole");
publicRoutes.set("#employer-invites","adminConsole");
publicRoutes.set("#recruiter-demo","recruiterDemo");
views.rolloutReviews = "Assessment reviews";
publicRoutes.set("#assessment-reviews","rolloutReviews");
if (!invitation.mode) {
  views.northlineApplication="Northline demo application";
  publicRoutes.set(northlineApplicationHash,"northlineApplication");
  for (const [view,person] of northlineReviewPages) {
    views[view]=`Review ${person.code}`;
    publicRoutes.set(`#northline-review-${person.id}`,view);
  }
}
const nav = [
  ["overview","grid"],["company","person"],["jobs","file"],["pools","person"],["assessments","file"],["submissions","inbox"],["rubric","rubric"],
  ["profile","person"],["careers","eye"],["candidacy","inbox"]
];
const app = document.querySelector("#app");
const status = document.querySelector("#status");
const sessionWarning = document.querySelector("#session-warning");
let noticeTimer;
function notify(message) {
  status.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {status.textContent = "";}, 4500);
}
function validAssessment(item) {
  return !!item && fits(item.id,1,80) && /^[a-z0-9-]+$/.test(item.id) && fits(item.title,1,90) &&
    fits(item.role,1,80) && Number.isInteger(item.minutes) && item.minutes >= 5 && item.minutes <= 120 &&
    fits(item.brief,10,2200) && typeof item.exhibit === "string" && item.exhibit.length <= 1200 &&
    (item.glossary === undefined || validGlossary(item.glossary));
}
function validGlossary(entries) {
  return Array.isArray(entries) && entries.length<=12 &&
    entries.every(entry=>entry && fits(entry.term,2,48) && /^[\p{L}\p{N}][\p{L}\p{N} /'’-]*[\p{L}\p{N}]$/u.test(entry.term) &&
      fits(entry.definition,3,180)) &&
    new Set(entries.map(entry=>entry.term.toLowerCase())).size===entries.length;
}
function parseGlossary(value) {
  return value.split(/\r?\n/).map(clean).filter(Boolean).map(line=>{
    const divider=line.indexOf("|");
    if (divider<0) return {term:line,definition:""};
    return {term:clean(line.slice(0,divider)),definition:clean(line.slice(divider+1))};
  });
}
function glossaryFor(assessment) {
  return assessment.glossary ?? (assessment.id === starter.id ? rolloutGlossary : []);
}
function assessmentBrief(assessment) {
  const glossary=glossaryFor(assessment);
  const pending=new Map(glossary.map(entry=>[entry.term.toLowerCase(),entry.definition]));
  const alternatives=[...pending.keys()].sort((a,b)=>b.length-a.length);
  const match=alternatives.length ? new RegExp("(?<![\\p{L}\\p{N}])(?:" + alternatives.join("|") + ")(?![\\p{L}\\p{N}])","giu") : null;
  function annotate(text) {
    let output="";
    let from=0;
    for (const occurrence of match ? text.matchAll(match) : []) {
      const term=occurrence[0];
      const key=term.toLowerCase();
      if (!pending.has(key)) continue;
      output+=safe(text.slice(from,occurrence.index)) + `<dfn>${safe(term)}</dfn> <span class="inline-definition">(${safe(pending.get(key))})</span>`;
      pending.delete(key);
      from=occurrence.index+term.length;
    }
    return output + safe(text.slice(from));
  }
  return `<p class="text-block">${annotate(assessment.brief)}</p>
    ${assessment.exhibit ? `<div class="response-block"><h3>Supporting facts</h3><p class="text-block">${annotate(assessment.exhibit)}</p></div>` : ""}
    ${glossary.length ? `<details class="brief-detail glossary">
      <summary>Plain-language glossary (${glossary.length} ${glossary.length === 1 ? "term" : "terms"})</summary>
      <dl>${glossary.map(entry=>`<div><dt>${safe(entry.term)}</dt><dd>${safe(entry.definition)}</dd></div>`).join("")}</dl>
    </details>` : ""}`;
}
function readInvitation() {
  const embedded = document.querySelector('meta[name="assessment-packet"]');
  if (!embedded && !location.hash.startsWith("#invite=")) return {mode:false};
  try {
    const data = embedded?.content ?? location.hash.slice(8);
    if (data.length > 50000 || !/^[A-Za-z0-9_-]+$/.test(data)) throw Error("invalid invite");
    const bytes = Uint8Array.from(atob(data.replace(/-/g,"+").replace(/_/g,"/")), char => char.charCodeAt(0));
    const assessment = JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
    if (!validAssessment(assessment)) throw Error("invalid assessment");
    return {mode:true, assessment};
  } catch {
    return {mode:true, assessment:null};
  }
}
let page = invitation.mode ? (invitation.assessment && state.receipt ? "complete" : "candidate") :
  applyRecruiterInviteHash() ? "employerSignIn" : publicRoutes.get(location.hash) ?? "home";
let selectedAssessment = invitation.assessment?.id ?? starter.id;
let selectedSubmission = null;
let selectedJobId = null;
let editingJobId = null;
let newJobSource = "careers";
let candidateJobId = null;
let selectedCareer = "";
let submissionJobId = null;
let jobFilter = ["","all"];
let receipt = invitation.mode ? state.receipt : null;
let filter = "all";
let poolRole = starter.role.toLowerCase();
let poolBand = "all";
let poolCompanyId = state.companies?.[0]?.id;
let previewCompanyId = state.companies?.[0]?.id;
let editingProfile = false;
let savingProfile = false;
const maxProfileSkills = 8;
const maxProfileSkillLength = 50;
const maxProfileExperienceLength = 600;
let candidateLinkPreview = null;
const assessmentById = id => state.assessments.find(a => a.id === id);
const dateLabel = date => new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(date));
const total = review => review.scores.reduce((a,b) => a+b,0);
const corePoints = raw => raw * 90 / (criteria.length * 5);
const maxCompanyQuestions = 3;
const companyPromptLimit = 320;
const companyAnswerLimit = 1600;
const button = (label,action,id="",style="",symbol="") => `<button type="button" class="btn ${style}" data-action="${action}" data-id="${safe(id)}">${symbol ? icon(symbol) : ""}${label}</button>`;
const header = (title,description,actions="") => `<header class="page-head"><div><h1>${title}</h1><p>${description}</p></div>${actions && `<div class="actions">${actions}</div>`}</header>`;
const brand = () => `<a class="brand" href="#home" aria-label="Proof of Skill home"><span class="logo">${icon("mark")}</span>Proof of Skill</a>`;
function accountMenu(conventionalClass="btn") {
  return `<details class="account-menu">
    <summary class="${conventionalClass}">Account</summary>
    <div class="account-menu-links">
      <a href="#home">Candidate workspace</a>
      <a href="#employer-workspace">Employer workspace</a>
      <a href="#northline-application">Northline demo application</a>
      ${employerAccess?.can_invite ? '<a href="#admin">Admin console</a>' : ""}
      ${canReviewRollout ? '<a href="#assessment-reviews">Assessment reviews</a>' : ""}
      <button type="button" data-action="candidate-logout">Log out</button>
    </div>
  </details>`;
}
function home() {
  const role = signedInCandidate ? "candidate" : state.demoRole;
  const guestEntries = [
    ["#jobs","Job openings","peaks"],
    ["#choose-a-career","Work samples","dunes"],
    ["#talent-pools","Talent pools","glacier"]
  ];
  const entries = role==="recruiter" ? [["#company-workspace","Company workspace","peaks"],["#manage-openings","Manage openings","dunes"],["#talent-pools","Talent pools","glacier"]] :
    role==="candidate" ? [guestEntries[0],guestEntries[1],["#my-candidacy","My candidacy","glacier"]] : guestEntries;
  const links = role==="recruiter" ? entries : role==="candidate" ? [...entries,["#my-profile","My profile"]] :
    [entries[0],entries[2],["#my-profile","My profile"],["#employer-workspace","For employers"],["#workspace","Workspace"]];
  return `<div class="blue-home">
    <header class="blue-nav">
      <a href="#home" class="blue-wordmark" aria-label="Proof of Skill home">Proof of Skill</a>
      <nav aria-label="Main navigation">
        ${links.map(([url,label])=>`<a href="${url}">${label}</a>`).join("")}
      </nav>
      ${signedInCandidate ? accountMenu("blue-login") : role ? '<button type="button" class="blue-login" data-action="demo-logout">Log out</button>' : '<a class="blue-login" href="#login">Log in</a>'}
    </header>
    <main id="main" tabindex="-1">
      <section class="blue-hero" aria-labelledby="blue-heading">
        <div class="blue-copy">
          <h1 id="blue-heading">Show what<br>you can do.</h1>
          <a href="${role==="recruiter" ? "#company-workspace" : "#jobs"}" class="blue-action">${role==="recruiter" ? "Open company workspace" : "Browse openings"}</a>
        </div>
      </section>
      <nav class="blue-entries" aria-label="Explore Proof of Skill">
        ${entries.map(([url,label,terrain])=>`<a class="blue-entry ${terrain}" href="${url}"><span>${label}</span></a>`).join("")}
      </nav>
    </main>
  </div>`;
}
function demoLogin(register) {
  return `<div class="account-shell">
    <header class="account-header"><a href="#home" class="blue-wordmark" aria-label="Proof of Skill home">Proof of Skill</a><a href="#home">Back to home</a></header>
    <main id="main" class="account-layout" tabindex="-1">
      <div class="account-art" aria-hidden="true"></div>
      <section class="account-card flow">
        <h1>${register ? "Create browser-only recruiter account" : "Browser-only recruiter demo"}</h1>
        <p class="subtle">Try the hiring workspace with a fictional profile saved in this browser.</p>
        <form class="form" data-form="demo-login" data-register="${register}">
          ${register ? '<div class="field"><label for="demo-display-name">Demo display name</label><input id="demo-display-name" name="name" maxlength="80" required autocomplete="off" placeholder="Example: Avery Chen"></div>' : ""}
          <p class="error" data-error hidden></p>
          <button class="btn primary">${register ? "Create demo account" : "Sign in"}</button>
        </form>
        <a class="account-alternate" href="${register ? "#recruiter-demo" : "#recruiter-create-account"}">${register ? "Back to browser-only demo" : "Create local demo account"}</a>
        <a class="account-alternate" href="#login">Proof of Skill sign in</a>
      </section>
    </main>
  </div>`;
}
function signIn(register) {
  const live = candidateAuth?.configured;
  const google = candidateAuth?.googleEnabled;
  const teamEmailTest = candidateAuth?.teamEmailTest;
  const employer = page==="employerSignIn";
  const joining = employer && Boolean(pendingRecruiterToken);
  const heading = joining ? "Accept your recruiter invitation" : employer ? (signedInCandidate ? "Employer workspace" : "Employer sign in") :
    candidateLinkPreview ? live ? "Check your email" : "Your sign-in link preview" : register ? "Create account" : "Sign in";
  const intro = joining ? `Use the Google address that received your ${employerDemoCompany} invitation.` :
    employer ? (signedInCandidate ?
      (employerAccess ? "This Google account needs a company invitation. Open your invite link or switch to the account that received it." :
        "Employer access couldn’t be verified. Refresh the page to try again.") :
      "Use the Google account that received your company invitation.") :
    candidateLinkPreview ? live ? "If the address is eligible, a sign-in link will arrive shortly. Open it in this browser." :
      `In a live account, this sign-in link would go to <strong>${safe(candidateLinkPreview.email)}</strong>. Try it here to continue in the demo.` :
      google ? "" : live ? "Sign in with a link sent to your email." : "Use a sample email address to preview passwordless sign-in.";
  const googleButton = `<div class="candidate-provider flow">
    <button class="btn google-sign-in" type="button" data-action="candidate-google" ${google ? "" : "disabled"}><img src="vendor/google-g.png" width="18" height="18" alt="">Continue with Google</button>
    <p class="error" id="google-error" role="alert" hidden></p>
  </div>`;
  return `<div class="account-shell candidate-sign-in">
    <header class="account-header"><a href="#home" class="blue-wordmark" aria-label="Proof of Skill home">Proof of Skill</a>${employer && signedInCandidate ? accountMenu() : '<a href="#home">Back to home</a>'}</header>
    <main id="main" class="candidate-sign-in-layout" tabindex="-1">
      <section class="candidate-sign-in-card flow" aria-labelledby="candidate-sign-in-heading">
        <div><h1 id="candidate-sign-in-heading" tabindex="-1">${heading}</h1>
          ${intro ? `<p class="subtle">${intro}</p>` : ""}</div>
        ${candidateSessionNotice ? `<p class="notice" role="status">${safe(candidateSessionNotice)}</p>` : ""}
        ${candidateAuthNotice ? `<p class="error" role="alert">${safe(candidateAuthNotice)}</p>` : ""}
        ${employer ? `${recruiterNotice ? `<p class="notice" role="status">${safe(recruiterNotice)}</p>` : ""}
          ${signedInCandidate ? `<p class="subtle">Signed in as ${safe(signedInCandidate.email || "your current account")}.</p>
            ${joining ? button("Accept invitation","accept-recruiter-invite","","primary") : ""}
            ${button("Use another Google account","recruiter-switch-account")}
            <p class="error" id="google-error" role="alert" hidden></p>` : googleButton}
          ${!joining && !signedInCandidate ? '<a class="account-alternate" href="#company-workspace">Preview a sample company</a>' : ""}` :
        candidateLinkPreview ? `<div class="flow">${live ? "" : '<button type="button" class="btn primary" data-action="candidate-demo-link">Open demo sign-in link</button>'}
          <button type="button" class="btn text" data-action="candidate-change-email">Use another email</button></div>` : `
          ${google ? `${googleButton}<details class="sign-in-options"><summary>Continue with email</summary>` : ""}
          <form class="form" data-form="candidate-login">
            ${register ? '<div class="field"><label for="candidate-login-name">Display name</label><input id="candidate-login-name" name="name" maxlength="80" required autocomplete="off" placeholder="Example: Avery Chen"></div>' : ""}
            <div class="field"><label for="candidate-login-email">Email address</label><input id="candidate-login-email" name="email" type="email" maxlength="254" placeholder="you@example.com" autocomplete="off" ${teamEmailTest ? 'aria-describedby="candidate-email-test-note"' : ""} required>
              ${teamEmailTest ? '<small class="subtle" id="candidate-email-test-note">Email links in this private test go to Supabase team addresses.</small>' : ""}</div>
            <p class="error" data-error hidden></p>
            <button class="btn primary">${live ? "Email me a sign-in link" : "Preview email link"}</button>
          </form>
          ${google ? "</details>" : ""}
          <a class="account-alternate" href="${register ? "#login" : "#create-account"}">${register ? "Back to sign in" : "Create account"}</a>
          ${teamEmailTest ? '<button type="button" class="btn text" data-action="candidate-demo">Open the candidate demo</button>' : ""}`}
      </section>
    </main>
  </div>`;
}
function demoRegistration(form,role,name) {
  if (!fits(name,1,80)) return fail(form,"Enter a fictional display name.");
  if (state.demoAccounts[role]) return fail(form,"A demo account for this role already exists in this browser. Use sign in to return to it.");
  return true;
}
async function previewCandidateLink(form,data) {
  const email=clean(data.get("email"));
  const name=page==="register" ? clean(data.get("name")) : "";
  const register=page==="register";
  if (!fits(email,3,254) || !form.elements.email.validity.valid) return fail(form,"Enter a valid email address.");
  if (candidateAuth?.configured) {
    if (register && !fits(name,1,80)) return fail(form,"Enter a display name.");
    const submit=form.querySelector('button[type="submit"],button:not([type])');
    if (submit.disabled) return;
    submit.disabled=true;
    try {
      await candidateAuth.sendEmail(email,name,register);
    } catch (error) {
      if (error.code!=="otp_disabled" && error.code!=="user_not_found") {
        if (form.isConnected) fail(form,"The sign-in link couldn’t be requested. Try again in a moment.");
        return;
      }
    } finally {
      submit.disabled=false;
    }
    if (!form.isConnected) return;
  } else if (register && !demoRegistration(form,"candidate",name)) return;
  candidateAuthNotice="";
  candidateSessionNotice="";
  clearRecruiterSignInIntent();
  candidateLinkPreview={email,name};
  render();
  app.querySelector("#candidate-sign-in-heading").focus();
}
async function startGoogleSignIn(button) {
  if (!candidateAuth?.googleEnabled || button.disabled) return;
  const error=app.querySelector("#google-error");
  button.disabled=true;
  error.hidden=true;
  try {
    const employer = page==="employerSignIn";
    if (employer) {
      if (!rememberRecruiterSignIn()) throw Error("Session storage is unavailable");
    } else clearRecruiterSignInIntent();
    await candidateAuth.signInWithGoogle(employer);
  } catch {
    button.disabled=false;
    error.textContent="Google sign-in couldn’t start. Try again.";
    error.hidden=false;
  }
}
const signedInPages = new Set(["home","jobs","jobDetail","careers","candidate","profile","candidacy","complete","rolloutReviews","login","employerSignIn","employerWorkspace","adminConsole","northlineApplication"]);
if (!invitation.mode) for (const view of northlineReviewPages.keys()) signedInPages.add(view);
function enterDemoAccount(role,name="") {
  if (name) state.demoAccounts[role]={name};
  state.demoRole=role;
  persist();
  go("home");
  notify(state.demoAccounts[role] ? `Signed in as ${state.demoAccounts[role].name} · ${demoRoles[role]} demo.` : `Signed in to the ${demoRoles[role]} demo.`);
}
function sidebar() {
  if (signedInCandidate) return `<aside class="sidebar">${brand()}<nav aria-label="Candidate workspace">
    ${[["jobs","file"],["careers","eye"],["profile","person"],["candidacy","inbox"]].map(([view,symbol])=>`<button class="nav-btn" type="button" data-action="go" data-id="${view}" ${page===view ? 'aria-current="page"' : ""}>${icon(symbol)}${views[view]}</button>`).join("")}
    </nav></aside>`;
  if (page==="company" || companyReviewOpening || companyEditorDepartment) {
    return `<aside class="sidebar">${brand()}<nav aria-label="Company preview">
      <button class="nav-btn" type="button" data-action="go" data-id="company" ${page==="company" ? 'aria-current="page"' : ""}>${icon("person")}Company workspace</button>
      <button class="nav-btn" type="button" data-action="go" data-id="overview">${icon("grid")}Exit company preview</button>
    </nav><div class="sidebar-footer"><span class="workspace-mark">PS</span><div><strong>Company preview</strong><small>Browser-local data</small></div></div></aside>`;
  }
  const active = {create:"assessments",review:"submissions",candidate:"careers",complete:"careers",jobDetail:"jobs",manageJobs:"jobs",jobEditor:"jobs",confirmJob:"jobs"}[page] ?? page;
  return `<aside class="sidebar">${brand()}<nav aria-label="Workspace">
    <div class="nav-label">Hiring workspace</div>
    ${nav.map(([name,symbol]) => `${name==="profile" ? '<div class="nav-label secondary">Candidate experience</div>' : ""}<button class="nav-btn" type="button" data-action="go" data-id="${name}" ${active===name ? 'aria-current="page"' : ""}>${icon(symbol)}${views[name]}</button>`).join("")}
    </nav><div class="sidebar-footer"><span class="workspace-mark">PS</span><div><strong>Demo workspace</strong><small>Browser-local data</small></div></div></aside>`;
}
function render() {
  document.title = `${views[page]} · Proof of Skill`;
  if (page==="home") {
    app.innerHTML = home();
    return;
  }
  if (page==="login" || page==="register" || page==="employerSignIn") {
    app.innerHTML=signIn(page==="register");
    return;
  }
  if (page==="employerWorkspace" || page==="adminConsole") {
    app.innerHTML=page==="employerWorkspace" && employerDashboardAccess() ? employerWorkspace() :
      page==="adminConsole" && employerAccess?.can_invite ? adminConsole() : signIn(false);
    return;
  }
  if (!invitation.mode && page==="northlineApplication") {
    app.innerHTML=signedInCandidate ? northlineApplication() : signIn(false);
    return;
  }
  if (!invitation.mode && northlineReviewPages.has(page)) {
    app.innerHTML=employerDashboardAccess() ? northlineReview(northlineReviewPages.get(page)) : signIn(false);
    return;
  }
  if (page==="recruiterDemo" || page==="recruiterRegister") {
    app.innerHTML=demoLogin(page==="recruiterRegister");
    return;
  }
  const content = page==="company" ? companyWorkspace() : {overview,jobs,jobDetail,manageJobs,jobEditor,confirmJob,pools,assessments,submissions,careers,candidate,profile,candidacy,rubric,create,review,complete,rolloutReviews}[page]();
  const candidatePage = ["profile","candidacy","careers","candidate","complete"].includes(page);
  const workspaceAvatar = candidatePage ? `<button type="button" data-action="go" data-id="profile" class="avatar profile-avatar" aria-label="My profile" ${page==="profile" ? 'aria-current="page"' : ""}>${icon("person")}</button>` : '<span class="avatar" aria-label="Reviewer workspace">R</span>';
  app.innerHTML = invitation.mode ? `<div class="invited-shell"><div class="topbar"><strong>Proof of Skill</strong><span class="status-pill">Candidate assessment</span></div><main class="page" id="main" tabindex="-1">${content}</main></div>` :
    `<div class="shell" data-page="${page}">${sidebar()}<div><div class="topbar"><div class="crumb">Workspace ${icon("chevron")} <strong>${views[page]}</strong></div><div class="topbar-end">${signedInCandidate ? accountMenu() : '<span class="status-pill">Demo</span>'}${workspaceAvatar}</div></div><main class="page" id="main" tabindex="-1">${content}</main></div></div>`;
}
function go(next, syncUrl = true) {
  if (!views[next] || (invitation.mode && !["candidate","complete"].includes(next))) return;
  if (!invitation.mode) {
    const allowed=accountAccessPage(next);
    if (allowed!==next) return go(allowed);
  }
  if (next==="rolloutReviews" && !canReviewRollout) return;
  if (signedInCandidate && !signedInPages.has(next)) return;
  if (!invitation.mode && page==="employerSignIn" && next!=="employerSignIn") {
    pendingRecruiterToken="";
    recruiterNotice="";
    clearRecruiterSignInIntent();
  }
  if (next!==page) candidateLinkPreview=null;
  if (!invitation.mode && syncUrl) {
    const route = [...publicRoutes].find(([,view])=>view===next)?.[0];
    if (route && route!==location.hash) history.pushState(null,"",route);
  }
  if (next!=="candidate") candidateJobId = null;
  if (!invitation.mode) {
    if (!["submissions","review"].includes(next) && companyReviewOpening) {
      companyReviewOpening=null;
      submissionJobId=null;
    }
    if (!["jobEditor","confirmJob"].includes(next)) companyEditorDepartment=null;
  }
  if (next!=="profile") editingProfile = false;
  if (next!=="rolloutReviews") selectedRolloutReview=null;
  page = next;
  render();
  window.scrollTo(0,0);
  app.querySelector("#main").focus({preventScroll:true});
  if (next==="rolloutReviews") void refreshRolloutQueue(0);
}
function rows(items, showAssessment = false) {
  if (!items.length) return '<p class="empty">No submissions match this view.</p>';
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="Submission table"><table>
    <thead><tr><th scope="col">Candidate</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col">Core score</th><th scope="col"><span class="visually-hidden">Action</span></th></tr></thead>
    <tbody>${items.map(item => `<tr>
      <td><div class="row-label"><span class="tiny-mark">${icon("person")}</span><div><strong>${safe(item.code)}</strong>${showAssessment ? `<div class="subtle sample">${safe(assessmentById(item.assessmentId)?.title)}${item.sample ? " · Sample" : ""}</div>` : item.sample ? '<div class="subtle sample">Sample</div>' : ""}</div></div></td>
      <td>${dateLabel(item.date)}</td>
      <td>${submissionStatus(item)}</td>
      <td>${item.review ? coreScoreText(item,item.review) : "—"}</td>
      <td><button class="link" data-action="review" data-id="${safe(item.id)}" aria-label="Review candidate ${safe(item.code)}">Open</button></td>
    </tr>`).join("")}</tbody></table></div>`;
}
function submissionStatus(item) {
  const label = item.shortlistedAt ? "Shortlisted" : item.review ? "Reviewed" : "Needs review";
  const style = item.shortlistedAt ? "neutral" : item.review ? "reviewed" : "pending";
  return `<span class="pill ${style}"><span class="dot"></span>${label}</span>`;
}
const recent = list => [...list].sort((a,b) => new Date(b.date)-new Date(a.date));
function stat(symbol,color,label,count) {
  return `<div class="stat"><span class="tile-icon ${color}">${icon(symbol)}</span><div><small>${label}</small><strong>${count}</strong></div></div>`;
}
function rubricList() {
  return `<ol class="rubric-list">${criteria.map(criterion => `<li>${icon("check")}${criterion.name}<span>5 points</span></li>`).join("")}</ol>`;
}
function overview() {
  const needed = state.submissions.filter(item=>!item.review).length;
  const demoLink = `<a class="btn primary" href="guided-demo.html">${icon("eye")}Guided demo</a>`;
  return `${header("Hiring workspace","Help companies discover candidates through work samples.",button("Set up a role","setup-role","","primary","plus") + demoLink)}
    <section class="hero" aria-labelledby="featured-heading"><div class="hero-copy">
      <span class="hero-tag">${icon("file")} Starter assessment</span>
      <h2 id="featured-heading">The rollout rescue</h2>
      <p>A customer launch is slipping. See how a candidate prioritizes the work and gets the rollout back on track.</p>
      <div class="actions">${button("Explore talent pools","go","pools","light","person")}${button("Try the assessment","preview",starter.id,"ghost","eye")}</div>
    </div><div class="hero-art" aria-hidden="true"></div></section>
    <ol class="hiring-steps" aria-label="Hiring process"><li>Complete a work sample</li><li>Join a role pool after human review</li><li>Hear from participating employers</li></ol>
    <section class="stats" aria-label="Workspace activity">
      ${stat("file","","Assessments",state.assessments.length)}
      ${stat("inbox","amber","Needs review",needed)}
      ${stat("check","green","Reviewed",state.submissions.length-needed)}
    </section>
    <div class="columns">
      <section class="panel"><header class="panel-head"><div><h2>Recent submissions</h2><p>Open a work sample to review it.</p></div>${button("View all","go","submissions","text small")}</header>${rows(recent(state.submissions).slice(0,5))}</section>
      <section class="panel panel-pad"><h2>Review rubric</h2><p class="subtle">Score each dimension from 1 to 5 based on the work submitted.</p>${rubricList()}${button("View rubric","go","rubric","small")}</section>
    </div>`;
}
const scoreBands = [
  {id:"strong",label:"16–20 points",min:16},
  {id:"solid",label:"12–15 points",min:12},
  {id:"developing",label:"4–11 points",min:4}
];
const bandFor = score => scoreBands.find(band=>score>=band.min);
const canJoinPool = item => !!item.review && item.poolOptIn === true;
const companyById = id => state.companies.find(company=>company.id===id);
const companyKey = name => clean(name).normalize("NFKC").replace(/\s+/gu," ").toLowerCase();
const employerBlocked = (name,id) => state.outreach.blocked.some(block=>
  (id && block.companyId===id) || companyKey(block.name)===companyKey(name));
const hiringCompany = company => companyById(company.clientId) ?? company;
function applicationEmployerBlocked(name,company) {
  return employerBlocked(name,company?.id) || (!!company?.clientId && employerBlocked(hiringCompany(company).name,company.clientId));
}
const outreachScopes = {
  off:"Off",
  exact:"Assessed roles only",
  related:"Assessed and related roles",
  pivots:"Also open to career pivots"
};
const roleMatches = [
  {role:"Customer Onboarding Specialist",scope:"related",skills:[2,3],reason:"The work sample shows how this candidate plans a rollout and communicates next steps to customers."},
  {role:"Service Operations Coordinator",scope:"related",skills:[1,2],reason:"The work sample shows how this candidate prioritizes service risks and coordinates follow-through."},
  {role:"Incident Intake Coordinator",scope:"pivots",skills:[0,1],reason:"The work sample shows how this candidate sorts evidence and decides which issues need attention first."}
];
function recruitmentMatch(item, company, role) {
  if (!canJoinPool(item) || !company) return null;
  const ownsSample = state.applicantIds.includes(item.id);
  if (!ownsSample && !item.sample) return null;
  const scope = ownsSample ? state.outreach.scope : "pivots";
  if (scope==="off") return null;
  if (ownsSample && [company,hiringCompany(company)].some(employer=>employerBlocked(employer.name,employer.id))) return null;
  const assessment = assessmentById(item.assessmentId);
  if (!assessment) return null;
  if (assessment.role.toLowerCase()===role) return {scope:"exact"};
  if (scope==="exact" || assessment.id!==starter.id) return null;
  return roleMatches.find(match=>match.role.toLowerCase()===role &&
    (match.scope==="related" || scope==="pivots") &&
    match.skills.every(index=>item.review.scores[index]>=4)) ?? null;
}
function requestStillAllowed(request, item) {
  if (request.jobId) return request.jobId===item.jobId && !!item.review && !applicationEmployerBlocked(request.companyName,companyById(request.companyId));
  const role = request.role ?? assessmentById(item.assessmentId)?.role.toLowerCase();
  return !!recruitmentMatch(item,companyById(request.companyId),role);
}
function withdrawUnavailableRequests() {
  state.interviewRequests = state.interviewRequests.filter(request=>{
    if (request.status!=="pending" || !state.applicantIds.includes(request.submissionId)) return true;
    const item = state.submissions.find(entry=>entry.id===request.submissionId);
    return item && requestStillAllowed(request,item);
  });
}
function employerLabel(company) {
  if (!company) return "Employer";
  return company.clientId ? `${company.name} for ${hiringCompany(company).name}` : company.name;
}
function pools() {
  const roles = new Map(state.assessments.map(item=>[item.role.toLowerCase(),item.role]));
  roleMatches.forEach(({role})=>roles.set(role.toLowerCase(),role));
  const employer = companyById(poolCompanyId);
  const visible = recent(state.submissions).flatMap(item=>{
    const match = recruitmentMatch(item,employer,poolRole);
    return match && (poolBand==="all" || bandFor(total(item.review)).id===poolBand) ? [{item,match}] : [];
  });
  const direct = visible.filter(({match})=>match.scope==="exact");
  const suggested = visible.filter(({match})=>match.scope!=="exact");
  return `${header("Talent pools","Discover people through role-specific work samples.",button("My candidacy","go","candidacy","","person"))}
    <div class="columns">
      <section class="flow" aria-label="Pool candidates">
        <div class="panel panel-pad pool-filters">
          <div class="field"><label for="pool-employer">View as employer</label><select id="pool-employer">${state.companies.map(company=>`<option value="${safe(company.id)}" ${company.id===poolCompanyId ? "selected" : ""}>${safe(employerLabel(company))}</option>`).join("")}</select></div>
          <div class="field"><label for="pool-role">Role</label><select id="pool-role">${Array.from(roles,([value,label])=>`<option value="${safe(value)}" ${value===poolRole ? "selected" : ""}>${safe(label)}</option>`).join("")}</select></div>
          <div class="field"><label for="pool-band">Score range</label><select id="pool-band"><option value="all">All scores</option>${scoreBands.map(band=>`<option value="${band.id}" ${band.id===poolBand ? "selected" : ""}>${band.label}</option>`).join("")}</select></div>
        </div>
        <h2>Assessed for this role</h2>
        ${direct.length ? direct.map(({item,match})=>poolCard(item,employer,roles.get(poolRole),match)).join("") : '<p class="panel empty">No assessed candidates match this view yet.</p>'}
        <h2>Suggested matches</h2>
        ${suggested.length ? suggested.map(({item,match})=>poolCard(item,employer,roles.get(poolRole),match)).join("") : '<p class="panel empty">No candidates with transferable work samples match this view yet.</p>'}
      </section>
      <aside class="flow">
        <section class="panel panel-pad flow">
          <div><h2>Participating employers</h2><p class="subtle">Employers agree to consider nontraditional backgrounds and review work samples before résumés.</p></div>
          <ul class="rubric-list employer-list">${state.companies.map(company=>`<li>${icon("check")}${safe(employerLabel(company))}${company.sample ? "<span>Demo</span>" : ""}</li>`).join("")}</ul>
          <form class="form" data-form="company">
            <div class="field"><label for="company-name">Company name</label><input id="company-name" name="company" required maxlength="80" placeholder="Enter a demo company"></div>
            <div class="field"><label for="company-client">Recruiting on behalf of (optional)</label><select id="company-client" name="client"><option value="">Hiring directly</option>${state.companies.filter(company=>!company.clientId).map(company=>`<option value="${safe(company.id)}">${safe(company.name)}</option>`).join("")}</select></div>
            <label class="consent compact"><input type="checkbox" name="pledge" required><span>I’ll review work first and consider applicants who took a nontraditional path.</span></label>
            <p class="error" data-error hidden></p>
            <div class="actions"><button class="btn">Add an employer</button></div>
          </form>
        </section>
      </aside>
    </div>`;
}
function poolCard(item, company, role, match) {
  const assessment = assessmentById(item.assessmentId);
  const request = priorRequest(item,company);
  return `<article class="panel panel-pad flow">
    <div class="pool-card-head"><div><h3>${safe(item.code)}</h3><p class="subtle">${safe(assessment.role)} · ${safe(assessment.title)}${item.sample ? " · Sample candidate" : ""}</p></div><span class="pill neutral">${total(item.review)} / 20</span></div>
    ${match.reason ? `<p class="notice"><strong>${match.scope==="pivots" ? "Career pivot" : "Related role"}</strong> · ${match.reason}</p>` : ""}
    ${workSampleEvidence(item)}
    ${request ? `<p class="subtle">${requestLabel(request)} · ${safe(request.roleLabel ?? assessment.role)}</p>` : `<form class="flow" data-form="request" data-id="${safe(item.id)}" data-role="${safe(role)}">
      <div class="actions"><button class="btn primary">Request live interview</button></div><p class="error" data-error hidden></p>
    </form>`}
  </article>`;
}
function workSampleEvidence(item) {
  return `<details class="brief-detail pool-evidence"><summary>${item.review ? "View work sample and scores" : "View work sample"}</summary>
    ${item.answers.map((answer,i)=>`<div class="response-block"><h3>${criteria[i].name}${item.review ? ` <span class="subtle">${item.review.scores[i]} / 5</span>` : ""}</h3><p class="text-block">${safe(answer)}</p></div>`).join("")}</details>`;
}
function priorRequest(item, company) {
  return state.interviewRequests.find(request=>request.submissionId===item.id && companyById(request.companyId) &&
    hiringCompany(companyById(request.companyId)).id===hiringCompany(company).id);
}
function requestLabel(request) {
  return {pending:"Requested",accepted:"Candidate interested",declined:"Candidate declined"}[request.status];
}
function candidateWorkSamples() {
  return recent(state.submissions.filter(item=>state.applicantIds.includes(item.id)));
}
function candidatePoolStatus(item) {
  if (!item.poolOptIn) return "Pool sharing off";
  if (state.outreach.scope==="off") return "Outreach off";
  return canJoinPool(item) ? "Eligible for talent pool" : "Waiting for review";
}
function profile() {
  const items = candidateWorkSamples();
  const {name,roles,intro,skills=[],experience=""} = state.profile;
  const outreach = state.outreach.scope;
  return `${header("My profile","Add your skills and experience, and revisit the work you’ve submitted.",button("My candidacy","go","candidacy","","inbox"))}
    <div class="columns profile-columns">
      <div class="flow">
        <section class="panel panel-pad flow" aria-labelledby="profile-details-heading">
          ${editingProfile ? `<h2 id="profile-details-heading">Edit profile</h2>
            <p class="subtle" id="profile-privacy">These details are visible in your candidate workspace.</p>
            <form class="form" data-form="profile" aria-describedby="profile-privacy">
              <div class="field"><label for="profile-name">Display name</label><input id="profile-name" name="name" maxlength="80" value="${safe(name)}"></div>
              <div class="field"><label for="profile-roles">Career interests</label><small id="profile-roles-help">Enter up to eight roles, one per line.</small><textarea id="profile-roles" name="roles" maxlength="648" aria-describedby="profile-roles-help" placeholder="Implementation Coordinator">${safe(roles.join("\n"))}</textarea></div>
              <div class="field"><label for="profile-intro">About me</label><textarea id="profile-intro" name="intro" maxlength="400" placeholder="What kind of work would you like to do next?">${safe(intro)}</textarea></div>
              <div class="field"><label for="profile-skills">Skills</label><small id="profile-skills-help">Enter up to ${maxProfileSkills} skills, one per line.</small><textarea id="profile-skills" name="skills" maxlength="${maxProfileSkills*(maxProfileSkillLength+1)}" aria-describedby="profile-skills-help" placeholder="Process improvement">${safe(skills.join("\n"))}</textarea></div>
              <div class="field"><label for="profile-experience">Experience</label><textarea id="profile-experience" name="experience" maxlength="${maxProfileExperienceLength}" placeholder="Describe work, projects, or volunteer experience.">${safe(experience)}</textarea></div>
              <p class="error" data-error hidden></p>
              <div class="actions"><button class="btn primary">Save profile</button>${button("Cancel","cancel-profile")}</div>
            </form>` : `<header class="profile-heading"><div class="profile-identity"><span class="profile-mark">${icon("person")}</span><div><h2 id="profile-details-heading">${safe(name || "Your candidate profile")}</h2></div></div>${savingProfile ? '<span class="subtle" role="status">Saving profile…</span>' : button("Edit profile","edit-profile","","small")}</header>
            ${intro ? `<p class="text-block">${safe(intro)}</p>` : ""}
            <div><h3>Career interests</h3>${roles.length ? `<ul class="profile-roles">${roles.map(role=>`<li>${safe(role)}</li>`).join("")}</ul>` : '<p class="subtle">Add the roles you’re interested in exploring.</p>'}</div>
            ${skills.length ? `<div><h3>Skills</h3><ul class="profile-roles">${skills.map(skill=>`<li>${safe(skill)}</li>`).join("")}</ul></div>` : ""}
            ${experience ? `<div><h3>Experience</h3><p class="text-block">${safe(experience)}</p></div>` : ""}`}
        </section>
        <section class="flow" aria-labelledby="my-samples-heading">
          <header class="profile-heading"><h2 id="my-samples-heading">My work samples</h2><div class="actions">
            ${signedInCandidate && items.some(isRolloutWork) ? button("Refresh results","refresh-rollout-results","","small") : ""}
            ${button("Try an assessment","go","careers","small","eye")}</div></header>
          ${savedRolloutDraft() ? `<article class="panel panel-pad profile-heading"><div><h3>${safe(starter.title)}</h3><p class="subtle">Draft saved to your account</p></div>${button("Resume draft","preview",starter.id,"small","file")}</article>` : ""}
          ${signedInCandidate ? state.jobs.filter(job=>savedOpeningDraft(job.id) && jobStatus(job)==="open")
            .map(job=>`<article class="panel panel-pad profile-heading"><div><h3>${safe(job.title)}</h3><p class="subtle">${safe(job.company)} · Practice draft</p></div>${button("Resume draft","job-apply",job.id,"small","file")}</article>`).join("") : ""}
          ${items.length ? items.map(profileSample).join("") : '<p class="panel empty">Your submitted work samples and review feedback will appear here.</p>'}
        </section>
      </div>
      ${signedInCandidate ? '<aside class="panel panel-pad"><h2>Account storage</h2><p class="subtle">Your profile is private. Assigned reviewers can see the rollout responses you submit under your candidate code.</p></aside>' : `<aside class="flow" aria-label="Recruiter visibility">
        <section class="panel panel-pad flow">
          <div><h2>Recruiter outreach</h2><p class="subtle">${outreachScopes[outreach]}</p></div>
          <p>Employers can see eligible work samples under a candidate code. Your profile details and reviewer feedback are private.</p>
          <div class="actions">${button("Manage outreach and blocks","go","candidacy","","person")}</div>
        </section>
        <details class="panel panel-pad profile-preview"><summary>Preview as a recruiter</summary>
          <div class="flow profile-preview-body">
            <div class="field"><label for="profile-preview-employer">View as employer</label><select id="profile-preview-employer">${state.companies.map(company=>`<option value="${safe(company.id)}" ${company.id===previewCompanyId ? "selected" : ""}>${safe(employerLabel(company))}</option>`).join("")}</select></div>
            <div id="profile-preview-results" class="flow">${profilePreview(items)}</div>
          </div>
        </details>
      </aside>`}
    </div>`;
}
function profileSample(item) {
  const assessment = assessmentById(item.assessmentId);
  const companyScore = item.review ? companyScoreText(item,item.review.companyScores) : "";
  return `<article class="panel panel-pad flow">
    <div class="profile-heading"><div><h3>${safe(assessment?.title ?? "Work sample")}</h3><p class="subtle">${safe(assessment?.role)} · Submitted ${dateLabel(item.date)} · ${safe(item.code)}</p></div>
      <span class="pill ${item.review ? "reviewed" : "pending"}">${item.review ? `Reviewed · ${coreScoreText(item,item.review)}` :
        signedInCandidate && !isRolloutWork(item) ? "Saved to account" : "Awaiting review"}</span></div>
    ${signedInCandidate ? "" : `<p class="subtle">${candidatePoolStatus(item)}</p>`}
    ${workSampleEvidence(item)}
    ${companyScore ? `<p class="subtle">Company questions · ${companyScore}</p>` : ""}
    ${item.review?.strengths ? rolloutFeedback(item.review) :
      item.review ? `<div><h4>Reviewer feedback</h4><p class="text-block">${safe(item.review.notes)}</p></div>` : ""}
  </article>`;
}
function isRolloutWork(item) {
  return item?.assessmentId===starter.id && !Object.hasOwn(item,"jobId");
}
function rolloutFeedback(review) {
  return `<div class="flow"><h4>Reviewer feedback</h4>
    <ul class="rubric-list">${criteria.map((criterion,index)=>`<li>${criterion.name}<span>${review.scores[index]} / 5</span></li>`).join("")}</ul>
    <div><h4>What worked</h4><p class="text-block">${safe(review.strengths)}</p></div>
    <div><h4>What to improve</h4><p class="text-block">${safe(review.improvements)}</p></div></div>`;
}
function updateRolloutReviews(reviews) {
  const bySample=new Map(reviews.map(review=>[review.sample_id,review]));
  for (const item of state.submissions.filter(isRolloutWork)) {
    item.review=bySample.get(item.id) ?? null;
  }
}
async function refreshRolloutResults(control) {
  const user=signedInCandidate;
  if (!user || control.disabled) return;
  control.disabled=true;
  try {
    const reviews=await candidateAuth.loadRolloutReviews(user.id);
    if (signedInCandidate!==user) return;
    updateRolloutReviews(reviews);
    if (page==="profile" && !editingProfile) {
      render();
      app.querySelector('[data-action="refresh-rollout-results"]').focus();
    }
    notify("Assessment results checked.");
  } catch {
    if (signedInCandidate===user) notify("Results couldn’t be checked. Try again.");
  } finally {
    control.disabled=false;
  }
}
function profilePreview(items) {
  const employer = companyById(previewCompanyId);
  const cards = items.flatMap(item=>{
    const assessment = assessmentById(item.assessmentId);
    if (!assessment || !recruitmentMatch(item,employer,assessment.role.toLowerCase())) return [];
    const suggestedRoles = roleMatches.filter(({role,scope})=>recruitmentMatch(item,employer,role.toLowerCase())?.scope===scope).map(({role})=>role);
    return [`<article class="profile-preview-sample flow">
      <div><h3>${safe(item.code)}</h3><p class="subtle">${safe(assessment.role)} · ${safe(assessment.title)} · ${total(item.review)} / 20</p></div>
      ${suggestedRoles.length ? `<p class="subtle">Suggested for ${safe(suggestedRoles.join(", "))}</p>` : ""}
      ${workSampleEvidence(item)}
    </article>`];
  });
  return cards.join("") || '<p class="subtle">This employer can’t see any of your work samples in Talent pools.</p>';
}
function setProfileEditor(isEditing) {
  if (savingProfile) return;
  editingProfile = isEditing;
  render();
  app.querySelector(isEditing ? "#profile-name" : '[data-action="edit-profile"]').focus({preventScroll:true});
}
function profileLines(value) {
  return clean(value).split(/\r?\n/).map(clean).filter(Boolean);
}
function uniqueProfileLines(lines) {
  return [...new Map(lines.map(line=>[line.toLowerCase(),line])).values()];
}
async function saveCandidateProfile(form,data) {
  if (savingProfile) return;
  const name = clean(data.get("name"));
  const intro = clean(data.get("intro"));
  const roles = profileLines(data.get("roles"));
  const skills = profileLines(data.get("skills"));
  const experience = clean(data.get("experience"));
  if (name.length>80 || intro.length>400 || roles.length>8 || roles.some(role=>role.length>80)) {
    return fail(form,"Use up to 80 characters for your name and each of the eight roles, and up to 400 for About me.");
  }
  if (skills.length>maxProfileSkills || skills.some(skill=>skill.length>maxProfileSkillLength)) {
    return fail(form,`Enter up to ${maxProfileSkills} skills of ${maxProfileSkillLength} characters each.`);
  }
  if (experience.length>maxProfileExperienceLength) {
    return fail(form,`Keep experience within ${maxProfileExperienceLength} characters.`);
  }
  const profile={name,roles:uniqueProfileLines(roles),intro,skills:uniqueProfileLines(skills),experience};
  if (new TextEncoder().encode(JSON.stringify(profile)).length>8000) {
    return fail(form,"Shorten your profile before saving.");
  }
  if (signedInCandidate) {
    const user=signedInCandidate;
    savingProfile=true;
    form.setAttribute("aria-busy","true");
    for (const control of form.elements) control.disabled=true;
    let saved;
    try {
      saved=await candidateAuth.saveProfile(user.id,profile);
    } catch {} finally {
      savingProfile=false;
      form.removeAttribute("aria-busy");
      for (const control of form.elements) control.disabled=false;
    }
    if (signedInCandidate!==user) return;
    if (!saved) {
      if (form.isConnected) fail(form,"Your profile couldn’t be saved. Try again.");
      else {
        if (page==="profile") render();
        notify("Your profile couldn’t be saved. Try again.");
      }
      return;
    }
    state.profile=saved;
    if (page==="profile") setProfileEditor(false);
    notify("Profile saved to your account.");
    return;
  }
  state.profile = profile;
  persist();
  setProfileEditor(false);
  notify(storageAvailable ? "Profile saved." : "Profile saved for this session. Browser storage is unavailable.");
}
function outreachSettings() {
  const {scope,blocked} = state.outreach;
  return `<section class="panel panel-pad flow" aria-labelledby="outreach-heading">
    <div><h2 id="outreach-heading">Recruiter outreach</h2><p class="subtle" id="outreach-help">Choose which opportunities you’re open to. Recruiters see a candidate code and the reviewed work samples you choose to share.</p></div>
    <div class="field"><label for="outreach-scope">Open to interview requests for</label><select id="outreach-scope" aria-describedby="outreach-help">${Object.entries(outreachScopes).map(([value,label])=>`<option value="${value}" ${value===scope ? "selected" : ""}>${label}</option>`).join("")}</select></div>
    <div class="blocked-companies flow">
      <div><h3>Blocked companies</h3><p class="subtle" id="block-help">A block immediately hides your work from the company and recruiters working on its behalf, and withdraws their pending interview requests. You can add or remove a block any time. Companies don’t see your list.</p></div>
      <form class="request-form" data-form="block-company">
        <div class="field"><label for="blocked-company">Company name</label><input id="blocked-company" name="company" list="block-company-options" aria-describedby="block-help" required maxlength="80" placeholder="Search or enter a company name">
          <datalist id="block-company-options">${state.companies.map(company=>`<option value="${safe(company.name)}"></option>`).join("")}</datalist>
        </div>
        <button class="btn">Block company</button><p class="error" data-error hidden></p>
      </form>
      ${blocked.length ? `<ul class="rubric-list request-list" aria-label="Blocked companies">${blocked.map(block=>`<li><strong>${safe(block.name)}</strong><button class="btn small" type="button" data-action="unblock-company" data-id="${safe(block.id)}" aria-label="Unblock ${safe(block.name)}">Unblock</button></li>`).join("")}</ul>` : '<p class="subtle">No companies blocked.</p>'}
    </div>
  </section>`;
}
function candidacy() {
  const items = candidateWorkSamples();
  if (signedInCandidate) {
    const practice=items.filter(item=>item.application);
    return `${header("My candidacy","Review your saved practice applications.",button("My profile","go","profile") + '<a class="btn" href="#northline-application">Northline demo application</a>')}
      <section class="reading flow"><p class="notice">Current openings are examples. Your practice applications are private to this account.</p>
        ${practice.length ? practice.map(item=>`<article class="panel panel-pad flow"><h2>${safe(item.application.title)}</h2><p class="subtle">${safe(item.application.company)} · ${dateLabel(item.date)}</p>${workSampleEvidence(item)}</article>`).join("") :
        '<p class="panel empty">Your practice applications will appear here.</p>'}
      </section>`;
  }
  return `${header("My candidacy","Manage recruiter outreach, work sample sharing, and interview requests.",button("My profile","go","profile","","person") + button("Try an assessment","go","careers","primary","eye"))}
    <div class="reading flow">${outreachSettings()}${items.length ? items.map(item=>{
      const requests = state.interviewRequests.filter(request=>request.submissionId===item.id &&
        (request.status!=="pending" || requestStillAllowed(request,item)));
      const opening = jobById(item.jobId);
      return `<article class="panel panel-pad flow">
        <div class="pool-card-head"><div><h2>${safe(assessmentById(item.assessmentId)?.title)}</h2><p class="subtle">Candidate code ${safe(item.code)}</p></div><span class="pill neutral">${candidatePoolStatus(item)}</span></div>
        ${opening ? `<p class="subtle">Work sample for ${safe(item.application?.title ?? opening.title)} at ${safe(item.application?.company ?? opening.company)}.</p>` : ""}
        <div class="actions">${button(item.poolOptIn ? "Turn off pool sharing" : "Opt in to talent pool","pool-consent",item.id,"small")}${opening && jobStatus(opening)==="open" ? button("View opening","job-detail",opening.id,"small") : ""}</div>
        <h3>Interview requests</h3>
        ${requests.length ? `<ul class="rubric-list request-list">${requests.map(request=>`<li><div><strong>${safe(request.companyName ?? employerLabel(companyById(request.companyId)))}</strong><p class="subtle">${safe(request.roleLabel ?? assessmentById(item.assessmentId)?.role)} · ${requestLabel(request)}</p></div>
          ${request.status==="pending" ? `<div class="actions">${button("I'm interested","respond-yes",request.id,"primary small")}${button("Decline","respond-no",request.id,"small")}</div>` : ""}
        </li>`).join("")}</ul>` : '<p class="subtle">No interview requests yet.</p>'}
      </article>`;
    }).join("") : '<p class="panel empty">Submit a work sample from this browser to see your candidacy here.</p>'}</div>`;
}
function updateOutreach(focusId, message) {
  withdrawUnavailableRequests();
  persist();
  render();
  document.getElementById(focusId).focus();
  notify(storageAvailable ? message : `${message} This change is available for this session.`);
}
function blockCompany(form,data) {
  const name = clean(data.get("company"));
  if (!fits(name,1,80)) return fail(form,"Enter a company name.");
  const normalized = companyKey(name);
  if (state.outreach.blocked.some(block=>companyKey(block.name)===normalized)) return fail(form,"You’ve already blocked this company.");
  const company = state.companies.find(entry=>companyKey(entry.name)===normalized);
  state.outreach.blocked.push({id:uuid(),companyId:company?.id,name:company?.name ?? name});
  updateOutreach("blocked-company","Company blocked.");
}
function unblockCompany(id) {
  state.outreach.blocked = state.outreach.blocked.filter(block=>block.id!==id);
  updateOutreach("blocked-company","Company unblocked.");
}
function enrollCompany(form,data) {
  const name=clean(data.get("company"));
  if (!fits(name,1,80) || !data.has("pledge")) return fail(form,"Enter a company name and agree to review work first.");
  if (state.companies.some(company=>companyKey(company.name)===companyKey(name))) return fail(form,"That employer is already in the pool.");
  const clientId = clean(data.get("client"));
  const client = companyById(clientId);
  if (clientId && (!client || client.clientId)) return fail(form,"Choose a participating employer that hires directly.");
  state.companies.push({id:uuid(),name,sample:false,clientId});
  persist();
  render();
  app.querySelector("#company-name").focus();
  notify("Employer added to this demo.");
}
function requestInterview(form) {
  const item=state.submissions.find(entry=>entry.id===form.dataset.id);
  const company=companyById(poolCompanyId);
  const roleLabel=clean(form.dataset.role);
  if (!item || roleLabel.toLowerCase()!==poolRole || !recruitmentMatch(item,company,poolRole)) return fail(form,"This work sample is no longer available in your view.");
  if (priorRequest(item,company)) return fail(form,"An interview has already been requested for this work sample.");
  state.interviewRequests.push({id:uuid(),submissionId:item.id,companyId:company.id,role:poolRole,roleLabel,status:"pending"});
  persist();
  render();
  app.querySelector("#pool-role").focus();
  notify("Request recorded in My candidacy for local demo candidates.");
}
function respondToInterview(id,status) {
  const request=state.interviewRequests.find(entry=>entry.id===id);
  if (!request || request.status!=="pending" || !state.applicantIds.includes(request.submissionId)) return;
  const item=state.submissions.find(entry=>entry.id===request.submissionId);
  if (!item || !requestStillAllowed(request,item)) return;
  request.status=status;
  persist();
  go("candidacy");
  notify(status==="accepted" ? "Interest recorded." : "Request declined.");
}
function togglePoolConsent(id) {
  const item=state.submissions.find(entry=>entry.id===id);
  if (!item || !state.applicantIds.includes(id)) return;
  item.poolOptIn=!item.poolOptIn;
  withdrawUnavailableRequests();
  persist();
  render();
  app.querySelector(`[data-action="pool-consent"][data-id="${id}"]`).focus();
}

const jobVerificationDays = 7;
const jobSources = {employer:"Employer confirmed", careers:"Official careers page"};
const jobDate = value => new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));

function sampleJobs() {
  const checkedAt = new Date().toISOString();
  return [
    {
      id:"sample-implementation", title:"Implementation Coordinator", company:"Northline Field Systems",
      location:"Remote · United States", type:"Full-time", salary:"$55,000–$70,000 / year",
      description:"Help small field-service teams get their scheduling software up and running. Coordinate rollout tasks, flag risks and keep customers up to date.",
      requirements:"A work sample showing how you prioritize tasks, communicate tradeoffs and plan follow-up.",
      training:"Scheduling software, implementation playbooks and customer onboarding.",
      source:"employer", assessmentId:starter.id, sourceUrl:"", checkedAt, sample:true
    },
    {
      id:"sample-support", title:"Customer Support Associate", company:"CivicLoop Software",
      location:"Dallas, TX · Hybrid", type:"Full-time", salary:"",
      description:"Help customers troubleshoot routine software issues and document patterns for the product team.",
      requirements:"Clear written communication and comfort investigating customer issues.",
      training:"",
      source:"careers", assessmentId:"", sourceUrl:"", checkedAt, sample:true
    },
    {
      id:"sample-onboarding", title:"Customer Onboarding Specialist", company:"CivicLoop Software",
      location:"Remote · United States", type:"Full-time", salary:"$26–$32 / hour",
      description:"Guide new customers through setup, run onboarding sessions and track open questions.",
      requirements:"Experience explaining a process clearly and coordinating next steps.",
      training:"",
      source:"careers", assessmentId:"", sourceUrl:"", checkedAt, sample:true
    }
  ];
}

function jobById(id) {
  return state.jobs?.find(item=>item.id===id);
}
const companyQuestionsFor = opening => opening?.companyQuestions ?? [];
const openingDraftKey = id => "job-" + id;
function savedOpeningDraft(id) {
  return signedInCandidate ? openingDrafts.get(id)?.revision != null :
    Boolean(state.drafts[openingDraftKey(id)] || state.companyDrafts[openingDraftKey(id)]);
}

function officialJobUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol==="https:" && url.hostname.includes(".") && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

function jobStatus(item, now = Date.now()) {
  if (item.closed) return "closed";
  if (item.sample) return "open";
  if (!item.checkedAt) return "draft";
  const elapsed = now - Date.parse(item.checkedAt);
  return elapsed >= 0 && elapsed < jobVerificationDays * 86_400_000 ? "open" : "expired";
}

function jobSourceBadge(item) {
  return `<div class="actions"><span class="pill ${item.source==="employer" ? "reviewed" : "neutral"}">${jobSources[item.source]}</span>${item.sample ? '<span class="status-pill">Sample opening</span>' : ""}</div>`;
}

function jobs() {
  const [term, source] = jobFilter;
  const openJobs = state.jobs.filter(item=>jobStatus(item)==="open");
  const matches = openJobs.filter(item=>(source==="all" || source===item.source) &&
    [item.title,item.company,item.location,item.type,assessmentById(item.assessmentId)?.role].some(value=>value?.toLowerCase().includes(term.toLowerCase())));
  return `${header("Job openings",signedInCandidate ? "Browse sample openings and practice applying." : "Explore roles with a clear source and application path.",signedInCandidate ? "" : button("Manage openings","go","manageJobs","","file"))}
    <form class="panel panel-pad job-search" data-form="job-search" aria-label="Find openings">
      <div class="field"><label for="job-query">Find a role</label><input type="search" id="job-query" name="query" maxlength="90" value="${safe(term)}" placeholder="Role, company or location"></div>
      <div class="field"><label for="job-source">Listing source</label><select id="job-source" name="source">
        ${Object.entries({all:"All sources",...jobSources}).map(([value,label])=>`<option value="${value}" ${value===source ? "selected" : ""}>${label}</option>`).join("")}
      </select></div>
      <button class="btn primary">Search</button>
    </form>
    <p class="subtle job-count">${matches.length} ${matches.length===1 ? "opening" : "openings"}</p>
    <div class="job-list">${matches.length ? matches.map(item=>`<article class="panel panel-pad flow job-card">
      ${jobSourceBadge(item)}
      <div><h2>${safe(item.title)}</h2><p class="subtle">${safe(item.company)} · ${safe(item.location)} · ${safe(item.type)}</p></div>
      <strong>${safe(item.salary || "Salary not disclosed")}</strong>
      <p class="subtle">${item.source==="employer" ? "Start with a work sample" : "Apply through the employer"}${item.sample ? "" : " · Checked " + jobDate(item.checkedAt)}</p>
      <div class="actions">${button("View opening","job-detail",item.id,"","file")}</div>
    </article>`).join("") : '<p class="panel empty">No open jobs match this search.</p>'}</div>`;
}

function employerLink(item, label) {
  const url = officialJobUrl(item.sourceUrl);
  return url ? `<a href="${safe(url.href)}" target="_blank" rel="noopener noreferrer" class="btn">${label}</a>` : "";
}

function jobDetail() {
  const item = jobById(selectedJobId);
  if (!item || jobStatus(item)!=="open") return header("Opening unavailable","Browse the current openings.",button("Job openings","go","jobs"));
  const assessment = item.source==="employer" ? assessmentById(item.assessmentId) : null;
  const url = officialJobUrl(item.sourceUrl);
  return `${header(safe(item.title),`${safe(item.company)} · ${safe(item.location)} · ${safe(item.type)}`,button("Job openings","go","jobs"))}
    <div class="columns">
      <section class="panel panel-pad flow">
        ${jobSourceBadge(item)}
        <div><h2>About the role</h2><p class="text-block job-detail-copy">${safe(item.description)}</p></div>
        <div><h3>What you’ll need on day one</h3><p class="text-block job-detail-copy">${safe(item.requirements)}</p></div>
        ${item.training ? `<div><h3>What you’ll learn on the job</h3><p class="text-block job-detail-copy">${safe(item.training)}</p></div>` : ""}
      </section>
      <section class="panel panel-pad flow">
        <div><h2>Pay and application</h2><p class="job-detail-copy"><strong>${safe(item.salary || "Salary not disclosed")}</strong></p>
        ${item.salary ? '<p class="subtle">Employer-provided pay</p>' : ""}</div>
        <div><h3>${assessment ? "Work sample first" : "Employer application"}</h3>
          <p class="subtle">${assessment ? safe(assessment.title) + " · About " + assessment.minutes + " minutes · Human review" : "The employer handles applications through its own portal."}</p>
          ${companyQuestionsFor(item).length ? '<p class="subtle">Core work sample · 90 points. Optional company questions · up to 10 points.</p>' : ""}
          ${assessment && url ? '<p class="subtle">The link to continue to the employer’s application appears after a human reviews your work.</p>' : ""}</div>
        <div class="actions">${assessment ? button(existingJobSubmission(item.id) ? "View work sample receipt" : savedOpeningDraft(item.id) ? "Resume draft" : "Start work sample","job-apply",item.id,"primary","file") : employerLink(item,"Apply on employer site") || '<button class="btn" disabled type="button">Apply on employer site</button>'}</div>
        ${signedInCandidate && item.id==="sample-implementation" ? '<a class="btn" href="#northline-application">Try the full hiring demo</a>' : ""}
        <div class="job-source-note"><h3>Listing source</h3>
          <p class="subtle">${item.sample ? "Fictional opening for the walkthrough." : "Checked " + jobDate(item.checkedAt) + " · Recheck due " + jobDate(Date.parse(item.checkedAt) + jobVerificationDays * 86_400_000)}</p>
          ${url ? `<p class="subtle">Official listing on ${safe(url.hostname)}</p><div class="actions">${assessment ? employerLink(item,"View official listing") : ""}</div>` : ""}</div>
      </section>
    </div>`;
}

function manageJobs() {
  const items = state.jobs.filter(item=>!item.sample);
  const statusLabel = {open:"Published",draft:"Needs verification",expired:"Recheck due",closed:"Closed"};
  return `${header("Manage openings","Set up a skills-first role or list a verified opening from an employer’s careers page.",button("Set up a role","setup-role","","primary","plus") + button("Add external listing","edit-job","","","link") + button("Company workspace","go","company","","person"))}
    <section class="flow reading">
      <p class="notice">Record an employer confirmation for work-sample openings or check the official careers page for external listings. Published openings expire after ${jobVerificationDays} days unless you recheck them.</p>
      ${items.length ? items.map(item=>`<article class="panel panel-pad flow">
        <div class="pool-card-head"><div><h2>${safe(item.title)}</h2><p class="subtle">${safe(item.company)} · ${jobSources[item.source]}</p></div><span class="pill neutral">${statusLabel[jobStatus(item)]}</span></div>
        <p class="subtle">${item.checkedAt ? "Last checked " + jobDate(item.checkedAt) : "Awaiting source check"}</p>
        <div class="actions">${item.team ? button("Open company workspace","team-open-workspace",item.team.workspaceId,"","person") :
          (item.source==="employer" || state.submissions.some(submission=>submission.jobId===item.id) ? button("Review applicants","job-submissions",item.id,"","inbox") : "") + employerLink(item,"Open source") + button("Edit opening","edit-job",item.id) + button(jobStatus(item)==="open" ? "Recheck opening" : "Confirm and publish","confirm-job",item.id,"primary","check") + (!item.closed ? button("Close opening","close-job",item.id) : "")}</div>
      </article>`).join("") : '<p class="panel empty">Opening drafts and source checks you record will appear here.</p>'}
    </section>`;
}

function jobEditor() {
  const item = jobById(editingJobId);
  const workspace = companyEditorDepartment ? currentCompany() : null;
  const department = workspace && departmentIn(workspace,companyEditorDepartment);
  const back = workspace ? button("Company workspace","go","company") : button("Manage openings","go","manageJobs");
  const value = field => safe(item?.[field] ?? "");
  const types = ["Full-time","Part-time","Contract","Internship"];
  const employer = (item?.source ?? newJobSource)==="employer";
  const assessmentId = item?.assessmentId || starter.id;
  const questions = companyQuestionsFor(item);
  const title = item ? "Edit opening" : employer ? "Set up a role" : "Add external listing";
  return `${header(title,workspace ? `${safe(workspace.name)} · ${safe(department?.name)}` : employer ? "Define what candidates need on day one, what you’ll teach, and how you’ll review their work." : "Use the employer’s official posting and pay details.",back)}
    <form class="panel panel-pad form reading" data-form="job-editor">
      ${workspace ? '<p class="notice">Candidates start with a work sample for this company opening.</p>' : `<div class="field"><label for="listing-source">Application path</label><select id="listing-source" name="source"><option value="employer" ${employer ? "selected" : ""}>Employer confirmed · Work sample first</option><option value="careers" ${employer ? "" : "selected"}>Official careers page · External application</option></select></div>`}
      <div class="form-row">
        <div class="field"><label for="job-title">Job title</label><input id="job-title" name="title" maxlength="90" value="${item ? value("title") : employer ? safe(starter.role) : ""}" required></div>
        <div class="field"><label for="job-company">Company</label><input id="job-company" name="company" maxlength="80" value="${workspace ? safe(workspace.name) : value("company")}" ${workspace ? "readonly" : "required"}></div>
      </div>
      <div class="form-row">
        <div class="field"><label for="job-location">Location and work arrangement</label><input id="job-location" name="location" maxlength="100" value="${value("location")}" placeholder="Dallas, TX · Hybrid" required></div>
        <div class="field"><label for="job-type">Employment type</label><select id="job-type" name="type">${types.map(type=>`<option ${type===item?.type ? "selected" : ""}>${type}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label for="source-url" id="source-url-label">Official posting URL${employer ? " (optional)" : ""}</label><input id="source-url" type="url" name="sourceUrl" maxlength="1200" value="${value("sourceUrl")}" placeholder="https://careers.company.com/job/123" ${employer ? "" : "required"}></div>
      <div class="field"><label for="job-pay">Employer-provided salary (optional)</label><input id="job-pay" name="salary" maxlength="100" value="${value("salary")}" placeholder="$55,000–$70,000 / year"><small>Leave blank when the employer gives no amount.</small></div>
      <div class="field"><label for="job-description">About the role</label><textarea id="job-description" name="description" maxlength="1400" required>${value("description")}</textarea></div>
      <div class="field"><label for="job-requirements">What candidates need on day one</label><small id="day-one-help">List the skills or requirements candidates need before training begins.</small><textarea id="job-requirements" name="requirements" maxlength="1000" aria-describedby="day-one-help" required>${value("requirements")}</textarea></div>
      <div class="field"><label for="job-training">What candidates will learn on the job</label><textarea id="job-training" name="training" maxlength="1000" placeholder="Example: Product walkthroughs, company tools, and customer onboarding playbooks.">${value("training")}</textarea></div>
      <fieldset id="job-assessment-field" ${employer ? "" : "hidden disabled"}>
        <legend>Work sample setup</legend>
        <div class="field"><label for="job-assessment">Core assessment</label><select id="job-assessment" name="assessmentId" required>${state.assessments.map(assessment=>`<option value="${safe(assessment.id)}" ${assessmentId===assessment.id ? "selected" : ""}>${safe(assessment.role)} · ${safe(assessment.title)}${assessment.id===starter.id ? " (standard)" : ""}</option>`).join("")}</select></div>
        <h2>Company questions <span class="subtle">Optional</span></h2>
        <p class="subtle" id="company-questions-help">Add up to three short, job-relevant questions. The core work sample is worth 90 points. These questions are worth up to 10 points together, and candidates can skip them.</p>
        ${Array.from({length:maxCompanyQuestions},(_,i)=>`<div class="field"><label for="company-question-${i}">Company question ${i+1}</label><textarea id="company-question-${i}" name="company-question-${i}" maxlength="${companyPromptLimit}" aria-describedby="company-questions-help" ${i===0 ? 'placeholder="Example: A customer asks to move their rollout to a holiday weekend. What would you check before committing?"' : ""}>${safe(questions[i])}</textarea></div>`).join("")}
      </fieldset>
      <p class="error" data-error hidden></p><div class="actions"><button class="btn primary">Save opening draft</button></div>
    </form>`;
}

function confirmJob() {
  const item = jobById(editingJobId);
  if (!item || item.sample) return manageJobs();
  const employer = item.source==="employer";
  return `${header("Confirm opening",`${safe(item.title)} · ${safe(item.company)}`,companyEditorDepartment ? button("Company workspace","go","company") : button("Manage openings","go","manageJobs"))}
    <form class="panel panel-pad form reading" data-form="confirm-job">
      <div><h2>Check the source</h2><p class="subtle">${employer ? "Confirm that the employer approved this opening and agreed to review a work sample first." : "Check that the official careers page still shows this opening."} Check that the posting details and any pay quoted here match what the employer provided.</p></div>
      ${item.sourceUrl ? `<div class="actions">${employerLink(item,"Open official listing")}</div>` : ""}
      <label class="consent"><input name="confirmed" type="checkbox" required><span>${employer ? "I confirmed the opening and any pay details with the employer. The hiring team will review work samples before asking for a résumé and consider applicants from nontraditional backgrounds." : "I checked this opening and any pay details on the employer’s official careers page."}</span></label>
      <p class="error" data-error hidden></p><div class="actions"><button class="btn primary">Record check and publish</button></div>
    </form>`;
}

function saveJob(form, data) {
  const existing = jobById(editingJobId);
  const item = Object.fromEntries(["title","company","location","type","source","sourceUrl","salary","description","requirements","training"].map(field=>[field,clean(data.get(field))]));
  if (companyEditorDepartment) {
    const workspace = currentCompany();
    if (!departmentIn(workspace,companyEditorDepartment) || !canManageTeamDepartment(currentTeamMember(),companyEditorDepartment) ||
        (existing && (existing.team?.workspaceId!==workspace.id || existing.team.departmentId!==companyEditorDepartment))) return fail(form,"This company opening is unavailable.");
    item.company=workspace.name;
    item.source="employer";
    item.team=existing?.team ?? {workspaceId:workspace.id,departmentId:companyEditorDepartment,recruiterId:null,managerId:null};
  }
  const url = officialJobUrl(item.sourceUrl);
  if (![item.title,item.company,item.location,item.description,item.requirements].every(Boolean)) return fail(form,"Complete the required job details.");
  if (!Object.hasOwn(jobSources,item.source)) return fail(form,"Choose a listing source.");
  const employer = item.source==="employer";
  if ((!employer || item.sourceUrl) && !url) return fail(form,"Enter a valid HTTPS link to the official opening.");
  item.assessmentId = employer ? clean(data.get("assessmentId")) : "";
  if (employer && !assessmentById(item.assessmentId)) return fail(form,"Choose the assessment for this opening.");
  item.companyQuestions = employer ? Array.from({length:maxCompanyQuestions},(_,i)=>clean(data.get(`company-question-${i}`))).filter(Boolean) : [];
  if (item.companyQuestions.some(question=>question.length>companyPromptLimit) ||
      new Set(item.companyQuestions.map(question=>question.toLowerCase())).size!==item.companyQuestions.length) {
    return fail(form,"Enter distinct company questions with up to 320 characters each.");
  }
  if (existing && state.submissions.some(submission=>submission.jobId===existing.id) && companyKey(item.company)!==companyKey(existing.company)) {
    return fail(form,"Create a new opening to change the employer after candidates have submitted work.");
  }
  item.id = existing?.id ?? uuid();
  item.sourceUrl = url?.href ?? "";
  item.checkedAt = null;
  item.closed = false;
  if (existing && item.assessmentId!==existing.assessmentId) {
    const draftKey="job-" + item.id;
    delete state.drafts[draftKey];
    delete state.poolDrafts[draftKey];
    delete state.companyDrafts[draftKey];
  }
  if (existing) Object.assign(existing,item);
  else state.jobs.push(item);
  persist();
  editingJobId = item.id;
  go("confirmJob");
  notify(storageAvailable ? "Opening draft saved. Confirm the details to publish." : "Draft saved for this session.");
}

function updateJobStatus(form, data) {
  const item = jobById(editingJobId);
  if (!item || item.sample || !data.has("confirmed")) return fail(form,"Confirm the source and details first.");
  if (companyEditorDepartment && (!canReviewTeamOpening(item) || !canManageTeamDepartment(currentTeamMember(),item.team.departmentId))) return fail(form,"This company opening is unavailable.");
  item.checkedAt = new Date().toISOString();
  item.closed = false;
  persist();
  go(companyEditorDepartment ? "company" : "manageJobs");
  notify(storageAvailable ? "Opening published in this browser." : "Opening published for this session.");
}

function existingJobSubmission(id) {
  return state.submissions.find(item=>item.jobId===id && state.applicantIds.includes(item.id));
}


function assessments() {
  return `${header("Assessments","Create or preview a work sample.",button("New assessment","go","create","primary","plus"))}
    <div class="cards">${state.assessments.map(item => `<article class="panel panel-pad assessment-card">
      <div class="actions"><span class="pill neutral">${safe(item.role)}</span><span class="subtle">${item.minutes} min</span></div>
      <h2>${safe(item.title)}</h2><p class="subtle">${safe(item.brief.length > 200 ? item.brief.slice(0,198)+"…" : item.brief)}</p>
      <div class="actions">${button("Preview","preview",item.id,"primary small","eye")}${button("Copy demo link","invite",item.id,"small","link")}${button("Download candidate kit","kit",item.id,"small","download")}</div>
    </article>`).join("")}</div>
    <p class="subtle link-note">Open the assessment directly from a job posting in a live rollout. For this private demo, use a standalone candidate kit or an assessment link with site access.</p>`;
}
function careers() {
  const roles = new Map(state.assessments.map(item=>[item.role.toLowerCase(),item.role]));
  if (roles.has(starter.role.toLowerCase())) roles.set(starter.role.toLowerCase(),starter.role);
  const samples = selectedCareer ? state.assessments.filter(item=>item.role.toLowerCase()===selectedCareer) : [];
  return `${header("Choose a career","Pick the kind of work you want to try. You’ll get a scenario based on the role.")}
    <div class="reading flow">
      <div class="panel panel-pad field"><label for="candidate-career">Career</label><select id="candidate-career"><option value="">Select a career</option>${Array.from(roles,([key,label])=>`<option value="${safe(key)}" ${key===selectedCareer ? "selected" : ""}>${safe(label)}</option>`).join("")}</select></div>
      ${(savedRolloutDraft() && !samples.some(item=>item.id===starter.id) ? [starter,...samples] : samples)
        .map(item=>`<article class="panel panel-pad flow"><h2>${safe(item.title)}</h2><p class="subtle">${safe(item.role)} · About ${item.minutes} minutes</p><div class="actions">${button(item.id===starter.id && savedRolloutDraft() ? "Resume draft" : "Start work sample","preview",item.id,"primary","file")}</div></article>`).join("")}
    </div>`;
}
function submissions() {
  const opening = jobById(submissionJobId);
  if (companyReviewOpening && (submissionJobId!==companyReviewOpening || !canReviewTeamOpening(opening))) {
    return header("Applicants unavailable","Choose an opening assigned to this demo member.",button("Company workspace","go","company"));
  }
  const items = recent(state.submissions.filter(item => {
    if (opening && item.jobId!==opening.id) return false;
    switch (filter) {
      case "pending": return !item.review;
      case "reviewed": return !!item.review;
      case "shortlisted": return !!item.shortlistedAt;
      default: return true;
    }
  }));
  const actions = companyReviewOpening ? button("Company workspace","go","company") :
    opening ? button("Manage openings","go","manageJobs") + button("All submissions","go","submissions") : button("Import submission","import","","","upload");
  return `${header(opening ? "Review applicants" : "Submissions",opening ? `${safe(opening.title)} · ${safe(opening.company)}` : "Work samples are listed by candidate code.",actions)}
    <input type="file" id="import-file" accept=".json,application/json" hidden>
    <section class="panel"><div class="panel-head"><h2>Review queue</h2></div>
      <div class="filter" aria-label="Filter submissions">${[["all","All"],["pending","Needs review"],["reviewed","Reviewed"],["shortlisted","Shortlisted"]].map(([value,label])=>`<button class="btn small" data-action="filter" data-id="${value}" aria-pressed="${value===filter}">${label}</button>`).join("")}</div>
      ${rows(items,true)}
    </section>`;
}
function create() {
  return `${header("New assessment","Create a fictional task that reflects the work of the role.",button("Assessments","go","assessments"))}
    <form class="panel panel-pad form reading" data-form="create">
      <div class="field"><label for="title">Assessment title</label><input id="title" name="title" maxlength="90" required placeholder="Example: Plan a customer onboarding"></div>
      <div class="form-row">
        <div class="field"><label for="role">Role</label><input id="role" name="role" maxlength="80" required placeholder="Example: Implementation Coordinator"></div>
        <div class="field"><label for="minutes">Suggested minutes</label><input id="minutes" name="minutes" type="number" value="25" min="5" max="120" required></div>
      </div>
      <div class="field"><label for="brief">Scenario brief</label><textarea id="brief" name="brief" minlength="10" maxlength="2200" required placeholder="Describe the situation, constraints, and expected outcome."></textarea></div>
      <div class="field"><label for="exhibit">Supporting facts (optional)</label><textarea id="exhibit" name="exhibit" maxlength="1200" placeholder="Add deadlines, staff availability, or other details."></textarea></div>
      <div class="field"><label for="glossary">Glossary (optional)</label><small id="glossary-format">Add up to 12 terms, one per line. Use a vertical bar between the term and its definition.</small><textarea id="glossary" name="glossary" aria-describedby="glossary-format" maxlength="3000" placeholder="Escalation | Passing a problem to someone who can resolve it"></textarea></div>
      <p class="notice">Assessments use the workspace rubric for problem framing, prioritization, execution, and communication.</p>
      <p class="error" data-error hidden></p><div class="actions"><button class="btn primary">Create assessment</button></div>
    </form>`;
}
function candidate() {
  if (invitation.mode && !invitation.assessment) return `${header("Assessment unavailable","This demo link is incomplete. Ask the sender for a fresh link.")}`;
  const item = invitation.assessment ?? assessmentById(selectedAssessment) ?? starter;
  const opening = jobById(candidateJobId);
  const accountRollout = signedInCandidate && !opening && item.id===starter.id;
  const accountOpening = signedInCandidate && opening;
  if (accountRollout && !rolloutAttempt) rolloutAttempt={id:uuid(),revision:null};
  const draftKey = opening ? openingDraftKey(opening.id) : item.id;
  const previousSample = opening && candidateWorkSamples().find(sample=>sample.assessmentId===item.id && !sample.jobId);
  const draft = state.drafts[draftKey] ?? previousSample?.answers ?? [];
  const questions = companyQuestionsFor(opening);
  const companyDraft = state.companyDrafts[draftKey] ?? [];
  const navigation = opening ? button("Opening details","job-detail",opening.id) : button("Choose a career","go","careers");
  return `${header(safe(item.title),`${safe(item.role)} · About ${item.minutes} minutes`, invitation.mode ? "" : navigation)}
    <div class="flow reading">
      ${opening ? `<p class="notice">Work sample for <strong>${safe(opening.title)}</strong> at ${safe(opening.company)}.</p>` : ""}
      <section class="panel panel-pad flow"><h2>Your briefing</h2>${assessmentBrief(item)}
        <p class="notice"><strong>Start with the work sample.</strong> ${accountRollout ? "A person scores your submitted responses under a candidate code. Leave names and contact information out of your answers." :
          signedInCandidate ? "Your response is saved to your account. Leave names and contact information out of your answers." : "A person reviews your response under a candidate code. You can then choose to make your work available to participating employers. Any résumé request comes after work review. Leave names and contact information out of your answers."}</p>
      </section>
      <form class="panel panel-pad form" data-form="candidate" data-id="${safe(item.id)}" data-draft="${safe(draftKey)}" ${accountRollout ? 'data-account-rollout="true"' : ""}
        ${accountOpening ? `data-account-opening="${safe(opening.id)}"` : ""}>
        <div><h2>${opening ? "Core work sample · 90 points" : "Your response"}</h2>
          <p class="subtle">You can save a draft with blank answers. Answer all four core questions to submit.</p>
          <p class="subtle" id="draft-status" aria-live="polite">${accountRollout ? accountDraftStatus(savedRolloutDraft(),rolloutDraftDirty) :
            accountOpening ? accountDraftStatus(savedOpeningDraft(opening.id),dirtyOpeningDrafts.has(opening.id)) :
            localDraftStatus(draftKey)}</p>${previousSample && !state.drafts[draftKey] ? `<p class="subtle">Your earlier work is filled in below. Review or edit it before ${signedInCandidate ? "submitting this practice sample." : "submitting to this employer."}</p>` : ""}</div>
        ${criteria.map((criterion,i)=>`<div class="field"><label for="answer-${i}">${criterion.name}</label><small id="prompt-${i}">${criterion.prompt}</small><textarea name="answer-${i}" id="answer-${i}" aria-describedby="prompt-${i}" required maxlength="2000">${safe(draft[i])}</textarea></div>`).join("")}
        ${questions.length ? `<fieldset class="company-question-section"><legend>Optional company questions · Up to 10 points</legend><p class="subtle">You can leave these blank and still submit. The hiring team scores these answers separately, and they stay out of talent pools.</p>
          ${questions.map((prompt,i)=>`<div class="field"><label for="company-answer-${i}">${safe(prompt)}</label><textarea name="company-answer-${i}" id="company-answer-${i}" maxlength="${companyAnswerLimit}">${safe(companyDraft.find(entry=>entry.prompt===prompt)?.answer)}</textarea></div>`).join("")}
        </fieldset>` : ""}
        ${invitation.mode || signedInCandidate ? "" : `<label class="consent"><input type="checkbox" name="pool-opt-in" ${state.poolDrafts[draftKey] ? "checked" : ""}><span><strong>Allow this work sample to appear in talent pools</strong><small>Once reviewed, this sample can be shared under your candidate code if you turn on recruiter outreach.</small></span></label>
        <div class="actions">${button("Manage recruiter outreach","go","candidacy","text small")}</div>`}
        <p class="error" data-error hidden></p><div class="actions">
          ${button("Save and continue later","save-candidate-draft")}
          <button class="btn primary">${accountRollout ? "Submit for review" : signedInCandidate && opening ? "Submit practice sample" : invitation.mode ? "Finish work sample" : "Submit work sample"}</button></div>
      </form>
    </div>`;
}
function complete() {
  const item = receipt;
  const opening = jobById(item?.jobId);
  if (!item) return header("Submission receipt","Open the candidate workspace to complete an assessment.");
  const submittedForReview=signedInCandidate && isRolloutWork(item);
  return `${header(signedInCandidate && !submittedForReview ? "Work sample saved" : invitation.mode ? "Work sample complete" : "Work sample submitted",`Candidate code ${safe(item.code)}`)}
    <section class="panel panel-pad flow reading">
      <p>${submittedForReview ? "Your work sample is awaiting human review. Find your score and feedback in My profile once it’s reviewed." :
        signedInCandidate ? "Your response is saved to your candidate account." : invitation.mode ? "Download your submission and send the file to the person who invited you." : storageAvailable ? "Your response is in this browser's review queue. Download a copy if you want to pass it to another reviewer." : "Download this submission before closing the page. Browser storage is unavailable."}</p>
      ${item.poolOptIn && !invitation.mode ? '<p class="subtle">You opted in to share this work sample after review. You can choose your outreach settings in My candidacy.</p>' : ""}
      ${opening ? `<p class="subtle">Work sample for ${safe(item.application?.title ?? opening.title)} at ${safe(item.application?.company ?? opening.company)}.</p>
        ${item.review && jobStatus(opening)==="open" ? employerLink(item.application ?? opening,"Continue to employer application") : ""}` : ""}
      <div class="actions">${!invitation.mode && !opening ? button("See openings for this career","career-openings",item.assessmentId,"primary","file") : ""}
        ${button("Download submission","receipt","",invitation.mode ? "primary" : "","download")}${invitation.mode ? button("Start another response","restart") : button("My profile","go","profile") + button("My candidacy","go","candidacy") + (signedInCandidate ? "" : button("Open review queue","go","submissions"))}</div>
    </section>`;
}
function rubric() {
  return `${header("Review rubric","Four criteria, each scored by a human reviewer on a 1–5 scale.")}
    <div class="cards">${criteria.map(criterion=>`<section class="panel panel-pad flow"><h2>${criterion.name}</h2><p>${criterion.prompt}</p><p class="subtle"><strong>Strong evidence</strong> · ${criterion.strong}</p></section>`).join("")}</div>
    <section class="panel panel-pad scale-card"><h2>Scoring scale</h2><ul class="rubric-list">${levels.slice(1).map((level,index)=>`<li><strong>${index+1}</strong> ${level}</li>`).join("")}</ul><p class="subtle">Use scores to guide the follow-up conversation and record evidence in your notes.</p></section>`;
}
function coreScoreText(item, review) {
  const raw = total(review);
  return item.jobId || item.companyResponses?.length ? `${corePoints(raw)} / 90` : `${raw} / 20`;
}
function companyScoreText(item, scores) {
  const responses = item.companyResponses ?? [];
  if (!responses.length) return "";
  if (!responses.some(response=>response.answer)) return "Skipped · 0 / 10";
  if (responses.some((response,i)=>response.answer && scores?.[i]==null)) return "Awaiting separate score";
  const earned = responses.reduce((sum,response,i)=>sum + (response.answer ? scores[i] : 0),0);
  return `${Math.round(earned * 20 / responses.length) / 10} / 10`;
}
function scoreFields(scores) {
  return criteria.map((criterion,index)=>`<fieldset><legend>${criterion.name}</legend><small class="subtle">${criterion.strong}</small><div class="scale">
    ${levels.slice(1).map((label,i)=>`<label title="${safe(label)}"><input type="radio" name="score-${index}" value="${i+1}" aria-label="${i+1}: ${safe(label)}" required ${scores?.[index]===i+1 ? "checked" : ""}><span>${i+1}</span></label>`).join("")}
  </div></fieldset>`).join("");
}
function rolloutReviews() {
  if (!canReviewRollout) return header("Assessment reviews","Sign in with an assigned reviewer account.");
  const row=rolloutQueue.rows.find(item=>item.key===selectedRolloutReview);
  if (row) {
    const {sample,feedback}=row;
    return `${header(safe(sample.code),`${starter.title} · Submitted ${dateLabel(sample.date)}`,button("Back to review queue","rollout-queue-back"))}
      <div class="columns review-columns">
        <section class="panel panel-pad"><h2>Work sample</h2><details class="brief-detail"><summary>Assessment brief</summary>${assessmentBrief(starter)}</details>
          ${sample.answers.map((answer,index)=>`<div class="response-block"><h3>${criteria[index].name}</h3><p class="text-block">${safe(answer)}</p></div>`).join("")}
        </section>
        <form class="panel panel-pad form" data-form="rollout-review" data-id="${safe(row.key)}">
          <div><h2>Scorecard</h2><p class="subtle">Score each criterion from 1 to 5. The candidate can read the score and both notes when you publish.</p></div>
          ${scoreFields(feedback?.scores)}
          <div class="field"><label for="rollout-strengths">What worked</label><textarea id="rollout-strengths" name="strengths" maxlength="1600" required>${safe(feedback?.strengths)}</textarea></div>
          <div class="field"><label for="rollout-improvements">What to improve</label><textarea id="rollout-improvements" name="improvements" maxlength="1600" required>${safe(feedback?.improvements)}</textarea></div>
          <p class="error" data-error hidden></p><div class="actions"><button class="btn primary">${feedback ? "Update feedback" : "Publish feedback"}</button></div>
        </form>
      </div>`;
  }
  return `${header("Assessment reviews","Review submitted Rollout Rescue work by candidate code.",button("Refresh queue","rollout-queue-page",String(rolloutQueue.offset)))}
    <section class="panel panel-pad flow reading"><h2>Review queue</h2>
      ${rolloutQueue.loading ? '<p role="status">Loading submissions…</p>' : rolloutQueue.error ? `<p class="error" role="alert">${safe(rolloutQueue.error)}</p>` :
        rolloutQueue.rows.length ? `<ul class="rubric-list request-list">${rolloutQueue.rows.map(({sample,key,feedback})=>
          `<li><div><strong>${safe(sample.code)}</strong><p class="subtle">${dateLabel(sample.date)} · ${feedback ? `Reviewed · ${total(feedback)} / 20` : "Awaiting review"}</p></div>
            ${button("Open work sample","rollout-review-open",key,"small")}</li>`).join("")}</ul>` : '<p class="subtle">No work samples on this page.</p>'}
      <div class="actions">${rolloutQueue.offset>0 ? button("Previous page","rollout-queue-page",String(rolloutQueue.offset-rolloutQueuePageSize),"small") : ""}
        ${rolloutQueue.hasNext ? button("Next page","rollout-queue-page",String(rolloutQueue.offset+rolloutQueuePageSize),"small") : ""}</div>
    </section>`;
}
async function refreshRolloutQueue(offset) {
  if (!canReviewRollout || rolloutQueue.loading) return;
  const user=signedInCandidate;
  selectedRolloutReview=null;
  rolloutQueue={rows:[],offset,hasNext:false,loading:true,error:""};
  render();
  try {
    const rows=await candidateAuth.loadRolloutQueue(offset,rolloutQueuePageSize);
    if (signedInCandidate!==user) return;
    rolloutQueue.rows=rows.slice(0,rolloutQueuePageSize).filter(({sample})=>
      isRolloutWork(sample) && validSubmission({...sample,format:"proof-of-skill-submission-v1"}))
      .map(({user_id,id,sample,rollout_reviews})=>({userId:user_id,id,key:`${user_id}/${id}`,sample,feedback:rollout_reviews}));
    rolloutQueue.hasNext=rows.length>rolloutQueuePageSize;
  } catch {
    if (signedInCandidate===user) rolloutQueue.error="The queue couldn’t be loaded. Try refreshing it.";
  } finally {
    if (signedInCandidate===user) {
      rolloutQueue.loading=false;
      if (page==="rolloutReviews") render();
    }
  }
}
async function publishRolloutFeedback(form,data) {
  if (!canReviewRollout) return;
  const row=rolloutQueue.rows.find(item=>item.key===form.dataset.id);
  const scores=criteria.map((_,index)=>Number(data.get(`score-${index}`)));
  const strengths=clean(data.get("strengths"));
  const improvements=clean(data.get("improvements"));
  if (!row || scores.some(score=>!Number.isInteger(score) || score<1 || score>5) ||
    !fits(strengths,1,1600) || !fits(improvements,1,1600)) return fail(form,"Choose all four scores and complete both feedback notes.");
  const submit=form.querySelector('button:not([type])');
  if (submit.disabled) return;
  submit.disabled=true;
  const user=signedInCandidate;
  try {
    const feedback=await candidateAuth.publishRolloutReview(row.userId,row.id,scores,strengths,improvements);
    if (signedInCandidate!==user) return;
    row.feedback=feedback;
    const ownSample=row.userId===user.id && state.submissions.find(item=>item.id===row.id);
    if (ownSample) ownSample.review=feedback;
    if (form.isConnected) {
      selectedRolloutReview=null;
      render();
      app.querySelector("#main").focus({preventScroll:true});
    }
    notify("Feedback published to the candidate’s profile.");
  } catch {
    if (form.isConnected) fail(form,"Feedback couldn’t be published. Review your notes and try again.");
  } finally {
    submit.disabled=false;
  }
}
function review() {
  const item = state.submissions.find(entry=>entry.id===selectedSubmission);
  if (!item || !canAccessCompanyReview(item)) return header("Submission unavailable","Open another work sample.",button("Review queue","back-to-submissions"));
  const assessment = assessmentById(item.assessmentId);
  const application = item.application ?? jobById(item.jobId);
  const companyScore = companyScoreText(item,item.review?.companyScores);
  return `${header(safe(item.code),`${safe(assessment.title)} · Submitted ${dateLabel(item.date)}${item.sample ? " · Sample" : ""}${application ? " · " + safe(application.title) : ""}`,button(submissionJobId ? "Review applicants" : "Submissions","back-to-submissions"))}
    <div class="columns review-columns">
      <section class="panel panel-pad"><h2>${item.jobId || companyScore ? "Core work sample" : "Work sample"}</h2><details class="brief-detail"><summary>Assessment brief</summary>${assessmentBrief(assessment)}</details>
        ${item.answers.map((answer,index)=>`<div class="response-block"><h3>${criteria[index].name}</h3><p class="text-block">${safe(answer)}</p></div>`).join("")}
      </section>
      <div class="flow"><form class="panel panel-pad form" data-form="review" data-id="${safe(item.id)}">
        <div><h2>Scorecard</h2><p class="subtle" id="score-total" aria-live="polite">${item.review ? `${coreScoreText(item,item.review)} core points` : "Select one core score per criterion."}</p><p class="subtle">Give credit for the candidate's reasoning when they explain it in their own words.</p>${companyReviewOpening && item.review?.reviewer ? `<p class="subtle">Last reviewed by ${safe(item.review.reviewer)}</p>` : ""}</div>
        ${scoreFields(item.review?.scores)}
        ${companyScore ? `<fieldset class="company-question-section">
          <legend>Company questions · Up to 10 points</legend>
          <p class="subtle">Score these separately, or save your core review now and return to them later.</p>
          <p class="score-total" id="company-score-status" aria-live="polite">${companyScore}</p>
          ${item.companyResponses.map(({prompt,answer},i)=>`<div class="response-block"><h3 class="text-block">${safe(prompt)}</h3><p class="text-block">${safe(answer || "Candidate skipped this question.")}</p>
            ${answer ? `<div class="field"><label for="company-score-${i}">Score company question ${i+1}</label><select id="company-score-${i}" name="company-score-${i}"><option value="">Not scored</option>${["No evidence",...levels.slice(1)].map((label,score)=>`<option value="${score}" ${item.review?.companyScores?.[i]===score ? "selected" : ""}>${score} · ${label}</option>`).join("")}</select></div>` : ""}</div>`).join("")}
        </fieldset>` : ""}
        <div class="field"><label for="notes">Evidence and feedback</label><textarea id="notes" name="notes" required maxlength="1600" placeholder="Cite examples from the work sample.">${safe(item.review?.notes)}</textarea></div>
        <p class="error" data-error hidden></p><div class="actions"><button class="btn primary">Save review</button>${item.review ? button("Download scorecard","scorecard",item.id,"","download") : ""}</div>
      </form>${interviewPanel(item)}</div>
    </div>`;
}
function interviewPanel(item) {
  if (companyReviewOpening && currentTeamMember()?.role==="manager") return "";
  const opening = jobById(item.jobId);
  const request = item.jobId && state.interviewRequests.find(entry=>entry.submissionId===item.id && entry.jobId===item.jobId);
  const companyName = item.application?.company ?? opening?.company;
  const company = state.companies.find(entry=>companyKey(entry.name)===companyKey(companyName));
  const available = opening?.source==="employer" && state.applicantIds.includes(item.id) && !applicationEmployerBlocked(companyName,company);
  const description = item.shortlistedAt ? "The candidate is on the shortlist. The hiring team arranges any interview separately." :
    item.review ? "Decide whether to shortlist this candidate based on their work sample." : "Save your scorecard to unlock shortlisting.";
  const action = item.review ? button(item.shortlistedAt ? "Remove from shortlist" : "Shortlist for interview","shortlist",item.id,item.shortlistedAt ? "" : "primary",item.shortlistedAt ? "" : "check") :
    '<button class="btn" type="button" disabled>Shortlist for interview</button>';
  return `<section class="panel panel-pad flow" id="interview-panel" aria-labelledby="interview-heading">
    <div><h2 id="interview-heading">Live interview</h2><p class="subtle">${description}</p></div>
    <div class="actions">${action}${item.review && available && !request ? button("Invite to interview","application-interview",item.id,"primary","person") : ""}</div>
    ${request ? `<p class="subtle">${requestLabel(request)} · ${safe(request.companyName)}</p>` : ""}
  </section>`;
}
function inviteApplicant(id) {
  const item=state.submissions.find(entry=>entry.id===id);
  const opening=jobById(item?.jobId);
  if (!canAccessCompanyReview(item) || (companyReviewOpening && currentTeamMember()?.role==="manager")) return;
  if (!item?.review || opening?.source!=="employer" || !state.applicantIds.includes(id)) return;
  const companyName=item.application?.company ?? opening.company;
  const company=state.companies.find(entry=>companyKey(entry.name)===companyKey(companyName));
  if (applicationEmployerBlocked(companyName,company) || state.interviewRequests.some(entry=>entry.submissionId===id && entry.jobId===opening.id)) return;
  state.interviewRequests.push({id:uuid(),submissionId:id,jobId:opening.id,companyId:company?.id,companyName,roleLabel:item.application?.title ?? opening.title,status:"pending"});
  persist();
  render();
  app.querySelector("#interview-heading").setAttribute("tabindex","-1");
  app.querySelector("#interview-heading").focus();
  notify("Interview invitation recorded in My candidacy.");
}
function uuid() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value=>value.toString(16).padStart(2,"0")).join("");
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");
}
function savedRolloutDraft() {
  return signedInCandidate && rolloutAttempt?.revision != null;
}
function accountDraftStatus(saved,dirty) {
  if (dirty) return "Unsaved changes. Select Save and continue later to keep them.";
  return saved ? "Draft saved to your account. You can resume on another device." :
    "Save and continue later keeps a draft in your account.";
}
function localDraftStatus(draftKey) {
  if (!storageAvailable) return "Browser storage is unavailable.";
  return state.drafts[draftKey] ? "Draft saved in this browser." : "Drafts are saved in this browser.";
}
function setCandidateWorkBusy(form,busy) {
  candidateWorkBusy=busy;
  form.setAttribute("aria-busy",String(busy));
  for (const control of form.elements) control.disabled=busy;
}
const draftConflict = "This draft changed on another device. Copy any unsaved answers, then reload to open the latest version.";
function captureCandidateDraft(form) {
  const {draft}=form.dataset;
  const answers=criteria.map((_,i)=>form.elements[`answer-${i}`].value);
  const companyResponses=readCompanyAnswers(form);
  state.drafts[draft]=answers;
  if (companyResponses.length) state.companyDrafts[draft]=companyResponses;
  if (form.elements["pool-opt-in"]) state.poolDrafts[draft]=form.elements["pool-opt-in"].checked;
  return {answers,companyResponses};
}
async function saveCandidateDraft(form) {
  if (!form || candidateWorkBusy) return;
  const user=signedInCandidate;
  const {draft,accountOpening}=form.dataset;
  const {answers,companyResponses}=captureCandidateDraft(form);
  if (answers.some(answer=>answer.length>2000)) return fail(form,"Keep each response within 2,000 characters.");
  if (!validCompanyResponses(companyResponses)) return fail(form,"Keep each company answer within 1,600 characters.");
  form.querySelector("[data-error]").hidden=true;
  if (!user) {
    persist();
    form.querySelector("#draft-status").textContent=localDraftStatus(draft);
    if (!storageAvailable) return fail(form,"Your browser couldn’t save this draft. Keep this page open to retain your answers.");
    notify("Draft saved in this browser.");
    return;
  }
  const attempt=accountOpening ? openingDrafts.get(accountOpening) ?? {id:uuid(),revision:null} : rolloutAttempt;
  if (!attempt) return fail(form,"This draft couldn’t be opened. Keep a copy of your answers before reloading.");
  setCandidateWorkBusy(form,true);
  try {
    const saved=accountOpening ? await candidateAuth.saveOpeningDraft(user.id,accountOpening,attempt,answers,companyResponses) :
      await candidateAuth.saveRolloutDraft(user.id,attempt,answers);
    if (signedInCandidate!==user) return;
    if (!saved) {
      if (form.isConnected) fail(form,draftConflict);
      else notify(draftConflict);
      return;
    }
    const savedAttempt={id:saved.id,revision:saved.revision};
    const dirty=state.drafts[draft]!==answers;
    if (accountOpening) {
      openingDrafts.set(accountOpening,savedAttempt);
      if (!dirty) dirtyOpeningDrafts.delete(accountOpening);
    } else {
      rolloutAttempt=savedAttempt;
      rolloutDraftDirty=dirty;
    }
    const activeForm=app.querySelector('[data-form="candidate"]');
    if (activeForm?.dataset.draft===draft) activeForm.querySelector("#draft-status").textContent=accountDraftStatus(true,dirty);
    else if (page==="profile" && !editingProfile) render();
    notify("Draft saved to your account.");
  } catch {
    if (form.isConnected) fail(form,"Your draft couldn’t be saved. Your answers are still here. Try again.");
    else if (signedInCandidate===user) notify("Your draft couldn’t be saved. Try again.");
  } finally {
    setCandidateWorkBusy(form,false);
  }
}
async function submitAccountRollout(form,answers) {
  const user=signedInCandidate;
  if (candidateWorkBusy) return;
  form.querySelector("[data-error]").hidden=true;
  setCandidateWorkBusy(form,true);
  try {
    const submission=await candidateAuth.submitRollout(rolloutAttempt,answers);
    if (signedInCandidate!==user) return;
    rolloutAttempt=null;
    rolloutDraftDirty=false;
    finishCandidateSubmission(form,submission);
  } catch (error) {
    const message=error.code==="40001" ? draftConflict : "Your work sample couldn’t be submitted. Your answers are still here. Try again.";
    if (form.isConnected) fail(form,message);
    else if (signedInCandidate===user) notify(message);
  } finally {
    setCandidateWorkBusy(form,false);
  }
}
async function submitCandidate(form, data) {
  const assessment = invitation.assessment ?? assessmentById(form.dataset.id);
  if (!assessment) return fail(form,"Open an assessment first.");
  const answers = criteria.map((_,index)=>clean(data.get(`answer-${index}`)));
  if (answers.some(answer=>!fits(answer,1,2000))) return fail(form,"Enter an answer for each criterion.");
  const opening = jobById(candidateJobId);
  if (signedInCandidate && form.dataset.accountRollout && !opening && assessment.id===starter.id) return submitAccountRollout(form,answers);
  if (opening && (jobStatus(opening)!=="open" || opening.assessmentId!==assessment.id)) return fail(form,"This opening needs to be rechecked before you can submit.");
  const previous = opening ? existingJobSubmission(opening.id) : null;
  if (previous) {
    receipt = previous;
    go("complete");
    return;
  }
  const companyResponses = readCompanyAnswers(form,data);
  if (!validCompanyResponses(companyResponses)) return fail(form,"Keep each company answer within 1,600 characters.");
  const openingDraft=opening && signedInCandidate ? openingDrafts.get(opening.id) : null;
  const id = form.dataset.submissionId ?? openingDraft?.id ?? uuid();
  let submission = {id,assessmentId:assessment.id,code:`PS-${id.slice(0,8).toUpperCase()}`,date:new Date().toISOString(),answers,sample:false,review:null,poolOptIn:!signedInCandidate && data.has("pool-opt-in")};
  if (opening) {
    submission.jobId = opening.id;
    submission.application = {title:opening.title,company:opening.company,sourceUrl:opening.sourceUrl};
  }
  if (companyResponses.length) submission.companyResponses = companyResponses;
  if (signedInCandidate) {
    const user=signedInCandidate;
    if (candidateWorkBusy) return;
    setCandidateWorkBusy(form,true);
    form.dataset.submissionId=id;
    try {
      submission=await candidateAuth.saveSample(user.id,submission);
    } catch {
      if (form.isConnected) fail(form,"Your work sample couldn’t be submitted. Your answers are still here. Try again.");
      return;
    } finally { setCandidateWorkBusy(form,false); }
    if (signedInCandidate!==user) return;
    if (openingDraft?.revision != null) {
      openingDrafts.delete(opening.id);
      dirtyOpeningDrafts.delete(opening.id);
      // The submitted sample is authoritative if the redundant draft cannot be cleared.
      void candidateAuth.clearOpeningDraft(user.id,opening.id,openingDraft).catch(()=>{});
    }
  }
  finishCandidateSubmission(form,submission);
}
function finishCandidateSubmission(form,submission) {
  receipt=submission;
  if (invitation.mode) state.receipt = receipt;
  else if (!state.submissions.some(item=>item.id===submission.id)) {
    state.submissions.push(receipt);
    state.applicantIds.push(submission.id);
  }
  delete state.drafts[form.dataset.draft];
  delete state.poolDrafts[form.dataset.draft];
  delete state.companyDrafts[form.dataset.draft];
  persist();
  if (form.isConnected || app.querySelector('[data-form="candidate"]')?.dataset.draft===form.dataset.draft) go("complete");
  else if (signedInCandidate) {
    if (page==="profile" && !editingProfile) render();
    notify("Work sample saved to your account.");
  }
}
function readCompanyAnswers(form,data) {
  return companyQuestionsFor(jobById(candidateJobId)).map((prompt,i)=>({
    prompt,
    answer:data ? clean(data.get(`company-answer-${i}`)) : form.elements[`company-answer-${i}`]?.value ?? ""
  }));
}
function validCompanyResponses(responses) {
  return Array.isArray(responses) && responses.length<=maxCompanyQuestions && responses.every(response=>
    response && fits(response.prompt,1,companyPromptLimit) && typeof response.answer==="string" && response.answer.length<=companyAnswerLimit);
}
function companyRatings(item,data) {
  return (item.companyResponses ?? []).map(({answer},i)=>{
    if (!answer) return 0;
    const rating = data.get(`company-score-${i}`);
    return rating==null || rating==="" ? null : Number(rating);
  });
}
function fail(form,message) {
  const error = form.querySelector("[data-error]");
  error.textContent = message;
  error.hidden = false;
  error.setAttribute("role","alert");
}
app.addEventListener("submit",event=>{
  const form=event.target;
  if (!form.dataset.form) return;
  event.preventDefault();
  const data=new FormData(form);
  if (!invitation.mode && form.dataset.form==="candidate-login") return previewCandidateLink(form,data);
  if (!invitation.mode && form.dataset.form==="recruiter-invite") return prepareRecruiterInvite(form,data);
  if (!invitation.mode && form.dataset.form==="northline-application") return submitNorthlineApplication(form,data,event.submitter?.name==="save-draft");
  if (!invitation.mode && form.dataset.form==="northline-review") return submitNorthlineReview(form,data);
  if (!invitation.mode && form.dataset.form==="demo-login") {
    const name=form.dataset.register==="true" ? clean(data.get("name")) : "";
    if (form.dataset.register==="true" && !demoRegistration(form,"recruiter",name)) return;
    return enterDemoAccount("recruiter",name);
  }
  if (!invitation.mode && page==="company" && form.dataset.form.startsWith("team-")) return submitTeamForm(form,data);
  if (form.dataset.form==="candidate") return submitCandidate(form,data);
  if (form.dataset.form==="rollout-review") return publishRolloutFeedback(form,data);
  if (form.dataset.form==="profile") return saveCandidateProfile(form,data);
  if (form.dataset.form==="job-editor") return saveJob(form,data);
  if (form.dataset.form==="confirm-job") return updateJobStatus(form,data);
  if (form.dataset.form==="job-search") {
    jobFilter = [clean(data.get("query")),clean(data.get("source"))];
    go("jobs");
    return;
  }
  if (form.dataset.form==="company") return enrollCompany(form,data);
  if (form.dataset.form==="block-company") return blockCompany(form,data);
  if (form.dataset.form==="request") return requestInterview(form);
  if (form.dataset.form==="create") {
    const glossary=parseGlossary(clean(data.get("glossary")));
    if (!validGlossary(glossary)) return fail(form,"Enter up to 12 unique glossary terms as Term | Definition. Use 2–48 characters for each term and 3–180 for each definition.");
    const item={id:uuid(),title:clean(data.get("title")),role:clean(data.get("role")),minutes:Number(data.get("minutes")),brief:clean(data.get("brief")),exhibit:clean(data.get("exhibit")),glossary};
    if (!validAssessment(item)) return fail(form,"Enter a title, role, and brief with at least 10 characters.");
    state.assessments.push(item);
    persist();
    go("assessments");
    notify(storageAvailable ? "Assessment created." : "Assessment created for this session. Browser storage is unavailable.");
  }
  if (form.dataset.form==="review") {
    const item=state.submissions.find(entry=>entry.id===form.dataset.id);
    if (!canAccessCompanyReview(item)) return fail(form,"This company submission is unavailable.");
    const scores=criteria.map((_,index)=>Number(data.get(`score-${index}`)));
    const notes=clean(data.get("notes"));
    if (!item || scores.some(score=>!Number.isInteger(score)||score<1||score>5) || !fits(notes,1,1600)) return fail(form,"Choose each score and add evidence-based feedback.");
    const companyScores = companyRatings(item,data);
    if (companyScores.some(score=>score!==null && (!Number.isInteger(score) || score<0 || score>5))) return fail(form,"Choose a score from 0 to 5 for each company question you score.");
    item.review={scores,notes,reviewer:companyReviewOpening ? currentTeamMember().name : item.review?.reviewer};
    if (companyScores.length) item.review.companyScores=companyScores;
    persist();
    render();
    app.querySelector("#score-total").setAttribute("tabindex","-1");
    app.querySelector("#score-total").focus();
    notify(storageAvailable ? "Review saved." : "Review saved for this session. Download a scorecard to keep it.");
  }
});
app.addEventListener("input",event=>{
  const form=event.target.form;
  if (form?.dataset.form==="candidate") {
    captureCandidateDraft(form);
    persist();
    const draftNotice=app.querySelector("#draft-status");
    if (form.dataset.accountRollout) rolloutDraftDirty=true;
    if (form.dataset.accountOpening) dirtyOpeningDrafts.add(form.dataset.accountOpening);
    const message=signedInCandidate ? accountDraftStatus(false,true) : localDraftStatus(form.dataset.draft);
    if (draftNotice.textContent!==message) draftNotice.textContent=message;
  }
  if (form?.dataset.form==="review") {
    const item=state.submissions.find(entry=>entry.id===form.dataset.id);
    const scores = criteria.map((_,i)=>Number(form.elements[`score-${i}`].value));
    const count = scores.filter(Boolean).length;
    if (event.target.type==="radio") app.querySelector("#score-total").textContent = count===criteria.length ? `${coreScoreText(item,{scores})} core points` : `${count} of ${criteria.length} criteria scored`;
    const companyStatus=app.querySelector("#company-score-status");
    if (companyStatus && event.target.name.startsWith("company-score-")) companyStatus.textContent=companyScoreText(item,companyRatings(item,new FormData(form)));
  }
});
function download(filename,type,content) {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportSubmission(item) {
  const {id,assessmentId,code,date,answers,poolOptIn,companyResponses}=item;
  download(`${item.code}-submission.json`,"application/json",JSON.stringify({format:"proof-of-skill-submission-v1",id,assessmentId,code,date,answers,poolOptIn,companyResponses},null,2));
}
function validSubmission(data) {
  return data && data.format==="proof-of-skill-submission-v1" && fits(data.id,36,36) &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(data.id) &&
    data.code===`PS-${data.id.slice(0,8).toUpperCase()}` && fits(data.date,1,40) && Number.isFinite(new Date(data.date).getTime()) &&
    (data.poolOptIn === undefined || typeof data.poolOptIn === "boolean") &&
    (data.companyResponses === undefined || validCompanyResponses(data.companyResponses)) &&
    Array.isArray(data.answers) && data.answers.length===criteria.length && data.answers.every(answer=>fits(answer,1,2000));
}
app.addEventListener("change",async event=>{
  if (page==="northlineApplication" && event.target.id==="northline-candidate") return changeNorthlineCandidate(event.target.value);
  if (!invitation.mode && page==="company" && ["team-workspace-picker","team-member-picker"].includes(event.target.id)) {
    return changeTeamView(event.target.id,event.target.value);
  }
  if (event.target.id==="candidate-career") {
    selectedCareer=event.target.value;
    render();
    app.querySelector("#candidate-career").focus();
    return;
  }
  if (event.target.id==="profile-preview-employer") {
    previewCompanyId=event.target.value;
    app.querySelector("#profile-preview-results").innerHTML=profilePreview(candidateWorkSamples());
    return;
  }
  if (event.target.id==="listing-source") {
    const partner = event.target.value==="employer";
    const field = app.querySelector("#job-assessment-field");
    field.hidden = !partner;
    field.disabled = !partner;
    app.querySelector("#source-url").required = !partner;
    app.querySelector("#source-url-label").textContent = partner ? "Official posting URL (optional)" : "Official posting URL";
    return;
  }
  if (event.target.id==="outreach-scope") {
    const scope=event.target.value;
    if (!Object.hasOwn(outreachScopes,scope)) return;
    state.outreach.scope=scope;
    updateOutreach("outreach-scope","Recruiter outreach updated.");
    return;
  }
  if (["pool-employer","pool-role","pool-band"].includes(event.target.id)) {
    const {id,value}=event.target;
    if (id==="pool-employer") poolCompanyId=value;
    else if (id==="pool-role") poolRole=value;
    else poolBand=value;
    render();
    document.getElementById(id).focus();
    return;
  }
  if (event.target.id!=="import-file") return;
  const file=event.target.files[0];
  event.target.value="";
  if (!file) return;
  try {
    if (file.size>65536) throw Error("Choose a submission JSON file under 64 KB.");
    const item=JSON.parse(await file.text());
    if (!validSubmission(item)) throw Error("This file is not a valid Proof of Skill submission.");
    if (!assessmentById(item.assessmentId)) throw Error("This workspace does not contain that assessment.");
    if (state.submissions.some(existing=>existing.id===item.id)) throw Error("This submission is already in the queue.");
    const {id,assessmentId,code,date,answers,poolOptIn,companyResponses}=item;
    state.submissions.push({id,assessmentId,code,date,answers,sample:false,review:null,poolOptIn:poolOptIn===true,companyResponses});
    persist();
    filter="all";
    go("submissions");
    notify(storageAvailable ? "Submission imported." : "Submission imported for this session. Browser storage is unavailable.");
  } catch(error) {
    notify(error instanceof SyntaxError ? "Choose an exported submission JSON file." : error.message);
  }
});
function exportScorecard(item) {
  const assessment=assessmentById(item.assessmentId);
  const lines=[
    "Proof of Skill · Work Sample Scorecard", assessment.title, assessment.role, `Candidate ${item.code}${item.sample ? " (demo sample)" : ""}`,
    `Human review · ${coreScoreText(item,item.review)} core points`, "",
    ...criteria.flatMap((criterion,i)=>[`${criterion.name} (${item.review.scores[i]}/5)`,item.answers[i], ""]),
    "Reviewer feedback",item.review.notes
  ];
  if (item.companyResponses?.length) {
    lines.push("","Company questions",companyScoreText(item,item.review.companyScores));
    item.companyResponses.forEach(({prompt,answer},i)=>{
      const rating=item.review.companyScores?.[i];
      lines.push("",prompt,answer || "Skipped",rating==null ? "Not scored" : `${rating} / 5`);
    });
  }
  download(`${item.code}-scorecard.txt`,"text/plain;charset=utf-8",lines.join("\n"));
}
function toggleShortlist(id) {
  const item = state.submissions.find(entry=>entry.id===id);
  if (!canAccessCompanyReview(item) || (companyReviewOpening && currentTeamMember()?.role==="manager")) return;
  if (!item?.review) return;
  item.shortlistedAt = item.shortlistedAt ? null : new Date().toISOString();
  persist();
  app.querySelector("#interview-panel").outerHTML = interviewPanel(item);
  app.querySelector('[data-action="shortlist"]').focus();
  const message = item.shortlistedAt ? "Added to interview shortlist." : "Removed from interview shortlist.";
  notify(storageAvailable ? message : message + " This change is available for this session.");
}
function encodeAssessment(item) {
  const bytes = new TextEncoder().encode(JSON.stringify(item));
  return btoa(Array.from(bytes, byte=>String.fromCharCode(byte)).join("")).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function downloadKit(id, control) {
  control.disabled = true;
  try {
    const assets = await Promise.all(["style.css","app.js"].map(async path => {
      const result = await fetch(path);
      if (!result.ok) throw Error("Candidate kit assets could not be loaded.");
      return result.text();
    }));
    const [style,script] = assets;
    const encoded = encodeAssessment(assessmentById(id));
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="assessment-packet" content="${encoded}"><title>Proof of Skill</title><style>${style}</style></head>
<body><div id="app"></div><div id="status" class="toast" role="status" aria-live="polite"></div>
<script>${script.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
    download("proof-of-skill-candidate-kit.html","text/html;charset=utf-8",html);
  } catch (error) {
    notify(error.message);
  } finally {
    control.disabled = false;
  }
}
async function copyInvitation(id) {
  const encoded = encodeAssessment(assessmentById(id));
  const url=new URL(location.href);
  url.hash=`invite=${encoded}`;
  try {
    await navigator.clipboard.writeText(url.toString());
    notify("Assessment link copied.");
  } catch {
    window.prompt("Copy this assessment link",url.toString());
  }
}
app.addEventListener("click",event=>{
  const menu=app.querySelector(".account-menu[open]");
  if (menu && (!menu.contains(event.target) || event.target.closest(".account-menu a"))) menu.open=false;
  const control=event.target.closest("[data-action]");
  if (!control) return;
  const {action,id}=control.dataset;
  if (!invitation.mode && page==="company" && action.startsWith("team-")) return handleTeamAction(action,id);
  switch(action) {
    case "save-candidate-draft": void saveCandidateDraft(control.form); break;
    case "refresh-rollout-results": void refreshRolloutResults(control); break;
    case "rollout-queue-page": void refreshRolloutQueue(Number(id)); break;
    case "rollout-review-open":
      if (canReviewRollout && rolloutQueue.rows.some(item=>item.key===id)) {
        selectedRolloutReview=id;
        render();
        app.querySelector("#main").focus({preventScroll:true});
      }
      break;
    case "rollout-queue-back":
      selectedRolloutReview=null;
      render();
      app.querySelector("#main").focus({preventScroll:true});
      break;
    case "candidate-google": void startGoogleSignIn(control); break;
    case "northline-sample-answers":
      if (page!=="northlineApplication") break;
      demoResponses[0].forEach((answer,index)=>{
        const field=control.form.elements["answer-"+index];
        if (!clean(field.value)) field.value=answer;
      });
      break;
    case "accept-recruiter-invite": void claimRecruiterInvite(control); break;
    case "recruiter-switch-account": void switchRecruiterAccount(control); break;
    case "send-recruiter-invite": void sendPreparedRecruiterInvite(control); break;
    case "copy-recruiter-invite":
      if (employerAccess?.can_invite && preparedRecruiterInvite) {
        void navigator.clipboard.writeText(preparedRecruiterInvite.link).then(()=>notify("Invite link copied."))
          .catch(()=>window.prompt("Copy this recruiter invitation link",preparedRecruiterInvite.link));
      }
      break;
    case "candidate-logout":
      if (!signedInCandidate || control.disabled) break;
      control.disabled=true;
      void candidateAuth.signOut().then(()=>{
        if (signedInCandidate) leaveCandidateAccount();
      }).catch(()=>{
        control.disabled=false;
        notify("Sign-out couldn’t complete. Try again.");
      });
      break;
    case "candidate-demo-link":
      if (candidateLinkPreview && !candidateAuth?.configured) enterDemoAccount("candidate",candidateLinkPreview.name);
      break;
    case "candidate-demo":
      if (candidateAuth?.teamEmailTest && !signedInCandidate) enterDemoAccount("candidate");
      break;
    case "candidate-change-email":
      candidateLinkPreview=null;
      render();
      app.querySelector("#candidate-login-email").focus();
      break;
    case "demo-logout":
      delete state.demoRole;
      persist();
      go("home");
      app.querySelector(".blue-login").focus();
      notify("Signed out of the Proof of Skill demo.");
      break;
    case "team-open-workspace": {
      const workspace=state.teamWorkspaces.find(item=>item.id===id);
      if (!workspace) break;
      if (state.teamView.workspaceId!==id) {
        state.teamView={workspaceId:id,memberId:workspace.members.find(member=>member.role==="owner").id};
        companySection="openings";
        persist();
      }
      go("company");
      break;
    }
    case "go":
      if (id==="submissions") submissionJobId=null;
      go(id);
      break;
    case "preview": candidateJobId=null; selectedAssessment=id; go("candidate"); break;
    case "job-detail": selectedJobId=id; go("jobDetail"); break;
    case "setup-role": editingJobId=null; newJobSource="employer"; go("jobEditor"); break;
    case "edit-job": editingJobId=id; newJobSource="careers"; go("jobEditor"); break;
    case "confirm-job": editingJobId=id; go("confirmJob"); break;
    case "close-job": {
      const item=jobById(id);
      if (!item || item.sample) break;
      item.closed=true;
      persist();
      go("manageJobs");
      notify("Opening closed.");
      break;
    }
    case "job-apply": {
      const item=jobById(id);
      if (!item || jobStatus(item)!=="open" || item.source!=="employer" || !assessmentById(item.assessmentId)) break;
      const previous=existingJobSubmission(id);
      if (previous) {
        receipt=previous;
        go("complete");
      } else {
        candidateJobId=id;
        selectedAssessment=item.assessmentId;
        go("candidate");
      }
      break;
    }
    case "job-submissions": submissionJobId=id; filter="all"; go("submissions"); break;
    case "back-to-submissions": go("submissions"); break;
    case "career-openings": {
      const assessment=assessmentById(id);
      if (assessment) {jobFilter=[assessment.role,"all"]; go("jobs");}
      break;
    }
    case "invite": void copyInvitation(id); break;
    case "kit": void downloadKit(id,control); break;
    case "restart":
      if (invitation.mode) {
        state.receipt=null;
        receipt=null;
        persist();
      }
      go("candidate");
      break;
    case "filter":
      filter=id;
      render();
      app.querySelector(`[data-action="filter"][data-id="${id}"]`)?.focus();
      break;
    case "review":
      if (canAccessCompanyReview(state.submissions.find(item=>item.id===id))) {
        selectedSubmission=id;
        go("review");
      }
      break;
    case "shortlist": toggleShortlist(id); break;
    case "application-interview": inviteApplicant(id); break;
    case "respond-yes": respondToInterview(id,"accepted"); break;
    case "respond-no": respondToInterview(id,"declined"); break;
    case "edit-profile": setProfileEditor(true); break;
    case "cancel-profile": setProfileEditor(false); break;
    case "pool-consent": togglePoolConsent(id); break;
    case "unblock-company": unblockCompany(id); break;
    case "import": app.querySelector("#import-file").click(); break;
    case "receipt": if (receipt) exportSubmission(receipt); break;
    case "scorecard": {
      const item=state.submissions.find(entry=>entry.id===id);
      if (item?.review && canAccessCompanyReview(item)) exportScorecard(item);
      break;
    }
  }
});
window.addEventListener("hashchange",()=>{
  const next=readInvitation();
  if (next.mode!==invitation.mode || (next.mode && JSON.stringify(next.assessment)!==JSON.stringify(invitation.assessment))) {
    location.reload();
    return;
  }
  if (!invitation.mode && applyRecruiterInviteHash()) {
    go("employerSignIn");
    return;
  }
  const destination=publicRoutes.get(location.hash) ?? (location.hash==="" ? "home" : null);
  if (!invitation.mode && destination && destination!==page) go(destination,false);
});
function showCandidateIdleWarning(visible) {
  const restoreFocus=!visible && sessionWarning.contains(document.activeElement);
  sessionWarning.hidden=!visible;
  sessionWarning.querySelector("#session-warning-message").textContent=visible ?
    "You’ll be signed out soon after 30 minutes of inactivity. Stay signed in if you need time to save your work." : "";
  if (restoreFocus) app.querySelector("#main")?.focus({preventScroll:true});
}
sessionWarning?.querySelector("button").addEventListener("click",()=>{
  candidateIdleTimer?.keepAlive();
});
function stopCandidateIdleTimer() {
  candidateIdleTimer?.stop();
  candidateIdleTimer=null;
  window.removeEventListener("candidate-session-changed",onCandidateSessionChange);
}
function onCandidateSessionChange() {
  leaveCandidateAccount(page==="employerSignIn" ? "employerSignIn" : "home");
}
function expireCandidateSession() {
  candidateAuthNotice="";
  const employer = page==="employerWorkspace" || page==="employerSignIn" || northlineReviewPages.has(page);
  candidateSessionNotice=(employer || page==="adminConsole" || page==="login") ? "You were signed out after 30 minutes of inactivity." :
    "You were signed out after 30 minutes of inactivity. Sign in to resume any saved drafts.";
  leaveCandidateAccount(employer ? "employerSignIn" : "login");
  void candidateAuth.signOut().catch(()=>{});
}
function leaveCandidateAccount(destination="home") {
  stopCandidateIdleTimer();
  signedInCandidate=null;
  employerAccess=null;
  preparedRecruiterInvite=null;
  canReviewRollout=false;
  rolloutAttempt=null;
  rolloutDraftDirty=false;
  openingDrafts.clear();
  dirtyOpeningDrafts.clear();
  rolloutQueue={rows:[],offset:0,hasNext:false,loading:false,error:""};
  receipt=null;
  state=demoWorkspace;
  go(destination);
}
async function initializeCandidateAccount() {
  const returning=new URLSearchParams(location.search).get("candidate-auth")==="1";
  const hasRoute=Boolean(location.hash);
  const savedIntent=recruiterSignInIntent();
  if ((page==="employerSignIn" || page==="login" || returning) && !pendingRecruiterToken &&
    recruiterInviteHash.test("#recruiter-invite="+savedIntent)) pendingRecruiterToken=savedIntent;
  const employer = page==="employerSignIn" || page==="employerWorkspace" ||
    Boolean(pendingRecruiterToken) || (returning && savedIntent===employerWorkspaceIntent);
  app.innerHTML='<main class="page reading" id="main" tabindex="-1"><p role="status">Loading your account…</p></main>';
  let idle;
  try {
    const user=await candidateAuth.initialize();
    if (!user) {
      if (employer) go("employerSignIn");
      else if (page==="adminConsole" || page==="northlineApplication" || northlineReviewPages.has(page)) go(page);
      else render();
      return;
    }
    idle=window.createCandidateIdleTimer({userId:user.id,fresh:returning,onWarning:showCandidateIdleWarning,onExpire:expireCandidateSession});
    candidateIdleTimer=idle;
    if (!idle.start()) return;
    window.addEventListener("candidate-session-changed",onCandidateSessionChange,{once:true});
    const [saved,access]=await Promise.all([
      candidateAuth.loadCandidate(user.id),
      candidateAuth.recruiterAccess().catch(()=>null)
    ]);
    if (candidateIdleTimer!==idle) return;
    const {name,roles,intro,skills,experience}=saved.profile ?? {};
    const workspace=freshState();
    workspace.jobs=sampleJobs();
    workspace.poolDrafts={};
    workspace.companyDrafts={};
    workspace.outreach={scope:"off",blocked:[]};
    workspace.profile={
      name:typeof name==="string" ? name.slice(0,80) : clean(user.user_metadata?.display_name ?? user.user_metadata?.full_name).slice(0,80),
      roles:Array.isArray(roles) ? roles.filter(role=>fits(role,1,80)).slice(0,8) : [],
      intro:typeof intro==="string" ? intro.slice(0,400) : "",
      skills:Array.isArray(skills) ? skills.filter(skill=>fits(skill,1,maxProfileSkillLength)).slice(0,maxProfileSkills) : [],
      experience:typeof experience==="string" ? experience.slice(0,maxProfileExperienceLength) : ""
    };
    workspace.submissions=saved.samples.filter(sample=>sample && validSubmission({...sample,format:"proof-of-skill-submission-v1"}) &&
      workspace.assessments.some(item=>item.id===sample.assessmentId)).map(sample=>({...sample,review:null,poolOptIn:false}));
    workspace.applicantIds=workspace.submissions.map(item=>item.id);
    if (saved.rolloutDraft && !workspace.applicantIds.includes(saved.rolloutDraft.id)) {
      const {id,revision,answers}=saved.rolloutDraft;
      rolloutAttempt={id,revision};
      workspace.drafts[starter.id]=answers;
    }
    for (const draft of saved.openingDrafts) {
      if (!workspace.jobs.some(job=>job.id===draft.opening_id) || workspace.submissions.some(sample=>sample.jobId===draft.opening_id)) continue;
      const draftKey=openingDraftKey(draft.opening_id);
      openingDrafts.set(draft.opening_id,{id:draft.id,revision:draft.revision});
      workspace.drafts[draftKey]=draft.answers;
      if (validCompanyResponses(draft.company_responses)) workspace.companyDrafts[draftKey]=draft.company_responses;
    }
    signedInCandidate=user;
    candidateSessionNotice="";
    canReviewRollout=saved.canReviewRollout;
    state=workspace;
    updateRolloutReviews(saved.reviews);
    employerAccess=access;
    if (pendingRecruiterToken) {
      if (!returning) return go("employerSignIn");
      const token=pendingRecruiterToken;
      const companyId=await acceptRecruiterInvite(token);
      if (candidateIdleTimer!==idle || pendingRecruiterToken!==token) return;
      return go(finishRecruiterAcceptance(companyId) ? "employerWorkspace" : "employerSignIn");
    }
    if (employer) {
      clearRecruiterSignInIntent();
      return go("employerWorkspace");
    }
    go(returning || !hasRoute || !signedInPages.has(page) || (page==="rolloutReviews" && !canReviewRollout) ? accountLandingPage() : page);
  } catch {
    if (idle && candidateIdleTimer!==idle) return;
    stopCandidateIdleTimer();
    candidateAuthNotice=returning ? (candidateAuth.googleEnabled ? "Sign-in couldn’t finish. Try Google again or request a fresh email link." :
      "This sign-in link couldn’t be opened. Request a fresh link and open it in this browser.") :
      "Your account couldn’t be loaded. Try signing in again.";
    go(employer ? "employerSignIn" : "login");
  }
}
if (!invitation.mode) initTeamWorkspaces();
if (!invitation.mode && candidateAuth?.configured) void initializeCandidateAccount();
else render();

