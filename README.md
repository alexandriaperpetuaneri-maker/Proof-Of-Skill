# Proof of Skill

A browser-based prototype for skills-first hiring. Try the hiring workspace from the homepage or open the guided demo to follow a fictional work sample through review, a talent pool, and an interview request.

## Publish with GitHub Pages

1. Create a GitHub repository named `proof-of-skill` and initialize it with a README. GitHub Free supports Pages for public repositories.
2. Unzip `proof-of-skill-github.zip`. From the repository's Code tab, choose **Add file**, then **Upload files**. Upload the extracted files so `index.html` sits at the top level. Commit them to `main`.
3. In **Settings → Pages**, under **Build and deployment**, choose **Deploy from a branch**. Select **main** and **/(root)**, then save.
4. Open the URL displayed on the Pages settings screen once deployment finishes. To share the walkthrough directly, append `guided-demo.html` to the site URL.

## How the demo works

The workspace saves draft assessments, submissions, reviews, and interview requests in the current browser. Its example records are fictional. Use the demo with sample data. A live hiring pilot would need a shared backend and account access controls.

The site uses static HTML, CSS, and JavaScript with no build step or AI API. For local development, run `python3 -m http.server 8000` from this directory and open `http://localhost:8000`. The standalone `guided-demo.html` also opens directly in a browser.
