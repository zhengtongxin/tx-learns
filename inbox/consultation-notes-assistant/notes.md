# Project: a consultation notes assistant (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/06-consultation-notes-assistant.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'06-consultation-notes-assistant.html' to that item only.

Topic: Users, sign-in and money. Planned item: "Project: a consultation notes assistant" (project, tag "Users, sign-in and money · Project"). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Turn the product into something a professional would use: a form for visit notes that returns three tidy outputs. I used a clinic as the example; it is a demo, not medical software.

## Steps
1. A form: patient name, visit date (a real date picker), free-text notes.
2. A validated request on the API (Pydantic model) and a POST route, not GET, because the data is in the body.
3. A system prompt that always asks for three sections: a summary for the records, next steps for the professional, and a plain-language email to the patient.
4. Stream the reply, render markdown, keep the sign-in and plan gate from before.
5. Deploy and test the whole path: sign in, subscribe, submit, read the three sections.

## What I got wrong
- "Method not allowed": the route was still GET.
- Date sent in the wrong format; send ISO dates.
- Treated the demo as safe for real patient data. It is not: real use needs privacy law compliance, encryption, audit logs, access roles and consent.

## Try it yourself
1. Change the three outputs for another job (a teacher, a mechanic).
2. Add a field and make it required on both front end and API.
3. List five things a real deployment would need before touching private data.

## Takeaways
Structured input plus a structured prompt gives dependable output. Say clearly what a demo is not allowed to hold.
