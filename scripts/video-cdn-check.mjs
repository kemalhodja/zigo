/* global console, process */
const provider = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE ? "bunny" : process.env.NEXT_PUBLIC_MUX_PLAYBACK_BASE ? "mux" : process.env.NEXT_PUBLIC_VIDEO_CDN_BASE ? "generic" : "supabase";
const price = { supabase: 3.0, bunny: 0.33, mux: 1.32, generic: 0.5 }[provider];
const costTry = Math.round(price * 900);
const savingsTry = Math.round(3.0 * 900 - costTry);
console.log(`Provider: ${provider}`);
console.log(`Est. 900GB/ay cost: ${costTry}₺ (tasarruf ${savingsTry}₺ vs Supabase)`);
if (provider === "supabase") console.warn("WARN Bunny/Mux kapalı - viral'de fatura riski");
else console.log(`PASS CDN aktif: ${provider}`);
