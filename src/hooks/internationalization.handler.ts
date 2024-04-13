import type { Handle } from "@sveltejs/kit";
import { i18n } from "$lib/i18n";

export const internationalization: Handle = i18n.handle();
