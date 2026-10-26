import { getSession } from "@/lib/auth";
import { getUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

// 후기 사진은 누구나, 자격증 사진은 본인과 강사·대표만 볼 수 있음
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const u = await getUpload(params.id);
  if (!u) return new Response("not found", { status: 404 });
  if (u.kind === "LICENSE") {
    const session = await getSession();
    const ok = session && (session.user.role !== "STUDENT" || session.user.id === u.userId);
    if (!ok) return new Response("forbidden", { status: 403 });
  }
  return new Response(Buffer.from(u.data, "base64"), {
    headers: {
      "Content-Type": u.mime,
      "Cache-Control": u.kind === "LICENSE" ? "private, max-age=3600" : "public, max-age=31536000, immutable",
    },
  });
}
