import type { RoleQaRole, RoleQaSection } from "@/lib/domain/role-qa-checklist";

export const roleQaContentEn: Record<RoleQaRole, RoleQaSection[]> = {
  student: [
    {
      title: "Account and feed",
      items: [
        { id: "student-register", text: "Register from /auth and complete /onboarding with at least one education area.", href: "/auth" },
        { id: "student-feed", text: "Home feed shows only posts and Sparks from selected areas.", href: "/" },
        { id: "student-follow", text: "Follow verified teachers from feed, Micro or Discover creator rails.", href: "/explore?format=teachers" },
        { id: "student-engage", text: "Like, save and comment on matched posts; comments stay moderated before display.", href: "/" },
        { id: "student-collections", text: "Saved posts appear in /collections Smart Collections.", href: "/collections" },
      ],
    },
    {
      title: "Learning and safety",
      items: [
        { id: "student-micro", text: "Watch a Micro lesson and claim points only after the 60-second gate.", href: "/micro" },
        { id: "student-quiz", text: "Complete a mini quiz and see correct/review explanations.", href: "/learn" },
        { id: "student-duels", text: "Play safe topic duels with no direct messaging.", href: "/duels" },
        { id: "student-progress", text: "See streak, league and level progress on /student.", href: "/student" },
        { id: "student-no-dm", text: "Confirm student direct messaging is not available anywhere." },
      ],
    },
  ],
  parent: [
    {
      title: "Account and supervision",
      items: [
        { id: "parent-register", text: "Register from /auth and complete /onboarding with a shared education area.", href: "/auth" },
        { id: "parent-feed", text: "Parent feed matches selected areas only.", href: "/" },
        { id: "parent-family", text: "Create a child profile from /family.", href: "/family" },
        { id: "parent-areas", text: "Assign child Match-Feed areas from family setup.", href: "/family" },
        { id: "parent-questions", text: "Ask questions in selected areas and read teacher answers.", href: "/questions" },
      ],
    },
    {
      title: "Rewards and approvals",
      items: [
        { id: "parent-rewards", text: "Review reward store items and parent approval guidance.", href: "/rewards" },
        { id: "parent-approve", text: "Confirm child learning actions only from parent-controlled screens.", href: "/parent" },
        { id: "parent-analytics", text: "Parent dashboard stays calm and analytics-focused.", href: "/parent" },
      ],
    },
  ],
  teacher: [
    {
      title: "Verification and areas",
      items: [
        { id: "teacher-register", text: "Register as teacher from /auth.", href: "/auth" },
        { id: "teacher-pending", text: "Teacher stays unverified until platform approval.", href: "/teacher" },
        { id: "teacher-areas", text: "After verification, assigned education areas unlock publishing.", href: "/onboarding" },
        { id: "teacher-self-assign", text: "/api/interests returns 403 for teacher self-assignment." },
      ],
    },
    {
      title: "Creator surfaces",
      items: [
        { id: "teacher-post", text: "Create a post from /create in an assigned area.", href: "/create" },
        { id: "teacher-reel", text: "Create a Micro lesson from /create?mode=micro.", href: "/create?mode=micro" },
        { id: "teacher-story", text: "Create a Spark from /create?mode=spark in an assigned area.", href: "/create?mode=spark" },
        { id: "teacher-answer", text: "Answer questions only in assigned areas.", href: "/questions" },
        { id: "teacher-profile", text: "Public profile grid shows posts and Micro lessons.", href: "/profile" },
      ],
    },
  ],
  admin: [
    {
      title: "Platform control",
      items: [
        { id: "admin-bootstrap", text: "First admin exists in platform_admins.", href: "/setup" },
        { id: "admin-verify", text: "Verify or revoke teacher status from /admin.", href: "/admin" },
        { id: "admin-areas", text: "Assign teacher education areas from /admin.", href: "/admin" },
        { id: "admin-rewards", text: "Manage reward status and stock.", href: "/admin" },
      ],
    },
    {
      title: "Safety and moderation",
      items: [
        { id: "admin-reports", text: "Reports appear in /moderation and detail pages.", href: "/moderation" },
        { id: "admin-queue", text: "Moderation queues separate comments, Spark replies and reports.", href: "/moderation" },
        { id: "admin-audit", text: "Approve/reject actions create moderation_audit_log rows.", href: "/moderation" },
        { id: "admin-rate-limit", text: "Comment and Spark reply spam attempts return rate-limit feedback." },
      ],
    },
  ],
};
