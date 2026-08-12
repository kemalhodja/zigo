import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://fuqnjxcoxopomzgbifve.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc("list_explore_social_posts", { p_limit: 5 });
  console.log("Error:", error);
  console.log("Is Array?", Array.isArray(data));
  if (Array.isArray(data)) console.log("Length:", data.length);
  console.log("Data:", JSON.stringify(data, null, 2).slice(0, 500));
}
run().catch(console.error);
