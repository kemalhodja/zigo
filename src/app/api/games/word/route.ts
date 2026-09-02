import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// In-memory cache for the dictionary to avoid reading from disk on every request
let cachedDictionary: Record<string, { word: string; meaning: string }[]> | null = null;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "TR";
    const levelStr = searchParams.get("level") || "1";
    let level = parseInt(levelStr, 10);
    
    const isDaily = searchParams.get("daily") === "true";
    
    // Fallback for EN since we only have TR full dictionary
    if (lang === "EN") {
      // In a real app we'd fetch EN dictionary from db, but let's just return a generic for now or read from the old dict.
      // We will handle EN fallback in the client.
      return NextResponse.json({ error: "Only TR is supported via API" }, { status: 400 });
    }

    if (!cachedDictionary) {
      const dataPath = path.join(process.cwd(), "data", "tdk-full-dictionary.json");
      const fileData = fs.readFileSync(dataPath, "utf8");
      cachedDictionary = JSON.parse(fileData);
    }

    let wordLen = 4;
    if (isDaily) {
      wordLen = 5;
    } else {
      if (level >= 3 && level <= 5) wordLen = 5;
      if (level >= 6 && level <= 10) wordLen = 6;
      if (level >= 11 && level <= 15) wordLen = 7;
      if (level >= 16 && level <= 20) wordLen = 8;
      if (level >= 21) wordLen = 9;
    }

    const lenStr = wordLen.toString();
    const wordList = cachedDictionary?.[lenStr];

    if (!wordList || wordList.length === 0) {
      return NextResponse.json({ error: "No words found for this length" }, { status: 404 });
    }

    if (isDaily) {
      // Turkey Time (UTC+3) deterministic day string YYYY-MM-DD
      const now = new Date();
      const trTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const dateKey = trTime.toISOString().split("T")[0]; // e.g. "2026-09-03"
      
      let hash = 0;
      for (let i = 0; i < dateKey.length; i++) {
        hash = (hash << 5) - hash + dateKey.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      const positiveHash = Math.abs(hash);
      const dailyWord = wordList[positiveHash % wordList.length];
      return NextResponse.json({ ...dailyWord, dateKey, isDaily: true });
    }

    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];

    return NextResponse.json(randomWord);

  } catch (error) {
    console.error("Error fetching dictionary word:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
