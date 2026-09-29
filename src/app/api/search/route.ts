import { NextResponse } from "next/server";
import { globalSearch } from "@/services/search";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const result = await globalSearch(q);
  return NextResponse.json(result);
}
