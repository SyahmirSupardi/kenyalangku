"use client";

import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useState, type FocusEvent } from "react";
import ProfileCard from "@/src/components/ProfileCard";
import styles from "@/src/components/AboutCarousel.module.css";

const slides = [
  {
    id: "founder",
    label: "THE FOUNDER",
    title: "Syahmir Supardi",
    description:
      "Syahmir Supardi is pursuing a Bachelor of Computer Science (Hons.), with studies in game design, software development, and AI. His work as a research officer has shaped an analytical approach to turning complex data into clear systems and useful insights. As founder and game creator at KenyalangKu, he brings that curiosity to building Malaysian game worlds that carry local culture to players everywhere.",
    image: "/images/kenyalangku/syahmir-supardi.jpg",
    imageAlt: "Portrait of KenyalangKu founder and game creator Syahmir Supardi.",
    imageLabel: "SYAHMIR SUPARDI · FOUNDER & GAME CREATOR",
    portfolioUrl: "https://portfolio-syahmir-supardi.vercel.app/",
    portfolioLabel: "Syahmir's Portfolio",
    contain: false,
  },
  {
    id: "nazreen",
    label: "3D ASSET DESIGNER",
    title: "Nazreen Bin Abdul Radzak",
    description:
      "Nazreen's path into game development was shaped by experiences across both creative and technical fields. Starting with a foundation in multimedia design, he developed his skills through graphic design, IT support, digital content creation, and hands-on event production. Along the way, his interest in 3D modeling opened another way to express ideas through digital art. As part of KenyalangKu's creative team, he now applies that knowledge to building 3D assets for games, combining attention to detail with a desire to turn imagination into something players can experience.",
    image: "/images/kenyalangku/nazreen-bin-abdul-radzak.png",
    imageAlt: "Portrait of Nazreen Bin Abdul Radzak, KenyalangKu 3D Asset Designer.",
    imageLabel: "NAZREEN BIN ABDUL RADZAK · 3D ASSET DESIGNER",
    portfolioUrl: "/about/nazreen/assets",
    portfolioLabel: "Nazreen's Portfolio",
    contain: false,
  },
  {
    id: "nazrin",
    label: "NARRATIVE DESIGNER",
    title: "Ku Nazrin Ardy",
    description:
      "Nazrin operates at the vital intersection of technology, behavioural psychology, and interactive entertainment. Backed by a foundational background in IT and advanced expertise in Industrial-Organizational Psychology, his career spans high-growth tech sectors, including cloud infrastructure at GoDaddy and blockchain startups, to managing global enterprise accounts at HP across North America, APAC, and EMEA. As the former head of Unintentional Games Studio Sdn Bhd, he seamlessly bridges corporate operational leadership with creative vision, directing production teams while continuing to design, code, and architect original game worlds driven by player psychology.",
    image: "/images/kenyalangku/ku-nazrin-ardy-01.png",
    imageAlt: "Portrait of Ku Nazrin Ardy, KenyalangKu Narrative Designer.",
    imageLabel: "KU NAZRIN ARDY · NARRATIVE DESIGNER",
    contain: false,
  },
  {
    id: "daniel",
    label: "TECHNICAL GAME DESIGNER",
    title: "Muhammad Daniel Erfan Bin Arbain",
    description:
      "Driven by the intersection of engineering logic and creative storytelling, Daniel pairs a solid technical foundation from Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA) with a passion for complete game creation. He thrives as a multidisciplinary generalist, moving from early narrative design and 2D character sketching to programming core mechanics. Game jams have honed his ability to prototype quickly and collaborate across disciplines. As he expands his practice into music and audio design, he aims to build cohesive, systems-driven, and immersive worlds for players everywhere.",
    image: "/images/kenyalangku/muhammad-daniel-erfan-bin-arbain.jpg",
    imageAlt: "Portrait of Muhammad Daniel Erfan Bin Arbain, KenyalangKu Technical Game Designer.",
    imageLabel: "MUHAMMAD DANIEL ERFAN BIN ARBAIN · TECHNICAL GAME DESIGNER",
    contain: false,
  },
];

const cycleDuration = 7200;

export default function AboutCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [nazrinPhoto, setNazrinPhoto] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (paused || hovering || focusWithin || reducedMotion || slides[active].id === "nazrin") return;
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, cycleDuration);
    return () => window.clearTimeout(timer);
  }, [active, focusWithin, hovering, paused, reducedMotion]);

  useEffect(() => {
    if (slides[active].id !== "nazrin" || paused || reducedMotion) return;
    const timer = window.setInterval(() => setNazrinPhoto((current) => (current + 1) % 2), 5000);
    return () => window.clearInterval(timer);
  }, [active, paused, reducedMotion]);

  const slide = slides[active];
  const visualImage = slide.id === "nazrin" && nazrinPhoto === 1
    ? "/images/kenyalangku/ku-nazrin-ardy-02.png"
    : slide.image;
  const visualAlt = slide.id === "nazrin" && nazrinPhoto === 1
    ? "Ku Nazrin Ardy holding a child in front of a colourful illustrated backdrop."
    : slide.imageAlt;
  const slideNumber = String(active + 1).padStart(2, "0");
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setFocusWithin(false);
    }
  };

  return (
    <section
      className={styles.carousel}
      aria-label="About KenyalangKu stories"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={handleBlur}
    >
      <div
        className={styles.visual}
      >
        <ProfileCard
          className={styles.profileCard}
          avatarUrl={visualImage}
          avatarAlt={visualAlt}
          iconUrl="/images/kenyalangku/kenyalangku-logo.png"
          name={slide.title}
          title={slide.label}
          miniAvatarUrl="/images/kenyalangku/kenyalangku-logo.png"
          handle="KenyalangKu"
          status={slide.label}
          portfolioHref={"portfolioUrl" in slide ? slide.portfolioUrl : undefined}
          holo={0.55}
          glare={0.24}
          tiltStrength={7}
          parallax={3}
          intro={false}
        />
      </div>

      <div className={styles.story}>
        <div className={styles.storyContent} key={slide.id}>
          <div className={styles.storyMeta}>
            <span><i aria-hidden="true" />{slide.label}</span>
            <span>{slideNumber} / {String(slides.length).padStart(2, "0")}</span>
          </div>
          <h2
            className={slide.id === "founder" ? styles.founderTitle : slide.id === "nazreen" ? styles.nazreenTitle : slide.id === "nazrin" ? styles.nazrinTitle : slide.id === "daniel" ? styles.danielTitle : undefined}
          >
            {slide.title}
          </h2>
          <div className={styles.storyRule} aria-hidden="true" />
          <p>{slide.description}</p>
        </div>

        <div className={styles.controls} role="group" aria-label="Carousel controls">
          <button
            className={styles.arrow}
            type="button"
            aria-label="Previous story"
            onClick={() => setActive((active + slides.length - 1) % slides.length)}
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <div className={styles.pagination} role="group" aria-label="Choose a story">
            {slides.map((item, index) => (
              <button
                key={item.id}
                className={`${styles.paginationButton} ${active === index ? styles.selected : ""}`}
                type="button"
                aria-label={`Show ${item.label.toLowerCase()} story`}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
          <button
            className={styles.arrow}
            type="button"
            aria-label="Next story"
            onClick={() => setActive((active + 1) % slides.length)}
          >
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <span className={styles.controlSpacer} aria-hidden="true" />
          <button
            className={styles.pause}
            type="button"
            disabled={reducedMotion}
            aria-label={
              reducedMotion
                ? "Automatic playback is disabled by reduced motion settings"
                : paused
                  ? "Resume automatic carousel"
                  : "Pause automatic carousel"
            }
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused || reducedMotion ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          </button>
          <span className={styles.pauseLabel}>
            {reducedMotion ? "AUTO OFF" : paused ? "PLAY" : "PAUSE"}
          </span>
        </div>
      </div>
    </section>
  );
}
