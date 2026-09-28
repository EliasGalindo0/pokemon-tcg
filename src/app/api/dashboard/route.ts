import { ok, toResponse } from "@/lib/http";
import { getDashboard } from "@/services/dashboard";

export async function GET() {
  try {
    return ok(await getDashboard());
  } catch (error) {
    return toResponse(error);
  }
}
