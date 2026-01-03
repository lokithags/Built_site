
import Groq from "groq-sdk";

/* ===================== ENHANCED LOGGER ===================== */
const log = {
  info: (m: string) => console.log(`[INFO] ${m}`),
  warn: (m: string) => console.warn(`[WARN] ${m}`),
  error: (m: string) => console.error(`[ERROR] ${m}`),

  promptSent: (target: string, prompt: string) => {
    console.log(`[GROQ PROMPT → ${target.toUpperCase()}]`);
    console.log("────────────────────────────────────────");
    const preview = prompt.length > 2000 ? prompt.substring(0, 2000) + "\n... (TRUNCATED)" : prompt;
    console.log(preview);
    console.log("────────────────────────────────────────\n");
  },

  rawReceived: (target: string, raw: string) => {
    console.log(`[GROQ RAW RESPONSE ← ${target.toUpperCase()}] (length: ${raw.length})`);
    console.log("────────────────────────────────────────");
    const preview = raw.length > 3000 ? raw.substring(0, 3000) + "\n... (TRUNCATED)" : raw;
    console.log(preview);
    console.log("────────────────────────────────────────\n");
  },

  cleanedOutput: (target: string, cleaned: string) => {
    console.log(`[CLEANED OUTPUT → ${target.toUpperCase()}] (length: ${cleaned.length})`);
    if (cleaned.length === 0) {
      console.log("EMPTY AFTER CLEANING!");
      return;
    }
    if (target.toLowerCase() === "json") {
      console.log("PREVIEW (first ~2000 chars):");
      console.log(cleaned.substring(0, 2000));
      if (cleaned.length > 2000) console.log(`\n... (full JSON: ${cleaned.length} characters)`);
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.speakers?.length) console.log(`Speakers: ${parsed.speakers.length}`);
        if (parsed.schedule?.length) {
          const sessions = parsed.schedule.reduce((s: number, d: any) => s + (d.sessions?.length ?? 0), 0);
          console.log(`Schedule: ${parsed.schedule.length} days, ${sessions} sessions`);
        }
        if (parsed.event?.title) console.log(`Event: "${parsed.event.title}"`);
      } catch {}
    } else {
      const preview = cleaned.length < 500 ? cleaned : cleaned.substring(0, 1000) + "\n... (preview truncated)";
      console.log(preview);
    }
    console.log("\n");
  },

  validationFail: (target: string, reason: string) => {
    console.error(`[VALIDATION FAILED] ${target.toUpperCase()}: ${reason}`);
  },

  success: (target: string) => {
    console.log(`[SUCCESS] ${target.toUpperCase()} generated and validated\n`);
  },
};

/* ===================== SMART CONTENT EXTRACTION ===================== */
const extractCleanContent = (text: string): string => {
  const match = text.match(/```(?:json|html|css|javascript)?\s*\n?([\s\S]*?)\n?```/i);
  if (match) return match[1].trim();
  return text.replace(/```[\s\S]*?```/g, "").trim();
};

/* ===================== SPA CONSTRAINT ===================== */
const SPA_CONSTRAINT = `
CRITICAL RULES (ABSOLUTE):
- SINGLE PAGE APPLICATION
- ONLY index.html (NO other HTML files)
- Pages are SECTIONS, not files
- Navigation via JavaScript ONLY
- data.json is the ONLY content source
- index.html = structure only
- styles.css = styling only
- script.js = routing + rendering
- NO explanations, NO markdown, NO extra files
`;

/* ===================== CSS MASTER PROMPT ===================== */
const CSS_MASTER_PROMPT = `
You are an elite creative frontend designer who builds visually striking,
cinematic emotionally engaging single-page experiences — NOT dashboards,
NOT SaaS admin panels, NOT generic card-based UIs.

ABSOLUTE VISUAL REQUIREMENTS (NON-NEGOTIABLE):

- FULL-SCREEN HERO DESIGN
- DRAMATIC TYPOGRAPHY
- MINIMAL UI, MAXIMUM IMPACT
- VISUAL DEPTH & MOOD
- ANIMATED PRESENCE

STRICT AVOIDANCES:
- NO generic cards
- NO business dashboard look
- NO light grey backgrounds everywhere
- NO tiny fonts
- NO “corporate SaaS” aesthetic

CSS GUIDELINES:
- Use CSS variables for colors
- Use flex or grid to center content
- Prefer full-width layouts
- Buttons must be bold, large, and obvious
- Icons may float using position: absolute

The site should feel like:
“A cinematic landing page or interactive experience,
not an admin tool or documentation site.”

Deliver CSS that prioritizes:
EMOTION → FOCUS → IMPACT → STYLE
`;

/* ===================== GROQ CLIENT ===================== */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

/* ===================== TYPES ===================== */
export interface CodeBundle {
  html: string;
  css: string;
  js: string;
  json: string;
}

export interface ProjectArtifacts extends CodeBundle {
  plan: string;
}

type EditableFile = keyof CodeBundle;
type Mode = "plan" | "code";

/* ===================== ROLLBACK ===================== */
const rollbackHistory: CodeBundle[] = [];

function saveSnapshot(code: CodeBundle) {
  rollbackHistory.push(JSON.parse(JSON.stringify(code)));
}

function rollback(): CodeBundle | null {
  if (rollbackHistory.length < 2) return null;
  rollbackHistory.pop();
  return JSON.parse(JSON.stringify(rollbackHistory[rollbackHistory.length - 1]));
}

/* ===================== VALIDATION ===================== */
function assertValid(file: EditableFile | "plan", content: string) {
  log.cleanedOutput(file, content);

  if (!content || content.length < 100) {
    log.validationFail(file, "Output too short or empty after cleaning");
    throw new Error(`${file} output invalid or empty`);
  }

  if (file === "html" && !content.trimStart().startsWith("<!DOCTYPE html")) {
    log.validationFail(file, "Missing <!DOCTYPE html>");
    throw new Error("Invalid HTML");
  }

  if (file === "json") {
    try {
      JSON.parse(content);
    } catch (e: any) {
      log.validationFail("json", `Parse error: ${e.message}`);
      throw new Error("Invalid JSON");
    }
  }

  if (/(about|contact|projects|login)\.html/i.test(content)) {
    log.validationFail(file, "Multi-page HTML detected");
    throw new Error("Multi-page HTML not allowed");
  }

  log.success(file);
}

/* ===================== GENERATION CORE ===================== */
async function generateWithGroq(prompt: string, temperature = 0.4): Promise<string> {
  log.info("Calling Groq API");
  log.promptSent("GROQ", prompt);

  const model = "openai/gpt-oss-120b";

  const res = await groq.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature,
    max_tokens: 8192,
  });

  const raw = res.choices[0]?.message?.content || "";
  if (!raw) throw new Error("Empty response from Groq");

  log.rawReceived("GROQ", raw);

  const cleaned = extractCleanContent(raw);
  return cleaned;
}

/* ===================== STEP 1: GENERATE PLAN ===================== */
async function generateProjectPlan(userPrompt: string): Promise<string> {
  const prompt = `
${CSS_MASTER_PROMPT}

${SPA_CONSTRAINT}

You are an expert full-stack architect.

Output a detailed project plan in plain text (no code, no markdown).

Focus heavily on:
- SPA section-based routing
- Complete data.json schema (MOST IMPORTANT)
- Rendering flow
- Responsibilities of each file

User request: "${userPrompt}"

Output only the plan text.
`.trim();

  const plan = await generateWithGroq(prompt, 0.3);
  assertValid("plan", plan);
  return plan;
}

/* ===================== STEP 2: GENERATE ALL 4 FILES IN ONE CALL ===================== */
async function generateAllFiles(plan: string): Promise<CodeBundle> {
  const prompt = `
${SPA_CONSTRAINT}

Using this project plan, generate ALL 4 files: data.json, index.html, styles.css, script.js.

IMPORTANT: All content, text, headings, images, numbers, and sections must come from data.json.
Do not hardcode any content in HTML or JS. JS should dynamically fetch and render everything from data.json.

For CSS:
${CSS_MASTER_PROMPT}

Output them exactly like this (no extra text):

--- data.json ---
[complete raw JSON]

--- index.html ---
[complete raw HTML]

--- styles.css ---
[complete raw CSS]

--- script.js ---
[complete raw JavaScript]

PROJECT PLAN:
${plan}
`.trim();

  const fullResponse = await generateWithGroq(prompt, 0.4);

  const jsonMatch = fullResponse.match(/--- data\.json ---\n([\s\S]*?)\n---/);
  const htmlMatch = fullResponse.match(/--- index\.html ---\n([\s\S]*?)\n---/);
  const cssMatch = fullResponse.match(/--- styles\.css ---\n([\s\S]*?)\n---/);
  const jsMatch = fullResponse.match(/--- script\.js ---\n([\s\S]*?)$/);

  if (!jsonMatch || !htmlMatch || !cssMatch || !jsMatch) {
    throw new Error("Failed to extract all 4 files from response");
  }

  const json = jsonMatch[1].trim();
  const html = htmlMatch[1].trim();
  const css = cssMatch[1].trim();
  const js = jsMatch[1].trim();

  assertValid("json", json);
  assertValid("html", html);
  log.cleanedOutput("css", css);
  log.cleanedOutput("js", js);
  log.success("css");
  log.success("js");

  return { json, html, css, js };
}

/* ===================== MAIN GENERATION — ONLY 2 CALLS ===================== */
export async function generateWebAppWithRollback(prompt: string): Promise<ProjectArtifacts> {
  try {
    log.info("STEP 1: Generating project plan");
    const plan = await generateProjectPlan(prompt);

    log.info("STEP 2: Generating all 4 files in ONE Groq call");
    const { json, html, css, js } = await generateAllFiles(plan);

    const newCode: CodeBundle = { html, css, js, json };
    saveSnapshot(newCode);

    log.info("FULL PROJECT GENERATED SUCCESSFULLY WITH ONLY 2 GROQ CALLS!");
    return { plan, ...newCode };
  } catch (err: any) {
    log.error(`GENERATION FAILED: ${err.message}`);
    throw err;
  }
}

/* ===================== ROLLBACK ===================== */
export function rollbackCode(): CodeBundle | null {
  const code = rollback();
  if (!code) {
    log.warn("No previous version to rollback to");
    return null;
  }
  log.info("Rolled back to previous version");
  return code;
}

/* ===================== INCREMENTAL UPDATE ===================== */
const SPA_INCREMENTAL_CONSTRAINT = `
CRITICAL RULES (ABSOLUTE):
- SINGLE PAGE APPLICATION
- ONLY index.html (NO other HTML files)
- Pages are SECTIONS, not files
- Navigation via JavaScript ONLY
- data.json is the ONLY content source
- index.html = structure only
- styles.css = styling only
- script.js = routing + rendering
- NO explanations, NO markdown, NO extra files
- Incremental updates allowed: generate only the files that need changes
- ALL updates must go through data.json; content in HTML or JS should never be hardcoded
`;

async function generateIncrementalFiles(
  userPrompt: string,
  currentCode: CodeBundle
): Promise<Partial<CodeBundle>> {
  const prompt = `
${CSS_MASTER_PROMPT}

${SPA_INCREMENTAL_CONSTRAINT}

Here is the current project context:
--- data.json ---
${currentCode.json}

--- index.html ---
${currentCode.html}

--- styles.css ---
${currentCode.css}

--- script.js ---
${currentCode.js}

User request: "${userPrompt}"

IMPORTANT: Update data.json first; then update JS to fetch/render the new data. 
Never hardcode any content in HTML or JS.

Generate only the files that need changes (1–4 files). 
Output exactly like this (no extra text):

--- data.json --- 
[if updated, complete JSON]

--- index.html ---
[if updated, complete HTML]

--- styles.css ---
[if updated, complete CSS]

--- script.js ---
[if updated, complete JS]

Do NOT modify files unnecessarily.
`.trim();

  const response = await generateWithGroq(prompt, 0.4);

  const files: Partial<CodeBundle> = {};

  const jsonMatch = response.match(/--- data\.json ---\n([\s\S]*?)(\n---|$)/);
  if (jsonMatch) files.json = jsonMatch[1].trim();

  const htmlMatch = response.match(/--- index\.html ---\n([\s\S]*?)(\n---|$)/);
  if (htmlMatch) files.html = htmlMatch[1].trim();

  const cssMatch = response.match(/--- styles\.css ---\n([\s\S]*?)(\n---|$)/);
  if (cssMatch) files.css = cssMatch[1].trim();

  const jsMatch = response.match(/--- script\.js ---\n([\s\S]*?)(\n---|$)/);
  if (jsMatch) files.js = jsMatch[1].trim();

  return files;
}

function applyIncrementalChanges(
  currentCode: CodeBundle,
  updates: Partial<CodeBundle>
): CodeBundle {
  const merged: CodeBundle = { ...currentCode };

  (["json", "html", "css", "js"] as EditableFile[]).forEach((file) => {
    if (updates[file]) {
      merged[file] = updates[file]!;
      assertValid(file, merged[file]);
      log.info(`${file.toUpperCase()} updated`);
    }
  });

  saveSnapshot(merged);
  return merged;
}

export async function incrementalUpdate(
  userPrompt: string,
  currentCode: CodeBundle
): Promise<{ updatedCode: CodeBundle; changes: Partial<CodeBundle> }> {
  log.info("Generating incremental updates");

  const updates = await generateIncrementalFiles(userPrompt, currentCode);

  if (!Object.keys(updates).length) {
    log.info("No changes detected");
    return { updatedCode: currentCode, changes: {} };
  }

  const updatedCode = applyIncrementalChanges(currentCode, updates);

  log.info("Incremental update applied successfully");

  return { updatedCode, changes: updates };
}

/* ===================== MAIN ENTRY WITH CHAT MODE ===================== */
export async function generateWebApp(
  prompt: string,
  context: {
    currentCode?: CodeBundle | null;
    isFirstMessage: boolean;
    mode: Mode | "chat";
  }
): Promise<
  | { type: "plan"; content: string }
  | { type: "code"; code: ProjectArtifacts }
  | { type: "chat"; content: string }
> {
  if (context.mode === "chat") {
    log.info("Chat mode — generating conversational response only");

    const chatPrompt = `
You are a friendly, helpful assistant talking to a developer who is building a website.

Respond naturally and conversationally. Be encouraging and clear.

User: "${prompt}"

Keep it concise and engaging. Do not mention code generation, files, or technical changes unless asked.
`.trim();

    const response = await generateWithGroq(chatPrompt, 0.7);
    return { type: "chat", content: response };
  }

  if (context.mode === "plan") {
    return { type: "plan", content: await generateProjectPlan(prompt) };
  }

  if (context.isFirstMessage || !context.currentCode) {
    log.info("First message or no code → full generation");
    const artifacts = await generateWebAppWithRollback(prompt);
    return { type: "code", code: artifacts };
  }

  log.info("Existing code → incremental update");
  const { updatedCode, changes } = await incrementalUpdate(prompt, context.currentCode);

  log.info("Changes applied:");
  Object.keys(changes).forEach((file) => {
    log.info(`- ${file.toUpperCase()}`);
  });

  return { type: "code", code: { plan: "Incremental Update", ...updatedCode } };
}
