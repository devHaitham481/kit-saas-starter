import { PRICE_ID_LEN } from "$configs/fields-length";
import { z } from "zod";
import * as m from "$paraglide/messages";

const priceIdField = z
  .string({ required_error: m.validation_priceId_isRequired() })
  .trim()
  .length(PRICE_ID_LEN, { message: m.validation_priceId_length({ len: PRICE_ID_LEN }) })
  .startsWith("price_");

export { priceIdField };
