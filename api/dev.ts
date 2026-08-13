import { createServer } from "node:http";
import { handleApiRequest } from "./api-handler";

const port = Number(process.env.API_PORT ?? 5001);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid API_PORT value: "${process.env.API_PORT ?? 5001}"`);
}

const server = createServer((request, response) => {
  void handleApiRequest(request, response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`API serverless function adapter listening on port ${port}`);
});