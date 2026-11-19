"use client";

import Link from "next/link";
import { Settings, UserRound } from "lucide-react";

export function DashboardSetupReminder() {
  return (
    <section className="dashboard-setup-state" aria-label="Profile setup reminder">
      <div>
        <span>Profile setup</span>
        <h2>Set character stats that change route math.</h2>
        <p>Class, tools, bartering, pets, housing, magic find, and idle timers change profit/hr and drop estimates. Profile data stays in your browser.</p>
      </div>
      <div className="dashboard-setup-actions">
        <Link href="/profiles"><UserRound size={16} /> Create or import profile</Link>
        <Link href="/settings"><Settings size={16} /> Route settings</Link>
      </div>
    </section>
  );
}
