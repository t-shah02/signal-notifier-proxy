export interface ICoolifyDeploymentWebhookEventBase {
  application_name: string;
  application_uuid: string;
  deployment_uuid: string;
  deployment_url: string;
  project: string;
  environment: string;
  pull_request_id?: number;
  preview_fqdn?: string;
  fqdn?: string;
}

export interface ICoolifyDeploymentFailedWebhookEvent extends ICoolifyDeploymentWebhookEventBase {
  success: false;
  message: "Deployment failed";
  event: "deployment_failed";
}

export interface ICoolifyDeploymentSuccessWebhookEvent extends ICoolifyDeploymentWebhookEventBase {
  success: true;
  message: "New version successfully deployed";
  event: "deployment_success";
}

export interface ICoolifyApplicationStatusChangedWebhookEvent {
  success: false;
  message: "Application stopped";
  event: "status_changed";
  application_name: string;
  application_uuid: string;
  url: string;
  project: string;
  environment: string;
  fqdn: string;
}

export type ICoolifyDeploymentWebhookEvent =
  | ICoolifyDeploymentFailedWebhookEvent
  | ICoolifyDeploymentSuccessWebhookEvent
  | ICoolifyApplicationStatusChangedWebhookEvent;

export interface ISignalSendMessageResponse {
  success: boolean;
  message?: string;
}
