import React from "react";

export function SectionHeading({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="section-heading">
      <h2>{label}</h2>
      <p>{detail}</p>
    </div>
  );
}
