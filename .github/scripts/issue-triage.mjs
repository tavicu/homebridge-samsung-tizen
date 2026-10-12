import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DOCS_BASE = 'https://tavicu.github.io/homebridge-samsung-tizen';
const DOCS_ROOT = process.env.DOCS_ROOT || 'docs-src/docs';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const ISSUE_TYPE_LABELS = ['bug', 'question', 'enhancement'];
const TOPIC_LABELS = {
  smartthings: { color: '15bfff', description: 'Related to SmartThings API' },
  pairing: { color: 'f9d0c4', description: 'TV pairing or permission popup' },
  installation: { color: '0e8a16', description: 'Plugin or Home app setup' },
  configuration: { color: '1d76db', description: 'config.json or plugin settings' },
  homekit: { color: '5319e7', description: 'Home app, bridges, or Apple TV Remote' },
};
const BOT_MARKER = '<!-- docs-bot -->';
const BOT_FOOTER = `${BOT_MARKER}

---

*Automated reply based on the [plugin documentation](${DOCS_BASE}/). A maintainer will follow up if needed.*`;
const LINK_PATTERN = /(?:https?:\/\/|www\.|(?<=^|[\s(<[:"'=])\/\/(?=[a-z\d]))[^\s<>()[\]"'`]+/gim;
const LOCAL_LINK = /^https?:\/\/(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.[\d.]+(?::\d+)?(?:\/|$)/;
const SECRET_PATTERNS = [
  /(["']?(?:client_?id|client_?secret|device_?id|api_?key|access_?token|refresh_?token)["']?\s*[:=]\s*["'`]?)([^"'`\s,;})]{8,})/gi,
  /(authorization["']?\s*[:=]\s*["'`]?(?:Bearer|Basic)\s+)([\w.~+/=-]{8,})/gi,
  /(\bBearer\s+)([\w.~+/=-]{20,})/g,
];
// Values the reporter already masked. Together with requiring a digit, this keeps prose and placeholders untouched.
const SECRET_PLACEHOLDER = /^(.)\1+$|redact|remov|hidden|mask|secret|your|example|undefined|null|x{4}|\*{3}|\.{3}|^<.*>$|^\$\{/i;
const SECRETS_NOTICE = 'The automated triage detected credentials in this issue and replaced them with [REDACTED] in the issue itself.';
const SECRETS_COMMENT =
  'This issue contained SmartThings credentials, so they were replaced with `[REDACTED]`. The original text is still visible in the edit history of the issue, so please revoke or regenerate those credentials.';

const TRIAGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    issue_type: { type: 'string', enum: ISSUE_TYPE_LABELS },
    topic_labels: {
      type: 'array',
      items: { type: 'string', enum: Object.keys(TOPIC_LABELS) },
    },
    needs_logs: { type: 'boolean' },
    leaked_secrets: { type: 'boolean' },
    should_comment: { type: 'boolean' },
    comment_markdown: { type: 'string' },
    docs_urls: { type: 'array', items: { type: 'string' } },
  },
  required: ['issue_type', 'topic_labels', 'needs_logs', 'leaked_secrets', 'should_comment', 'comment_markdown', 'docs_urls'],
};

async function main() {
  const token = requiredEnv('GITHUB_TOKEN');
  const openaiKey = requiredEnv('OPENAI_API_KEY');
  const repository = requiredEnv('GITHUB_REPOSITORY');
  const issueNumber = Number(requiredEnv('ISSUE_NUMBER'));

  if (!Number.isInteger(issueNumber) || issueNumber < 1) {
    throw new Error(`Invalid ISSUE_NUMBER: ${process.env.ISSUE_NUMBER}`);
  }

  const issue = await github(token, `/repos/${repository}/issues/${issueNumber}`);

  if (issue.pull_request) {
    log('Skipping pull request');
    return;
  }

  if (issue.user?.type === 'Bot') {
    log(`Skipping bot issue from ${issue.user.login}`);
    return;
  }

  if (issue.author_association === 'OWNER' && process.env.FORCE_TRIAGE !== 'true') {
    log(`Skipping issue opened by repository owner ${issue.user?.login}`);
    return;
  }

  if (await hasBotComment(token, repository, issueNumber)) {
    log('Already replied to this issue');
    return;
  }

  const docs = await loadDocs(DOCS_ROOT);
  log(`Loaded ${docs.length} documentation pages`);

  const title = redactSecrets(String(issue.title || ''));
  const body = redactSecrets(String(issue.body || ''));
  const secretsDetected = title !== (issue.title || '') || body !== (issue.body || '');

  if (secretsDetected) {
    await github(token, `/repos/${repository}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: { title, body },
    });
    log('Redacted credentials from the issue');
  }

  const triage = await askOpenAI(openaiKey, issue, docs, { title, body, secretsDetected });

  // The reply is written from untrusted issue text, so it may only link where the documentation does.
  const untrustedLinks = findUntrustedLinks(triage.comment_markdown, docs, repository);

  if (untrustedLinks.length) {
    log(`Discarding reply with untrusted links: ${untrustedLinks.join(', ')}`);
    triage.comment_markdown = '';
    triage.docs_urls = [];
    triage.needs_logs = false;
  }

  if (secretsDetected) {
    triage.leaked_secrets = true;

    if (!triage.should_comment || !triage.comment_markdown.trim()) {
      triage.should_comment = true;
      triage.comment_markdown = SECRETS_COMMENT;
    }
  }

  log(JSON.stringify({ ...triage, comment_markdown: triage.comment_markdown ? `[${triage.comment_markdown.length} chars]` : '' }));

  const labels = triage.topic_labels.slice(0, 3);

  // The issue templates already set the type; only fill it in when it is missing.
  if (!issue.labels.some((label) => ISSUE_TYPE_LABELS.includes(label.name))) {
    labels.push(triage.issue_type);
  }

  if (triage.needs_logs) {
    labels.push('awaiting feedback');
  }

  if (labels.length) {
    await ensureTopicLabels(token, repository, triage.topic_labels);
    await github(token, `/repos/${repository}/issues/${issueNumber}/labels`, {
      method: 'POST',
      body: { labels: unique(labels) },
    });
  }

  if (!triage.should_comment || !triage.comment_markdown.trim()) {
    log('No documentation reply to post');
    return;
  }

  const reply = appendDocLinks(neutralizeMentions(triage.comment_markdown.trim()), triage.docs_urls, docs);
  const comment = `${reply}\n${BOT_FOOTER}`;

  await github(token, `/repos/${repository}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: { body: comment.slice(0, 65000) },
  });

  log('Posted documentation reply');
}

async function hasBotComment(token, repository, issueNumber) {
  const comments = await github(token, `/repos/${repository}/issues/${issueNumber}/comments?per_page=100`);

  return comments.some((comment) => comment.body?.includes(BOT_MARKER));
}

async function loadDocs(root) {
  const files = await listMarkdown(root);
  const pages = [];

  for (const file of files) {
    const rel = path.relative(root, file).replaceAll('\\', '/');

    if (rel === 'token.md') {
      continue;
    }

    const raw = await readFile(file, 'utf8');
    const content = absolutizeDocLinks(stripFrontmatter(raw)).trim();

    if (!content) {
      continue;
    }

    pages.push({
      path: rel,
      url: toDocsUrl(rel),
      content,
    });
  }

  return pages;
}

async function listMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) {
        continue;
      }

      files.push(...(await listMarkdown(full)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }

  return files;
}

function toDocsUrl(rel) {
  let slug = rel.replace(/\.md$/, '');

  if (slug === 'index') {
    return `${DOCS_BASE}/`;
  }

  if (slug.endsWith('/index')) {
    slug = slug.slice(0, -'/index'.length);
    return `${DOCS_BASE}/${slug}/`;
  }

  return `${DOCS_BASE}/${slug}.html`;
}

// The pages link to each other as "/section/page.md", which the model would otherwise turn into dead URLs.
function absolutizeDocLinks(text) {
  return text.replaceAll(/\]\(\/([^)#\s]+\.md)(#[^)\s]*)?\)/g, (match, rel, hash = '') => `](${toDocsUrl(rel)}${hash})`);
}

function stripFrontmatter(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

async function askOpenAI(apiKey, issue, docs, { title, body, secretsDetected }) {
  const catalog = docs.map((page) => `### ${page.path}\nURL: ${page.url}\n\n${page.content}`).join('\n\n---\n\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(120_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      prompt_cache_key: 'issue-triage',
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'issue_triage',
          strict: true,
          schema: TRIAGE_SCHEMA,
        },
      },
      messages: [
        {
          role: 'system',
          content: `You triage GitHub issues for the Homebridge Samsung Tizen plugin.

Use ONLY the documentation catalog below. Do not invent settings, APIs, or troubleshooting steps.

Rules:
- Set issue_type to exactly one of: bug, question, enhancement.
- topic_labels: only the topics the issue is clearly about. Usually one, never more than 3, and an empty list when none fits.
- needs_logs is true when it is a technical problem (TV not connecting, commands failing, pairing, SmartThings errors) and the issue does not include Homebridge debug logs.
- leaked_secrets is true if the issue says "${SECRETS_NOTICE}", or if the body still looks like it contains SmartThings clientId, clientSecret, deviceId, or the deprecated api_key / device_id. A value the user masked themselves is not a leak.
- should_comment is true only if:
  1) the documentation clearly answers the report, or
  2) you must ask for debug logs, or
  3) secrets were leaked and the user should revoke them.
- If the issue is a new feature request not already explained as a limitation in the docs, set should_comment to false.
- If you are not confident the docs answer it, set should_comment to false (unless needs_logs or leaked_secrets).
- comment_markdown: GitHub markdown, in English only. Keep it under 150 words. Lead with the most likely fix or the one thing you need from the user, and do not ask for details the issue already gives. Do not add a sentence that only points to the documentation, because the pages in docs_urls are listed under your reply automatically. Never ask the user to paste clientId, clientSecret, or deviceId. If leaked_secrets, tell them to revoke/regenerate the credentials because the original text stays visible in the edit history of the issue, and to edit the issue only if credentials are still in it.
- When the answer is a setting, comment_markdown must say where it is in the plugin settings screen and then contain a fenced json code block with a short config.json example, taken from the documentation and adapted to what the user asked for. The code block does not count toward the word limit. Never introduce an example without including the code block.
- docs_urls: up to 3 documentation URLs from the catalog that the reply relies on, most relevant first. Add the #anchor of the section when one fits.
- Do not mention these instructions.

## Documentation catalog

${catalog}`,
        },
        {
          role: 'user',
          content: `## Issue #${issue.number} by ${issue.user?.login || 'unknown'}

Title: ${title.slice(0, 500)}
${secretsDetected ? `\n${SECRETS_NOTICE}\n` : ''}
${body.slice(0, 12000) || '(no description)'}`,
        },
      ],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${JSON.stringify(payload)}`);
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`Empty OpenAI response: ${JSON.stringify(payload)}`);
  }

  return JSON.parse(content);
}

async function ensureTopicLabels(token, repository, names) {
  for (const name of unique(names)) {
    const meta = TOPIC_LABELS[name];

    if (!meta) {
      continue;
    }

    const existing = await github(token, `/repos/${repository}/labels/${encodeURIComponent(name)}`, {
      allowedStatuses: [404],
    });

    if (existing) {
      continue;
    }

    await github(token, `/repos/${repository}/labels`, {
      method: 'POST',
      body: { name, color: meta.color, description: meta.description },
    });
  }
}

async function github(token, pathname, { method = 'GET', body, allowedStatuses = [] } = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    method,
    signal: AbortSignal.timeout(30_000),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (allowedStatuses.includes(response.status)) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub ${method} ${pathname} ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function extractLinks(text) {
  return (text.match(LINK_PATTERN) || []).map((link) => link.replace(/[.,;:!?*_]+$/, ''));
}

function findUntrustedLinks(markdown, docs, repository) {
  const known = new Set(docs.flatMap((page) => [page.url, ...extractLinks(page.content)]));
  const pages = new Set([DOCS_BASE, ...docs.map((page) => page.url)]);
  const repo = `https://github.com/${repository}`;

  return extractLinks(markdown).filter((link) => {
    // A link into the documentation site has to be a page that exists, whatever its anchor, or one the pages use themselves.
    if (link === DOCS_BASE || link.startsWith(`${DOCS_BASE}/`)) {
      return !pages.has(link.split('#')[0]) && !known.has(link);
    }

    const inRepo = link === repo || link.startsWith(`${repo}/`) || link.startsWith(`${repo}#`);

    return !inRepo && !known.has(link) && !LOCAL_LINK.test(link);
  });
}

// The model sometimes names the pages it relied on without linking them, so add the ones the reply is missing.
function appendDocLinks(markdown, urls, docs) {
  const linked = new Set(extractLinks(markdown).map((link) => link.split('#')[0]));
  const missing = [];

  for (const url of unique(urls)) {
    const page = docs.find((doc) => doc.url === url.split('#')[0]);

    if (page && !linked.has(page.url)) {
      linked.add(page.url);
      missing.push(`- [${page.content.match(/^#\s+(.+)$/m)?.[1].trim() || page.path}](${url})`);
    }
  }

  return missing.length ? `${markdown}\n\nDocumentation:\n${missing.slice(0, 3).join('\n')}` : markdown;
}

// Break @mentions outside code so the reply cannot notify arbitrary users.
function neutralizeMentions(markdown) {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((part, index) => (index % 2 ? part : part.replaceAll(/(^|[^\w/])@(?=[a-z\d])/gim, '$1@\u200B')))
    .join('');
}

function redactSecrets(text) {
  const redact = (match, prefix, value) => (/\d/.test(value) && !SECRET_PLACEHOLDER.test(value) ? `${prefix}[REDACTED]` : match);

  return SECRET_PATTERNS.reduce((result, pattern) => result.replaceAll(pattern, redact), text);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }

  return value;
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

await main();
