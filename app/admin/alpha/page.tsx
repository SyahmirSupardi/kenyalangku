import type { Metadata } from "next";
import AlphaAdmin from "@/src/components/alpha/AlphaAdmin";
import styles from "@/src/components/alpha/alpha.module.css";

export const metadata: Metadata = {
  title: "Alpha claims",
  robots: { index: false, follow: false },
};

export default function AdminAlphaPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner} style={{ width: "min(100% - 6vw, 1400px)" }}>
        <AlphaAdmin />
      </div>
    </main>
  );
}
