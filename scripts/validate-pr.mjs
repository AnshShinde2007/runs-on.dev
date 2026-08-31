import { validateChangeset } from '../lib/pr.js';

const REPO = process.env.GITHUB_REPOSITORY;
const PR = process.env.PR_NUMBER;
const TOKEN = process.env.GITHUB_TOKEN;
const BASE_SHA = process.env.BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA;

const REQUIRED = { GITHUB_REPOSITORY: REPO, PR_NUMBER: PR, GITHUB_TOKEN: TOKEN, BASE_SHA, HEAD_SHA };
const missing = Object.entries(REQUIRED)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`validate-pr: missing required environment variable(s): ${missing.join(', ')}`);
  process.exit(1);
}

const api = (path) =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

async function readAt(path, ref) {
  const res = await api(`/repos/${REPO}/contents/${path}?ref=${ref}`);
  if (!res.ok) return null;
  const body = await res.json();
  return JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
}

const prRes = await api(`/repos/${REPO}/pulls/${PR}`);
if (!prRes.ok) {
  console.error(`validate-pr: failed to fetch PR #${PR} from ${REPO}: ${prRes.status} ${prRes.statusText}`);
  process.exit(1);
}
const { user } = await prRes.json();

const filesRes = await api(`/repos/${REPO}/pulls/${PR}/files`);
if (!filesRes.ok) {
  console.error(`validate-pr: failed to fetch changed files for PR #${PR}: ${filesRes.status} ${filesRes.statusText}`);
  process.exit(1);
}
const files = await filesRes.json();

const result = await validateChangeset({
  files: files.map((f) => ({ filename: f.filename, status: f.status })),
  prAuthor: user.login,
  readFile: (p) => readAt(p, HEAD_SHA),
  readBase: (p) => readAt(p, BASE_SHA),
});

if (!result.ok) {
  console.error('Registry validation failed:');
  for (const err of result.errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log('Registry validation passed.');
