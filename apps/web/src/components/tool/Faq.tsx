import { JsonLd } from "@/components/JsonLd";

export interface FaqItem {
  q: string;
  a: string;
}

/** 화면에 보이는 FAQ와 같은 내용으로만 FAQPage 구조화 데이터를 만든다 */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
        }}
      />
      <dl className="faq">
        {items.map((i) => (
          <div key={i.q} data-faq-item>
            <dt>{i.q}</dt>
            <dd>{i.a}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
