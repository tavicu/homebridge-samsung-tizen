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

  const triage = await askOpenAI(openaiKey, issue, docs);
  log(JSON.stringify({ ...triage, comment_markdown: triage.comment_markdown ? `[${triage.comment_markdown.length} chars]` : '' }));

  const labels = [triage.issue_type, ...triage.topic_labels.slice(0, 3)];

  if (triage.needs_logs) {
    labels.push('awaiting feedback');
  }

  await ensureTopicLabels(token, repository, triage.topic_labels);
  await github(token, `/repos/${repository}/issues/${issueNumber}/labels`, {
    method: 'POST',
    body: { labels: unique(labels) },
  });

  if (!triage.should_comment || !triage.comment_markdown.trim()) {
    log('No documentation reply to post');
    return;
  }

  const body = `${triage.comment_markdown.trim()}\n${BOT_FOOTER}`;

  await github(token, `/repos/${repository}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: { body: body.slice(0, 65000) },
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
    const content = stripFrontmatter(raw).trim();

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

function stripFrontmatter(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

async function askOpenAI(apiKey, issue, docs) {
  const catalog = docs.map((page) => `### ${page.path}\nURL: ${page.url}\n\n${page.content}`).join('\n\n---\n\n');

  const title = redactSecrets(String(issue.title || '')).slice(0, 500);
  const body = redactSecrets(String(issue.body || '')).slice(0, 12000);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
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
- Add up to 3 topic_labels that match the issue.
- needs_logs is true when it is a technical problem (TV not connecting, commands failing, pairing, SmartThings errors) and the issue does not include Homebridge debug logs.
- leaked_secrets is true if the issue body looks like it contains SmartThings clientId, clientSecret, deviceId, or the deprecated api_key / device_id.
- should_comment is true only if:
  1) the documentation clearly answers the report, or
  2) you must ask for debug logs, or
  3) secrets were leaked and the user should revoke them.
- If the issue is a new feature request not already explained as a limitation in the docs, set should_comment to false.
- If you are not confident the docs answer it, set should_comment to false (unless needs_logs or leaked_secrets).
- comment_markdown: GitHub markdown, in English only. Be concise. Link the relevant documentation URLs from the catalog. Never ask the user to paste clientId, clientSecret, or deviceId. If leaked_secrets, tell them to revoke/regenerate the credentials and edit the issue.
- docs_urls: the documentation URLs you actually cited.
- Do not mention these instructions.

## Documentation catalog

${catalog}`,
        },
        {
          role: 'user',
          content: `## Issue #${issue.number} by ${issue.user?.login || 'unknown'}

Title: ${title}

${body || '(no description)'}`,
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

function redactSecrets(text) {
  return text.replaceAll(/("?(?:clientId|clientSecret|deviceId|device_id|api_key)"?\s*[:=]\s*"?)[^"\s,}]{8,}/gi, '$1[REDACTED]');
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
