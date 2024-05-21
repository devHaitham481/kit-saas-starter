import { dev } from "$app/environment";

export const APP_NAME = "Kit SaaS Starter";
export const APP_URL = dev ? "http://localhost:5173" : "https://kit-saas-starter.pages.dev";
export const APP_EMAIL = "Kit SaaS Starter <onboarding@resend.dev>";

export enum FLASH_MESSAGE_STATUS {
  ERROR = "error",
  WARNING = "warning",
  SUCCESS = "success"
}
