"use client";

import Link from "next/link";
import type { KeyboardEvent } from "react";

function openWithSpace(event: KeyboardEvent<HTMLAnchorElement>) {
  if (event.key === " " || event.key === "Spacebar" || event.code === "Space") {
    event.preventDefault();
    window.location.assign("/ideas");
  }
}

export function IdeaNotesStack() {
  return (
    <div className="idea-supplied-stack" aria-label="两张手写便利贴">
      <Link
        href="/ideas"
        className="idea-supplied-note idea-supplied-note-a"
        aria-label="轻轻抬起第一张便利贴，查看奇思妙想"
        onKeyDown={openWithSpace}
      />
      <Link
        href="/ideas"
        className="idea-supplied-note idea-supplied-note-b"
        aria-label="轻轻翻动火箭便利贴，查看奇思妙想"
        onKeyDown={openWithSpace}
      />
    </div>
  );
}
