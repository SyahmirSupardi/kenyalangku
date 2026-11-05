import type { Metadata } from "next";
import CollaborationSpread from "@/src/components/CollaborationSpread";
import styles from "./collaboration.module.css";

export const metadata: Metadata = {
  title: "Collaboration",
  description: "Explore KenyalangKu's game academy connection, AI community, and development technology.",
};

export default function Collaboration() {
  return <main id="main" className={styles.page}>
    <header className={styles.heading}>
      <p>KENYALANGKU / CREATIVE CONNECTIONS</p>
      <h1>Building worlds, <em>together.</em></h1>
      <span>Explore the people, learning spaces, and technology around our work.</span>
    </header>
    <CollaborationSpread />
  </main>;
}
