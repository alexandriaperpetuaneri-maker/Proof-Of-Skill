"use strict";

const northlineApplicationHash = "#northline-application";
const northlineCandidateKey = "proof-of-skill-northline-candidate";
const northlineDemoCandidates = [
  {id:"avery", name:"Avery Chen", code:"PS-2101"},
  {id:"morgan", name:"Morgan Ellis", code:"PS-2102"}
];
const northlineReviewPages = new Map(northlineDemoCandidates.map(person=>["northlineReview-"+person.id,person]));
let northlineCandidateId = northlineDemoCandidates[0].id;
try { northlineCandidateId = sessionStorage.getItem(northlineCandidateKey) || northlineCandidateId; } catch {}

function northlineDemoRecord(person) {
  try {
    const record=JSON.parse(localStorage.getItem(northlineCandidateKey+"-"+person.id));
    if (Array.isArray(record?.answers)) return record;
  } catch {}
  return person.id==="morgan" ? {
    answers:demoResponses[1], submittedAt:"2026-11-19T20:50:00Z", feedback:null
  } : {answers:[], submittedAt:null, feedback:null};
}

function saveNorthlineDemoRecord(person,record,form) {
  try {
    localStorage.setItem(northlineCandidateKey+"-"+person.id,JSON.stringify(record));
    return true;
  } catch {
    fail(form,"This browser couldn’t save your changes. Your entries are still here.");
    return false;
  }
}

function northlineDemoStatus({submittedAt,feedback}) {
  return submittedAt ? feedback?.shortlisted ? "Shortlisted for interview" : feedback ? "Reviewed" : "Awaiting review" : "Draft";
}

function northlineDemoBadge(record) {
  return `<span class="pill ${record.feedback ? "reviewed" : record.submittedAt ? "pending" : "neutral"}">${northlineDemoStatus(record)}</span>`;
}

function northlineDemoPage(content,reading=false) {
  return `<div class="account-shell">
    <header class="account-header">${brand()}${accountMenu()}</header>
    <main id="main" class="page ${reading ? "reading" : ""} flow" tabindex="-1">${content}</main>
  </div>`;
}

function northlineReviewQueue() {
  const applications=northlineDemoCandidates.map(person=>({person,record:northlineDemoRecord(person)}))
    .filter(({record})=>record.submittedAt)
    .sort((left,right)=>Date.parse(right.record.submittedAt)-Date.parse(left.record.submittedAt));
  return `<section class="panel panel-pad flow" aria-labelledby="northline-queue">
    <div><h2 id="northline-queue">Applications</h2><p class="subtle">Review answers by candidate code and publish your feedback.</p></div>
    <ul class="rubric-list request-list">${applications.map(({person,record})=>`<li>
      <div><strong>${person.code}</strong><p class="subtle">${dateLabel(record.submittedAt)}${record.feedback ? ` · ${total(record.feedback)} / 20` : ""}</p></div>
      <div class="actions">${northlineDemoBadge(record)}<a class="btn small" href="#northline-review-${person.id}" aria-label="Review ${person.code}">Open work sample</a></div>
    </li>`).join("")}</ul>
  </section>`;
}

function northlineApplication() {
  const person=northlineDemoCandidates.find(entry=>entry.id===northlineCandidateId) ?? northlineDemoCandidates[0];
  const record=northlineDemoRecord(person);
  const navigation=employerDashboardAccess() ? '<a class="btn" href="#employer-workspace">Recruiter view</a>' :
    '<a class="btn" href="#my-candidacy">My candidacy</a>';
  return northlineDemoPage(`
    ${header(starter.role,`${employerDemoCompany} · ${starter.title}`,navigation)}
    <section class="panel panel-pad flow" aria-label="Demo candidate">
      <p class="notice">Fictional hiring demo. Drafts, reviews, and decisions stay in this browser. Use fictional information.</p>
      <div class="form-row">
        <div class="field"><label for="northline-candidate">Try as a candidate</label>
          <select id="northline-candidate">${northlineDemoCandidates.map(entry=>`<option value="${entry.id}" ${entry===person ? "selected" : ""}>${entry.name}</option>`).join("")}</select>
        </div>
        <div><p class="subtle">Candidate code ${person.code}</p>${northlineDemoBadge(record)}</div>
      </div>
    </section>
    ${record.submittedAt ? northlineCandidateResult(record) : `
      <section class="panel panel-pad flow"><div><h2>Your briefing</h2><p class="subtle">About ${starter.minutes} minutes</p></div>${assessmentBrief(starter)}</section>
      <form class="panel panel-pad form" data-form="northline-application" data-id="${person.id}">
        <div><h2>Your work sample</h2>
          <p class="subtle">Save a draft to finish later. Answer all four questions to submit.</p></div>
        ${criteria.map((item,index)=>`<div class="field">
          <label for="northline-answer-${index}">${item.name}</label>
          <small id="northline-prompt-${index}">${item.prompt}</small>
          <textarea name="answer-${index}" id="northline-answer-${index}" aria-describedby="northline-prompt-${index}" maxlength="2000" required>${safe(record.answers[index])}</textarea>
        </div>`).join("")}
        <p class="error" data-error hidden></p>
        <div class="actions">
          <button class="btn primary">Submit work sample</button>
          <button class="btn" name="save-draft" formnovalidate>Save and continue later</button>
          ${button("Fill blank answers with examples","northline-sample-answers","","text")}
        </div>
      </form>`}
  `,true);
}

function northlineCandidateResult({feedback}) {
  if (!feedback) return '<section class="panel panel-pad flow"><h2>Work sample submitted</h2><p>Your work is awaiting human review. Return here to see your score, feedback, and application status.</p></section>';
  return `<section class="panel panel-pad flow" aria-labelledby="northline-feedback">
    <div><h2 id="northline-feedback">Recruiter feedback</h2><p class="score-total">${total(feedback)} / 20</p></div>
    <ul class="rubric-list">${criteria.map((item,index)=>`<li>${item.name}<span>${feedback.scores[index]} / 5</span></li>`).join("")}</ul>
    <div class="response-block"><h3>What worked</h3><p class="text-block">${safe(feedback.strengths)}</p></div>
    <div class="response-block"><h3>What to improve</h3><p class="text-block">${safe(feedback.improvements)}</p></div>
  </section>`;
}

function northlineReview(person) {
  const record=northlineDemoRecord(person);
  const back='<a class="btn" href="#employer-workspace">Back to applications</a>';
  if (!record.submittedAt) return northlineDemoPage(header("Work sample unavailable","The candidate hasn’t submitted a work sample yet.",back),true);
  const feedback=record.feedback;
  return northlineDemoPage(`
    ${header(person.code,`${starter.role} · ${employerDemoCompany}`,back)}
    <div class="columns review-columns">
      <section class="panel panel-pad flow">
        <div><h2>Work sample</h2><p class="subtle">${starter.title} · Submitted ${dateLabel(record.submittedAt)}</p></div>
        <details class="brief-detail"><summary>Assessment brief</summary>${assessmentBrief(starter)}</details>
        <div>${record.answers.map((answer,index)=>`<div class="response-block"><h3>${criteria[index].name}</h3><p class="text-block">${safe(answer)}</p></div>`).join("")}</div>
      </section>
      <form class="panel panel-pad form" data-form="northline-review" data-id="${person.id}">
        <div><h2>Scorecard</h2><p class="subtle">Score each criterion from 1 to 5. Publishing shares the score, notes, and status with this demo candidate.</p></div>
        ${scoreFields(feedback?.scores)}
        <div class="field"><label for="northline-strengths">What worked</label><textarea id="northline-strengths" name="strengths" maxlength="1600" required>${safe(feedback?.strengths)}</textarea></div>
        <div class="field"><label for="northline-improvements">What to improve</label><textarea id="northline-improvements" name="improvements" maxlength="1600" required>${safe(feedback?.improvements)}</textarea></div>
        <label class="consent"><input type="checkbox" name="shortlist" ${feedback?.shortlisted ? "checked" : ""}><span><strong>Shortlist for interview</strong><small>Updates the application status in this demo.</small></span></label>
        <p class="error" data-error hidden></p>
        <div class="actions"><button class="btn primary">${feedback ? "Update feedback" : "Publish feedback"}</button></div>
      </form>
    </div>`);
}

function changeNorthlineCandidate(candidateId) {
  if (!northlineDemoCandidates.some(person=>person.id===candidateId)) return;
  northlineCandidateId=candidateId;
  try { sessionStorage.setItem(northlineCandidateKey,candidateId); } catch {}
  render();
  app.querySelector("#northline-candidate").focus();
}

function submitNorthlineApplication(form,data,draftOnly) {
  if (page!=="northlineApplication" || !signedInCandidate) return;
  const person=northlineDemoCandidates.find(entry=>entry.id===form.dataset.id);
  if (!person) return;
  const current=northlineDemoRecord(person);
  if (current.submittedAt) return go("northlineApplication");
  const answers=criteria.map((_,index)=>clean(data.get("answer-"+index)));
  if (answers.some(answer=>!fits(answer,draftOnly ? 0 : 1,2000))) return fail(form,"Complete all four answers before submitting.");
  const record={answers,submittedAt:draftOnly ? null : new Date().toISOString(),feedback:null};
  if (!saveNorthlineDemoRecord(person,record,form)) return;
  if (draftOnly) {
    form.querySelector("[data-error]").hidden=true;
    notify("Draft saved in this browser.");
  } else {
    go("northlineApplication");
    notify("Work sample submitted.");
  }
}

function submitNorthlineReview(form,data) {
  const person=northlineReviewPages.get(page);
  if (!employerDashboardAccess() || person?.id!==form.dataset.id) return;
  const record=northlineDemoRecord(person);
  if (!record.submittedAt) return fail(form,"This work sample is unavailable.");
  const scores=criteria.map((_,index)=>Number(data.get("score-"+index)));
  const strengths=clean(data.get("strengths"));
  const improvements=clean(data.get("improvements"));
  if (scores.some(score=>!Number.isInteger(score) || score<1 || score>5) ||
    !fits(strengths,1,1600) || !fits(improvements,1,1600)) return fail(form,"Choose all four scores and add both feedback notes.");
  record.feedback={scores,strengths,improvements,shortlisted:data.has("shortlist")};
  if (!saveNorthlineDemoRecord(person,record,form)) return;
  go("employerWorkspace");
  notify("Feedback published.");
}

