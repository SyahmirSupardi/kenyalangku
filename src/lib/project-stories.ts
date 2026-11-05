export type ProjectStory = {
  role: string;
  introduction: string;
  statement: string;
  titleArtwork?: string;
  previewArtwork?: { src: string; alt: string; fit?: "cover" | "contain" }[];
  pillars: { title: string; text: string }[];
  roadmap: { title: string; text: string; image?: string; alt?: string; position?: string; subtitle?: string; detail?: string; status?: string }[];
};

export const projectStories: Record<string, ProjectStory> = {
  "genesis-roulette": {
    role: "Special initiative",
    introduction: "A different kind of world.",
    statement: "An original experiment where chance and competition meet.",
    pillars: [
      { title: "A distinct identity", text: "A colourful science-fiction setting gives this initiative a visual language of its own." },
      { title: "Chance and choice", text: "The project explores how uncertainty and player decisions might shape a competitive experience." },
      { title: "In development", text: "Its gameplay direction is being explored; the cover art is concept material." },
    ],
    roadmap: [
      { title: "Explore the concept", text: "Define the game's identity and test the ideas behind its competitive direction.", image: "/images/projects/genesis-roulette-cover.png", alt: "Genesis Roulette concept cover art", position: "15% center" },
      { title: "Prototype the experience", text: "Develop early playable experiments and evaluate what works through iteration.", image: "/images/projects/genesis-roulette-cover.png", alt: "Futuristic arena in Genesis Roulette cover art", position: "65% center" },
      { title: "Share the next chapter", text: "Present more of the project when its direction is ready to share.", image: "/images/projects/genesis-roulette-cover.png", alt: "Elemental eggs in Genesis Roulette cover art", position: "50% 70%" },
    ],
  },
  pusaka: {
    role: "Our first proof",
    introduction: "Where tradition meets combat",
    statement: "PUSAKA is an online multiplayer fighting game inspired by Silat, bringing the art of Malaysian martial heritage into a competitive gaming experience.",
    titleArtwork: "/images/projects/pusaka-wordmark.png",
    previewArtwork: [
      { src: "/images/projects/pusaka-icon.png", alt: "PUSAKA game emblem", fit: "contain" },
      { src: "/images/projects/pusaka-environment.png", alt: "A sunlit Malay waterfront settlement with timber homes and a central gathering pavilion" },
      { src: "/images/projects/pusaka-early-poster.png", alt: "Early PUSAKA poster featuring two characters and a Malay waterfront setting" },
    ],
    pillars: [
      { title: "Silat at its heart", text: "Malaysian martial heritage shapes the movement, rhythm, and identity of the game." },
      { title: "Deliberate combat", text: "A combat direction built around tactical footwork, precise timing, and meaningful player choices." },
      { title: "Players together", text: "Designed as an online multiplayer fighting game, where each encounter is a contest between players." },
      { title: "A living heritage", text: "An invitation to discover the culture carried through movement, setting, and visual storytelling." },
    ],
    roadmap: [
      { title: "The First Spark", subtitle: "Concept & Pre-Production", status: "COMPLETE", text: "Every journey starts somewhere. PUSAKA began with brainstorming, exploring ideas, and shaping the concept of a fighting game inspired by Malaysian Silat.", detail: "This early stage established the game's creative direction, core gameplay ideas, visual identity, and the foundation of its Game Design Document.", image: "/images/projects/pusaka-progress-01.png", alt: "Pulau Seri Tanjung early arena layout and level design study", position: "center" },
      { title: "Bringing the Concept to Life", subtitle: "Greyboxing & Early Prototyping", status: "IN PROGRESS", text: "With the initial direction established, development moves into Unreal Engine. This stage focuses on greyboxing the environment, building two early-stage characters, and introducing basic animations.", detail: "These first building blocks help establish the game's scale, movement, and visual presentation before more complex combat systems are developed.", image: "/images/projects/pusaka-progress-02.gif", alt: "Looping capture of PUSAKA greyboxing and early prototyping" },
      { title: "The First Playable Experience", subtitle: "Arena Polish & Internal Playtesting", status: "PLANNED", text: "The next milestone is to bring one compact arena to a polished, playable state, supported by the essential character movement and combat interactions.", detail: "Internal playtesting will help evaluate gameplay responsiveness, movement, combat readability, and the overall experience. Feedback from these tests will guide further improvements before development expands.", image: "/images/projects/pusaka-progress-03.gif", alt: "Looping PUSAKA development progress capture" },
      { title: "The Next Chapter", subtitle: "Future Development", status: "UPCOMING", text: "What comes next will be shaped by the results of internal testing and the progress of the core gameplay systems.", detail: "Further development milestones will be announced as PUSAKA continues to take shape." },
    ],
  },
  "myth-tanah": {
    role: "Our flagship world",
    introduction: "The land remembers.",
    statement: "A world of myth. A journey into the imagination of home.",
    pillars: [
      { title: "Myth & imagination", text: "Malaysian-inspired mythology becomes a starting point for an original fantasy world." },
      { title: "A world to discover", text: "Mysterious landscapes and places with a sense of history invite curiosity through exploration." },
      { title: "Characters with roots", text: "Early character work includes Aras, part of the developing identity of MYTH: TANAH." },
      { title: "Stories in the land", text: "Environmental storytelling connects the world’s landscapes, encounters, and imagination." },
    ],
    roadmap: [
      { title: "Imagine the world", text: "Explore the mythology, landscapes, and visual language that give MYTH: TANAH its own identity.", image: "/night-walk/assets/projects/myth-tanah-wallpaper.png", alt: "Mythical tiger and flooded settlement in MYTH: TANAH concept artwork", position: "50% 37%" },
      { title: "Shape the journey", text: "Develop characters such as Aras and explore how worldbuilding, encounters, and environmental stories connect through play.", image: "/night-walk/assets/myth-tanah.webp", alt: "Early character concept for MYTH: TANAH", position: "72% center" },
      { title: "Bring the world to life", text: "Build and refine playable experiences, sharing future glimpses of the world as development progresses.", image: "/night-walk/assets/projects/myth-tanah-wallpaper.png", alt: "Aras facing a mythical tiger in the mist", position: "50% 65%" },
    ],
  },
};
