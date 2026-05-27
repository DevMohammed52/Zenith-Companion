import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Error Preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ErrorPreviewPage() {
  if (process.env.ENABLE_ERROR_PREVIEW !== "1") notFound();

  throw new Error("Local Zenith error boundary preview");
}
