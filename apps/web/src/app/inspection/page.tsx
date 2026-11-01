import { addYears, formatWon, inspectionWindow, penaltyForDays } from "@site/calc-core";
import { inspectionData } from "@site/data";
import { ToolPage, type Example } from "@/components/tool/ToolPage";
import { SourcesList } from "@/components/tool/SourcesList";
import { formatKoreanDate } from "@/lib/kst";
import { LINKS } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { toolById } from "@/lib/tools";
import { InspectionCalculator } from "./InspectionCalculator";

const tool = toolById("inspection");
const data = inspectionData();
const p = data.params;
const penaltyReady = data.missing.window.length === 0 && data.missing.penalty.length === 0;

export const metadata = pageMetadata({
  title: "자동차 검사 기간·과태료 계산기",
  description: "검사 유효기간 만료일로 정기검사를 받을 수 있는 기간(만료일 전 90일~후 31일)과 늦었을 때 과태료 기준을 자동차관리법 기준으로 확인합니다.",
  path: tool.path,
  noindex: !tool.published,
});

// 사례: 날짜·금액은 엔진으로 계산
const e1 = inspectionWindow("2027-06-09", p);
const e2next = addYears("2027-06-09", data.cycle.everyYears);
const tiersShown = [10, 31, 34, 40, 70, 100, 114, 115];

const examples: Example[] = [
  {
    title: "만료일이 2027년 6월 9일인 차",
    body: (
      <p>
        검사는 {formatKoreanDate(e1.start)}부터 {formatKoreanDate(e1.end)}까지 받을 수 있습니다. 만료일 90일 전부터 받을 수 있어서, 일찍 받아도
        손해가 없습니다.
      </p>
    ),
  },
  {
    title: "검사 기간 안에 일찍 받으면 다음 만료일은?",
    body: (
      <p>
        위 차가 2027년 4월에 합격해도, 검사 기간 안에 받았으므로 만료일(2027년 6월 9일)에 받은 것으로 봅니다. 다음 유효기간은 종전 만료일 다음 날부터
        세어 비사업용 승용차 기준 {data.cycle.everyYears}년 뒤인 {formatKoreanDate(e2next)}에 끝납니다.
      </p>
    ),
  },
  {
    title: "검사가 늦어진 일수별 과태료",
    body: (
      <p>
        지연 40일이면 {formatWon(penaltyForDays(40, p))}, 70일이면 {formatWon(penaltyForDays(70, p))}, 100일이면 {formatWon(penaltyForDays(100, p))}
        입니다. 115일 이상이면 {formatWon(p.penaltyCapWon)}으로 상한입니다. 부과권자는 사정에 따라 최대 {Math.round(data.penaltyMaxReductionRate * 100)}%까지
        줄일 수 있습니다.
      </p>
    ),
  },
];

export default function InspectionPage() {
  return (
    <ToolPage
      tool={tool}
      summary={[
        `정기검사는 검사 유효기간 만료일 ${p.windowDaysBefore}일 전부터 만료일 ${p.windowDaysAfter}일 뒤까지 받을 수 있습니다(2025년 1월 1일부터).`,
        `비사업용 승용차의 검사 유효기간은 ${data.cycle.everyYears}년이고, 2025년 1월 1일 이후 새로 등록한 차는 첫 검사까지 ${data.cycle.firstAfterYears}년입니다.`,
        `검사를 받지 않고 30일 이내면 과태료 ${formatWon(penaltyForDays(1, p))}, 이후 3일마다 2만원씩 늘어 115일 이상이면 ${formatWon(p.penaltyCapWon)}입니다.`,
      ]}
      calculator={<InspectionCalculator params={p} penaltyReady={penaltyReady} />}
      examples={examples}
      method={
        <>
          <ol>
            <li>검사 기간 = 만료일 − {p.windowDaysBefore}일 ~ 만료일 + {p.windowDaysAfter}일.</li>
            <li>기간 안에 합격하면 만료일에 받은 것으로 보고, 다음 유효기간은 종전 만료일 다음 날부터 셉니다.</li>
            <li>
              과태료: 지연 30일 이내 4만원, 31일째부터 3일 초과할 때마다 2만원 추가, 115일 이상 60만원. 가산은 4만원 + ⌊(지연일수 − 31) ÷ 3⌋ × 2만원으로
              계산했습니다.
            </li>
          </ol>
          {!penaltyReady && (
            <p className="notice small" data-pending>
              날짜별 과태료 계산은 &apos;검사 지연기간&apos;을 어느 날부터 세는지 법령으로 확인한 뒤 제공합니다. 지금은 아래 기준표로 확인하세요.
            </p>
          )}
          <SourcesList sources={data.sources} />
        </>
      }
      table={
        <>
          <h3>검사 유효기간 (승용자동차)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">구분</th>
                  <th scope="col">유효기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>비사업용 승용</td>
                  <td>
                    {data.cycle.everyYears}년 (2025년 1월 1일 이후 신규등록한 새 차는 첫 유효기간 {data.cycle.firstAfterYears}년)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3>정기검사 미수검 과태료</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">검사 지연기간</th>
                  {tiersShown.map((d) => (
                    <th key={d} scope="col">
                      {d}일
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>과태료</td>
                  {tiersShown.map((d) => (
                    <td key={d}>{(penaltyForDays(d, p) / 10_000).toLocaleString("ko-KR")}만원</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      }
      faq={[
        { q: "정기검사는 언제부터 받을 수 있나요?", a: `검사 유효기간 만료일 ${p.windowDaysBefore}일 전부터 만료일 ${p.windowDaysAfter}일 뒤까지입니다. 2025년 1월 1일부터 이전보다 앞당겨 받을 수 있게 바뀌었습니다.` },
        { q: "일찍 받으면 다음 검사도 빨라지나요?", a: "아닙니다. 검사 기간 안에 합격하면 만료일에 받은 것으로 보고, 다음 유효기간은 종전 만료일 다음 날부터 셉니다." },
        { q: "새 차는 언제 첫 검사를 받나요?", a: `비사업용 승용차를 2025년 1월 1일 이후 새로 등록했다면 첫 유효기간은 ${data.cycle.firstAfterYears}년입니다. 그 이전에 등록한 차는 등록증의 유효기간을 확인하세요.` },
        { q: "검사를 늦게 받으면 과태료가 얼마인가요?", a: `30일 이내 4만원이고, 이후 3일마다 2만원씩 늘어 115일 이상이면 ${formatWon(p.penaltyCapWon)}입니다. 사정에 따라 최대 절반까지 줄어들 수 있습니다.` },
        { q: "차를 판 뒤 검사 기간이 지났다면요?", a: "검사 유효기간이 지난 뒤 소유권이 바뀐 차는 이전등록한 날부터 31일 안에 정기검사를 받으면 됩니다." },
      ]}
      next={{ tools: [toolById("car-tax")], links: [LINKS.kotsa, LINKS.lawInspection] }}
      checkedAt={data.sources[0]?.checked_at ?? "2026-11-01"}
    />
  );
}
