import { Coffee, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";

const idleMmoProfileUrl = "https://web.idle-mmo.com/@D3vxGh0st";
const discordHandle = "d3v_gh0st";

export default function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Project information">
      <div className="site-footer-copy">
        <strong>Zenith Companion</strong>
        <span>
          Fan-made IdleMMO companion project. Not affiliated with, endorsed by, or
          officially connected to Galahad Creative or IdleMMO.
        </span>
      </div>

      <div className="site-footer-actions" aria-label="Project links">
        <span className="site-footer-pill" title="Contact on Discord">
          <MessageCircle size={15} />
          Discord: {discordHandle}
        </span>
        <a
          className="site-footer-pill"
          href={idleMmoProfileUrl}
          rel="noreferrer"
          target="_blank"
          title="Open D3vxGh0st on IdleMMO"
        >
          <ShieldCheck size={15} />
          IdleMMO profile
          <ExternalLink size={13} />
        </a>
        <span className="site-footer-pill site-footer-pill-muted" title="Ko-fi link will be added later">
          <Coffee size={15} />
          Ko-fi coming soon
        </span>
      </div>
    </footer>
  );
}
