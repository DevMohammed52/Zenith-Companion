"use client";

import AppErrorFallback from "@/components/AppErrorFallback";
import styles from "@/components/AppErrorFallback.module.css";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  void error;

  return (
    <html lang="en">
      <body className={styles.globalBody}>
        <AppErrorFallback
          code="500"
          eyebrow="App shell error"
          title="Zenith could not finish loading."
          description="The main app shell failed before the normal layout could recover. Try again, or return to the dashboard after the page reloads."
          reset={reset}
          fullScreen
        />
      </body>
    </html>
  );
}
