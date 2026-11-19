export type ProjectStory = {
  role: string;
  introduction: string;
  statement: string;
  titleArtwork?: string;
  titleArtworkSize?: [number, number];
  hideEyebrow?: boolean;
  hideSubtitle?: boolean;
  wideProgressImages?: boolean;
  previewArtwork?: { src: string; alt: string; fit?: "cover" | "contain" }[];
  platforms?: { icon: string; label: string }[];
  pillars: { title: string; text: string }[];
  roadmap: { title: string; text: string; image?: string; alt?: string; position?: string; subtitle?: string; detail?: string; status?: string; caption?: string; ratio?: string; frameless?: boolean }[];
};

export const projectStories: Record<string, ProjectStory> = {
  "genesis-roulette": {
    role: "Now in closed alpha",
    introduction: "Where chance meets the mind game",
    statement: "Genesis Roulette is a mobile tactical duel game that combines a roulette of chance, hidden team building and simultaneous mind-game picks, and settles ties with a physical tapping duel.",
    titleArtwork: "/images/projects/genesis-roulette-wordmark.png",
    titleArtworkSize: [2041, 771],
    hideEyebrow: true,
    hideSubtitle: true,
    wideProgressImages: true,
    platforms: [
      { icon: "/images/projects/platform-android.svg", label: "Android" },
      { icon: "/images/projects/platform-ios.svg", label: "iOS" },
    ],
    previewArtwork: [
      { src: "/images/projects/genesis-roulette-icon.png", alt: "Genesis Roulette emblem", fit: "contain" },
      { src: "/images/projects/genesis-roulette-key-art.png", alt: "The Genesis Roulette emblem glowing above a sky-city arena with floating islands and waterfalls" },
      { src: "/images/projects/genesis-roulette-elemental-clash.png", alt: "A fire lion and a water creature clash with elemental beams in the arena" },
    ],
    pillars: [
      { title: "Readable risk", text: "The remaining Life and Death bullets and the next-shot Life chance are always on screen. The order is never shown, so every shot is a risk you can read." },
      { title: "Fair mind games", text: "Element lineups stay private until both sides lock in, and fighters are revealed together. Victory comes from out-reading your rival, never from hidden knowledge." },
      { title: "Skill decides ties", text: "When two fighters share an element, a 10-second Button Smash settles it. Your nerve and your thumbs decide who survives." },
      { title: "A world with stakes", text: "Neptune, 3100. As The Ending draws closer, rival scientists settle real disputes at the Bench, and your hero starts at the very bottom." },
    ],
    roadmap: [
      { title: "The First Roll", subtitle: "Concept & First Prototype", status: "COMPLETE", text: "Genesis Roulette began as a duel built on chance: a row of identical eggs, a hidden deck of Life and Death bullets, and an element cycle of Fire, Water and Nature.", detail: "This stage shaped the core rules and design pillars that the game is built on.", image: "/images/projects/genesis-roulette-progress-01.png", alt: "Genesis Roulette gameplay on a phone: a roulette turn against The Warden, with the egg table, the shared Life and Death pool and perks", ratio: "1278 / 633", frameless: true },
      { title: "Rebuilt for Mobile", subtitle: "Unity Production & Core Systems", status: "COMPLETE", text: "The game moved to Unity and was rebuilt for Android phones in landscape. The rules, opponents, saving, a 4-chapter Story and a 10-level Arcade ladder are in place.", detail: "Button Smash, the Esports Coliseum with its drones, six element monsters, the main menu, player profile, missions and online private rooms were added along the way.", image: "/images/projects/genesis-roulette-progress-02.gif", alt: "Looping capture of Genesis Roulette gameplay: roulette turns, element assignment and a Button Smash", ratio: "480 / 238", frameless: true },
      { title: "Into Testers’ Hands", subtitle: "Closed Alpha & Internal Game Testing", status: "IN PROGRESS", text: "The closed alpha is now being tested on Android by invited testers with access codes. Players can take on the Story, the Arcade ladder and online matches against a friend.", detail: "Testing focuses on match feel, balance, stability and performance on phones. A tester should be able to finish a full Story run, a full Arcade run and an online match without a crash.", image: "/images/projects/genesis-roulette-progress-03.png", alt: "Genesis Roulette tester access screen asking for an access code", ratio: "1280 / 580" },
      { title: "The Next Chapter", subtitle: "Future Development", status: "UPCOMING", text: "What comes next will be shaped by the results of closed alpha testing.", detail: "Areas being explored include public matchmaking, more opponent artwork and the story scenes of the Circuit. Further milestones will be announced as Genesis Roulette takes shape." },
    ],
  },
  pusaka: {
    role: "Our first proof",
    introduction: "Where tradition meets combat",
    statement: "PUSAKA is an online multiplayer fighting game inspired by Silat, bringing the art of Malaysian martial heritage into a competitive gaming experience.",
    titleArtwork: "/images/projects/pusaka-wordmark.png",
    platforms: [
      { icon: "/images/projects/platform-windows.svg", label: "Windows PC (planned)" },
      { icon: "/images/projects/platform-steam.svg", label: "Steam (planned)" },
    ],
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
