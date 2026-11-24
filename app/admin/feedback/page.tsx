import type { Metadata } from "next";
import AdminFeedback from "@/src/components/alpha/AdminFeedback";
import styles from "@/src/components/alpha/alpha.module.css";

export const metadata: Metadata = {
  title: "Player feedback",
  robots: { index: false, follow: false },
};

export default function AdminFeedbackPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner} style={{ width: "min(100% - 6vw, 1100px)" }}>
        <AdminFeedback />
      </div>
    </main>
  );
}
