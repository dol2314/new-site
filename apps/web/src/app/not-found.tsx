import type { Metadata } from "next";
import Link from "next/link";

// robots는 넣지 않는다: Next가 404에 noindex를 자동으로 넣으므로 넣으면 중복된다.
export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다" };

export default function NotFound() {
  return (
    <div className="container">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소가 바뀌었거나 없는 페이지입니다.</p>
      <p>
        <Link href="/">처음 화면으로 가기</Link>
      </p>
    </div>
  );
}
