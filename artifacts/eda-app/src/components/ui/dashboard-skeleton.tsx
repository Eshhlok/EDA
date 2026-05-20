import { motion } from "framer-motion";

export default function DashboardSkeleton() {

  return (

    <div className="space-y-6 p-6">

      {/* Header Skeleton */}

      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 1.2,
        }}
        className="
          h-40
          rounded-3xl
          glass-card
          executive-border
        "
      />

      {/* KPI Skeletons */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {Array.from({ length: 6 }).map(
          (_, i) => (

            <motion.div

              key={i}

              initial={{
                opacity: 0.4,
              }}

              animate={{
                opacity: 1,
              }}

              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1,
                delay: i * 0.08,
              }}

              className="
                h-36
                rounded-3xl
                glass-card
                executive-border
              "
            />
          )
        )}

      </div>

      {/* Content Skeleton */}

      <motion.div
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 1.2,
        }}
        className="
          h-[300px]
          rounded-3xl
          glass-card
          executive-border
        "
      />

    </div>
  );
}