import type { Metadata } from "next";
import AdminHub from "@/src/components/alpha/AdminHub";
import styles from "@/src/components/alpha/alpha.module.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner} style={{ width: "min(100% - 6vw, 1100px)" }}>
        <AdminHub />
      </div>
    </main>
  );
}
