import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AboutCarousel from "@/src/components/AboutCarousel";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Meet the KenyalangKu team: Syahmir Supardi, Nazreen Bin Abdul Radzak, Ku Nazrin Ardy, and Muhammad Daniel Erfan Bin Arbain.",
};

export default function About() {
  return (
    <main id="main" className={styles.aboutPage}>
      <div className={styles.inner}>
        <section className={styles.intro} aria-labelledby="about-title">
          <div className={styles.eyebrow}>
            <i aria-hidden="true" /> KENYALANGKU / ABOUT US
          </div>
          <div className={styles.introRow}>
            <h1 id="about-title">
              Rooted here.<br />
              <span>Imagined everywhere.</span>
            </h1>
            <div className={styles.introCopy}>
              <p>We are KenyalangKu. An independent Malaysian game studio, beginning with the stories closest to home.</p>
              <p>Heritage, mythology, landscapes, and imagination are our starting points. We turn them into experiences that invite people everywhere to be curious about Malaysia.</p>
            </div>
          </div>
        </section>

        <section className={styles.carouselWrap} aria-labelledby="team-title">
          <h2 id="team-title" className={styles.teamTitle}>Meet the <span>Team</span></h2>
          <AboutCarousel />
        </section>

        <div className={styles.closing}>
          <span>ROOTED IN CULTURE · DRIVEN BY IMAGINATION</span>
          <Link href="/collaboration">
            Work with KenyalangKu <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
