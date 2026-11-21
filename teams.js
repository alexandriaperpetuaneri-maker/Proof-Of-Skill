"use strict";

const teamRoles = {
  owner:"Company owner",admin:"Company admin",lead:"Recruiting lead",
  recruiter:"Recruiter",manager:"Hiring manager"
};
const teamAccessDescriptions = {
  owner:"All company openings, team settings, and handoffs.",
  admin:"All company openings, team settings, and handoffs.",
  lead:"Openings and handoffs in your departments.",
  recruiter:"Your assigned openings and their applicant reviews.",
  manager:"Applicant reviews for openings assigned to you."
};
let companySection = "openings";
let companyEditorDepartment = null;
let companyReviewOpening = null;

function initTeamWorkspaces() {
  if (state.teamWorkspaces?.length) return;
  const northline = {
    id:"northline-team",name:"Northline Field Systems",
    departments:[{id:"delivery",name:"Customer Delivery"},{id:"integrations",name:"Integrations"}],
    members:[
      {id:"morgan",name:"Morgan Vale",role:"owner",departmentIds:[]},
      {id:"jules",name:"Jules Kim",role:"admin",departmentIds:[]},
      {id:"avery",name:"Avery Chen",role:"lead",departmentIds:["delivery","integrations"]},
      {id:"riley",name:"Riley Brooks",role:"recruiter",departmentIds:["delivery"]},
      {id:"noor",name:"Noor Ellis",role:"recruiter",departmentIds:["delivery","integrations"]},
      {id:"reese",name:"Reese Hart",role:"recruiter",departmentIds:["integrations"]},
      {id:"sam",name:"Sam Rivera",role:"manager",departmentIds:["delivery"]}
    ],handoffs:[]
  };
  const civicloop = {
    id:"civicloop-team",name:"CivicLoop Software",
    departments:[{id:"onboarding",name:"Onboarding"}],
    members:[{id:"taylor",name:"Taylor Reed",role:"owner",departmentIds:[]},
      {id:"drew",name:"Drew Park",role:"recruiter",departmentIds:["onboarding"]}],
    handoffs:[]
  };
  state.teamWorkspaces = [northline,civicloop];
  state.teamView = {workspaceId:northline.id,memberId:northline.members[0].id};

  const original = jobById("sample-implementation") ?? sampleJobs()[0];
  if (!jobById(original.id)) state.jobs.push(original);
  original.team = {workspaceId:northline.id,departmentId:"delivery",recruiterId:"riley",managerId:"sam"};
  state.jobs.push(
    {...original,id:"sample-team-integrations",title:"Implementation Coordinator · Integrations",
      description:"Plan scheduling software integrations and coordinate technical handoffs.",
      team:{workspaceId:northline.id,departmentId:"integrations",recruiterId:"reese",managerId:null}},
    {...original,id:"sample-team-onboarding",title:"Implementation Coordinator · Onboarding",company:civicloop.name,
      description:"Guide new customers through rollout and coordinate training.",
      team:{workspaceId:civicloop.id,departmentId:"onboarding",recruiterId:null,managerId:null}}
  );
  state.submissions.push({
    ...structuredClone(seed.submissions[2]),id:"team-sample-1",code:"PS-2101",jobId:original.id,poolOptIn:false,
    application:{title:original.title,company:northline.name,sourceUrl:""}
  });
}

const currentCompany = () => state.teamWorkspaces.find(workspace=>workspace.id===state.teamView.workspaceId);
const currentTeamMember = () => currentCompany()?.members.find(member=>member.id===state.teamView.memberId);
const companyAdmin = member => !!member && !member.removedAt && ["owner","admin"].includes(member.role);
const departmentIn = (workspace,id) => workspace.departments.find(department=>department.id===id);
const memberIn = (workspace,id) => workspace.members.find(member=>member.id===id);
const teamJobs = workspace => state.jobs.filter(job=>job.team?.workspaceId===workspace.id);
const memberOnDepartment = (member,departmentId) => !!member && !member.removedAt && member.departmentIds.includes(departmentId);
const canManageTeamDepartment = (member,departmentId) => companyAdmin(member) || (member?.role==="lead" && memberOnDepartment(member,departmentId));

function canReviewTeamOpening(job) {
  const workspace = currentCompany();
  const member = currentTeamMember();
  const team = job?.team;
  if (!workspace || team?.workspaceId!==workspace.id || !member || member.removedAt) return false;
  if (canManageTeamDepartment(member,team.departmentId)) return true;
  if (!memberOnDepartment(member,team.departmentId)) return false;
  return (member.role==="recruiter" && team.recruiterId===member.id) ||
    (member.role==="manager" && team.managerId===member.id);
}

function canSetTeamAssignment(job,field) {
  if (!canReviewTeamOpening(job) || jobStatus(job)==="closed") return false;
  const member = currentTeamMember();
  return canManageTeamDepartment(member,job.team.departmentId) || (field==="recruiterId" && member.role==="recruiter");
}

function possibleAssignees(workspace,departmentId,role) {
  return workspace.members.filter(member=>member.role===role && memberOnDepartment(member,departmentId));
}

function recordRecruiterAssignment(workspace,job,targetId,note) {
  const previous = job.team.recruiterId;
  if (previous===targetId) return;
  const pending = workspace.handoffs.find(handoff=>handoff.jobId===job.id && !handoff.completedAt);
  const now = new Date().toISOString();
  if (pending && targetId) {
    pending.to = memberIn(workspace,targetId).name;
    pending.completedAt = now;
    pending.resolution = note;
  } else {
    workspace.handoffs.unshift({jobId:job.id,from:memberIn(workspace,previous)?.name ?? "Unassigned",
      to:memberIn(workspace,targetId)?.name ?? "",note,createdAt:now,completedAt:targetId ? now : null});
  }
  job.team.recruiterId = targetId;
}

function reconcileTeamAssignments(workspace,member,reason) {
  for (const job of teamJobs(workspace)) {
    const assignment = job.team;
    const eligible = memberOnDepartment(member,assignment.departmentId);
    if (assignment.recruiterId===member.id && (!eligible || member.role!=="recruiter")) {
      if (jobStatus(job)==="closed") assignment.recruiterId=null;
      else recordRecruiterAssignment(workspace,job,null,reason);
    }
    if (assignment.managerId===member.id && (!eligible || member.role!=="manager")) assignment.managerId=null;
  }
}

const teamOption = (id,label,selected) => `<option value="${safe(id)}" ${id===selected ? "selected" : ""}>${safe(label)}</option>`;

function companyWorkspace() {
  const workspace = currentCompany();
  const member = currentTeamMember();
  const active = member && !member.removedAt;
  const allowedSections = ["openings"];
  if (active && (companyAdmin(member) || member.role==="lead")) allowedSections.push("handoffs");
  if (companyAdmin(member)) allowedSections.push("settings");
  if (!allowedSections.includes(companySection)) companySection="openings";
  const labels = {openings:"Assigned openings",handoffs:"Handoff queue",settings:"Team settings"};
  const visible = teamJobs(workspace).filter(canReviewTeamOpening);
  const departments = workspace.departments.filter(department=>canManageTeamDepartment(member,department.id));
  return `${header("Company workspace",safe(workspace.name),'<a class="btn" href="#recruiter-demo">Browser-only recruiter sign in</a>')}
    <div class="flow team-workspace">
      <p class="notice"><strong>Browser-local prototype.</strong> Use fictional information. “View as” simulates permissions. The same browser holds the demo data, and these controls provide no secure backend access enforcement.</p>
      <section class="panel panel-pad flow" aria-label="Demo workspace and account">
        <div class="form-row">
          <div class="field"><label for="team-workspace-picker">Company workspace</label><select id="team-workspace-picker">${state.teamWorkspaces.map(item=>teamOption(item.id,item.name,workspace.id)).join("")}</select></div>
          <div class="field"><label for="team-member-picker">View as</label><select id="team-member-picker">${workspace.members.map(item=>teamOption(item.id,item.name + " · " + teamRoles[item.role] + (item.removedAt ? " (removed)" : ""),member?.id)).join("")}</select></div>
        </div>
        ${active ? `<p class="subtle">${teamAccessDescriptions[member.role]}${member.departmentIds.length ? " " + safe(member.departmentIds.map(id=>departmentIn(workspace,id)?.name).filter(Boolean).join(", ")) + "." : ""}</p>` : '<p class="notice">Access removed. This member can no longer view opening or applicant records in the company prototype.</p>'}
      </section>
      ${active ? `<nav class="actions" aria-label="Company workspace sections">${allowedSections.map(section=>`<button type="button" class="btn ${section===companySection ? "primary" : ""}" data-action="team-section" data-id="${section}" aria-pressed="${section===companySection}">${labels[section]}</button>`).join("")}</nav>
        ${companySection==="settings" ? teamSettings(workspace,member) : companySection==="handoffs" ? teamHandoffQueue(workspace,visible) : teamOpenings(workspace,visible,departments)}` : ""}
      ${active ? `<details class="panel panel-pad team-disclosure"><summary>Create a demo company workspace</summary>
        <form class="form team-form" data-form="team-company">
          <div class="field"><label for="team-company-name">Fictional company name</label><input required maxlength="80" id="team-company-name" name="name"></div>
          <div class="field"><label for="team-owner-name">Fictional owner name</label><input required maxlength="80" id="team-owner-name" name="owner"></div>
          <p class="error" data-error hidden></p><div class="actions"><button class="btn">Create workspace</button></div>
        </form></details>` : ""}
    </div>`;
}

function teamOpenings(workspace,jobs,departments) {
  const available = state.jobs.filter(job=>!job.team && !job.sample && job.source==="employer" && companyKey(job.company)===companyKey(workspace.name));
  const options = departments.map(item=>teamOption(item.id,item.name)).join("");
  return `<section class="flow" aria-labelledby="team-openings-heading">
    <h2 id="team-openings-heading">Company openings</h2>
    ${departments.length ? `<form class="panel panel-pad request-form" data-form="team-new-opening">
      <div class="field"><label for="team-new-department">Department for the new opening</label><select id="team-new-department" name="department">${options}</select></div>
      <button class="btn primary">Set up a role</button><p class="error" data-error hidden></p>
    </form>
    ${available.length && companyAdmin(currentTeamMember()) ? `<details class="panel panel-pad team-disclosure"><summary>Attach an existing opening</summary>
      <form class="form team-form" data-form="team-attach-opening">
        <div class="field"><label for="team-attach-job">Opening to attach</label><select id="team-attach-job" name="job">${available.map(job=>teamOption(job.id,job.title)).join("")}</select></div>
        <div class="field"><label for="team-attach-department">Receiving department</label><select id="team-attach-department" name="department">${options}</select></div>
        <p class="error" data-error hidden></p><div class="actions"><button class="btn">Attach opening</button></div>
      </form></details>` : ""}` : ""}
    ${jobs.length ? jobs.map(job=>teamOpeningCard(workspace,job)).join("") : '<p class="panel empty">There are no openings in this view.</p>'}
  </section>`;
}

function teamOpeningCard(workspace,job) {
  const assignment = job.team;
  const applicants = state.submissions.filter(item=>item.jobId===job.id);
  const recruiter = memberIn(workspace,assignment.recruiterId);
  const manager = memberIn(workspace,assignment.managerId);
  const actor = currentTeamMember();
  const handoff = workspace.handoffs.find(entry=>entry.jobId===job.id &&
    (canManageTeamDepartment(actor,assignment.departmentId) || (entry.completedAt && actor.id===recruiter?.id)));
  const pendingInterviews = state.interviewRequests.filter(request=>request.jobId===job.id && request.status==="pending").length;
  const status = {open:"Published",draft:"Draft",expired:"Recheck due",closed:"Closed"}[jobStatus(job)];
  return `<article class="panel panel-pad flow">
    <div class="profile-heading"><div><h3>${safe(job.title)}</h3><p class="subtle">${safe(departmentIn(workspace,assignment.departmentId)?.name)} · ${applicants.length} ${applicants.length===1 ? "applicant" : "applicants"} · ${applicants.filter(item=>!item.review).length} awaiting review${pendingInterviews ? ` · ${pendingInterviews} pending interview ${pendingInterviews===1 ? "request" : "requests"}` : ""}</p></div><span class="pill neutral">${status}</span></div>
    <dl class="assignment-summary"><div><dt>Recruiter</dt><dd>${safe(recruiter?.name ?? "Unassigned")}</dd></div><div><dt>Hiring manager</dt><dd>${safe(manager?.name ?? "Unassigned")}</dd></div></dl>
    ${handoff && (handoff.note || handoff.resolution) ? `<div class="notice flow"><strong>Handoff from ${safe(handoff.from)}</strong>${handoff.note ? `<p class="text-block">${safe(handoff.note)}</p>` : ""}${handoff.resolution ? `<p class="text-block">${safe(handoff.resolution)}</p>` : ""}</div>` : ""}
    <div class="actions">${button("Review applicants","team-review",job.id,"","inbox")}
      ${!job.sample && canManageTeamDepartment(currentTeamMember(),assignment.departmentId) ? button("Edit opening","team-edit-opening",job.id) + button(status==="Published" ? "Recheck opening" : "Confirm and publish","team-confirm-opening",job.id) + (status==="Closed" ? "" : button("Close opening","team-close-opening",job.id)) : ""}</div>
    ${canSetTeamAssignment(job,"recruiterId") ? teamAssignmentForm(workspace,job,"recruiterId") : ""}
    ${canSetTeamAssignment(job,"managerId") ? teamAssignmentForm(workspace,job,"managerId") : ""}
  </article>`;
}

function teamAssignmentForm(workspace,job,field) {
  const recruiter = field==="recruiterId";
  const memberRole = recruiter ? "recruiter" : "manager";
  const label = recruiter ? "Transfer or assign recruiter" : "Assign hiring manager";
  const id = field + "-" + job.id;
  return `<details class="brief-detail team-disclosure"><summary>${label}</summary>
    <form class="form team-form" data-form="team-assignment" data-id="${safe(job.id)}" data-field="${field}">
      <div class="field"><label for="${safe(id)}">${recruiter ? "Recruiter" : "Hiring manager"}</label>
        <select name="member" id="${safe(id)}">${teamOption("",recruiter ? "Unassigned · Handoff queue" : "Unassigned")}${possibleAssignees(workspace,job.team.departmentId,memberRole).map(member=>teamOption(member.id,member.name,job.team[field])).join("")}</select>
      </div>
      ${recruiter ? `<div class="field"><label for="note-${safe(job.id)}">Handoff note (optional)</label><textarea id="note-${safe(job.id)}" name="note" maxlength="500" placeholder="What should the next recruiter pick up?"></textarea></div>` : ""}
      <p class="error" data-error hidden></p><div class="actions"><button class="btn">Save assignment</button></div>
    </form></details>`;
}

function teamHandoffQueue(workspace,jobs) {
  const unassigned = jobs.filter(job=>!job.team.recruiterId && jobStatus(job)!=="closed");
  const visibleJobIds = new Set(jobs.map(job=>job.id));
  const history = workspace.handoffs.filter(entry=>entry.completedAt && visibleJobIds.has(entry.jobId));
  return `<section class="flow" aria-labelledby="team-queue-heading">
    <h2 id="team-queue-heading">Unassigned openings</h2>
    ${unassigned.length ? unassigned.map(job=>teamOpeningCard(workspace,job)).join("") : '<p class="panel empty">No openings need a recruiter.</p>'}
    <h2>Handoff history</h2>
    ${history.length ? `<ul class="panel panel-pad team-history">${history.map(entry=>`<li><strong>${safe(jobById(entry.jobId)?.title)}</strong><p class="subtle">${safe(entry.from)} to ${safe(entry.to)} · ${dateLabel(entry.completedAt)}</p>${entry.note ? `<p class="text-block">${safe(entry.note)}</p>` : ""}${entry.resolution ? `<p class="text-block">${safe(entry.resolution)}</p>` : ""}</li>`).join("")}</ul>` : '<p class="panel empty">Completed transfers will appear here.</p>'}
  </section>`;
}

function canManageTeamMember(actor,member) {
  return companyAdmin(actor) && !!member && !member.removedAt &&
    member.role!=="owner" && (actor.role==="owner" || member.role!=="admin");
}

function teamSettings(workspace,actor) {
  return `<div class="columns team-settings">
    <section class="panel panel-pad flow" aria-labelledby="departments-heading">
      <h2 id="departments-heading">Departments</h2>
      <form class="request-form" data-form="team-department">
        <div class="field"><label for="new-team-department">New department name</label><input id="new-team-department" name="name" required maxlength="80"></div>
        <button class="btn">Add department</button><p class="error" data-error hidden></p>
      </form>
      ${workspace.departments.map(item=>`<details class="brief-detail team-disclosure"><summary>${safe(item.name)}</summary>
        <form class="form team-form" data-form="team-department" data-id="${safe(item.id)}">
          <div class="field"><label for="department-${safe(item.id)}">Department name</label><input id="department-${safe(item.id)}" name="name" required maxlength="80" value="${safe(item.name)}"></div>
          <p class="error" data-error hidden></p><div class="actions"><button class="btn">Rename department</button></div>
        </form></details>`).join("")}
    </section>
    <section class="panel panel-pad flow" aria-labelledby="members-heading">
      <h2 id="members-heading">Team members</h2>
      <details class="brief-detail team-disclosure"><summary>Add a demo team member</summary>${teamMemberForm(workspace,actor)}</details>
      ${workspace.members.map(member=>`<article class="team-member">
        <div class="profile-heading"><div><h3>${safe(member.name)}</h3><p class="subtle">${teamRoles[member.role]}
        ${member.departmentIds.length ? " · " + safe(member.departmentIds.map(id=>departmentIn(workspace,id)?.name).filter(Boolean).join(", ")) : ""}</p></div>
        ${member.removedAt ? '<span class="pill pending">Removed</span>' : ""}</div>
        ${canManageTeamMember(actor,member) ? `<details class="brief-detail team-disclosure"><summary>Edit membership</summary>${teamMemberForm(workspace,actor,member)}</details>
        <details class="brief-detail team-disclosure"><summary>Remove member</summary>
          <form class="form team-form" data-form="team-remove-member" data-id="${safe(member.id)}">
            <p class="subtle">Openings stay with their departments. Any active opening assigned to this recruiter moves to the handoff queue.</p>
            <p class="error" data-error hidden></p><div class="actions"><button class="btn">Remove ${safe(member.name)}</button></div>
          </form></details>` : ""}
      </article>`).join("")}
    </section>
  </div>`;
}

function teamMemberForm(workspace,actor,member) {
  const id = member?.id ?? "new";
  const roles = Object.entries(teamRoles).filter(([role])=>role!=="owner" && (role!=="admin" || actor.role==="owner"));
  return `<form class="form team-form" data-form="team-membership" data-id="${safe(member?.id)}">
    <div class="field"><label for="member-name-${safe(id)}">Fictional member name</label><input name="name" id="member-name-${safe(id)}" required maxlength="80" value="${safe(member?.name)}"></div>
    <div class="field"><label for="member-role-${safe(id)}">Role</label><select name="role" id="member-role-${safe(id)}">${roles.map(([role,label])=>teamOption(role,label,member?.role ?? "recruiter")).join("")}</select></div>
    <fieldset><legend>Department membership</legend><p class="subtle">Choose one or more departments for recruiting leads, recruiters, and hiring managers.</p>
      ${workspace.departments.map(department=>`<label class="consent compact"><input type="checkbox" name="department" value="${safe(department.id)}" ${member?.departmentIds.includes(department.id) ? "checked" : ""}><span>${safe(department.name)}</span></label>`).join("")}
    </fieldset>
    <p class="error" data-error hidden></p><div class="actions"><button class="btn">${member ? "Save membership" : "Add team member"}</button></div>
  </form>`;
}

function refreshTeamWorkspace(message) {
  persist();
  render();
  app.querySelector("#team-member-picker").focus({preventScroll:true});
  notify(storageAvailable ? message : message + " This change is available for this session.");
}

function changeTeamView(id,value) {
  if (id==="team-workspace-picker") {
    const workspace = state.teamWorkspaces.find(item=>item.id===value);
    if (!workspace) return;
    state.teamView = {workspaceId:workspace.id,memberId:workspace.members.find(item=>item.role==="owner").id};
  } else {
    if (!memberIn(currentCompany(),value)) return;
    state.teamView.memberId = value;
  }
  companySection = "openings";
  persist();
  render();
  document.getElementById(id).focus();
}

function submitTeamForm(form,data) {
  const workspace = currentCompany();
  const actor = currentTeamMember();
  if (!actor || actor.removedAt) return fail(form,"Choose an active demo member.");
  switch (form.dataset.form) {
    case "team-company": {
      const name=clean(data.get("name"));
      const owner=clean(data.get("owner"));
      if (!fits(name,1,80) || !fits(owner,1,80)) return fail(form,"Enter a fictional company and owner name.");
      if (state.teamWorkspaces.some(item=>companyKey(item.name)===companyKey(name))) return fail(form,"A workspace already uses that company name.");
      const item = {id:uuid(),name,departments:[{id:uuid(),name:"General Hiring"}],
        members:[{id:uuid(),name:owner,role:"owner",departmentIds:[]}],handoffs:[]};
      state.teamWorkspaces.push(item);
      state.teamView={workspaceId:item.id,memberId:item.members[0].id};
      companySection="openings";
      return refreshTeamWorkspace("Company workspace created.");
    }
    case "team-department": {
      if (!companyAdmin(actor)) return fail(form,"Choose a company owner or admin.");
      const existing = departmentIn(workspace,form.dataset.id);
      const name=clean(data.get("name"));
      if (form.dataset.id && !existing) return fail(form,"This department is unavailable.");
      if (!fits(name,1,80) || workspace.departments.some(dept=>dept.id!==existing?.id && companyKey(dept.name)===companyKey(name))) {
        return fail(form,"Enter a unique department name.");
      }
      if (existing) existing.name=name;
      else workspace.departments.push({id:uuid(),name});
      return refreshTeamWorkspace(existing ? "Department renamed." : "Department added.");
    }
    case "team-membership": {
      const member=memberIn(workspace,form.dataset.id);
      const name=clean(data.get("name"));
      const role=clean(data.get("role"));
      const departmentIds=[...new Set(data.getAll("department"))];
      if (!companyAdmin(actor) || (form.dataset.id && !canManageTeamMember(actor,member))) return fail(form,"This membership is unavailable.");
      if (!Object.hasOwn(teamRoles,role) || role==="owner" || (role==="admin" && actor.role!=="owner")) return fail(form,"Choose an available team role.");
      if (!fits(name,1,80) || workspace.members.some(item=>item.id!==member?.id && !item.removedAt && companyKey(item.name)===companyKey(name))) return fail(form,"Enter a unique fictional member name.");
      if (role!=="admin" && (!departmentIds.length || departmentIds.some(id=>!departmentIn(workspace,id)))) return fail(form,"Choose at least one department.");
      const fields={name,role,departmentIds:role==="admin" ? [] : departmentIds};
      if (member) {
        Object.assign(member,fields);
        reconcileTeamAssignments(workspace,member,"The previous assignee’s team membership changed.");
      } else workspace.members.push({id:uuid(),...fields});
      return refreshTeamWorkspace(member ? "Membership saved." : "Demo member added.");
    }
    case "team-remove-member": {
      const member=memberIn(workspace,form.dataset.id);
      if (!canManageTeamMember(actor,member)) return fail(form,"This member cannot be removed from this view.");
      member.removedAt=new Date().toISOString();
      reconcileTeamAssignments(workspace,member,"Recruiter removed from the workspace. Review the existing applications and interview activity.");
      return refreshTeamWorkspace("Member removed. Active recruiting assignments were released.");
    }
    case "team-assignment": {
      const job=jobById(form.dataset.id);
      const field=form.dataset.field;
      if (!["recruiterId","managerId"].includes(field) || !canSetTeamAssignment(job,field)) return fail(form,"This assignment is unavailable.");
      const id=clean(data.get("member")) || null;
      const note=clean(data.get("note"));
      const role=field==="recruiterId" ? "recruiter" : "manager";
      if (id && !possibleAssignees(workspace,job.team.departmentId,role).some(member=>member.id===id)) return fail(form,"Choose an active member of this department.");
      if (note.length>500) return fail(form,"Keep the handoff note within 500 characters.");
      if (field==="recruiterId") recordRecruiterAssignment(workspace,job,id,note);
      else job.team.managerId=id;
      return refreshTeamWorkspace(id || field==="managerId" ? "Assignment saved." : "Opening moved to the handoff queue.");
    }
    case "team-new-opening":
    case "team-attach-opening": {
      const departmentId=clean(data.get("department"));
      if (!departmentIn(workspace,departmentId) || !canManageTeamDepartment(actor,departmentId)) return fail(form,"Choose a department you manage.");
      if (form.dataset.form==="team-new-opening") {
        companyEditorDepartment=departmentId;
        editingJobId=null;
        newJobSource="employer";
        return go("jobEditor");
      }
      const job=jobById(data.get("job"));
      if (!companyAdmin(actor) || !job || job.sample || job.team || job.source!=="employer" || companyKey(job.company)!==companyKey(workspace.name)) {
        return fail(form,"Choose an unattached employer opening for this company.");
      }
      job.team={workspaceId:workspace.id,departmentId,recruiterId:null,managerId:null};
      return refreshTeamWorkspace("Opening attached to the department.");
    }
  }
}

function handleTeamAction(action,id) {
  if (action==="team-section") {
    companySection=id;
    render();
    app.querySelector('[data-action="team-section"][aria-pressed="true"]')?.focus();
    return;
  }
  const job=jobById(id);
  if (!canReviewTeamOpening(job)) return;
  if (action==="team-review") {
    companyReviewOpening=id;
    submissionJobId=id;
    filter="all";
    return go("submissions");
  }
  if (job.sample || !canManageTeamDepartment(currentTeamMember(),job.team.departmentId)) return;
  if (action==="team-close-opening") {
    job.closed=true;
    return refreshTeamWorkspace("Opening closed.");
  }
  companyEditorDepartment=job.team.departmentId;
  editingJobId=id;
  go(action==="team-confirm-opening" ? "confirmJob" : "jobEditor");
}

function canAccessCompanyReview(item) {
  return !companyReviewOpening || (item?.jobId===companyReviewOpening && canReviewTeamOpening(jobById(companyReviewOpening)));
}
