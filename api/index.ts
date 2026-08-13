import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "./api-handler";

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return handleApiRequest(req, res);
}