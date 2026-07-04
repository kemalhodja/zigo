# Zigo Software Blueprint

## 1. Product Definition

**Project name:** Zigo  
**Global slogan:** The Smart, Verified, and Gamified Social Feed for Education.  
**Concept:** Verified education media that turns social feed habits into learning habits.

Zigo combines the verified professional trust of LinkedIn, the question-answer depth of Quora, the gamified habit loop of daily micro learning, and the short-form content mechanics of TikTok.

## 2. Platform And Stack

**Primary platform:** Mobile-first web app / PWA  
**Frontend default:** React or Next.js  
**Backend default:** Supabase first; Node.js/Express can be used when custom backend logic becomes necessary  
**Database:** PostgreSQL  
**Authorization default:** PostgreSQL Row Level Security when using Supabase

## 3. Core Roles

### Teacher

- Verified education content creator.
- Can publish posts only when `is_verified = true`.
- Can publish only in education areas assigned through `user_interests`.
- Can answer questions in assigned education areas.

### Parent

- Supervisory and analytics user.
- Can select education areas.
- Can view matched posts, child progress, learning time, teacher answers, and reward approvals.
- Can ask questions.
- Cannot publish posts.

### Student

- Gamified learner profile.
- Can select education areas.
- Can view matched posts, watch micro learning videos, solve quizzes, join duels, earn Zigo Crystals, and customize an avatar.
- Can ask questions.
- Cannot publish posts.
- Cannot send direct messages.

## 4. Match-Feed Rule

The feed is driven by one invariant:

> A post appears in a user's feed only when `posts.area_id` exists in that user's `user_interests`.

This rule reduces information noise and prevents unrelated education content from entering the feed.

Example Supabase query:

```ts
export async function getPersonalizedFeed(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      media_url,
      area_id,
      created_at,
      users:teacher_id (
        full_name,
        is_verified
      )
    `)
    .in(
      "area_id",
      supabase.from("user_interests").select("area_id").eq("user_id", userId),
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
```

## 5. Gamification

Students earn points through verified learning actions:

- Watched verified micro lesson: `+10`
- Completed mini quiz: `+10`
- Won duel: configurable reward

Points are stored in `users.total_points`. Avatar state is stored in `users.avatar_assets`.

The avatar store can unlock:

- Digital items such as hats, suits, capes, pets, and frames.
- Parent-approved real-world rewards such as book coupons.

## 6. Safety Rules

- Do not implement student-to-student direct messaging.
- Comments and open text must pass moderation before being shown to children.
- Use a profanity and cyberbullying filter before storing or rendering student-visible text.
- Permission checks must exist in the database or backend, not only in UI components.

## 7. Initial Build Order

1. Create PostgreSQL schema and Row Level Security policies.
2. Add Supabase client and typed database access helpers.
3. Implement authentication and role-aware profile loading.
4. Implement Match-Feed read path.
5. Implement teacher post creation with verified teacher checks.
6. Implement question and answer flows.
7. Implement student points and avatar customization.
8. Add parent analytics and reward approval flows.
