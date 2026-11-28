import { notFound } from "next/navigation";
import UiPreviewClient from "./UiPreviewClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "UI Primitive Preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UiPreviewPage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_UI_PREVIEW !== "1") {
    notFound();
  }

  return <UiPreviewClient />;
}
