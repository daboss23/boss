import { siteGapLines } from "../../lib/actionPlans";
import type { SiteScan } from "../../lib/types";
import { Card, CardHeader } from "../ui/Card";
import { Icon } from "../ui/Icon";

export default function SiteFindings({ scan }: { scan: SiteScan }) {
  const lines = siteGapLines(scan);
  const gaps = lines.filter((l) => !l.ok).length;
  return (
    <Card>
      <CardHeader
        icon="search"
        title="What we found on your site"
        sub={
          <>
            {scan.domain} · {gaps === 0 ? "no major gaps detected" : `${gaps} conversion ${gaps === 1 ? "gap" : "gaps"} detected`}
          </>
        }
      />
      <ul className="grid gap-2 sm:grid-cols-2">
        {lines.map((l) => {
          const body = (
            <>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full ${l.ok ? "bg-win/15 text-win" : "bg-leak/15 text-leak"}`}>
                <Icon name={l.ok ? "check" : "x"} size={13} strokeWidth={2.6} />
              </span>
              <span className={`text-sm ${l.ok ? "text-soft" : "text-white"}`}>{l.text}</span>
              {!l.ok && l.section && <Icon name="arrowRight" size={15} className="ml-auto shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />}
            </>
          );
          return (
            <li key={l.key}>
              {!l.ok && l.section ? (
                <a
                  href={`#${l.section}`}
                  className="group flex items-center gap-3 rounded-xl bg-leak/[0.05] px-4 py-3 ring-1 ring-leak/15 transition-colors hover:bg-leak/[0.09]"
                >
                  {body}
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.06]">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {(scan.rating !== null || scan.reviewCount !== null) && (
        <p className="mt-4 text-[12.5px] text-muted">
          Found on your site:{" "}
          {scan.rating !== null && <span className="text-soft">{scan.rating.toFixed(1)} star rating</span>}
          {scan.rating !== null && scan.reviewCount !== null && " from "}
          {scan.reviewCount !== null && <span className="text-soft">{scan.reviewCount.toLocaleString("en-US")} reviews</span>}
        </p>
      )}
    </Card>
  );
}
