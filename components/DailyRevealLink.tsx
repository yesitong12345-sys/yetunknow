"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

export function DailyRevealLink({ mode = "desktop" }: { mode?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const lastPointer = useRef("mouse");
  const revealOnClick = useRef(false);

  function rememberPointer(event: PointerEvent<HTMLAnchorElement>) {
    lastPointer.current = event.pointerType;
    revealOnClick.current = event.pointerType !== "mouse" && !open;
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (lastPointer.current !== "mouse" && revealOnClick.current) {
      event.preventDefault();
      setOpen(true);
    }
    revealOnClick.current = false;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      window.location.assign("/daily");
    }
  }

  return (
    <Link
      href="/daily"
      className={`daily-reveal-link daily-reveal-${mode}${open ? " is-open" : ""}`}
      aria-label="日常记录：悬停或第一次轻触翻开手账，进入可阅读记录"
      onPointerDown={rememberPointer}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setOpen(true); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setOpen(false); }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="daily-closed-asset" aria-hidden="true" />
      <span className="daily-open-asset" aria-hidden="true" />
      <span className="daily-notice">
        <small>日常记录</small>
        <strong>碰一下，翻开看看</strong>
        <b aria-hidden="true">↗</b>
      </span>
    </Link>
  );
}
