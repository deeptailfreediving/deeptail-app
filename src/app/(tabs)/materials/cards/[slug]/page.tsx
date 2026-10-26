import Image from "next/image";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { decks, getDeck } from "@/lib/materialDecks";

export function generateStaticParams() {
  return decks.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const d = getDeck(params.slug);
  return { title: d ? `${d.title} | 딥테일 교육자료` : "교육자료" };
}

export default function DeckPage({ params }: { params: { slug: string } }) {
  const deck = getDeck(params.slug);
  if (!deck) notFound();
  return (
    <>
      <PageHeader title={deck.title} back="/materials" />
      <ol className="flex flex-col gap-3 p-4 pb-8">
        {deck.cards.map((alt, i) => (
          <li key={i} className="overflow-hidden rounded-2xl bg-[#0d2233] shadow-card">
            <Image
              src={`/materials/${deck.slug}/${i + 1}.webp`}
              alt={`${deck.title} ${i + 1}/${deck.cards.length}: ${alt}`}
              width={1080}
              height={1350}
              sizes="(max-width: 480px) 100vw, 448px"
              priority={i === 0}
              unoptimized
              className="h-auto w-full"
            />
          </li>
        ))}
      </ol>
    </>
  );
}
