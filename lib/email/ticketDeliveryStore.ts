import "server-only";
import { client } from "@/sanity/lib/client";

export function ticketDeliveryStore() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  return token ? client.withConfig({ token, useCdn: false }) : null;
}
