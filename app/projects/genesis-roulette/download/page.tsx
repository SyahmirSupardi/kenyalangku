import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RedeemForm from "@/src/components/alpha/RedeemForm";
import styles from "@/src/components/alpha/alpha.module.css";

export const metadata: Metadata = {
  title: "Download Genesis Roulette alpha",
  description: "Redeem your Genesis Roulette closed alpha code for a private download link.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <Link className={styles.back} href="/projects/genesis-roulette"><ArrowLeft size={16} /> Genesis Roulette</Link>
        <div className={styles.layout}>
          <RedeemForm />
        </div>
      </div>
    </main>
  );
}
