import { useUserBadges } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import { Award } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// BadgeDisplay intentionally takes no props: it fetches the current user's
// badges itself via useUserBadges(), so it can be rendered standalone (e.g.
// the Gamification page's "badges" tab) without the parent managing badge
// state.
export default function BadgeDisplay() {
  const { data: userBadges, isLoading } = useUserBadges();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!userBadges || userBadges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Award className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No badges earned yet</p>
        <p className="text-xs mt-1">Complete challenges to unlock badges!</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-3 sm:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {userBadges.map((ub) => (
        <motion.div
          key={ub.id}
          variants={itemVariants}
          whileHover={{ y: -4, boxShadow: "0 8px 24px -4px rgba(0,0,0,0.15)" }}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm"
          title={ub.badges.description}
        >
          <span className="text-3xl">{ub.badges.icon}</span>
          <p className="text-xs font-semibold text-center text-card-foreground leading-tight">
            {ub.badges.name}
          </p>
          <p className="text-[10px] text-muted-foreground text-center leading-snug">
            {ub.badges.description}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(ub.earned_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
