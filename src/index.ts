import type { ICoolifyDeploymentWebhookEvent } from "./types";
import {
  isCoolifyWebhookPayloadValid,
  sendWebhookDeploymentSignalMessage,
} from "./utils";

// constants
const SERVER_PORT = Bun.env.SERVER_PORT || 8100;
const SIGNAL_PHONE_NUMBER = Bun.env.SIGNAL_PHONE_NUMBER ?? null;

const signalProxyHandler = async (
  request: Bun.BunRequest,
): Promise<Response> => {
  const rawPayload = await request.json();
  console.log(
    `Received raw payload with the following data: ${JSON.stringify(rawPayload)}`,
  );

  if (!isCoolifyWebhookPayloadValid(rawPayload)) {
    console.error("The payload received was invalid");
    return new Response(
      "Invalid Coolify deployment webhook payload in request body",
      { status: 400 },
    );
  }

  const payload = rawPayload as ICoolifyDeploymentWebhookEvent;
  const { success, message } = await sendWebhookDeploymentSignalMessage(
    payload,
    SIGNAL_PHONE_NUMBER ?? "",
  );
  if (!success) {
    console.error("Failed to send message to Signal REST API");
    return new Response(`Error with message: ${message}`, {
      status: 502,
    });
  }

  console.log(
    `Sent payload successfully to phone number: ${SIGNAL_PHONE_NUMBER}`,
  );
  return new Response("Received payload and sent to Signal server", {
    status: 200,
  });
};

function main() {
  if (SIGNAL_PHONE_NUMBER === null) {
    console.error(
      "There was no target signal phone number to receive messages for",
    );
    process.exit(1);
  }

  const server = Bun.serve({
    port: SERVER_PORT,
    development: Bun.env.NODE_ENV === "development",
    routes: {
      "/signal-proxy": {
        POST: signalProxyHandler,
      },
    },
    async fetch() {
      return new Response("Not found", { status: 404 });
    },
  });

  if (!server) {
    console.error(
      `There was an error starting the server on port: ${SERVER_PORT}`,
    );
    process.exit(1);
  }

  console.log(
    `Server started listening to connections on port: ${SERVER_PORT}`,
  );
}

main();
