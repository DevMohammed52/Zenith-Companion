"use client";

import { useEffect } from "react";
import AppErrorFallback from "@/components/AppErrorFallback";
import { reportAppError } from "@/lib/error-reporting";
import styles from "@/components/AppErrorFallback.module.css";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    reportAppError(error, "app_shell_error");
  }, [error]);

  return (
    <html lang="en">
      <body className={styles.globalBody}>
        <AppErrorFallback
          code="500"
          eyebrow="App shell error"
          title="Zenith could not finish loading."
          description="The main application layout failed to start. Reload the page to fetch fresh assets or jump back to a working tool."
          digest={error.digest}
          reset={reset}
          fullScreen
        />
      </body>
    </html>
  );
}
