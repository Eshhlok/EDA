import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  { main: "Warming up the servers...", sub: "Cold starts happen — we'll be ready in a moment." },
  { main: "Fetching your data...", sub: "Pulling everything together." },
  { main: "Crunching the numbers...", sub: "Good things take a few seconds." },
  { main: "Spinning up the engines...", sub: "First request after inactivity takes a moment." },
  { main: "Building your pipeline...", sub: "Hang tight, almost there." },
  { main: "Running the analysis...", sub: "AI is doing the heavy lifting." },
  { main: "Scanning for outliers...", sub: "Every anomaly will be found." },
  { main: "Scoring data quality...", sub: "Checking completeness, consistency, and more." },
  { main: "Generating visualisations...", sub: "Your charts are taking shape." },
  { main: "Loading your dataset...", sub: "Parsing rows and columns." },
  { main: "Preparing your report...", sub: "Worth the wait, we promise." },
  { main: "Waking up the data engines...", sub: "Cloud compute sleeps between requests." },
  { main: "Computing correlations...", sub: "Finding patterns in the noise." },
  { main: "Profiling your columns...", sub: "Types, distributions, and gaps — all covered." },
  { main: "Almost there...", sub: "Just a few more seconds." },
];

interface SmartLoadingProps {
  interval?: number; // ms between message changes, default 2800
}

export function SmartLoading({ interval = 2800 }: SmartLoadingProps) {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * MESSAGES.length)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  const { main, sub } = MESSAGES[index];

  return (
    <div className="flex flex-col items-center gap-1 mt-3 select-none">
      <AnimatePresence mode="wait">
        <motion.p
          key={index + "-main"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-muted-foreground text-center"
        >
          {main}
        </motion.p>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.p
          key={index + "-sub"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="text-[11px] text-muted-foreground/60 text-center"
        >
          {sub}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}