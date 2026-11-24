import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FeedbackForm from "@/src/components/alpha/FeedbackForm";
import styles from "@/src/components/alpha/alpha.module.css";

export const metadata: Metadata = {
  title: "Genesis Roulette player feedback",
  description: "Report a bug or share playtest feedback on the Genesis Roulette closed alpha.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <Link className={styles.back} href="/projects/genesis-roulette"><ArrowLeft size={16} /> Genesis Roulette</Link>
        <div className={styles.layout}>
          <FeedbackForm />
        </div>
      </div>
    </main>
  );
}
