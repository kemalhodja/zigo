export const REGISTRATION_CAMPAIGNS_SESSION_KEY = "zigo:announce-campaigns";
export const REGISTRATION_CAMPAIGNS_SEEN_KEY = "zigo:registration-campaigns-seen";
export const APP_INTRO_SEEN_KEY = "zigo:app-intro-seen";

export function markRegistrationCampaignAnnouncementPending() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(REGISTRATION_CAMPAIGNS_SESSION_KEY, "1");
  } catch {
    // ignore
  }
}

export function markRegistrationCampaignAnnouncementSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REGISTRATION_CAMPAIGNS_SEEN_KEY, "1");
    window.sessionStorage.removeItem(REGISTRATION_CAMPAIGNS_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function shouldShowRegistrationCampaignAnnouncement() {
  if (typeof window === "undefined") return false;

  try {
    if (window.localStorage.getItem(REGISTRATION_CAMPAIGNS_SEEN_KEY) === "1") return false;
    if (window.sessionStorage.getItem(REGISTRATION_CAMPAIGNS_SESSION_KEY) !== "1") return false;
    return window.localStorage.getItem(APP_INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
