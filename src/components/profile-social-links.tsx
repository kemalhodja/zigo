"use client";

type ProfileSocialLinksProps = {
  bio?: string | null;
  websiteUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
};

export function ProfileSocialLinks({ bio, websiteUrl, youtubeUrl, instagramUrl }: ProfileSocialLinksProps) {
  if (!bio && !websiteUrl && !youtubeUrl && !instagramUrl) return null;

  const urlMatches = bio ? bio.match(/https?:\/\/[^\s]+/g) : null;
  const validLinks = new Set<string>();
  
  if (urlMatches) {
    urlMatches.forEach(u => validLinks.add(u));
  }
  
  if (websiteUrl) {
    validLinks.add(websiteUrl);
  }
  if (youtubeUrl) {
    validLinks.add(youtubeUrl);
  }
  if (instagramUrl) {
    validLinks.add(instagramUrl);
  }

  if (validLinks.size === 0) return null;

  const links = Array.from(validLinks).map((url) => {
    const cleanUrl = url.trim();
    let label = "Web Sitesi";
    let icon = "globe";
    let badgeClass = "bg-slate-100 text-slate-800 hover:bg-slate-200";

    if (/youtube\.com|youtu\.be/i.test(cleanUrl)) {
      label = "YouTube Kanalı";
      icon = "youtube";
      badgeClass = "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100";
    } else if (/instagram\.com/i.test(cleanUrl)) {
      label = "Instagram";
      icon = "instagram";
      badgeClass = "bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100";
    } else if (/linkedin\.com/i.test(cleanUrl)) {
      label = "LinkedIn";
      icon = "linkedin";
      badgeClass = "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100";
    } else if (/t\.me|telegram\.org/i.test(cleanUrl)) {
      label = "Telegram Kanalı";
      icon = "telegram";
      badgeClass = "bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100";
    } else if (/wa\.me|whatsapp\.com/i.test(cleanUrl)) {
      label = "WhatsApp";
      icon = "whatsapp";
      badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100";
    }

    return { url: cleanUrl, label, icon, badgeClass };
  });

  return (
    <div className="mt-3.5 space-y-1.5">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-400">Özel Sayfalar & Bağlantılar</p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            className={`tap-scale inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${link.badgeClass}`}
            href={link.url}
            key={link.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <SocialLinkIcon icon={link.icon} />
            <span>{link.label}</span>
            <svg aria-hidden="true" className="size-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

function SocialLinkIcon({ icon }: { icon: string }) {
  if (icon === "youtube") {
    return (
      <svg aria-hidden="true" className="size-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  if (icon === "instagram") {
    return (
      <svg aria-hidden="true" className="size-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="20" rx="5" width="20" x="2" y="2" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
