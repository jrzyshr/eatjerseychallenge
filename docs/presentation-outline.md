# Eat Jersey Challenge — Presentation Outline

Use this outline with **Copilot in PowerPoint** to build or enhance your slides.
Each section below maps to a slide. Copy a section's prompt into Copilot to
generate that slide with richer design, imagery, and layout.

---

## Slide 1 — Title

**Prompt for Copilot in PowerPoint:**
> Create a title slide with the heading "Building an Interactive Map to Eat Our Way Through New Jersey". Subtitle: "A journey through 564 municipalities — one meal at a time". Add a secondary subtitle: "Lessons learned building with GitHub Copilot, Leaflet, and vanilla JavaScript". Use a dark navy background with gold accents.

**Speaker notes:**
Welcome everyone. Today I'm going to share the story of how I built an interactive web map to track our journey to eat at a restaurant in every single one of New Jersey's 564 municipalities — and what I learned along the way about AI-assisted development with GitHub Copilot.

---

## Slide 2 — What is the Eat Jersey Challenge?

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "What is the Eat Jersey Challenge?" with these bullet points:
> - Visit a restaurant in every one of New Jersey's 564 municipalities
> - Share each visit on Instagram, TikTok, and Facebook
> - Document the journey — every borough, city, township, town, and village
> - 564 towns across 21 counties — a massive undertaking
> - Started with a spreadsheet… but we needed something better
> Use navy background, white text, gold accent bar under the title.

**Speaker notes:**
Set the stage. Explain the challenge: we want to eat at a restaurant in every single municipality in NJ. 564 is a LOT. We needed a way to track progress visually, not just rows in a spreadsheet.

---

## Slide 3 — The Vision: An Interactive Map

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "The Vision: An Interactive Map" with these bullet points:
> - Colour-coded map: gold = visited, grey = unvisited, orange = queued
> - Click any town to see restaurant, date, photos, and social links
> - Show progress at a glance — how much of NJ have we covered?
> - Share it publicly so friends and followers can explore
> - Replace the spreadsheet with something people actually want to look at
> Include a placeholder area on the right side for a screenshot of the live map. Navy background.

**Speaker notes:**
The vision was simple: instead of a spreadsheet, build an interactive map where you can see every town coloured by status and click for details. Something you can share with people and they'll actually explore.

**Suggested visual:** Screenshot of the live map showing visited (gold) and unvisited (grey) towns.

---

## Slide 4 — DEMO: The Live Map *(30-min version only)*

**Prompt for Copilot in PowerPoint:**
> Create a "DEMO" slide with the title "DEMO: The Live Map" in gold text on a very dark background. Add a large placeholder area in the center labeled "Live Demo". Below it, list these demo steps:
> - Show the map at full zoom — gold vs grey towns
> - Click a visited town — popup with restaurant, date, social links
> - Toggle detail view: queued (orange) and pre-challenge (purple)
> - Show the legend toggle

**Speaker notes:**
DEMO: Open the live map. Show the colour coding. Click on a visited town and walk through the popup. Toggle detail mode to show queued and pre-challenge.

---

## Slide 5 — Technology Stack Overview

**Prompt for Copilot in PowerPoint:**
> Create a two-column slide titled "Technology Stack Overview". Left column:
> - Frontend: Vanilla JavaScript (ES5+)
> - Mapping: Leaflet.js 1.9 + OpenStreetMap
> - Styling: CSS3 — no preprocessors
> - Icons: Font Awesome 6.7 (social brands)
> Right column:
> - Data: Static JSON committed to Git
> - Hosting: GitHub Pages
> - Scripts: Node.js + Python 3
> - CI/CD: GitHub Actions
> Use navy background with gold section headers.

**Speaker notes:**
Quick overview of the full stack. Key takeaway: this is a zero-dependency frontend with no build step. Data lives in Git. Hosting is free.

---

## Slide 6 — Why No Framework?

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Why No Framework?" with bullets:
> - Zero frontend dependencies — no npm install for the website itself
> - No build step — edit HTML/JS/CSS and push; GitHub Pages does the rest
> - Static-first: all data is a JSON file versioned in Git
> - Lower maintenance burden — no dependency updates, no breaking changes
> - Perfect for a personal project that needs to last for years
> - When you don't need React, don't use React
> Navy background, white text.

**Speaker notes:**
This isn't an anti-framework talk — it's about picking the right tool. A personal mapping project doesn't need a SPA framework. Vanilla JS + static hosting = years of zero-maintenance operation.

---

## Slide 7 — How to Make a Map

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "How to Make a Map" with bullets:
> - Leaflet.js: lightweight open-source mapping library
> - OpenStreetMap tiles: free map imagery, no API key required
> - GeoJSON: NJ municipality boundary polygons from US Census Bureau
> - Each polygon keyed by GEOID — a unique 10-digit Census identifier
> - Colour each polygon based on visit status from our JSON data
> - Add click handlers to open rich popups with town details
> Include a placeholder for a diagram showing: Leaflet + OSM Tiles + GeoJSON = Interactive Map

**Speaker notes:**
Three ingredients: a mapping library (Leaflet), map tiles (OpenStreetMap — free), and boundary polygons (GeoJSON from Census). The GEOID is the magic key that joins geographic shapes to our data.

**Suggested visual:** Diagram: Leaflet + OpenStreetMap + GeoJSON → Interactive Map

---

## Slide 8 — The Data Model

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "The Data Model" with bullets:
> - municipalities.json: flat object keyed by 10-digit GEOID
> - Each entry: name, county, townType, status, visitNumber
> - Restaurant info: restaurantName, dateVisited
> - Links array: [{category, platform, label, url}] — flexible & extensible
> - Status values: visited | unvisited | queued | pre-challenge
> - Schema evolved from simple boolean 'visited' to rich multi-status model
> Optionally include a small JSON code snippet showing a sample entry.

**Speaker notes:**
Walk through the data model. Show a sample JSON entry. GEOID-based keys eliminate name ambiguity (there are multiple 'Washington' towns). The links array is flexible — any platform, any category.

---

## Slide 9 — From Firebase to Static JSON

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "From Firebase to Static JSON" with bullets:
> - Originally started with Firebase Firestore as the database
> - Realized: the data only changes when WE update it — no real-time needed
> - Removed Firebase entirely (visible in early commit history)
> - Static JSON = zero cost, zero auth, zero backend maintenance
> - Git versioning gives us full history of every data change for free
> - Lesson: don't add infrastructure you don't need
> Include a visual showing Firebase (crossed out) → JSON file + Git logo

**Speaker notes:**
Important architecture lesson. We started with Firebase because it seemed 'proper' — but we only update data weekly. A static JSON file committed to Git is simpler, cheaper, and gives version history.

---

## Slide 10 — DEMO: Admin Panel & Data Flow *(30-min version only)*

**Prompt for Copilot in PowerPoint:**
> Create a "DEMO" slide titled "DEMO: Admin Panel & Data Flow" with these demo steps:
> - Open admin.html — searchable town list
> - Click a town — edit modal with status, restaurant, links
> - Edit a field, save, then export JSON
> - Show the downloaded municipalities.json

**Speaker notes:**
Walk through the admin panel. Search for a town, open it, show the edit form. Changes are in-memory only until you Export JSON. This exported file gets committed to Git.

---

## Slide 11 — Importing Data from Excel

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Importing Data from Excel" with bullets:
> - Existing data lived in an Excel spreadsheet before the website
> - Built a CSV-to-JSON import pipeline: npm run import path/to/file.csv
> - Custom CSV parser handles quoted fields with embedded commas
> - Preserves 'orphaned' links — data added via admin that isn't in Excel
> - Blank cell handling: won't accidentally erase existing data on import

**Speaker notes:**
The challenge: we had data in Excel already. We needed to get it into our JSON format. The import script is smart — it merges, not replaces. Orphaned links are preserved and flagged with warnings.

---

## Slide 12 — Generating an Excel Template

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Generating an Excel Template" with bullets:
> - Python script: npm run gen-template
> - Generates a full Excel workbook from municipalities.json
> - Pre-populated with all 564 towns and existing data
> - Colour-coded columns: identity, visit info, restaurant, social platforms
> - Summary sheet with live formulas showing progress by county
> - Auto-scales platform columns (2–5 slots per platform based on usage)

**Speaker notes:**
Show the generated Excel file. It's not just a dump — it has colour-coded columns, a summary sheet with formulas, and auto-scaled platform columns.

**Suggested visual:** Screenshot of the colour-coded Excel template.

---

## Slide 13 — Social Media Bulk Import

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Social Media Bulk Import" with bullets:
> - Instagram: PostFox browser extension exports all posts as JSON
> - Python script parses export, matches posts to towns by visit number
> - Facebook: Graph API fetches page posts automatically
> - Both scripts: normalize labels ('NJ Town #N: Name'), create backups
> - Output populates Excel columns → re-import via CSV pipeline
> - Result: social links for every visited town, added in bulk

**Speaker notes:**
Walk through the Instagram workflow: PostFox extension → JSON export → Python script matches by visit number → populates Excel → CSV import. Same pattern for Facebook using the Graph API.

---

## Slide 14 — Thumbnail Automation with GitHub Actions

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Thumbnail Automation with GitHub Actions" with bullets:
> - Thumbnails: Instagram post images shown in map popups
> - Script extracts shortcodes from Instagram URLs → downloads images
> - Images resized to 320px WebP using Sharp (Node.js)
> - GitHub Actions: triggered when PostFox export is committed
> - Automatically fetches missing thumbnails and commits new .webp files
> - Idempotent: safe to re-run — already-downloaded images are skipped
> Include a placeholder for a screenshot of a GitHub Actions workflow run.

**Speaker notes:**
Show the GitHub Actions workflow file. When someone pushes a new PostFox export, CI automatically downloads missing thumbnails and commits them. Zero manual work for image management.

**Suggested visual:** Screenshot of GitHub Actions workflow run showing green checkmarks.

---

## Slide 15 — Edge Cases & Data Quirks

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Edge Cases & Data Quirks" with bullets:
> - Ambiguous town names: 4 towns named 'Washington' across different counties
> - Solution: maintain an ambiguousNames set, append county to Wikipedia links
> - Schema migration: v1 had boolean 'visited' → v2 has 4-status model
> - Migration script: scripts/migrate-schema-v2.js for backward compatibility
> - SRI hash mismatch: Leaflet CDN integrity hash changed unexpectedly
> - GeoJSON size: full NJ polygon file is large — lazy loading considerations

**Speaker notes:**
Interesting edge cases. The ambiguous names problem was subtle — multiple towns share the same name in different counties. Schema migration shows how data models evolve. The SRI hash issue was a fun debugging exercise.

---

## Slide 16 — DEMO: Excel Import Workflow *(30-min version only)*

**Prompt for Copilot in PowerPoint:**
> Create a "DEMO" slide titled "DEMO: Excel Import Workflow" with these steps:
> - Show the generated Excel template (colour-coded columns, summary sheet)
> - Make a change in Excel — mark a town as visited
> - Export as CSV
> - Run: npm run import path/to/file.csv
> - Show the updated municipalities.json diff

**Speaker notes:**
DEMO: Open the Excel template. Point out colour coding and formulas. Make a change, export CSV, run the import. Show the JSON diff.

---

## Slide 17 — Vibe Coding: The Starting Point

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Vibe Coding: The Starting Point" with bullets:
> - The very first commit: 'initial set of vibe coded files'
> - GitHub Copilot (Agent mode) generated the entire first version
> - HTML, CSS, JavaScript, even the initial data structure
> - From idea to working prototype in a single session
> - Not perfect — but a working starting point to iterate on
> - This is the promise of AI-assisted development
> Use a slightly different shade to signal the new section. Gold accent.

**Speaker notes:**
The origin story. The second commit in the repo is literally called 'initial set of vibe coded files'. Copilot's Agent mode generated the entire first version. It worked! Not perfectly, but it was a functional prototype to iterate on.

---

## Slide 18 — Three Modes of Copilot

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Three Modes of Copilot" with three columns or a comparison layout:
> - Plan Mode: research → propose → approve → execute
> - Agent Mode: autonomous implementation with tool access
> - Ask Mode: conversational Q&A, read-only
> Add: "Each mode has a sweet spot — choosing wisely saves time"
> Add: "The real power: chaining modes in a workflow"

**Speaker notes:**
Introduce the three modes. Set up the next three slides that go deeper into each one with concrete examples from this project.

---

## Slide 19 — Plan Mode Deep Dive

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Plan Mode Deep Dive" with bullets:
> - Best for: architecture decisions and multi-file changes
> - Researches the codebase before proposing anything
> - Shows a step-by-step plan you can review and approve
> - Example: planning the schema migration from v1 to v2
> - Example: designing the Excel template generation script
> - Tip: use Plan mode when you're not sure HOW to approach a problem

**Speaker notes:**
Plan mode excels when you need to think before you act. We used it for the schema migration — it identified all files that needed to change and proposed the migration script.

---

## Slide 20 — Agent Mode Deep Dive

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Agent Mode Deep Dive" with bullets:
> - Best for: writing code, running scripts, iterating
> - Can edit files, run terminal commands, and respond to errors
> - Generated the bulk import scripts (Python and Node.js)
> - Built the admin panel UI from a description
> - Iterative: 'This doesn't work' → reads error → fixes it
> - Tip: give it clear, specific instructions — don't be vague

**Speaker notes:**
Agent mode is the workhorse. It generated most of the scripts. The key insight: it can run code and see errors, so it iterates like a developer. Give it specific instructions.

---

## Slide 21 — Ask Mode Deep Dive

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Ask Mode Deep Dive" with bullets:
> - Best for: understanding code, quick questions, debugging
> - Read-only — doesn't change anything
> - 'What does this function do?' → instant explanation
> - 'Why is this polygon not rendering?' → targeted debugging
> - Great for onboarding: 'Explain this codebase to me'
> - Tip: use Ask to understand before using Agent to change

**Speaker notes:**
Ask mode is your rubber duck. Use it to understand unfamiliar code or debug issues. It's read-only so it's safe. Great pattern: Ask → Plan → Agent.

---

## Slide 22 — Copilot Pain Points & Issues

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Copilot Pain Points & Issues" with a cautionary tone — maybe a yellow/orange accent. Bullets:
> - VS Code crashes: lost context window and conversation history
> - No way to recover a conversation after a crash
> - Context window limits: long sessions degrade response quality
> - Copilot sometimes 'forgets' earlier decisions in long conversations
> - Generated code needs review — can introduce subtle bugs
> - Workaround: break work into smaller, focused sessions

**Speaker notes:**
Be honest about the challenges. VS Code crashes were the most painful — losing an entire conversation. After ~30 minutes of back-and-forth, quality drops. Workaround: shorter sessions, commit often, use memory files.

---

## Slide 23 — Tips & Best Practices

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "Tips & Best Practices" with a positive tone — gold/green accents. Bullets:
> - Use memory files: .github/copilot-instructions.md for project context
> - Break large tasks into small, focused sessions
> - Commit frequently — you can always revert
> - Be specific: 'Add a gold border to visited polygons' > 'Make it look better'
> - Review every line of generated code — trust but verify
> - Plan mode first, then Agent — don't jump straight to implementation

**Speaker notes:**
Practical tips from real experience. Memory files give Copilot persistent context. Being specific with prompts is the single biggest quality lever. Always review the code.

---

## Slide 24 — DEMO: GitHub Copilot in Action *(30-min version only)*

**Prompt for Copilot in PowerPoint:**
> Create a "DEMO" slide titled "DEMO: GitHub Copilot in Action" with these steps:
> - Show a real Copilot conversation in VS Code
> - Demonstrate Plan mode: design a new feature
> - Switch to Agent mode: implement the plan
> - Show how it reads errors and self-corrects
> - Show a memory file and how it provides context

**Speaker notes:**
DEMO: Live Copilot usage. Start with Plan mode, review the plan, switch to Agent and build. Show the iterative error-correction cycle. Show a memory file.

---

## Slide 25 — Evolution Timeline

**Prompt for Copilot in PowerPoint:**
> Create a timeline/roadmap slide titled "Evolution Timeline" with these milestones (in order):
> 1. Initial commit → 'vibe coded files' — Copilot generates v1
> 2. Remove Firebase → pivot to static JSON
> 3. Schema migration → boolean → 4-status model
> 4. Admin panel → visual editing
> 5. Excel import pipeline → bulk data management
> 6. Social media imports → Instagram & Facebook automation
> 7. Thumbnail automation → GitHub Actions CI/CD
> 8. Iterative popup refinement → 10+ styling commits

**Speaker notes:**
Walk through the project timeline using commit history milestones. Each step built on the previous one. This wasn't planned up front — it evolved organically.

---

## Slide 26 — The Power of Iterative Refinement *(30-min version only)*

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "The Power of Iterative Refinement" with bullets:
> - 10+ commits just tweaking popup styles and thumbnail display
> - Font sizes, padding, overlay effects, hover states — small details
> - Each commit: small, focused, and reversible
> - Don't try to get it perfect the first time — iterate
> - Git makes this safe: every change is a revertible commit
> - AI-assisted iteration: 'Make the font smaller' → instant result

**Speaker notes:**
The commit history tells a story of relentless refinement. Over 10 commits just for popup styling. Small incremental improvements compound. Git makes it safe to experiment.

---

## Slide 27 — What I'd Do Differently

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "What I'd Do Differently" with bullets:
> - Start with the data model — get that right first
> - Set up the Excel pipeline earlier — bulk entry saves hours
> - Use TypeScript or JSDoc for better Copilot suggestions
> - Add basic tests — even for a personal project
> - Document decisions as you go — not after the fact
> - Shorter Copilot sessions from day one to avoid context loss

**Speaker notes:**
Honest retrospective. Getting the data model right first would have saved a migration. TypeScript would give Copilot better type context for suggestions.

---

## Slide 28 — By the Numbers

**Prompt for Copilot in PowerPoint:**
> Create a visually striking "By the Numbers" slide with large numbers:
> - 564 municipalities in New Jersey
> - [X] towns visited so far
> - [X] commits in the repository
> - 0 frameworks, 0 build tools, $0 monthly hosting cost
> - ~2,500 lines of JavaScript
> - 6 automation scripts (Node.js + Python)
> - 1 GitHub Actions workflow
> Use large typography for the numbers. Gold on navy.

**Speaker notes:**
Fun slide with project stats. Update the [X] placeholders with real numbers. The zero-cost angle is compelling — this entire project runs for free on GitHub Pages.

---

## Slide 29 — What's Next? *(30-min version only)*

**Prompt for Copilot in PowerPoint:**
> Create a slide titled "What's Next?" with bullets:
> - Continue visiting — 564 towns is a multi-year journey
> - Add county-level progress visualization
> - Implement search/filter on the public map
> - Mobile-friendly improvements
> - User submissions? Community contributions?
> - The website grows with the challenge

**Speaker notes:**
Share future plans. The project isn't done — it evolves as the challenge continues. Open it up for ideas from the audience.

---

## Slide 30 — Thank You / Q&A

**Prompt for Copilot in PowerPoint:**
> Create a closing slide with "Thank You!" in large gold text and "Questions?" below it. Include:
> - GitHub: github.com/jrzyshr/eatjerseychallenge
> - Live map: [your GitHub Pages URL]
> Dark navy background. Include the EJC logo centered above the text.

**Speaker notes:**
Thank the audience. Open up for questions. Share the GitHub link and live map URL for anyone who wants to explore.

---

## Tips for Using This Outline with Copilot in PowerPoint

1. **Copy one slide prompt at a time** into Copilot in PowerPoint
2. **Add the EJC logo** (`images/EJCLogo-Transparent.png`) to the slide master so it appears on every slide
3. **Add screenshots** where placeholder areas are noted — these make the biggest visual impact
4. **Customize speaker notes** with your own anecdotes and specific examples
5. **Update placeholder values** like [X] with real numbers from `git log --oneline | wc -l`
6. **For the 15-min version**, skip slides marked *(30-min version only)* and merge:
   - Slides 5+6 → single "Tech Stack" slide
   - Slides 11+12 → single "Data Import" slide
   - Slides 13+14 → single "Social & Automation" slide
   - Slides 18-21 → single "Copilot Modes" slide
   - Skip slide 26 (Iterative Refinement) and slide 29 (What's Next)
