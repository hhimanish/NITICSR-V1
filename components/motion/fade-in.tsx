"use client";

import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion";

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  once?: boolean;
};

export function FadeIn({ children, delay = 0, y = 24, once = true, ...props }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
}
