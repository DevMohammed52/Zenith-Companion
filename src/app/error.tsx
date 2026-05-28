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
      title="This tool hit a bad state."
      description="The app kept the error details out of the page. Retry the route, or return to a stable tool while the server logs keep the useful debugging detail."
      reset={reset}
    />
  );
}
