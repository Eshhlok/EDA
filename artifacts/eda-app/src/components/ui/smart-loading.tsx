import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

const loadingMessages = [

  "Initializing AI analytics engine...",

  "Waking up cloud compute services...",

  "Processing dataset intelligence...",

  "Generating executive insights...",

  "Analyzing operational patterns...",

  "Building interactive analytics...",

  "Preparing visualization layers...",

  "Synchronizing data pipelines...",

];

export default function SmartLoading() {

  const [messageIndex, setMessageIndex] =
    useState(0);

  useEffect(() => {

    const interval = setInterval(() => {

      setMessageIndex(
        (prev) =>
          (prev + 1) %
          loadingMessages.length
      );

    }, 2500);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div
      className="
        min-h-[300px]
        flex
        flex-col
        items-center
        justify-center
        gap-6
        text-center
        px-6
      "
    >

      {/* Animated Orb */}

      <div className="relative">

        <motion.div

          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}

          transition={{
            repeat: Infinity,
            duration: 2,
          }}

          className="
            h-20
            w-20
            rounded-full
            bg-primary/20
            blur-2xl
            absolute
            inset-0
          "
        />

        <motion.div

          animate={{
            rotate: 360,
          }}

          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "linear",
          }}

          className="
            relative
            h-20
            w-20
            rounded-full
            border
            border-primary/20
            border-t-primary
          "
        />

      </div>

      {/* Rotating Messages */}

      <AnimatePresence mode="wait">

        <motion.p

          key={messageIndex}

          initial={{
            opacity: 0,
            y: 8,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          exit={{
            opacity: 0,
            y: -8,
          }}

          transition={{
            duration: 0.35,
          }}

          className="
            text-sm
            text-muted-foreground
            max-w-md
            leading-relaxed
          "
        >

          {
            loadingMessages[
              messageIndex
            ]
          }

        </motion.p>

      </AnimatePresence>

      <p
        className="
          text-xs
          text-muted-foreground/70
        "
      >

        Cloud analytics services may take a few moments to initialize after inactivity.

      </p>

    </div>
  );
}