"use client";

import type { PointerEvent, ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { cn } from "@/lib/utils";

const spring = {
  stiffness: 260,
  damping: 20,
  mass: 0.55,
};

export function WindLiftCard({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const sheenX = useMotionValue("50%");
  const sheenY = useMotionValue("50%");

  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);
  const rotateX = useSpring(rawRotateX, spring);
  const rotateY = useSpring(rawRotateY, spring);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX} ${sheenY}, rgb(255 255 255 / 0.42), transparent 48%)`;

  const settle = () => {
    rawX.set(0);
    rawY.set(0);
    rawRotateX.set(0);
    rawRotateY.set(0);
    sheenX.set("50%");
    sheenY.set("50%");
  };

  const lift = () => {
    if (!reduceMotion) {
      rawY.set(-9);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reduceMotion || event.pointerType === "touch") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const localX = (event.clientX - rect.left) / rect.width;
    const localY = (event.clientY - rect.top) / rect.height;
    const horizontal = (localX - 0.5) * 2;
    const vertical = (localY - 0.5) * 2;

    rawX.set(horizontal * 7);
    rawY.set(-10 - Math.abs(horizontal) * 2);
    rawRotateX.set(vertical * -9);
    rawRotateY.set(horizontal * 11);
    sheenX.set(`${Math.round(localX * 100)}%`);
    sheenY.set(`${Math.round(localY * 100)}%`);
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      onPointerEnter={lift}
      onPointerMove={handlePointerMove}
      onPointerLeave={settle}
      onFocus={lift}
      onBlur={settle}
      style={{
        x,
        y,
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-black/12 bg-[#d8d3c8] p-4 shadow-[0_8px_18px_rgb(45_39_30/0.08)] transition-[border-color,box-shadow] duration-150 hover:border-black/20 hover:shadow-[0_26px_52px_rgb(45_39_30/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#efede6] dark:border-white/12 dark:bg-[#282b30] dark:shadow-[0_8px_18px_rgb(0_0_0/0.22)] dark:hover:border-white/20 dark:hover:shadow-[0_28px_58px_rgb(0_0_0/0.48)] dark:focus-visible:ring-white/80 dark:focus-visible:ring-offset-[#1b1d21] motion-reduce:transform-none",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ background: sheen }}
      />
      <span className="relative block">{children}</span>
    </motion.a>
  );
}
