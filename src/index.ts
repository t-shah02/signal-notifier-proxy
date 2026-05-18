import { isCoolifyWebhookPayloadValid } from "./utils";

// constants
const SERVER_PORT = Bun.env.SERVER_PORT || 8100;
const SIGNAL_CLI_SERVER_PORT = Bun.env.SIGNAL_CLI_SERVER_PORT || 8101;

function main() {
  const server = Bun.serve({
    port: SERVER_PORT,
    development: Bun.env.NODE_ENV === "development",
    routes: {
      "/signal-proxy": {
        POST: async (request) => {
          const rawPayload = await request.json();
          console.log(`Received raw payload with the following data: ${JSON.stringify(rawPayload)}`);

          if (!isCoolifyWebhookPayloadValid(rawPayload)) {
            return new Response("Invalid Coolify deployment webhook payload in request body", { status: 400 });
          } 

          return new Response("Received payload and sent to Signal server", { status: 200 });
        },
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
