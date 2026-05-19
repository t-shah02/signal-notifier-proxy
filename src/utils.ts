import type {
  ICoolifyApplicationStatusChangedWebhookEvent,
  ICoolifyDeploymentFailedWebhookEvent,
  ICoolifyDeploymentSuccessWebhookEvent,
  ICoolifyDeploymentWebhookEvent,
  ICoolifyDeploymentWebhookEventBase,
  ICoolifyTestWebhookEvent,
  ISignalSendMessageResponse,
} from "./types";

// coolify payload
const REQUIRED_DEPLOYMENT_PAYLOAD_KEYS = [
  "application_name",
  "application_uuid",
  "deployment_uuid",
  "deployment_url",
  "environment",
] as const;
const REQUIRED_TEST_PAYLOAD_KEYS = [
  "success",
  "message",
  "event",
  "url",
] as const;
const UNKNOWN_PAYLOAD_EVENT_TYPE_NAME = "unknown event name";

// signal cli REST api
const SIGNAL_CLI_SERVER_PORT = Bun.env.SIGNAL_CLI_SERVER_PORT || 8080;
const SIGNAL_CLI_SERVER_HOST = Bun.env.SIGNAL_CLI_SERVER_HOST || "signal-cli";
const SIGNAL_REST_API_BASE_URL = `http://${SIGNAL_CLI_SERVER_HOST}:${SIGNAL_CLI_SERVER_PORT}`;

const isCoolifyWebhookPayloadValid = (payload: unknown): boolean => {
  if (typeof payload !== "object") return false;

  const payloadKeys = Object.keys(payload as object);

  const isMissingRequiredTestKey = REQUIRED_TEST_PAYLOAD_KEYS.some(
    (requiredKey) => !payloadKeys.includes(requiredKey),
  );
  const isMissingRequiredDeploymentKey = REQUIRED_DEPLOYMENT_PAYLOAD_KEYS.some(
    (requiredKey) => !payloadKeys.includes(requiredKey),
  );
  if (isMissingRequiredDeploymentKey && isMissingRequiredTestKey) return false;

  return true;
};

const buildLabelLine = (
  label: string,
  value?: string | number,
): string | null => {
  if (value === undefined || value === "") return null;
  return `${label}: ${value}`;
};

const joinMessageLines = (lines: (string | null)[]): string =>
  lines.filter((line): line is string => line !== null).join("\n");

const buildDeploymentDetailLines = (
  payload: ICoolifyDeploymentWebhookEventBase,
): (string | null)[] => [
  `📦 ${payload.application_name}`,
  `🗂️  Project: ${payload.project}`,
  `🌍 Environment: ${payload.environment}`,
  `🔗 ${payload.deployment_url}`,
  buildLabelLine("FQDN", payload.fqdn),
  buildLabelLine("Preview", payload.preview_fqdn),
  buildLabelLine(
    "PR",
    payload.pull_request_id ? `#${payload.pull_request_id}` : undefined,
  ),
  buildLabelLine("Deployment", payload.deployment_uuid),
];

const formatDeploymentSuccessMessage = (
  payload: ICoolifyDeploymentSuccessWebhookEvent,
): string =>
  joinMessageLines([
    "✅ Deployment succeeded",
    "",
    ...buildDeploymentDetailLines(payload),
    "",
    payload.message,
  ]);

const formatDeploymentFailedMessage = (
  payload: ICoolifyDeploymentFailedWebhookEvent,
): string =>
  joinMessageLines([
    "❌ Deployment failed",
    "",
    ...buildDeploymentDetailLines(payload),
    "",
    payload.message,
  ]);

const formatApplicationStatusChangedMessage = (
  payload: ICoolifyApplicationStatusChangedWebhookEvent,
): string =>
  joinMessageLines([
    "⚠️ Application status changed",
    "",
    `📦 ${payload.application_name}`,
    `🗂️  Project: ${payload.project}`,
    `🌍 Environment: ${payload.environment}`,
    `🔗 ${payload.url}`,
    buildLabelLine("FQDN", payload.fqdn),
    "",
    payload.message,
  ]);

const formatTestWebhookMessage = (payload: ICoolifyTestWebhookEvent): string =>
  joinMessageLines([
    "🧪 Coolify test webhook",
    "",
    `🔗 ${payload.url}`,
    "",
    payload.message,
  ]);

const formatPayloadMessage = (
  payload: ICoolifyDeploymentWebhookEvent,
): string => {
  switch (payload.event) {
    case "deployment_success":
      return formatDeploymentSuccessMessage(payload);
    case "deployment_failed":
      return formatDeploymentFailedMessage(payload);
    case "status_changed":
      return formatApplicationStatusChangedMessage(payload);
    case "test":
      return formatTestWebhookMessage(payload);
    default:
      return UNKNOWN_PAYLOAD_EVENT_TYPE_NAME;
  }
};

const sendWebhookDeploymentSignalMessage = async (
  payload: ICoolifyDeploymentWebhookEvent,
  receiverPhoneNumber: string,
): Promise<ISignalSendMessageResponse> => {
  if (
    typeof receiverPhoneNumber !== "string" ||
    receiverPhoneNumber.length === 0
  ) {
    return {
      success: false,
      message: "Invalid reciever phone number was provided from caller",
    };
  }

  const formattedPayloadMessage = formatPayloadMessage(payload);
  if (formattedPayloadMessage === UNKNOWN_PAYLOAD_EVENT_TYPE_NAME) {
    return {
      success: false,
      message:
        "Received an unrecognized payload event type, so could not build final message",
    };
  }

  const requestUrl = `${SIGNAL_REST_API_BASE_URL}/v2/send`;
  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: formattedPayloadMessage,
      number: receiverPhoneNumber,
      recipients: [receiverPhoneNumber],
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      message: `The Signal REST API server responded with status code: ${response.status}`,
    };
  }

  return {
    success: true,
  };
};

export {
  formatPayloadMessage,
  isCoolifyWebhookPayloadValid,
  sendWebhookDeploymentSignalMessage,
};
