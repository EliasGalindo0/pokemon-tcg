import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function toResponse(error: unknown) {
  if (error instanceof AppError) return fail(error.message, error.status);
  console.error(error);
  return fail("Erro interno.", 500);
}
