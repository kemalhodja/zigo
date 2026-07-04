import type { Messages } from "./types";

type DemoPostBase = {
  postId: undefined;
  authorId: undefined;
  verified: true;
  mediaUrl: null;
  isLiked: false;
  isSaved: false;
  isFollowingCreator: false;
  canFollowCreator: false;
};

export function buildDemoPosts(d: Messages["demo"]) {
  const base: DemoPostBase = {
    postId: undefined,
    authorId: undefined,
    verified: true,
    mediaUrl: null,
    isLiked: false,
    isSaved: false,
    isFollowingCreator: false,
    canFollowCreator: false,
  };

  return [
    {
      ...base,
      authorName: "Aylin Kaya",
      handle: "aylinmath",
      caption: d.post1Caption,
      gradient: "from-violet-600 via-fuchsia-500 to-rose-400",
      likes: 12482,
      comments: 348,
      badge: d.badgePost,
      area: d.areaMath,
      mediaType: "image" as const,
      scene: "math" as const,
    },
    {
      ...base,
      authorName: "Mert Demir",
      handle: "sciencewithmert",
      caption: d.post2Caption,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      likes: 8904,
      comments: 121,
      badge: d.badgeMicro,
      area: d.areaScience,
      mediaType: "image" as const,
      scene: "science" as const,
    },
    {
      ...base,
      authorName: "Elif Yıldız",
      handle: "englishwithelif",
      caption: d.post3Caption,
      gradient: "from-sky-500 via-indigo-500 to-violet-600",
      likes: 6438,
      comments: 92,
      badge: d.badgeLanguage,
      area: d.areaEnglish,
      mediaType: "image" as const,
      scene: "english" as const,
    },
    {
      ...base,
      authorName: d.codingClub,
      handle: "codeclub",
      caption: d.post4Caption,
      gradient: "from-amber-400 via-orange-500 to-rose-500",
      likes: 7211,
      comments: 158,
      badge: d.badgeCoding,
      area: d.areaCoding,
      mediaType: "video" as const,
      scene: "coding" as const,
    },
  ];
}

export function buildDemoSuggestedCreators(d: Messages["demo"]) {
  return [
    { name: "Aylin Kaya", handle: "aylinmath", area: d.areaMath, href: "/explore?q=Matematik", isFollowing: false },
    { name: "Mert Demir", handle: "sciencewithmert", area: d.areaScience, href: "/explore?q=Fen", isFollowing: false },
    { name: d.codingClub, handle: "codingclub", area: d.areaCoding, href: "/explore?q=Kodlama", isFollowing: false },
    { name: "Elif Yıldız", handle: "englishwithelif", area: d.areaEnglish, href: "/explore?q=İngilizce", isFollowing: false },
  ];
}

export function buildDemoDuels(d: Messages["duelsPage"]) {
  return [
    { id: "00000000-0000-4000-8000-000000000601", areaId: 1, accent: "from-crystal to-berry", reward: "+25", title: d.fractionSprint, topic: d.topicMath },
    { id: "00000000-0000-4000-8000-000000000602", areaId: 2, accent: "from-aqua to-mint", reward: "+25", title: d.scienceRace, topic: d.topicScience },
    { id: "00000000-0000-4000-8000-000000000603", areaId: 3, accent: "from-sun to-peach", reward: "+25", title: d.codeClash, topic: d.topicCoding },
  ] as const;
}

export function buildDemoLessons(d: Messages["demo"]) {
  return [
    { title: d.lessonFractions, area: d.areaMath, reward: "+10", color: "from-crystal to-fuchsia-500" },
    { title: d.lessonPlants, area: d.areaScience, reward: "+10", color: "from-emerald-500 to-teal-500" },
    { title: d.lessonLoop, area: d.areaCoding, reward: "+25", color: "from-amber-400 to-orange-500" },
  ];
}

export function buildDemoTrendingTopics(d: Messages["demo"], navAsk: string) {
  return [
    { href: "/explore?q=Kesir", label: d.topicFractions, meta: d.metaMicro12 },
    { href: "/explore?q=Fen", label: d.areaScience, meta: d.metaPosts8 },
    { href: "/explore?q=Kodlama", label: d.areaCoding, meta: d.metaDuels5 },
    { href: "/questions", label: navAsk, meta: d.metaQa },
  ];
}
