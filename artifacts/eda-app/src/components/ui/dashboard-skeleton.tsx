import { motion } from "framer-motion";

function ShimmerCard({
  className = "",
}: {
  className?: string;
}) {

  return (

    <div
      className={`
        relative
        overflow-hidden
        rounded-3xl
        glass-card
        executive-border
        ${className}
      `}
    >

      <motion.div

        initial={{
          x: "-100%",
        }}

        animate={{
          x: "200%",
        }}

        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}

        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-transparent
          via-white/10
          to-transparent
          dark:via-white/5
        "
      />

    </div>
  );
}

export default function DashboardSkeleton() {

  return (

    <div className="space-y-6 p-6">

      {/* Header */}

      <ShimmerCard className="h-40" />

      {/* KPI Grid */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {Array.from({ length: 6 }).map(
          (_, i) => (

            <ShimmerCard
              key={i}
              className="h-36"
            />
          )
        )}

      </div>

      {/* Content */}

      <ShimmerCard className="h-[300px]" />

    </div>
  );
}