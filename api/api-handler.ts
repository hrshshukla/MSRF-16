import type { IncomingMessage, ServerResponse } from "node:http";
import router from "./routes";
import {
  bootstrapSuperAdmin,
  synchronizeApprovedVolunteerRoles,
  synchronizeThoughtTemplateIds,
} from "./lib/superAdminBootstrap";
import { handleRequest } from "./http";

let initialization: Promise<void> | null = null;

function initialize(): Promise<void> {
  initialization ??= Promise.all([
    bootstrapSuperAdmin(),
    synchronizeApprovedVolunteerRoles(),
    synchronizeThoughtTemplateIds(),
  ]).then(() => undefined);

  return initialization;
}

export async function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  await initialize();
  await handleRequest(router, request, response);
}