import { asc } from "drizzle-orm";
import Link from "next/link";
import { db, tables } from "@/db";
import { requireAdmin } from "@/lib/staff";
import { Section } from "../../ui";
import ImportForm from "./ImportForm";

export default async function ImportLogsPage() {
  await requireAdmin();
  const users = await db
    .select({ id: tables.users.id, name: tables.users.name, email: tables.users.email })
    .from(tables.users)
    .orderBy(asc(tables.users.name));

  return (
    <>
      <Section title="노션 로그 가져오기">
        <p className="mx-1 text-sm leading-relaxed text-ink-sub">
          노션 로그북에서 변환한 가져오기 파일(.json)을 선택하고, 기록을 넣을 회원을 고르세요.
        </p>
        <ImportForm users={users} />
      </Section>
      <p className="mx-5 mt-4 text-sm">
        <Link href="/admin/logbook" className="font-bold text-brand">
          ← 로그북으로
        </Link>
      </p>
    </>
  );
}
