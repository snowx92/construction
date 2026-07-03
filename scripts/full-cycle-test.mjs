#!/usr/bin/env node
/**
 * Full-cycle API workflow test against live Tender AI backend.
 *
 * Usage:
 *   E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... node scripts/full-cycle-test.mjs
 *
 * Optional env:
 *   TENDER_API_BASE, FIREBASE_API_KEY, COMPANY_ID, PROJECT_ID, API_ID_TOKEN
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, "../.env.local"));
loadEnvFile(path.join(__dirname, "../.env"));

const API_BASE = process.env.TENDER_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://us-central1-tender-ai-system.cloudfunctions.net/api";

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  "AIzaSyBfKFJ6o1QRxQu7RCommqds4LZd-UgncBw";

const COMPANY_ID = process.env.COMPANY_ID || "01KW8SJ26RDE09CJNZJ6Q7PJ50";
const PROJECT_ID = process.env.PROJECT_ID || "01KWHKNGRWFE1GPP2D35V51QNR";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || process.env.SAMAIL_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || process.env.SAMAIL_TEST_PASSWORD;

function log(step, data) {
  console.log(`\n=== ${step} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getIdToken() {
  if (process.env.API_ID_TOKEN) return process.env.API_ID_TOKEN;
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error("Set E2E_TEST_EMAIL + E2E_TEST_PASSWORD or API_ID_TOKEN");
  }
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Auth failed: ${JSON.stringify(body)}`);
  return body.idToken;
}

async function api(method, apiPath, token, { query, body } = {}) {
  let url = `${API_BASE}${apiPath}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null) qs.append(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || res.statusText);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json.data ?? json;
}

async function pollAssistantReply(token, sessionId, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    await sleep(2000);
    const { messages } = await api("GET", "/api/chat/messages", token, {
      query: { companyId: COMPANY_ID, projectId: PROJECT_ID, sessionId, limit: 20 },
    });
    const assistant = (messages ?? [])
      .filter((m) => m.role === "assistant")
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      .pop();
    if (assistant && (assistant.status === "complete" || assistant.content)) {
      return assistant;
    }
    process.stdout.write(".");
  }
  return null;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Company: ${COMPANY_ID}`);
  console.log(`Project: ${PROJECT_ID}`);

  const token = await getIdToken();
  log("Auth", "Signed in successfully");

  // 1. Project status
  const { project } = await api("GET", `/api/projects/${PROJECT_ID}`, token, {
    query: { companyId: COMPANY_ID },
  });
  log("1. Project status", {
    name: project.name,
    status: project.status,
    currentStep: project.progressSummary?.currentStep,
    jobsPending: project.progressSummary?.jobsPending,
  });

  // 2. Documents, BOQ, requirements
  const { documents } = await api("GET", "/api/documents", token, {
    query: { companyId: COMPANY_ID, projectId: PROJECT_ID, limit: 50 },
  });
  log("2a. Documents", {
    count: documents?.length ?? 0,
    sample: (documents ?? []).slice(0, 3).map((d) => ({
      id: d.documentId || d.id,
      name: d.filename || d.name,
      status: d.status,
    })),
  });

  const { items: boqItems } = await api("GET", `/api/projects/${PROJECT_ID}/boq`, token, {
    query: { companyId: COMPANY_ID },
  });
  log("2b. BOQ", { count: boqItems?.length ?? 0, sample: (boqItems ?? []).slice(0, 3) });

  const { requirements } = await api("GET", `/api/projects/${PROJECT_ID}/requirements`, token, {
    query: { companyId: COMPANY_ID },
  });
  log("2c. Requirements", { count: requirements?.length ?? 0, sample: (requirements ?? []).slice(0, 3) });

  // 3. Reconcile if stuck
  const stuck = ["processing", "needs_review", "pricing", "generating_proposal", "uploading"];
  if (stuck.includes(project.status) || (project.progressSummary?.jobsPending ?? 0) > 0) {
    const reconciliation = await api("POST", `/api/projects/${PROJECT_ID}/reconcile`, token, {
      body: { companyId: COMPANY_ID },
    });
    log("3. Reconcile", reconciliation);
  } else {
    log("3. Reconcile", "Skipped — project not stuck");
  }

  // 4. Latest pricing run
  try {
    const { pricingRun } = await api("GET", "/api/pricing/runs/latest", token, {
      query: { companyId: COMPANY_ID, projectId: PROJECT_ID },
    });
    log("4. Latest pricing run", {
      pricingRunId: pricingRun.pricingRunId || pricingRun.id,
      status: pricingRun.status,
      lineItems: pricingRun.lineItems?.length ?? 0,
      totals: pricingRun.totals,
    });
  } catch (e) {
    log("4. Latest pricing run", `Not found (${e.message})`);
  }

  // 5. Latest proposal
  try {
    const latest = await api("GET", "/api/proposals/latest", token, {
      query: { companyId: COMPANY_ID, projectId: PROJECT_ID, includeContent: "false" },
    });
    log("5. Latest proposal", {
      proposalId: latest.proposal?.proposalId || latest.proposal?.id,
      status: latest.proposal?.status,
      sections: latest.sections?.length ?? 0,
      pendingSections: latest.proposal?.pendingSections,
    });
  } catch (e) {
    log("5. Latest proposal", `Not found (${e.message})`);
  }

  // 6. Copilot message + poll
  const { sessions } = await api("GET", "/api/chat/sessions", token, {
    query: { companyId: COMPANY_ID, projectId: PROJECT_ID, limit: 5 },
  });
  let sessionId = sessions?.[0]?.sessionId || sessions?.[0]?.id;
  if (!sessionId) {
    const created = await api("POST", "/api/chat/sessions", token, {
      body: { companyId: COMPANY_ID, projectId: PROJECT_ID, title: "Full-cycle test" },
    });
    sessionId = created.sessionId;
  }
  log("6a. Chat session", { sessionId });

  const sent = await api("POST", "/api/chat/messages", token, {
    body: {
      companyId: COMPANY_ID,
      projectId: PROJECT_ID,
      sessionId,
      content: "What is the project submission deadline?",
    },
  });
  log("6b. Message sent", { messageId: sent.messageId, jobId: sent.jobId, status: sent.status });

  process.stdout.write("\n6c. Polling for assistant reply");
  const reply = sent.assistantMessage?.content
    ? sent.assistantMessage
    : await pollAssistantReply(token, sessionId);
  console.log("");
  log("6c. Assistant reply", reply ? {
    messageId: reply.messageId || reply.id,
    status: reply.status,
    contentPreview: (reply.content || "").slice(0, 200),
  } : "No reply within timeout");

  console.log("\n✓ Full cycle test complete");
}

main().catch((err) => {
  console.error("\n✗ Test failed:", err.message);
  if (err.body) console.error(JSON.stringify(err.body, null, 2));
  process.exit(1);
});
