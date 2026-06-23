import { useState } from "react";
import { Trophy, Flame, Award, Smile } from "lucide-react";
import ChallengeCard from "@/components/gamification/ChallengeCard";
import BadgeDisplay from "@/components/gamification/BadgeDisplay";
import MoodCalendarView from "@/components/gamification/MoodCalendarView";
import {
  useChallenges,
  useUserChallenges,
  useJoinChallenge,
  useCheckInChallenge,
  useUserBadges,
  useMoodLogs,
  useLogMood,
} from "@/hooks/useGamification";

type Tab = "challenges" | "mood" | "badges";

export default function GamificationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("challenges");

  const { data: challenges = [], isLoading: loadingChallenges } = useChallenges();
  const { data: userChallenges = [] } = useUserChallenges();
  const { data: userBadges = [] } = useUserBadges();
  const { data: moodLogs = [] } = useMoodLogs();

  const joinChallenge = useJoinChallenge();
  const checkIn = useCheckInChallenge();
  const logMood = useLogMood();

  const activeCount = userChallenges.filter((c) => c.status === "active").length;
  const bestStreak = userChallenges.reduce((max, c) => Math.max(max, c.best_streak ?? 0), 0);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "challenges", label: "Challenges", icon: <Flame className="w-4 h-4" /> },
    { id: "mood",       label: "Mood Tracker", icon: <Smile className="w-4 h-4" /> },
    { id: "badges",     label: "My Badges",    icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
            <Trophy className="w-8 h-8 text-primary" />
            Challenges & Rewards
          </h1>
          <p className="text-muted-foreground mt-1">
            Build healthy habits, earn badges, and track your mood
          </p>
        </div>

        {/* Stats Row — same card style as Dashboard */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            <span className="text-3xl font-bold text-foreground">{activeCount}</span>
            <span className="text-xs text-muted-foreground text-center">Active Challenges</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            <span className="text-3xl font-bold text-foreground">{userBadges.length}</span>
            <span className="text-xs text-muted-foreground text-center">Badges Earned</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
            <Smile className="w-6 h-6 text-primary" />
            <span className="text-3xl font-bold text-foreground">{bestStreak}</span>
            <span className="text-xs text-muted-foreground text-center">Best Streak</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "challenges" && (
            <div className="space-y-4">
              {loadingChallenges ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : challenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-muted/10">
                  <span className="text-5xl mb-4">🏆</span>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No challenges available yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Challenges will appear here once the database is set up. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {challenges.map((challenge) => {
                    const userChallenge = userChallenges.find(
                      (uc) => uc.challenge_id === challenge.id
                    );
                    return (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        userChallenge={userChallenge}
                        onJoin={() => joinChallenge.mutate(challenge.id)}
                        onCheckIn={() => userChallenge && checkIn.mutate(userChallenge.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "mood" && (
            <MoodCalendarView moodLogs={moodLogs} onLogMood={logMood.mutate} />
          )}

          {activeTab === "badges" && (
            <BadgeDisplay userBadges={userBadges} />
          )}
        </div>

      </div>
    </div>
  );
}
