import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ClaimForm from "@/src/components/alpha/ClaimForm";
import styles from "@/src/components/alpha/alpha.module.css";

export const metadata: Metadata = {
  title: "Claim Genesis Roulette alpha access",
  description: "Claim one of 100 Genesis Roulette closed alpha tester slots for Android or Windows.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <Link className={styles.back} href="/projects/genesis-roulette"><ArrowLeft size={16} /> Genesis Roulette</Link>
        <div className={styles.layout}>
          <ClaimForm />
        </div>
      </div>
    </main>
  );
}
