import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GITHUB_OWNER = "amed128";
const GITHUB_REPO = "tasbih-digital";
const GITHUB_LABEL = "user-report";

export async function POST(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing GITHUB_TOKEN" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { description, version, platform, language } = body as Record<string, string>;

  if (!description || typeof description !== "string") {
    return NextResponse.json({ ok: false, error: "Missing description" }, { status: 400 });
  }

  const trimmed = description.trim();
  if (trimmed.length < 20) {
    return NextResponse.json({ ok: false, error: "Description too short" }, { status: 400 });
  }
  if (trimmed.length > 500) {
    return NextResponse.json({ ok: false, error: "Description too long" }, { status: 400 });
  }

  const issueBody = `${trimmed}

---
**App version:** ${version ?? "unknown"}
**Platform:** ${platform ?? "unknown"}
**Language:** ${language ?? "unknown"}`;

  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title: `[User report] ${trimmed.slice(0, 80)}`,
      body: issueBody,
      labels: [GITHUB_LABEL],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: 502 });
  }

  const issue = await res.json() as { html_url: string; number: number };
  return NextResponse.json({ ok: true, url: issue.html_url, number: issue.number });
}
