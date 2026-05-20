import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
}

export default function AnimatedCounter({
  value,
  duration = 1,
  decimals = 0,
}: AnimatedCounterProps) {

  const spring = useSpring(0, {
    damping: 20,
    stiffness: 100,
  });

  const display = useTransform(
    spring,
    (current) =>
      current.toFixed(decimals)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span>
      {display}
    </motion.span>
  );
}