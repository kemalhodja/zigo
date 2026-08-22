"use client";

import React from "react";

export function ActionIcon({ filled = false, name }: { filled?: boolean; name: string }) {
  if (name === "like") {
    return (
      <svg aria-hidden="true" className="size-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    );
  }

  if (name === "comment") {
    return (
      <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.5 9.5 0 0 1-4-.9L3 20l1.3-4A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    );
  }

  if (name === "repost") {
    return (
      <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-4 4m0 0l-4-4m4 4V7a2 2 0 00-2-2H5m0 0l4-4m-4 4l4 4" />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg aria-hidden="true" className="size-6 -rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    );
  }

  if (name === "share") {
    return (
      <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  );
}
