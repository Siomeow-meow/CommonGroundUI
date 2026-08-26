/**
 * Generic proxy route: /api/proxy/[...path]
 *
 * Any request to /api/proxy/user, /api/proxy/friend, /api/proxy/group, etc.
 * is forwarded to the backend, preserving method, headers, and body.
 *
 * This fixes the CORS error — the browser only talks to your own domain,
 * and this server-side route forwards to the external API.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://probable-guacamole-alpha.vercel.app";

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const slug = path.join("/");

  // Forward query string too
  const search = req.nextUrl.search ?? "";
  const targetUrl = `${BACKEND}/api/${slug}${search}`;

  // Forward headers, but strip host so the backend sees its own host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  // Forward body for POST/PATCH/PUT (not for GET/DELETE)
  const hasBody = ["POST", "PATCH", "PUT"].includes(req.method);
  const body = hasBody ? await req.text() : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await upstream.text();

    if (!upstream.ok) {
      console.error(`[proxy] ${req.method} ${targetUrl} -> ${upstream.status} ${upstream.statusText}: ${data.slice(0, 500)}`);
    }

    return new NextResponse(data, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (err) {
    console.error(`[proxy] ${req.method} ${targetUrl} failed:`, err);
    return NextResponse.json({ error: "Upstream request failed" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;