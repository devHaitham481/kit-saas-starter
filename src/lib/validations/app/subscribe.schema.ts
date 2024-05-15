import { z } from "zod";
import type { Infer } from "sveltekit-superforms";
import { priceIdField } from "$validations/core";

const subscribeFormSchema = z.object({ priceId: priceIdField });

type SubscribeFormSchema = Infer<typeof subscribeFormSchema>;

export { subscribeFormSchema, type SubscribeFormSchema };
