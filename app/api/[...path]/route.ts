import type { NextRequest } from 'next/server';

/** Server-side proxy target — prefer 127.0.0.1 to avoid Node fetch localhost/IPv6 issues. */
function resolveApiOrigin() {
  const raw =
    process.env.INTERNAL_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    'http://127.0.0.1:8000';
  return raw.replace(/\/$/, '').replace(/:\/\/localhost\b/i, '://127.0.0.1');
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PROXY_PER_ATTEMPT_TIMEOUT_MS = IS_PRODUCTION ? 25_000 : 20_000;
const PROXY_RETRY_ATTEMPTS = IS_PRODUCTION ? 2 : 15;
const SSE_PROXY_RETRY_ATTEMPTS = 12;
const PROXY_RETRY_DELAY_MS = 750;
const SSE_PROXY_RETRY_DELAY_MS = 1000;
const CONNECTION_RETRY_MAX_DELAY_MS = 4000;

/** SSE stays open indefinitely — must not use AbortSignal.timeout. */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FORWARD_REQUEST_HEADERS = ['content-type', 'accept', 'authorization', 'range'];

function isSseRequest(path: string, request: NextRequest) {
  return path === 'sse' || request.headers.get('accept')?.includes('text/event-stream') === true;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(error: unknown) {
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return true;
  const cause = error.cause;
  return cause instanceof Error && cause.name === 'AbortError';
}

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  const parts = [error.message, error.name];
  if (error.cause instanceof Error) {
    parts.push(error.cause.message, error.cause.name);
  } else if (error.cause != null) {
    parts.push(String(error.cause));
  }
  return parts.filter(Boolean).join(' — ') || 'Unknown error';
}

function isRetryableNetworkError(error: unknown) {
  const msg = errorMessage(error).toLowerCase();
  return (
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('fetch failed') ||
    msg.includes('socket hang up') ||
    msg.includes('und_err_connect_timeout') ||
    msg.includes('network')
  );
}

function retryDelayMs(attempt: number, sse: boolean, error: unknown) {
  if (isRetryableNetworkError(error)) {
    // Backend may still be starting (nodemon) — wait longer between attempts.
    return Math.min(1000 * attempt, CONNECTION_RETRY_MAX_DELAY_MS);
  }
  const base = sse ? SSE_PROXY_RETRY_DELAY_MS : PROXY_RETRY_DELAY_MS;
  return sse ? base * attempt : base;
}

function clientClosedResponse() {
  // Browser closed EventSource / navigated away — not a backend failure.
  return new Response(null, { status: 204 });
}

function linkClientAbort(request: NextRequest, upstreamAbort: AbortController) {
  if (request.signal.aborted) {
    upstreamAbort.abort();
    return () => {};
  }

  const onAbort = () => upstreamAbort.abort();
  request.signal.addEventListener('abort', onAbort, { once: true });
  return () => request.signal.removeEventListener('abort', onAbort);
}

async function fetchUpstream(
  targetUrl: string,
  init: RequestInit & { duplex?: 'half' },
  sse: boolean,
) {
  const maxAttempts = sse ? SSE_PROXY_RETRY_ATTEMPTS : PROXY_RETRY_ATTEMPTS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (init.signal?.aborted) {
      const aborted = new Error('Aborted');
      aborted.name = 'AbortError';
      throw aborted;
    }

    const attemptInit: RequestInit & { duplex?: 'half' } = {
      ...init,
      signal: sse ? init.signal : AbortSignal.timeout(PROXY_PER_ATTEMPT_TIMEOUT_MS),
    };

    try {
      const response = await fetch(targetUrl, attemptInit);
      if (response.ok || response.status < 500 || attempt === maxAttempts) {
        return response;
      }
      lastError = new Error(`Upstream HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (isAbortError(error) || init.signal?.aborted) {
        throw error;
      }
    }

    if (attempt < maxAttempts) {
      await sleep(retryDelayMs(attempt, sse, lastError));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Upstream fetch failed');
}

function pipeSseBody(upstreamBody: ReadableStream<Uint8Array>, upstreamAbort: AbortController) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value);
        }
      } catch {
        controller.close();
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      upstreamAbort.abort();
      return upstreamBody.cancel().catch(() => {});
    },
  });
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const apiOrigin = resolveApiOrigin();
  const targetUrl = `${apiOrigin}/api/${path}${request.nextUrl.search}`;
  const sse = isSseRequest(path, request);

  if (sse && request.signal.aborted) {
    return clientClosedResponse();
  }

  const upstreamAbort = new AbortController();
  const unlinkClientAbort = sse ? linkClientAbort(request, upstreamAbort) : () => {};

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  if (sse) {
    headers.set('accept', 'text/event-stream');
    headers.set('cache-control', 'no-cache');
  }

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetchUpstream(
      targetUrl,
      sse ? { ...init, signal: upstreamAbort.signal } : init,
      sse,
    );
  } catch (error) {
    unlinkClientAbort();
    if (sse && (request.signal.aborted || upstreamAbort.signal.aborted || isAbortError(error))) {
      return clientClosedResponse();
    }
    console.error(`API proxy failed (${request.method} ${targetUrl}):`, errorMessage(error));
    return Response.json(
      {
        code: 502,
        message: 'Backend unavailable. Start viewpro-backend on port 8000.',
      },
      { status: 502 },
    );
  } finally {
    if (!sse) {
      unlinkClientAbort();
    }
  }

  const responseHeaders = new Headers();
  const passResponseHeaders = ['content-type', 'cache-control', 'etag', 'accept-ranges', 'content-range'];

  if (!sse) {
    passResponseHeaders.push('content-length');
  }

  for (const key of passResponseHeaders) {
    const value = upstream.headers.get(key);
    if (value) responseHeaders.set(key, value);
  }

  const contentType = upstream.headers.get('content-type') || '';
  if (sse || contentType.includes('text/event-stream')) {
    responseHeaders.set('content-type', 'text/event-stream');
    responseHeaders.set('cache-control', 'no-cache, no-transform');
    responseHeaders.set('connection', 'keep-alive');
    responseHeaders.set('x-accel-buffering', 'no');
  }

  const body =
    sse && upstream.body
      ? pipeSseBody(upstream.body, upstreamAbort)
      : upstream.body;

  if (sse) {
    return new Response(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  unlinkClientAbort();
  return new Response(body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
