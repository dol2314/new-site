import Link from "next/link";
import { site } from "@/site.config";
import { publishedTools } from "@/lib/tools";

export function Header() {
  const tools = publishedTools();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          {site.name}
        </Link>
        {tools.length > 0 && (
          <nav aria-label="계산기">
            <ul className="nav-list">
              {tools.map((t) => (
                <li key={t.id}>
                  <Link href={t.path}>{t.short}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
