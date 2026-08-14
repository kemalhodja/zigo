import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: follows } = await supabase.from("follows").select("follower_id, following_id").limit(5);
  console.log("Some follows rows:", follows);

  if (!follows || follows.length === 0) {
     console.log("No follows in the database at all!");
     return;
  }
  
  const viewerId = follows[0].follower_id;
  const followingId = follows[0].following_id;
  console.log("Testing with follower_id:", viewerId, "who follows", followingId);

  const { data: userFollows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId);

  const followingIds = (userFollows ?? []).map((f) => f.following_id);
  const authorIds = [...new Set([...followingIds, viewerId])];

  console.log("Author IDs:", authorIds);

  const { data, error } = await supabase
    .from("social_posts")
    .select(
      `
      *,
      author:users!author_id (
        id,
        full_name
      )
    `
    )
    .in("author_id", authorIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Social posts error:", error);
    return;
  }
  
  console.log("Posts count:", data?.length);
  if (data && data.length > 0) {
      console.log("First post author ID:", data[0].author_id, "Is it the followed one?", followingIds.includes(data[0].author_id));
      
      // Let's check how many posts are from the viewer vs followed users
      const viewerPosts = data.filter(p => p.author_id === viewerId).length;
      const followingPostsCount = data.filter(p => followingIds.includes(p.author_id)).length;
      console.log("Out of", data.length, "posts:", viewerPosts, "are mine,", followingPostsCount, "are from followed users.");
  }
}

run();
