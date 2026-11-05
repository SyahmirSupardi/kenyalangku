"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import HoloCard from "./HoloCard.jsx";
import styles from "./CollaborationSpread.module.css";

const cards = [
  { src: "/images/partners/krackeddevs.svg", alt: "KrackedDevs logo", title: "KrackedDevs", role: "AI community", detail: "KrackedDevs is a builder ecosystem: a community, a school and a product lab, run by builders. We work with companies and government to turn that talent into shipped work.", url: "https://krackeddevs.com/" },
  { src: "/images/partners/xsolla-curine-academy.png", alt: "Xsolla Curine Academy emblem", title: "Xsolla Curine Academy", role: "Game academy", detail: "Xsolla Curine Academy is the flagship learning center of Xsolla Game Academy, with a campus based in Kuala Lumpur. It provides industry-relevant game development training programs for creative talents and professionals at every proficiency level, empowering them for success in one of the most dynamic and competitive industries. Our learning approach focuses on quick knowledge acquisition, enabling our students to adapt to industry trends and innovations.", url: "https://xsollacurine.academy/" },
  { src: "/images/partners/unreal-engine-supplied.png", alt: "Unreal Engine logo and wordmark", title: "Unreal Engine", role: "Technology we build with", detail: "Founded in 1991 by CEO Tim Sweeney, Epic Games is an American interactive entertainment company and 3D engine technology provider headquartered in Cary, North Carolina, with offices worldwide. Epic operates Fortnite and develops Unreal Engine, which powers leading games and is used in film and television, live events, architecture, automotive, and simulation. Through Fortnite, Unreal Engine, the Epic Games Store, and Epic Online Services, Epic provides a digital ecosystem for developers and creators to build, distribute, and operate content.", url: "https://www.unrealengine.com/" },
  { src: "/images/partners/godot.png", alt: "Godot Engine logo", title: "Godot Engine", role: "Technology we build with", detail: "The Godot Foundation is a Dutch non-profit organization registered as Stichting Godot. Formed on August 23, 2022, it administers charitable contributions that financially support the Godot Project, an open source game engine.", url: "https://godotengine.org/" },
];

function CardFace({ index }: { index: number }) {
  const card = cards[index];
  return <>
    <HoloCard className={styles.holo} image="/images/partners/holo-card-base.svg" backImage={undefined} style={undefined} alt="" preset="gold" foilColor="#d7ae69" intensity={0.7} glare={0.35} edgeSparkle={0.65} width={230} radius={14} hoverScale={1} idle={false} shadow={false} />
    <span className={`${styles.cardArt} ${index === 1 ? styles.xsollaArt : ""} ${index === 2 ? styles.unrealArt : ""}`}><Image src={card.src} alt={card.alt} fill sizes="(max-width: 650px) 140px, 230px" /></span>
    <span className={styles.cardCopy}><small>0{index + 1} / {card.role}</small><strong>{card.title}</strong></span>
  </>;
}

export default function CollaborationSpread() {
  const [active, setActive] = useState<number | null>(null);
  return <section className={styles.spread} aria-label="Collaboration cards">
    {active === null ? <>
      <div className={styles.deck}>
        {cards.map((card, index) => <button
          key={card.title}
          className={styles.card}
          type="button"
          aria-label={`Show ${card.title} details`}
          onClick={() => setActive(index)}
          style={{ "--offset": index - 1.5, "--angle": (index - 1.5) * 11, "--order": index } as CSSProperties}
        ><CardFace index={index} /></button>)}
      </div>
      <p className={styles.hint}>Select a card to explore our connections.</p>
    </> : <div className={styles.panel} aria-live="polite">
      <div className={styles.pinnedCard} aria-hidden="true"><CardFace index={active} /></div>
      <button className={styles.back} type="button" onClick={() => setActive(null)} aria-label="Back to all collaboration cards">← <span>All connections</span></button>
      <div className={styles.panelContent}>
        <span className={styles.eyebrow}>0{active + 1} / {cards[active].role}</span>
        <h2>{cards[active].title}</h2>
        <p>{cards[active].detail}</p>
        <a className={styles.website} href={cards[active].url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${cards[active].title} website (opens in a new tab)`}>Visit website <span aria-hidden="true">↗</span></a>
      </div>
    </div>}
  </section>;
}
