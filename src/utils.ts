import type { ICoolifyDeploymentWebhookEvent } from "./types";

const isCoolifyWebhookPayloadValid = (
  payload: unknown,
): boolean => {
  return false;
};

export { isCoolifyWebhookPayloadValid };
