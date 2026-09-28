import { ok, fail, toResponse } from "@/lib/http";
import { saveUpload } from "@/lib/uploads";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Envie o arquivo no campo file.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Arquivo ausente.", 400);

  try {
    const url = await saveUpload(file);
    return ok({ url }, 201);
  } catch (error) {
    return toResponse(error);
  }
}
