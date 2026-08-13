import type { IncomingMessage, ServerResponse } from "node:http";
import { config } from "dotenv";
import { handleApiRequest } from "./api-handler";

// Load environment variables from .env when running in local/serverless adapters
config();

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return handleApiRequest(req, res);
}