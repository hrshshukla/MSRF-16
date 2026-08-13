import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { logger } from "./lib/logger";

export type NextFunction = (error?: unknown) => void;

export type ApiRequest = IncomingMessage & {
  /**
   * Route handlers validate individual request shapes as needed. Keeping the
   * parsed body open here mirrors Node's request boundary without coupling the
   * serverless adapter to every route's schema.
   */
  body: any;
  query: Record<string, string | string[]>;
  params: Record<string, string>;
  path: string;
  ip: string;
  user?: {
    id: number;
    role: "super_admin" | "admin" | "volunteer" | "member";
    orgUnitId: number | null;
  };
  log: typeof logger;
};

export type ApiResponse = ServerResponse & {
  status(code: number): ApiResponse;
  json(value: unknown): void;
  send(value?: unknown): void;
};

type Handler = (req: ApiRequest, res: ApiResponse, next: NextFunction) => unknown;

type Layer = {
  method?: string;
  pattern?: string;
  handlers: Handler[];
};

type Match = {
  params: Record<string, string>;
};

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function matchPath(pattern: string, path: string): Match | null {
  const expected = pattern.replace(/\/+$/, "") || "/";
  const actual = path.replace(/\/+$/, "") || "/";
  const expectedParts = expected.split("/").filter(Boolean);
  const actualParts = actual.split("/").filter(Boolean);
  const params: Record<string, string> = {};

  for (let index = 0; index < expectedParts.length; index += 1) {
    const part = expectedParts[index]!;
    if (part.startsWith(":")) {
      const wildcard = part.endsWith("*");
      const name = part.slice(1, wildcard ? -1 : undefined);
      if (wildcard) {
        params[name] = actualParts.slice(index).map(decode).join("/");
        return index <= actualParts.length ? { params } : null;
      }
      if (actualParts[index] === undefined) return null;
      params[name] = decode(actualParts[index]!);
      continue;
    }
    if (actualParts[index] !== part) return null;
  }

  return actualParts.length === expectedParts.length ? { params } : null;
}

function parseQuery(url: URL): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    const existing = query[key];
    query[key] = existing === undefined
      ? value
      : Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
  }
  return query;
}

function requestIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0];
  return firstForwarded?.trim() || req.socket.remoteAddress || "";
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const existingBody = (req as ApiRequest).body;
  if (existingBody !== undefined) return existingBody;
  if (req.method === "GET" || req.method === "HEAD") return {};

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString("utf8");
  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw).entries());
  }
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

class ApiRouter {
  private readonly layers: Layer[] = [];

  get(path: string, ...handlers: Handler[]): this {
    this.layers.push({ method: "GET", pattern: path, handlers });
    return this;
  }

  post(path: string, ...handlers: Handler[]): this {
    this.layers.push({ method: "POST", pattern: path, handlers });
    return this;
  }

  patch(path: string, ...handlers: Handler[]): this {
    this.layers.push({ method: "PATCH", pattern: path, handlers });
    return this;
  }

  delete(path: string, ...handlers: Handler[]): this {
    this.layers.push({ method: "DELETE", pattern: path, handlers });
    return this;
  }

  use(router: ApiRouter): this {
    this.layers.push(...router.layers);
    return this;
  }

  getLayers(): readonly Layer[] {
    return this.layers;
  }
}

export function Router(): ApiRouter {
  return new ApiRouter();
}

export type IRouter = ApiRouter;
export type Request = ApiRequest;
export type Response = ApiResponse;

function decorateResponse(res: ServerResponse): ApiResponse {
  const response = res as ApiResponse;
  response.status = (code: number) => {
    response.statusCode = code;
    return response;
  };
  response.json = (value: unknown) => {
    if (response.headersSent) return;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(value));
  };
  response.send = (value?: unknown) => {
    if (response.headersSent) return;
    if (value === undefined) {
      response.end();
      return;
    }
    if (typeof value === "object") {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify(value));
      return;
    }
    response.end(String(value));
  };
  return response;
}

function decorateRequest(req: IncomingMessage, body: unknown): ApiRequest {
  const request = req as ApiRequest;
  const parsed = new URL(req.url ?? "/", "http://localhost");
  request.body = body;
  request.query = parseQuery(parsed);
  request.path = parsed.pathname.replace(/^\/api(?=\/|$)/, "") || "/";
  request.params = {};
  request.ip = requestIp(req);
  request.log = logger;
  return request;
}

export async function handleRequest(
  router: ApiRouter,
  rawRequest: IncomingMessage,
  rawResponse: ServerResponse,
): Promise<void> {
  const response = decorateResponse(rawResponse);
  response.setHeader("Access-Control-Allow-Origin", rawRequest.headers.origin ?? "*");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");

  if (rawRequest.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  try {
    const body = await readBody(rawRequest);
    const request = decorateRequest(rawRequest, body);
    const method = rawRequest.method ?? "GET";
    const layers = router.getLayers();
    const matchingLayers = layers
      .map((layer) => ({
        layer,
        match: layer.method === method && layer.pattern
          ? matchPath(layer.pattern, request.path)
          : null,
      }))
      .filter((entry): entry is { layer: Layer; match: Match } => entry.match !== null);

    let layerIndex = 0;
    let handlerIndex = 0;

    const runNext = async (error?: unknown): Promise<void> => {
      if (error) throw error;
      while (layerIndex < matchingLayers.length) {
        const current = matchingLayers[layerIndex]!;
        request.params = current.match.params;
        const handlers = current.layer.handlers;
        while (handlerIndex < handlers.length) {
          const handler = handlers[handlerIndex++]!;
          let advanced = false;
          let nextError: unknown;
          const next: NextFunction = (nextErrorValue) => {
            advanced = true;
            nextError = nextErrorValue;
          };
          await handler(request, response, next);
          if (nextError) throw nextError;
          if (!advanced) return;
        }
        layerIndex += 1;
        handlerIndex = 0;
      }

      if (!response.headersSent) {
        response.status(404).json({ error: "The requested service endpoint was not found." });
      }
    };

    await runNext();
  } catch (error) {
    logger.error({ err: error, method: rawRequest.method, url: rawRequest.url }, "Unhandled API error");
    if (!response.headersSent) {
      const statusCode = error instanceof HttpError ? error.statusCode : 500;
      response.status(statusCode).json({
        error: error instanceof HttpError
          ? error.message
          : "Something went wrong on our side. Please try again in a moment.",
      });
    }
  }
}