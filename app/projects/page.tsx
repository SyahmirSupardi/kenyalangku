import type { Metadata } from "next";
import ProjectFolderCollection from "@/src/components/ProjectFolderCollection";
import styles from "./projects.module.css";

export const metadata: Metadata = {
  title: "Our projects",
  description: "Explore KenyalangKu's flagship games and special initiatives: PUSAKA, MYTH: TANAH, and Genesis Roulette.",
};

export default function Projects() {
  return <main id="main" className={styles.page}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>KENYALANGKU / OUR PROJECTS</p>
      <h1>Worlds in <em>the making.</em></h1>
      <p>Explore our flagship games and the ideas taking shape beyond them. Open a folder to discover each project.</p>
    </header>
    <ProjectFolderCollection />
  </main>;
}
