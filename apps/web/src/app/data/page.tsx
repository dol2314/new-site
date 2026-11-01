import { DATA_SOURCES } from "@site/data";
import { JsonLd } from "@/components/JsonLd";
import { Prose } from "@/components/Prose";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/site.config";

export const metadata = pageMetadata({
  title: "데이터 출처와 갱신 기록",
  description: `${site.name}가 계산에 쓰는 법령·정부 공지·공공데이터 출처와 갱신 방법입니다.`,
  path: "/data/",
});

export default function DataPage() {
  return (
    <Prose title="데이터 출처와 갱신 기록" updated="2026-11-01">
      <JsonLd data={breadcrumbJsonLd([{ name: "데이터 출처", path: "/data/" }])} />
      <p className="lead">
        계산에 쓰는 모든 값은 아래 공식 출처에서 확인합니다. 값마다 적용 시작일(기준일)과 확인한 날을 함께 기록합니다.
      </p>

      <h2>출처</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">무엇</th>
              <th scope="col">출처</th>
              <th scope="col">갱신 방법</th>
            </tr>
          </thead>
          <tbody>
            {DATA_SOURCES.map((s) => (
              <tr key={s.id}>
                <td>{s.topic}</td>
                <td>
                  <a href={s.url} rel="noopener">
                    {s.name}
                  </a>
                </td>
                <td>{s.howUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>확인 원칙</h2>
      <ul>
        <li>블로그·뉴스·자동차 플랫폼의 숫자는 근거로 쓰지 않고, 원래 발표 자료를 찾는 실마리로만 씁니다.</li>
        <li>출처마다 숫자가 다르면 법령 조문과 정부 공지를 기준으로 합니다.</li>
        <li>확인하지 못한 값이 필요한 계산기는 공개하지 않습니다.</li>
        <li>공식 API가 있으면 API를 쓰고, 없으면 각 사이트의 이용 조건을 확인한 뒤 사람이 직접 옮겨 적습니다.</li>
      </ul>

      <h2>갱신 기록</h2>
      <p>계산기를 공개하면서 값을 바꾼 날짜와 내용을 여기에 남깁니다.</p>
    </Prose>
  );
}
