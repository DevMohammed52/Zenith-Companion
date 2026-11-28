"use client";

import { useEffect } from "react";
import AppErrorFallback from "@/components/AppErrorFallback";
import { reportAppError } from "@/lib/error-reporting";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    reportAppError(error, "route_error");
  }, [error]);

  return (
    <AppErrorFallback
      code="500"
      eyebrow="Route error"
      title="This view could not finish loading."
      description="Try loading this route again, reload the page if a recent deploy updated scripts, or return to the dashboard."
      digest={error.digest}
      reset={reset}
    />
  );
}
