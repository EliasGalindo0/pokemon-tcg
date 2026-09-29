import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { globalSearch } from "@/services/search";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ q, cards: [], decks: [], trades: [] });
  }
  const result = await globalSearch(user.id, q);
  if (user.role !== "ADMIN") {
    result.decks = [];
  }
  return NextResponse.json(result);
}
