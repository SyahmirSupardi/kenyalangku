import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUpRight, Compass, MoveUpRight, Sparkles, Users } from "lucide-react";
import { projects } from "@/src/lib/content";
import { projectStories } from "@/src/lib/project-stories";
import styles from "./project.module.css";
export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  return {
    title: project?.title ?? "Project not found",
    description: project?.description,
  };
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  const story = projectStories[slug];
  const next = projects[(projects.findIndex(p => p.slug === slug) + 1) % projects.length];
  const icons = [Compass, MoveUpRight, Users, Sparkles];
  const fullStory = slug === "pusaka" || slug === "genesis-roulette";
  return (
    <main id="main" className={`${styles.page} ${slug === "pusaka" || story.wideProgressImages ? styles.pusakaPage : ""}`}>
      <section className={styles.hero} aria-labelledby="project-title">
        <Image className={styles.heroImage} src={project.image} alt={project.imageAlt} fill loading="eager" fetchPriority="high" sizes="(max-width: 760px) 1320px, 100vw" />
        <div className={styles.heroShade} />
        <div className={styles.heroInner}>
          <div className={styles.heroNav}>
            <Link href="/projects"><ArrowLeft size={16} /> All projects</Link>
            <nav aria-label="Project chapters"><a href="#story">The story</a><a href="#roadmap">Roadmap</a><a href="#connect">Connect <ArrowUpRight size={14} /></a></nav>
          </div>
          <div className={styles.heroTitle}>
            {!story.hideEyebrow && <p className={styles.eyebrow}>{project.collection.toUpperCase()} / {project.number}</p>}
            <h1 id="project-title" className={story.titleArtwork ? styles.logoTitle : slug === "myth-tanah" ? styles.longTitle : undefined}>
              {story.titleArtwork ? <Image className={styles.logoTitleImage} src={story.titleArtwork} alt={project.title} width={story.titleArtworkSize?.[0] ?? 1774} height={story.titleArtworkSize?.[1] ?? 887} sizes="(max-width: 760px) 84vw, 520px" priority /> : project.title}
            </h1>
            {!story.hideSubtitle && <p className={styles.subtitle}>{project.subtitle}</p>}
          </div>
          <div className={styles.heroBottom}>
            <div className={styles.previewCards}>
              {story.roadmap.slice(0, 3).map((item, i) => (
                <a href={i === 0 ? "#story" : i === 1 ? "#roadmap" : "#experience"} className={`${styles.previewCard} ${slug === "pusaka" && i === 0 ? styles.pusakaIconCard : ""} ${slug === "genesis-roulette" && i === 0 ? styles.genesisIconCard : ""}`} key={item.title}>
                  <Image src={story.previewArtwork?.[i]?.src ?? item.image ?? project.image} alt={story.previewArtwork?.[i]?.alt ?? item.alt ?? ""} fill sizes="320px" style={{ objectPosition: item.position, objectFit: story.previewArtwork?.[i]?.fit ?? "cover" }} />
                  <span>0{i + 1}<br /><b>{["The story", "The journey", "The experience"][i]}</b></span>
                  <ArrowUpRight size={15} />
                </a>
              ))}
            </div>
            <a className={styles.discover} href="#story">Step into the world <ArrowDown size={18} /></a>
          </div>
        </div>
        <p className={styles.artNote}>{slug === "genesis-roulette" ? "KEY ART · CLOSED ALPHA" : "CONCEPT ARTWORK · IN DEVELOPMENT"}</p>
      </section>

      <div className={styles.editorial}>
        <section id="story" className={styles.story} aria-labelledby="story-title">
          <div className={styles.sectionHead}><span>01 / THE STORY</span><h2 id="story-title">{story.introduction}</h2></div>
          <div className={styles.storyGrid}>
            <aside className={styles.facts}>
              <p className={styles.eyebrow}>{story.role}</p>
              <dl><div><dt>Genre</dt><dd>{project.details.slice(0, 2).join(" / ")}</dd></div><div><dt>Status</dt><dd><i />{project.status}</dd></div>{story.platforms && <div><dt>Platform</dt><dd className={styles.platformIcons}>{story.platforms.map(pl => <span key={pl.label} title={pl.label}><Image src={pl.icon} alt={pl.label} width={23} height={23} /></span>)}</dd></div>}<div><dt>Origin</dt><dd>Malaysia</dd></div></dl>
              <a href="#roadmap" className={styles.textLink}>Follow the journey <ArrowDown size={16} /></a>
            </aside>
            <div className={styles.prose}><p className={fullStory ? styles.pusakaLead : styles.lead}>{story.statement}</p>{(fullStory ? project.paragraphs.slice(1) : project.paragraphs.slice(0, 2)).map(p => <p key={p}>{p}</p>)}</div>
          </div>
        </section>

        <section id="roadmap" className={styles.roadmap} aria-labelledby="roadmap-title">
          <div className={styles.sectionHead}><span>02 / THE JOURNEY</span><h2 id="roadmap-title">A world in the making.</h2></div>
          <div className={styles.roadmapGrid}>
            <div className={styles.roadmapIntro}>
              <p className={styles.eyebrow}>DEVELOPMENT ROADMAP</p>
              <h3>From the first idea<br />to the hands of players.</h3>
              <p>Each world takes time, curiosity, and careful iteration. This is the direction ahead for {project.title}.</p>
              <p className={styles.planningNote}>{fullStory ? "Current progress and planned direction. Release dates have not been announced." : "A proposed development sequence. Milestones and release dates have not been announced."}</p>
              <Link className={styles.textLink} href="/collaboration">Connect about this project <ArrowUpRight size={16} /></Link>
            </div>
            <ol className={styles.timeline}>
              {story.roadmap.map((stage, i) => (
                <li key={stage.title}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <div className={styles.stageCopy}><p className={styles.stageLabel}>PHASE 0{i + 1} <span>{stage.status ?? "PLANNED DIRECTION"}</span></p><h3>{stage.title}</h3>{stage.subtitle && <p className={styles.stageSubtitle}>{stage.subtitle}</p>}<p>{stage.text}</p>{stage.detail && <p>{stage.detail}</p>}</div>
                  {stage.image && <figure className={`${styles.stageImage} ${stage.frameless ? styles.frameless : ""}`} style={stage.ratio ? { aspectRatio: stage.ratio } : undefined}><Image src={stage.image} alt={stage.alt ?? ""} fill sizes="(max-width: 760px) 88vw, 520px" unoptimized={stage.image.endsWith(".gif")} style={{ objectPosition: stage.position }} />{!story.hideImageCaptions && <figcaption>0{i + 1} / {stage.caption ?? "DEVELOPMENT PROGRESS"}</figcaption>}</figure>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="experience" className={styles.experience} aria-labelledby="experience-title">
          <div className={styles.sectionHead}><span>03 / THE EXPERIENCE</span><h2 id="experience-title">What shapes this world.</h2></div>
          <div className={styles.pillars}>{story.pillars.map((pillar, i) => {
            const Icon = icons[i];
            return <article key={pillar.title}><div><Icon size={24} strokeWidth={1.2} /><span>0{i + 1}</span></div><h3>{pillar.title}</h3><p>{pillar.text}</p></article>;
          })}</div>
          <p className={styles.developmentNote}>The projects and artwork shown are in development. Gameplay, supported platforms, and release plans will be shared as they take shape.</p>
        </section>
      </div>

      <section id="connect" className={styles.closing} aria-labelledby="connect-title">
        <Image src={project.image} alt="" fill sizes="(max-width: 760px) 900px, 100vw" />
        <div className={styles.closingShade} />
        {slug === "genesis-roulette" ? <div className={styles.closingContent}><p className={styles.eyebrow}>CLOSED ALPHA · LIMITED SLOTS</p><h2 id="connect-title">Play the closed<br />alpha first.</h2><p>Claim one of the limited tester slots for Android or Windows. Your redeem code arrives by email and unlocks the download.</p><div className={styles.closingActions}><Link href="/projects/genesis-roulette/claim" className={styles.contactButton}>Claim your alpha slot <ArrowUpRight size={18} /></Link><Link href="/projects/genesis-roulette/download" className={styles.textLink}>Already have a code? Download <ArrowUpRight size={16} /></Link></div></div> : <div className={styles.closingContent}><p className={styles.eyebrow}>BE PART OF THE NEXT CHAPTER</p><h2 id="connect-title">Every world begins<br />with a conversation.</h2><p>Creators, cultural voices, publishers, and potential investors — let’s talk about {project.title}.</p><Link href="/contact" className={styles.contactButton}>Talk about this project <ArrowUpRight size={18} /></Link></div>}
      </section>
      <div className={styles.nextProject}><Link href="/projects"><ArrowLeft size={17} /> Back to all projects</Link><Link href={`/projects/${next.slug}`}><span>EXPLORE ANOTHER PROJECT</span><b>{next.title} <ArrowUpRight size={22} /></b></Link></div>
    </main>
  );
}
