"use client";

import { Keyboard } from "lucide-react";

export default function ShortcutsPanel() {
  return (
    <div className="settings-panel settings-panel-wide settings-desktop-only">
      <h2><Keyboard size={17} /> Keyboard Shortcuts</h2>
      <div className="shortcut-grid">
        <div><kbd>Ctrl</kbd><kbd>K</kbd><span>Global Search</span></div>
        <div><kbd>Alt</kbd><kbd>1</kbd><span>Dashboard</span></div>
        <div><kbd>Alt</kbd><kbd>2</kbd><span>Alchemy Profit</span></div>
        <div><kbd>Alt</kbd><kbd>3</kbd><span>Items Database</span></div>
        <div><kbd>Alt</kbd><kbd>4</kbd><span>Combat Planner</span></div>
        <div><kbd>Alt</kbd><kbd>5</kbd><span>Dungeons</span></div>
        <div><kbd>Alt</kbd><kbd>6</kbd><span>World Bosses</span></div>
        <div><kbd>Alt</kbd><kbd>7</kbd><span>BiS Recommender</span></div>
        <div><kbd>Alt</kbd><kbd>8</kbd><span>Crafting Queue</span></div>
        <div><kbd>Alt</kbd><kbd>S</kbd><span>Settings</span></div>
        <div><kbd>Esc</kbd><span>Close search or modal</span></div>
      </div>
    </div>
  );
}
