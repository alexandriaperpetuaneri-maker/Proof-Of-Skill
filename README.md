# Proof of Skill

A working prototype for a skills-first hiring network. Candidates complete a short work sample once and can opt in to discovery by multiple employers.

## First market

Start with small B2B software vendors that sell to municipalities or field-service teams and hire entry-level implementation coordinators. The buyer is the hiring manager who owns onboarding and implementation. People with frontline or adjacent operations experience are the first candidate audience.

The starter exercise is a fictional implementation rollout. Its shared glossary defines role-specific terms in plain language at first use and in a compact reference. Custom assessments can include up to 12 terms, which carry through demo links and standalone candidate kits. It tests whether a candidate can identify blockers, prioritize under a deadline, assign next steps, and communicate a launch decision. The results are meant to inform a live conversation.

## Work sample first

In a live pilot, candidates start from an assessment link. A human reviewer scores their work under a candidate code. With candidate consent, the work and rubric scores enter a pool for the role. All reviewed scores can appear in the pool. The default view includes every score, with optional filters for 4–11, 12–15, and 16–20 points. These are illustrative display ranges without validated hiring cutoffs.

Employers agree to consider people from nontraditional backgrounds and to review work before requesting résumés. In Talent pools, choose a demo employer and hiring role. The assessed results use work samples for the selected role. The suggested results use rubric scores on the starter assessment to demonstrate related-role and career-pivot suggestions. These are demo rules for three role pairs.

In My candidacy, candidates opt into outreach for their assessed roles, related roles, or career pivots. Outreach starts off. Each work sample also needs consent and a review before it appears. Candidates can add or remove company blocks at any time, including for companies that have yet to join the demo. A block applies to the company and any demo agency listed as recruiting for it. Pending requests that become unavailable are withdrawn. Past responses are kept in candidate history.

My profile brings together private candidate details, career interests, submitted work, scores, and reviewer feedback. The recruiter preview uses the selected demo employer's actual pool eligibility and shows only the candidate codes, evidence, and scores available to that employer.

Employers see a candidate code and shared work evidence. They can request a live interview, and candidates can register interest or decline in My candidacy. These are browser-local demo records. Employers handle actual interview scheduling separately.

## Job openings

Use Set up a role in the Hiring workspace to draft an employer-confirmed opening. Describe what candidates need on day one and what they’ll learn on the job. The standard Implementation Coordinator assessment is preselected. Employers can add up to three optional questions worth up to 10 points in total. Review applicants displays the core score out of 90 and the company score separately, with interview invitations available as soon as the core review is saved. Company questions and scores stay out of the portable talent pool record.

Candidates start in Choose a career, complete a work sample, and can then browse matching openings. Applying to a role using the same assessment fills in their earlier core answers for them to review and submit. Applicants receive interview invitations in My candidacy. An optional link to continue to the employer’s own application appears after human review.

Add external listing in Manage openings uses the employer’s official HTTPS posting and sends candidates there to apply.

The workspace owner records each source check manually. Publishing requires the check. Published listings expire after seven days, and closed or expired openings are hidden from the browse page. Updating a listing returns it to draft for another review. Listing data and assessment submissions are local to the current browser. Sample listings are marked and remain visible for the demo.

## Company workspaces

Choose **For employers → Preview a sample company** to open the company prototype. It includes two fictional companies. Use View as to compare company-wide owner and admin views, a recruiting lead’s departments, a recruiter’s assigned openings, and a hiring manager’s assigned reviews. Team settings creates or renames departments and manages individual memberships. An administrator can attach an existing employer opening for the same company, or create a new role directly under a department.

Recruiters can transfer their assigned opening to another active recruiter in the department. Owners, admins, and department leads can reassign openings from the handoff queue. Removing a member releases eligible recruiting assignments to the queue and leaves the job, applications, reviews, and interview requests in place. Handoff notes and completed transfers stay with the company. All records, identity switching, and view restrictions are local prototype behavior, with no real sessions or server-side authorization.

## Guided demo

The workspace links to [`guided-demo.html`](guided-demo.html), a self-contained, four-step walkthrough. Users can try submitting a work sample, scoring it as a reviewer, discovering it in a talent pool, and accepting or declining a fictional interview request. The same HTML file downloads from the demo and can be opened offline in a web browser. Example answers and scores are optional. Demo actions stay in that page session.

## Walkthrough

1. Open Talent pools to view two fictional employers and sample candidates, or add a demo employer.
2. Open Choose a career, complete the starter assessment or a custom work sample, and opt in to talent pool sharing. Turn on recruiter outreach in My candidacy.
3. Open the submission from the review queue. Score each dimension from 1 to 5, add feedback, and save.
4. In Talent pools, choose a participating employer, find the candidate code, and request an interview. In My candidacy, respond to the request or block the employer. Switch employers in Talent pools to see how the block applies.
5. For a separate candidate device, download a standalone candidate kit. The candidate opens the HTML and returns the submission JSON. Import for review. Recruiter outreach is available for candidates who submit from the workspace, where they can manage consent and company blocks. The owner can also preview the candidate-only route using a demo assessment link.

## Implementation

Serve the repository root as static HTML, CSS, and JavaScript. For example, run `python3 -m http.server 8000` and open `http://localhost:8000`. The guided demo and browser-local workspaces run without credentials. Keep the app on HTTPS or localhost for clipboard features. Drafts, assessments, submissions, reviews, company profiles, and interview requests in the browser-local demo persist in the current browser. The four fictional sample submissions can be scored and exported. Offline candidate kits include the app and brief. Submission import validates the file structure, matches the assessment ID, and rejects duplicate submission IDs. Scorecards export as text.

The hosted Proof of Skill preview is private. This repository can run standalone with fictional demo data. The optional Supabase integration below enables accounts, selected assessment reviews, and recruiter invitations through your own project.

## Paid pilot hypothesis

Recruit two or three hiring managers with upcoming implementation coordinator openings and candidates from adjacent operations roles. Use one common fictional work sample. Measure the share of reviewed, opted-in candidates who receive a live interview request, the time employers spend reviewing work, and how often employers interview someone they would have skipped during résumé screening. Test a flat employer fee for a small pilot and keep candidate access free. Pricing and willingness to pay are unvalidated.

## Candidate accounts

The shared sign-in screen uses the checked-in Supabase browser client (2.119.2, MIT). Google sign-in routes candidates to the candidate workspace, invited recruiters to their company workspace, and invite administrators to the Admin console. The Account menu lets administrators switch between the console, candidate workspace, and Northline employer preview. The private deployment also supports same-browser PKCE email links for Supabase team members. New email users start from Create account. Candidate profile details and submitted work samples are stored against the Supabase user ID. Practice applications for sample openings stay in the candidate’s account, separate from the browser-local demos.

The candidate workspace warns after 28 minutes of inactivity and signs out the browser session after 30 minutes. Activity is shared across tabs in the same browser. Use Save and continue later to keep assessment answers between sessions.

For a new deployment, apply the migrations in `supabase/migrations/` in filename order and add the site origin and full return URL ending in `/?candidate-auth=1` in Supabase Auth's URL configuration. Set your Supabase project origin without a trailing slash and its browser publishable key in `candidate-auth-config.js`. The checked-in configuration starts in standalone demo mode.

To enable Google, register the callback URI shown in Supabase's Google provider settings in Google Cloud, enter the Google client credentials into Supabase, and set `googleEnabled` to true. To send links to external addresses, configure custom SMTP in Supabase and remove `emailMode: "team-test"` from the browser config. Hosting access still applies to the private preview.

### Northline recruiter invitations

The Northline Field Systems demo uses email-bound invitations. The site owner’s verified Supabase user ID must be in `proof_of_skill_private.recruiter_invite_admins` to open the Admin console and prepare invitations. Give each invited recruiter viewer access to the private site. The recruiter accepts the company invitation on the shared sign-in page using the Google address it was sent to. The link expires after seven days.

Use **For employers** from the public-facing home screen or **Account → Employer workspace** when signed in. The employer entry keeps that destination through Google sign-in. Accounts without recruiter membership or admin access see instructions for opening an invitation or switching accounts.

The Northline employer workspace lists submissions for the fictional Implementation Coordinator opening. Open **Candidate view** to submit The Rollout Rescue as Avery Chen or check Morgan Ellis’s preloaded submission. Return to the employer workspace to open a sample by candidate code, score the rubric, publish feedback, and optionally shortlist. The candidate view shows the score, feedback, and application status. Northline demo drafts and decisions use browser storage and are separate from signed-in candidates’ saved practice work.

Deploy `supabase/functions/send-recruiter-invite` with JWT verification enabled. Set `RECRUITER_SITE_ORIGIN` to your deployment origin. For automatic delivery, set the function secrets `RESEND_API_KEY` and `RECRUITER_EMAIL_FROM` to a Resend sending key and verified sender address. An invite manager can open a prefilled email draft or copy the invitation link to send it manually.

### The rollout rescue

Signed-in candidates can use **Save and continue later** on the standalone Implementation Coordinator assessment and on assessments opened from practice listings. Drafts accept partial responses and can be resumed from My profile. The standalone assessment submission receipt includes the candidate code. My profile shows whether the sample is awaiting review, then shows the four rubric scores and both feedback notes when the reviewer publishes them. Use Refresh results to check from an already open profile.

Assessment reviews is available to accounts that the project administrator assigns in `public.rollout_reviewers`. The queue shows standalone Rollout Rescue submissions by candidate code. Drafts and candidate profiles are available only to their owners through the web app.
