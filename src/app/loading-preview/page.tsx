import { notFound } from "next/navigation";
import Loading from "../loading";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Loading Preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoadingPreviewPage() {
  if (process.env.ENABLE_LOADING_PREVIEW !== "1") notFound();

  return <Loading />;
}
