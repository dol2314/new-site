// 빌드 전에 실행: ADSENSE_PUB_ID 환경변수(pub-숫자16자리)가 있으면 apps/web/public/ads.txt 를 만든다.
// 값이 없으면 ads.txt를 만들지 않는다(틀린 값을 공개하지 않기 위해). 파일은 .gitignore 대상.
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "apps/web/public/ads.txt");
const id = (process.env.ADSENSE_PUB_ID ?? "").trim();

if (/^pub-\d{16}$/.test(id)) {
  writeFileSync(target, `google.com, ${id}, DIRECT, f08c47fec0942fa0\n`);
  console.log(`[ads.txt] 생성: ${id}`);
} else {
  if (existsSync(target)) rmSync(target);
  console.log(id ? `[ads.txt] 형식 오류로 만들지 않음: "${id}" (pub-숫자16자리여야 함)` : "[ads.txt] ADSENSE_PUB_ID 없음 → 만들지 않음");
}
