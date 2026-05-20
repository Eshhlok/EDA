import {
  motion,
  useMotionValue,
  animate,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
}

export default function AnimatedCounter({
  value,
  decimals = 0,
}: AnimatedCounterProps) {

  const motionValue =
    useMotionValue(0);

  const [displayValue, setDisplayValue] =
    useState(0);

  useEffect(() => {

    const controls = animate(
      motionValue,
      value,
      {
        duration: 1,
        ease: "easeOut",
        onUpdate(latest) {
          setDisplayValue(latest);
        },
      }
    );

    return () => controls.stop();

  }, [value, motionValue]);

  return (
    <motion.span>

      {displayValue.toLocaleString(
        undefined,
        {
          minimumFractionDigits:
            decimals,
          maximumFractionDigits:
            decimals,
        }
      )}

    </motion.span>
  );
}