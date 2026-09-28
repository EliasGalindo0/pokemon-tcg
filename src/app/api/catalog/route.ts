import { ok, toResponse } from "@/lib/http";
import { searchCatalog } from "@/services/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const result = await searchCatalog(searchParams.get("q") ?? "", searchParams.get("language") ?? undefined);
    return ok(result);
  } catch (error) {
    return toResponse(error);
  }
}
