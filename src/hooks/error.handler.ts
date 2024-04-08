import { logger } from "$lib/logger";
import type { HandleServerError } from "@sveltejs/kit";

export const handleError: HandleServerError = ({ status, message, error }) => {
  // TODO implement this handler
  logger.error(error);
  logger.error(status);

  // do not return sensitive data here as it will be sent to the client
  return { message };
};
