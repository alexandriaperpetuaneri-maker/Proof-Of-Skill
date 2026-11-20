
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
const state = readState();
state.poolDrafts ??= {};
if (!invitation.mode) {
  state.companies ??= structuredClone(seed.companies);
  state.interviewRequests ??= [];
  state.applicantIds ??= [];
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
  try {
    localStorage.setItem(key, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}
const views = {overview:"Overview", pools:"Talent pools", assessments:"Assessments", submissions:"Submissions", candidate:"Candidate view", candidacy:"My candidacy", rubric:"Review rubric", create:"New assessment", review:"Review submission", complete:"Submission receipt"};
const nav = [
  ["overview","grid"],["pools","person"],["assessments","file"],["submissions","inbox"],["rubric","rubric"],
  ["candidate","eye"],["candidacy","person"]
];
const app = document.querySelector("#app");
const status = document.querySelector("#status");
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
let page = invitation.mode ? (invitation.assessment && state.receipt ? "complete" : "candidate") : "overview";
let selectedAssessment = invitation.assessment?.id ?? starter.id;
let selectedSubmission = null;
let receipt = invitation.mode ? state.receipt : null;
let filter = "all";
let poolRole = starter.role.toLowerCase();
let poolBand = "all";
const assessmentById = id => state.assessments.find(a => a.id === id);
const dateLabel = date => new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(date));
const total = review => review.scores.reduce((a,b) => a+b,0);
const button = (label,action,id="",style="",symbol="") => `<button type="button" class="btn ${style}" data-action="${action}" data-id="${safe(id)}">${symbol ? icon(symbol) : ""}${label}</button>`;
const header = (title,description,actions="") => `<header class="page-head"><div><h1>${title}</h1><p>${description}</p></div>${actions && `<div class="actions">${actions}</div>`}</header>`;
const brand = () => `<div class="brand"><span class="logo">${icon("mark")}</span>Proof of Skill</div>`;
function sidebar() {
  const active = {create:"assessments",review:"submissions",complete:"candidate"}[page] ?? page;
  return `<aside class="sidebar">${brand()}<nav aria-label="Workspace">
    <div class="nav-label">Hiring workspace</div>
    ${nav.map(([name,symbol]) => `${name==="candidate" ? '<div class="nav-label secondary">Candidate experience</div>' : ""}<button class="nav-btn" type="button" data-action="go" data-id="${name}" ${active===name ? 'aria-current="page"' : ""}>${icon(symbol)}${views[name]}</button>`).join("")}
    </nav><div class="sidebar-footer"><span class="workspace-mark">PS</span><div><strong>Demo workspace</strong><small>Browser-local data</small></div></div></aside>`;
}
function render() {
  document.title = `${views[page]} · Proof of Skill`;
  const content = {overview,pools,assessments,submissions,candidate,candidacy,rubric,create,review,complete}[page]();
  app.innerHTML = invitation.mode ? `<div class="invited-shell"><div class="topbar"><strong>Proof of Skill</strong><span class="status-pill">Candidate assessment</span></div><main class="page" id="main" tabindex="-1">${content}</main></div>` :
    `<div class="shell">${sidebar()}<div><div class="topbar"><div class="crumb">Workspace ${icon("chevron")} <strong>${views[page]}</strong></div><div class="topbar-end"><span class="status-pill">Demo</span><span class="avatar" aria-label="Reviewer workspace">R</span></div></div><main class="page" id="main" tabindex="-1">${content}</main></div></div>`;
}
function go(next) {
  if (!views[next] || (invitation.mode && !["candidate","complete"].includes(next))) return;
  page = next;
  render();
  window.scrollTo(0,0);
  app.querySelector("#main").focus({preventScroll:true});
}
function rows(items, showAssessment = false) {
  if (!items.length) return '<p class="empty">No submissions match this view.</p>';
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="Submission table"><table>
    <thead><tr><th scope="col">Candidate</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col">Score</th><th scope="col"><span class="visually-hidden">Action</span></th></tr></thead>
    <tbody>${items.map(item => `<tr>
      <td><div class="row-label"><span class="tiny-mark">${icon("person")}</span><div><strong>${safe(item.code)}</strong>${showAssessment ? `<div class="subtle sample">${safe(assessmentById(item.assessmentId)?.title)}${item.sample ? " · Sample" : ""}</div>` : item.sample ? '<div class="subtle sample">Sample</div>' : ""}</div></div></td>
      <td>${dateLabel(item.date)}</td>
      <td>${submissionStatus(item)}</td>
      <td>${item.review ? `${total(item.review)} / 20` : "—"}</td>
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
  return `${header("Hiring workspace","Help companies discover candidates through work samples.",demoLink + button("New assessment","go","create","","plus"))}
    <section class="hero" aria-labelledby="featured-heading"><div class="hero-copy">
      <span class="hero-tag">${icon("file")} Starter assessment</span>
      <h2 id="featured-heading">The rollout rescue</h2>
      <p>A customer launch is slipping. See how a candidate prioritizes the work and gets the rollout back on track.</p>
      <div class="actions">${button("Explore talent pools","go","pools","light","person")}${button("Try the assessment","preview",starter.id,"ghost","eye")}</div>
    </div><div class="hero-art" aria-hidden="true"><div class="sheet back"></div><div class="sheet"><span class="glyph">${icon("file")}</span><i></i><i></i><i></i></div><span class="sheet-check">${icon("check")}</span></div></section>
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
function pools() {
  const roles = new Map(state.assessments.map(item=>[item.role.toLowerCase(),item.role]));
  const members = recent(state.submissions.filter(item=>canJoinPool(item) && assessmentById(item.assessmentId).role.toLowerCase()===poolRole));
  const visible = members.filter(item=>poolBand==="all" || bandFor(total(item.review)).id===poolBand);
  return `${header("Talent pools","Discover people who’ve demonstrated skills for the role.",button("Try an assessment","go","candidate","","eye"))}
    <div class="columns">
      <section class="flow" aria-label="Pool candidates">
        <div class="panel panel-pad form-row">
          <div class="field"><label for="pool-role">Role</label><select id="pool-role">${Array.from(roles,([value,label])=>`<option value="${safe(value)}" ${value===poolRole ? "selected" : ""}>${safe(label)}</option>`).join("")}</select></div>
          <div class="field"><label for="pool-band">Score range</label><select id="pool-band"><option value="all">All scores</option>${scoreBands.map(band=>`<option value="${band.id}" ${band.id===poolBand ? "selected" : ""}>${band.label}</option>`).join("")}</select></div>
        </div>
        ${visible.length ? visible.map(poolCard).join("") : '<p class="panel empty">No candidates have work samples in this view yet.</p>'}
      </section>
      <aside class="flow">
        <section class="panel panel-pad flow">
          <div><h2>Participating employers</h2><p class="subtle">Employers agree to consider nontraditional backgrounds and review work samples before résumés.</p></div>
          <ul class="rubric-list employer-list">${state.companies.map(company=>`<li>${icon("check")}${safe(company.name)}${company.sample ? "<span>Demo</span>" : ""}</li>`).join("")}</ul>
          <form class="form" data-form="company">
            <div class="field"><label for="company-name">Company name</label><input id="company-name" name="company" required maxlength="80" placeholder="Enter a demo company"></div>
            <label class="consent compact"><input type="checkbox" name="pledge" required><span>I’ll review work first and consider applicants who took a nontraditional path.</span></label>
            <p class="error" data-error hidden></p>
            <div class="actions"><button class="btn">Add an employer</button></div>
          </form>
        </section>
        <p class="subtle">Every reviewed candidate who opts in can appear in a role pool. Scores give employers a way to filter the pool.</p>
      </aside>
    </div>`;
}
function poolCard(item) {
  const assessment = assessmentById(item.assessmentId);
  const requests = state.interviewRequests.filter(request=>request.submissionId===item.id);
  const available = state.companies.filter(company=>!requests.some(request=>request.companyId===company.id));
  return `<article class="panel panel-pad flow">
    <div class="pool-card-head"><div><h2>${safe(item.code)}</h2><p class="subtle">${safe(assessment.title)}${item.sample ? " · Sample candidate" : ""}</p></div><span class="pill neutral">${total(item.review)} / 20</span></div>
    <details class="brief-detail pool-evidence"><summary>View work sample and scores</summary>
    ${item.answers.map((answer,i)=>`<div class="response-block"><h3>${criteria[i].name} <span class="subtle">${item.review.scores[i]} / 5</span></h3><p class="text-block">${safe(answer)}</p></div>`).join("")}</details>
    ${requests.length ? `<ul class="rubric-list employer-list" aria-label="Interview requests">${requests.map(request=>`<li>${icon("check")}${safe(companyById(request.companyId)?.name)}<span>${requestLabel(request)}</span></li>`).join("")}</ul>` : ""}
    ${available.length ? `<form class="request-form" data-form="request" data-id="${safe(item.id)}">
      <div class="field"><label for="request-${safe(item.id)}">Request as</label><select name="company" id="request-${safe(item.id)}" required><option value="">Choose an employer</option>${available.map(company=>`<option value="${safe(company.id)}">${safe(company.name)}</option>`).join("")}</select></div>
      <button class="btn primary">Request live interview</button><p class="error" data-error hidden></p>
    </form>` : ""}
  </article>`;
}
function requestLabel(request) {
  return {pending:"Requested",accepted:"Candidate interested",declined:"Candidate declined"}[request.status];
}
function candidacy() {
  const items = recent(state.submissions.filter(item=>state.applicantIds.includes(item.id)));
  return `${header("My candidacy","See your work samples and employer interest in this demo.",button("Try an assessment","go","candidate","primary","eye"))}
    <div class="reading flow">${items.length ? items.map(item=>{
      const requests = state.interviewRequests.filter(request=>request.submissionId===item.id);
      const poolStatus = canJoinPool(item) ? "In talent pool" : item.poolOptIn ? "Waiting for review" : "Pool sharing off";
      return `<article class="panel panel-pad flow">
        <div class="pool-card-head"><div><h2>${safe(assessmentById(item.assessmentId)?.title)}</h2><p class="subtle">Candidate code ${safe(item.code)}</p></div><span class="pill neutral">${poolStatus}</span></div>
        <div class="actions">${button(item.poolOptIn ? "Turn off pool sharing" : "Opt in to talent pool","pool-consent",item.id,"small")}</div>
        <h3>Interview requests</h3>
        ${requests.length ? `<ul class="rubric-list request-list">${requests.map(request=>`<li><div><strong>${safe(companyById(request.companyId)?.name)}</strong><p class="subtle">${requestLabel(request)}</p></div>
          ${request.status==="pending" ? `<div class="actions">${button("I'm interested","respond-yes",request.id,"primary small")}${button("Decline","respond-no",request.id,"small")}</div>` : ""}
        </li>`).join("")}</ul>` : '<p class="subtle">No interview requests yet.</p>'}
      </article>`;
    }).join("") : '<p class="panel empty">Submit a work sample from this browser to see your candidacy here.</p>'}</div>`;
}
function enrollCompany(form,data) {
  const name=clean(data.get("company"));
  if (!fits(name,1,80) || !data.has("pledge")) return fail(form,"Enter a company name and agree to review work first.");
  if (state.companies.some(company=>company.name.toLowerCase()===name.toLowerCase())) return fail(form,"That employer is already in the pool.");
  state.companies.push({id:uuid(),name,sample:false});
  persist();
  render();
  app.querySelector("#company-name").focus();
  notify("Employer added to this demo.");
}
function requestInterview(form,data) {
  const item=state.submissions.find(entry=>entry.id===form.dataset.id);
  const company=companyById(data.get("company"));
  if (!item || !canJoinPool(item) || !company) return fail(form,"Select a participating employer and eligible work sample.");
  if (state.interviewRequests.some(request=>request.submissionId===item.id && request.companyId===company.id)) return fail(form,"That employer has already requested an interview.");
  state.interviewRequests.push({id:uuid(),submissionId:item.id,companyId:company.id,status:"pending"});
  persist();
  render();
  app.querySelector("#pool-role").focus();
  notify("Request recorded in My candidacy for local demo candidates.");
}
function respondToInterview(id,status) {
  const request=state.interviewRequests.find(entry=>entry.id===id);
  if (!request || request.status!=="pending" || !state.applicantIds.includes(request.submissionId)) return;
  request.status=status;
  persist();
  go("candidacy");
  notify(status==="accepted" ? "Interest recorded." : "Request declined.");
}
function togglePoolConsent(id) {
  const item=state.submissions.find(entry=>entry.id===id);
  if (!item || !state.applicantIds.includes(id)) return;
  item.poolOptIn=!item.poolOptIn;
  persist();
  render();
  app.querySelector(`[data-action="pool-consent"][data-id="${id}"]`).focus();
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
function submissions() {
  const items = recent(state.submissions.filter(item => {
    switch (filter) {
      case "pending": return !item.review;
      case "reviewed": return !!item.review;
      case "shortlisted": return !!item.shortlistedAt;
      default: return true;
    }
  }));
  return `${header("Submissions","Work samples are listed by candidate code.",button("Import submission","import","","","upload"))}
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
  const draft = state.drafts[item.id] ?? [];
  return `${header(safe(item.title),`${safe(item.role)} · About ${item.minutes} minutes`, invitation.mode ? "" : button("Assessments","go","assessments"))}
    <div class="flow reading">
      <section class="panel panel-pad flow"><h2>Your briefing</h2>${assessmentBrief(item)}
        <p class="notice"><strong>Start with the work sample.</strong> A person reviews your response under a candidate code. You can then choose to make your work available to participating employers. Any résumé request comes after work review. Leave names and contact information out of your answers.</p>
      </section>
      <form class="panel panel-pad form" data-form="candidate" data-id="${safe(item.id)}">
        <div><h2>Your response</h2><p class="subtle" id="draft-status" aria-live="polite">${storageAvailable ? "Drafts are saved in this browser." : "Browser storage is unavailable."}</p></div>
        ${criteria.map((criterion,i)=>`<div class="field"><label for="answer-${i}">${criterion.name}</label><small id="prompt-${i}">${criterion.prompt}</small><textarea name="answer-${i}" id="answer-${i}" aria-describedby="prompt-${i}" required maxlength="2000">${safe(draft[i])}</textarea></div>`).join("")}
        <label class="consent"><input type="checkbox" name="pool-opt-in" ${state.poolDrafts[item.id] ? "checked" : ""}><span><strong>Join the talent pool after review</strong><small>Participating employers can see your candidate code, work sample, and rubric scores and request a live interview.</small></span></label>
        <p class="error" data-error hidden></p><div class="actions"><button class="btn primary">${invitation.mode ? "Finish work sample" : "Submit work sample"}</button></div>
      </form>
    </div>`;
}
function complete() {
  const item = receipt;
  if (!item) return header("Submission receipt","Open the candidate workspace to complete an assessment.");
  return `${header(invitation.mode ? "Work sample complete" : "Work sample submitted",`Candidate code ${safe(item.code)}`)}
    <section class="panel panel-pad flow reading">
      <p>${invitation.mode ? "Download your submission and send the file to the person who invited you." : storageAvailable ? "Your response is in this browser's review queue. Download a copy if you want to pass it to another reviewer." : "Download this submission before closing the page. Browser storage is unavailable."}</p>
      ${item.poolOptIn ? '<p class="subtle">You opted in to the talent pool. Your work is eligible after a human review.</p>' : ""}
      <div class="actions">${button("Download submission","receipt","","primary","download")}${invitation.mode ? button("Start another response","restart") : button("My candidacy","go","candidacy") + button("Open review queue","go","submissions")}</div>
    </section>`;
}
function rubric() {
  return `${header("Review rubric","Four criteria, each scored by a human reviewer on a 1–5 scale.")}
    <div class="cards">${criteria.map(criterion=>`<section class="panel panel-pad flow"><h2>${criterion.name}</h2><p>${criterion.prompt}</p><p class="subtle"><strong>Strong evidence</strong> · ${criterion.strong}</p></section>`).join("")}</div>
    <section class="panel panel-pad scale-card"><h2>Scoring scale</h2><ul class="rubric-list">${levels.slice(1).map((level,index)=>`<li><strong>${index+1}</strong> ${level}</li>`).join("")}</ul><p class="subtle">Use scores to guide the follow-up conversation and record evidence in your notes.</p></section>`;
}
function review() {
  const item = state.submissions.find(entry=>entry.id===selectedSubmission);
  if (!item) return header("Submission unavailable","Open another work sample.",button("Submissions","go","submissions"));
  const assessment = assessmentById(item.assessmentId);
  return `${header(safe(item.code),`${safe(assessment.title)} · Submitted ${dateLabel(item.date)}${item.sample ? " · Sample" : ""}`,button("Submissions","go","submissions"))}
    <div class="columns review-columns">
      <section class="panel panel-pad"><h2>Work sample</h2><details class="brief-detail"><summary>Assessment brief</summary>${assessmentBrief(assessment)}</details>
        ${item.answers.map((answer,index)=>`<div class="response-block"><h3>${criteria[index].name}</h3><p class="text-block">${safe(answer)}</p></div>`).join("")}
      </section>
      <div class="flow"><form class="panel panel-pad form" data-form="review" data-id="${safe(item.id)}">
        <div><h2>Scorecard</h2><p class="subtle" id="score-total" aria-live="polite">${item.review ? `${total(item.review)} / 20 points` : "Select one score per criterion."}</p><p class="subtle">Give credit for the candidate's reasoning when they explain it in their own words.</p></div>
        ${criteria.map((criterion,index)=>`<fieldset><legend>${criterion.name}</legend><small class="subtle">${criterion.strong}</small><div class="scale">
          ${levels.slice(1).map((label,i)=>`<label title="${safe(label)}"><input type="radio" name="score-${index}" value="${i+1}" aria-label="${i+1}: ${safe(label)}" required ${item.review?.scores[index] === i+1 ? "checked" : ""}><span>${i+1}</span></label>`).join("")}
        </div></fieldset>`).join("")}
        <div class="field"><label for="notes">Evidence and feedback</label><textarea id="notes" name="notes" required maxlength="1600" placeholder="Cite examples from the work sample.">${safe(item.review?.notes)}</textarea></div>
        <p class="error" data-error hidden></p><div class="actions"><button class="btn primary">Save review</button>${item.review ? button("Download scorecard","scorecard",item.id,"","download") : ""}</div>
      </form>${interviewPanel(item)}</div>
    </div>`;
}
function interviewPanel(item) {
  const description = item.shortlistedAt ? "The candidate is on the shortlist. The hiring team arranges any interview separately." :
    item.review ? "Decide whether to shortlist this candidate based on their work sample." : "Save your scorecard to unlock shortlisting.";
  const action = item.review ? button(item.shortlistedAt ? "Remove from shortlist" : "Shortlist for interview","shortlist",item.id,item.shortlistedAt ? "" : "primary",item.shortlistedAt ? "" : "check") :
    '<button class="btn" type="button" disabled>Shortlist for interview</button>';
  return `<section class="panel panel-pad flow" id="interview-panel" aria-labelledby="interview-heading">
    <div><h2 id="interview-heading">Live interview</h2><p class="subtle">${description}</p></div>
    <div class="actions">${action}</div>
  </section>`;
}
function uuid() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value=>value.toString(16).padStart(2,"0")).join("");
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");
}
function submitCandidate(form, data) {
  const assessment = invitation.assessment ?? assessmentById(form.dataset.id);
  if (!assessment) return fail(form,"Open an assessment first.");
  const answers = criteria.map((_,index)=>clean(data.get(`answer-${index}`)));
  if (answers.some(answer=>!fits(answer,1,2000))) return fail(form,"Enter an answer for each criterion.");
  const id = uuid();
  receipt = {id,assessmentId:assessment.id,code:`PS-${id.slice(0,8).toUpperCase()}`,date:new Date().toISOString(),answers,sample:false,review:null,poolOptIn:data.has("pool-opt-in")};
  if (invitation.mode) state.receipt = receipt;
  else {
    state.submissions.push(receipt);
    state.applicantIds.push(id);
  }
  delete state.drafts[assessment.id];
  delete state.poolDrafts[assessment.id];
  persist();
  go("complete");
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
  if (form.dataset.form==="candidate") return submitCandidate(form,data);
  if (form.dataset.form==="company") return enrollCompany(form,data);
  if (form.dataset.form==="request") return requestInterview(form,data);
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
    const scores=criteria.map((_,index)=>Number(data.get(`score-${index}`)));
    const notes=clean(data.get("notes"));
    if (!item || scores.some(score=>!Number.isInteger(score)||score<1||score>5) || !fits(notes,1,1600)) return fail(form,"Choose each score and add evidence-based feedback.");
    item.review={scores,notes};
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
    state.drafts[form.dataset.id]=criteria.map((_,i)=>form.elements[`answer-${i}`].value);
    state.poolDrafts[form.dataset.id]=form.elements["pool-opt-in"].checked;
    persist();
    const draftNotice=app.querySelector("#draft-status");
    const message=storageAvailable ? "Draft saved in this browser." : "Browser storage is unavailable.";
    if (draftNotice.textContent!==message) draftNotice.textContent=message;
  }
  if (form?.dataset.form==="review" && event.target.type==="radio") {
    const scores = criteria.map((_,i)=>Number(form.elements[`score-${i}`].value));
    const count = scores.filter(Boolean).length;
    app.querySelector("#score-total").textContent = count===criteria.length ? `${scores.reduce((a,b)=>a+b,0)} / 20 points` : `${count} of ${criteria.length} criteria scored`;
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
  const {id,assessmentId,code,date,answers,poolOptIn}=item;
  download(`${item.code}-submission.json`,"application/json",JSON.stringify({format:"proof-of-skill-submission-v1",id,assessmentId,code,date,answers,poolOptIn},null,2));
}
function validSubmission(data) {
  return data && data.format==="proof-of-skill-submission-v1" && fits(data.id,36,36) &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(data.id) &&
    data.code===`PS-${data.id.slice(0,8).toUpperCase()}` && fits(data.date,1,40) && Number.isFinite(new Date(data.date).getTime()) &&
    (data.poolOptIn === undefined || typeof data.poolOptIn === "boolean") &&
    Array.isArray(data.answers) && data.answers.length===criteria.length && data.answers.every(answer=>fits(answer,1,2000));
}
app.addEventListener("change",async event=>{
  if (event.target.id==="pool-role" || event.target.id==="pool-band") {
    const {id,value}=event.target;
    if (id==="pool-role") poolRole=value;
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
    const {id,assessmentId,code,date,answers,poolOptIn}=item;
    state.submissions.push({id,assessmentId,code,date,answers,sample:false,review:null,poolOptIn:poolOptIn===true});
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
    `Human review · ${total(item.review)}/20`, "",
    ...criteria.flatMap((criterion,i)=>[`${criterion.name} (${item.review.scores[i]}/5)`,item.answers[i], ""]),
    "Reviewer feedback",item.review.notes
  ];
  download(`${item.code}-scorecard.txt`,"text/plain;charset=utf-8",lines.join("\n"));
}
function toggleShortlist(id) {
  const item = state.submissions.find(entry=>entry.id===id);
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
  const control=event.target.closest("[data-action]");
  if (!control) return;
  const {action,id}=control.dataset;
  switch(action) {
    case "go": go(id); break;
    case "preview": selectedAssessment=id; go("candidate"); break;
    case "invite": void copyInvitation(id); break;
    case "kit": void downloadKit(id,control); break;
    case "restart": go("candidate"); break;
    case "filter":
      filter=id;
      render();
      app.querySelector(`[data-action="filter"][data-id="${id}"]`)?.focus();
      break;
    case "review": selectedSubmission=id; go("review"); break;
    case "shortlist": toggleShortlist(id); break;
    case "respond-yes": respondToInterview(id,"accepted"); break;
    case "respond-no": respondToInterview(id,"declined"); break;
    case "pool-consent": togglePoolConsent(id); break;
    case "import": app.querySelector("#import-file").click(); break;
    case "receipt": if (receipt) exportSubmission(receipt); break;
    case "scorecard": {
      const item=state.submissions.find(entry=>entry.id===id);
      if (item?.review) exportScorecard(item);
      break;
    }
  }
});
window.addEventListener("hashchange",()=>{
  const next=readInvitation();
  if (next.mode!==invitation.mode || (next.mode && JSON.stringify(next.assessment)!==JSON.stringify(invitation.assessment))) location.reload();
});
render();

