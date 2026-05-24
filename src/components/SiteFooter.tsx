import { ExternalLink, MessageCircle, ShieldCheck, UserCircle } from "lucide-react";

const idleMmoProfileUrl = "https://web.idle-mmo.com/@D3vxGh0st";
const discordHandle = "d3v_gh0st";

export default function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Project information">
      <div className="site-footer-brand">
        <span className="site-footer-mark" aria-hidden="true">
          <ShieldCheck size={18} />
        </span>
        <div className="site-footer-copy">
          <strong>Zenith Companion</strong>
          <span>
            Unofficial IdleMMO companion. Profiles, planners, and custom settings stay local to this browser unless you export them.
          </span>
        </div>
      </div>

      <div className="site-footer-actions" aria-label="Project links">
        <span className="site-footer-pill" title="Profiles and planner data are saved locally in this browser">
          <ShieldCheck size={15} />
          Local-first
        </span>
        <span className="site-footer-pill" title="Contact on Discord">
          <MessageCircle size={15} />
          {discordHandle}
        </span>
        <a
          className="site-footer-pill"
          href={idleMmoProfileUrl}
          rel="noreferrer"
          target="_blank"
          aria-label="Open D3vxGh0st on IdleMMO in a new tab"
        >
          <UserCircle size={15} />
          IdleMMO profile
          <ExternalLink size={13} />
        </a>
      </div>

      <p className="site-footer-disclaimer">
        Not affiliated with, endorsed by, or officially connected to Galahad Creative or IdleMMO.
      </p>
    </footer>
  );
}
