/**
 * Ad Integration Example
 * 
 * This file demonstrates how to integrate the ad gate system
 * into existing components like create-mode-composer or social-create-form.
 */

"use client";

import { AdGateButton } from "./ad-gate-button";

// Example 1: Integrating with a "Share Reel" button
export function ShareReelButtonExample({ userId, onShare }: { userId: string; onShare: () => void }) {
  return (
    <AdGateButton
      userId={userId}
      onClick={onShare}
      actionName="Reel Paylaş"
      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
    >
      <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
      </svg>
      Reels Paylaş
    </AdGateButton>
  );
}

// Example 2: Integrating with a "Create Post" button
export function CreatePostButtonExample({ userId, onCreatePost }: { userId: string; onCreatePost: () => void }) {
  return (
    <AdGateButton
      userId={userId}
      onClick={onCreatePost}
      actionName="Akış Gönderisi Oluştur"
      className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all"
    >
      <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      Akış Gönderisi Oluştur
    </AdGateButton>
  );
}

// Example 3: Using in create-mode-composer.tsx
// Replace your existing button with:
/*
import { AdGateButton } from "@/components/ad-gate-button";

// Inside your component:
<AdGateButton
  userId={user.id}
  onClick={handleSubmit}
  actionName="Gönderi Paylaş"
  className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-all"
>
  Paylaş
</AdGateButton>
*/

// Example 4: Using in social-create-form.tsx
// Replace your existing submit button with:
/*
import { AdGateButton } from "@/components/ad-gate-button";

// Inside your component:
<AdGateButton
  userId={user.id}
  onClick={handleCreatePost}
  actionName="Gönderi Oluştur"
  className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all"
>
  Gönderi Oluştur
</AdGateButton>
*/

// Example 5: Manual ad state check (without button wrapper)
export function ManualAdStateCheckExample({ userId }: { userId: string }) {
  // This is how you can manually check ad state anywhere
  const checkIfUserCanPost = async () => {
    try {
      const response = await fetch(`/api/ads/gate?userId=${userId}`);
      const data = await response.json();
      
      if (data.canProceed) {
        // User can post
        console.log("User can post!");
      } else {
        // Show ad gate modal
        console.log("User needs to watch ad first");
      }
    } catch (error) {
      console.error("Failed to check ad gate:", error);
    }
  };

  return (
    <button onClick={checkIfUserCanPost}>
      Check Ad State
    </button>
  );
}