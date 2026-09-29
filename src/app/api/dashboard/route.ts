import { requireAdmin } from "@/lib/auth";
import { ok, toResponse } from "@/lib/http";
import { getDashboard } from "@/services/dashboard";

export async function GET() {
  try {
    const user = await requireAdmin();
    return ok(await getDashboard(user.id));
  } catch (error) {
    return toResponse(error);
  }
}
