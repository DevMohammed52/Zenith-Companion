"use client";

import { Compass, X } from "lucide-react";
import { useEffect, useState } from "react";
import MobileCommandWheel from "@/components/MobileCommandWheel";
import { useSidebar } from "@/context/SidebarContext";
import { playZenithSound } from "@/lib/audio";
import { usePreferences } from "@/lib/preferences";

export default function MobileCommandWheelHost() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { preferences, loaded } = usePreferences();
  const [renderWheel, setRenderWheel] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      setRenderWheel(true);
      return;
    }

    const timeout = window.setTimeout(() => setRenderWheel(false), 260);
    return () => window.clearTimeout(timeout);
  }, [mobileOpen]);

  if (!loaded || preferences.mobileNavigationStyle !== "command") return null;
  const triggerSide = preferences.mobileCommandTriggerSide ?? "left";
  const closing = renderWheel && !mobileOpen;

  return (
    <>
      <button
        id="app-mobile-menu-button"
        className={`command-wheel-trigger command-wheel-trigger-${triggerSide} ${mobileOpen ? "command-wheel-trigger-open" : ""}`}
        type="button"
        aria-label={mobileOpen ? "Close command wheel" : "Open command wheel"}
        aria-controls="app-command-wheel"
        aria-expanded={mobileOpen}
        onClick={() => {
          playZenithSound(mobileOpen ? "close" : "open");
          setMobileOpen(!mobileOpen);
        }}
      >
        {mobileOpen ? <X size={22} /> : <Compass size={22} />}
        <span>Menu</span>
      </button>
      {renderWheel && (
        <MobileCommandWheel
          open={mobileOpen}
          closing={closing}
          onClose={() => setMobileOpen(false)}
          side={triggerSide}
        />
      )}
    </>
  );
}
