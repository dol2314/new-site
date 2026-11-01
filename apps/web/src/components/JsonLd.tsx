/** 구조화 데이터 출력. data는 서버에서 만든 고정 객체만 넣는다(사용자 입력 금지). */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
