import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { generateAnonymousAlias } from "@/lib/anonymous-name";
import { sanitizeContent, unescapeSanitized } from "@/lib/sanitizer";
import { showSuccess, showError } from "@/lib/toast-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  ShieldAlert,
  Trophy,
  HelpCircle,
  Send,
  Flag,
  CheckCircle2,
  Lock,
  Search,
  Sparkles,
  ArrowLeft,
  UserCheck,
  UserPlus,
  Loader2,
  MessageSquare,
  Activity,
  HeartHandshake,
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  topic: string;
  created_at: string | null;
  member_count?: number;
  is_member?: boolean;
  anonymous_alias?: string;
}

interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  post_type: "achievement" | "question";
  created_at: string;
  anonymous_alias?: string;
}

export default function Community() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [optIn, setOptIn] = useState<boolean | null>(null);

  // Groups and Memberships State
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<Record<string, { id: string; anonymous_alias: string }>>({});
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  // Post Feed State
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postFilter, setPostFilter] = useState<"all" | "achievement" | "question">("all");

  // Create Post State
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<"achievement" | "question">("achievement");
  const [submittingPost, setSubmittingPost] = useState(false);

  // Report Modal State
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Opt-in loading state
  const [optingIn, setOptingIn] = useState(false);

  const loadGroupsAndMemberships = useCallback(async (userId: string) => {
    try {
      // 1. Fetch all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .order("name");

      if (groupsError) throw groupsError;

      // 2. Fetch user group memberships
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("id, group_id, anonymous_alias")
        .eq("user_id", userId);

      if (memberError) throw memberError;

      const memberMap: Record<string, { id: string; anonymous_alias: string }> = {};
      memberData?.forEach((m) => {
        memberMap[m.group_id] = { id: m.id, anonymous_alias: m.anonymous_alias };
      });
      setMemberships(memberMap);

      // 3. Fetch member counts per group
      const { data: allMembers } = await supabase.from("group_members").select("group_id");
      const countMap: Record<string, number> = {};
      allMembers?.forEach((m) => {
        countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
      });

      const formattedGroups: Group[] = (groupsData || []).map((g) => ({
        ...g,
        member_count: countMap[g.id] || 0,
        is_member: !!memberMap[g.id],
        anonymous_alias: memberMap[g.id]?.anonymous_alias,
      }));

      setGroups(formattedGroups);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error loading groups:", error);
      showError(t("community.errors.loadGroupsTitle", "Failed to Load Groups"), error.message);
    }
  }, [t]);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setCurrentUserId(user.id);

        // Fetch user profile opt-in status
        const { data: profile } = await supabase
          .from("profiles")
          .select("community_opt_in")
          .eq("user_id", user.id)
          .maybeSingle();

        const isOptedIn = profile?.community_opt_in ?? false;
        setOptIn(isOptedIn);

        if (isOptedIn) {
          await loadGroupsAndMemberships(user.id);
        }
      } catch (err) {
        console.error("Failed to initialize community page:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadGroupsAndMemberships]);

  const handleOptIn = async () => {
    if (!currentUserId) return;
    setOptingIn(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: currentUserId,
            community_opt_in: true,
            community_visible: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      setOptIn(true);
      showSuccess(
        t("community.optInSuccessTitle", "Welcome to Community Groups!"),
        t("community.optInSuccessDesc", "You can now join support groups and share your journey anonymously.")
      );
      await loadGroupsAndMemberships(currentUserId);
    } catch (err: unknown) {
      const error = err as Error;
      showError(t("community.errors.optInFailed", "Opt-In Failed"), error.message);
    } finally {
      setOptingIn(false);
    }
  };

  const handleJoinGroup = async (group: Group) => {
    if (!currentUserId) return;
    try {
      const alias = generateAnonymousAlias(currentUserId, group.id);
      const { error } = await supabase.from("group_members").insert({
        user_id: currentUserId,
        group_id: group.id,
        anonymous_alias: alias,
      });

      if (error) throw error;

      showSuccess(
        t("community.joinSuccessTitle", "Joined Group"),
        t("community.joinSuccessDesc", `You joined "${group.name}" as ${alias}!`)
      );

      await loadGroupsAndMemberships(currentUserId);
      setSelectedGroupId(group.id);
    } catch (err: unknown) {
      const error = err as Error;
      showError(t("community.errors.joinFailed", "Failed to Join Group"), error.message);
    }
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("user_id", currentUserId)
        .eq("group_id", groupId);

      if (error) throw error;

      showSuccess(
        t("community.leaveSuccessTitle", "Left Group"),
        t("community.leaveSuccessDesc", `You left "${groupName}".`)
      );

      await loadGroupsAndMemberships(currentUserId);
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
    } catch (err: unknown) {
      const error = err as Error;
      showError(t("community.errors.leaveFailed", "Failed to Leave Group"), error.message);
    }
  };

  // Fetch posts for the active group
  useEffect(() => {
    if (!selectedGroupId || !optIn) return;

    async function fetchPosts() {
      setPostsLoading(true);
      try {
        // Fetch posts for group
        const { data: postsData, error: postsError } = await supabase
          .from("group_posts")
          .select("*")
          .eq("group_id", selectedGroupId)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        // Fetch group members to map anonymous_alias to user_id for this group
        const { data: groupMembers } = await supabase
          .from("group_members")
          .select("user_id, anonymous_alias")
          .eq("group_id", selectedGroupId);

        const aliasMap: Record<string, string> = {};
        groupMembers?.forEach((gm) => {
          aliasMap[gm.user_id] = gm.anonymous_alias;
        });

        const formattedPosts: GroupPost[] = (postsData || []).map((p) => ({
          ...p,
          post_type: p.post_type as "achievement" | "question",
          created_at: p.created_at || new Date().toISOString(),
          anonymous_alias: aliasMap[p.user_id] || "AnonymousMember",
        }));

        setPosts(formattedPosts);
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Error fetching group posts:", error);
        showError(t("community.errors.fetchPostsFailed", "Failed to Load Feed"), error.message);
      } finally {
        setPostsLoading(false);
      }
    }

    fetchPosts();
  }, [selectedGroupId, optIn, t]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !currentUserId || !newPostContent.trim()) return;

    // Sanitize input to prevent XSS attacks
    const sanitized = sanitizeContent(newPostContent);
    if (!sanitized) {
      showError(
        t("community.errors.invalidContentTitle", "Invalid Content"),
        t("community.errors.invalidContentDesc", "Please enter valid text for your post.")
      );
      return;
    }

    setSubmittingPost(true);
    try {
      const { data: createdPost, error } = await supabase
        .from("group_posts")
        .insert({
          group_id: selectedGroupId,
          user_id: currentUserId,
          content: sanitized,
          post_type: newPostType,
        })
        .select()
        .single();

      if (error) throw error;

      const userAlias = memberships[selectedGroupId]?.anonymous_alias || "AnonymousMember";

      setPosts((prev) => [
        {
          id: createdPost.id,
          group_id: createdPost.group_id,
          user_id: createdPost.user_id,
          content: createdPost.content,
          post_type: createdPost.post_type as "achievement" | "question",
          created_at: createdPost.created_at || new Date().toISOString(),
          anonymous_alias: userAlias,
        },
        ...prev,
      ]);

      setNewPostContent("");
      showSuccess(
        t("community.postSuccessTitle", "Post Published!"),
        t("community.postSuccessDesc", `Shared as ${userAlias} without revealing any PHI.`)
      );
    } catch (err: unknown) {
      const error = err as Error;
      showError(t("community.errors.postFailed", "Failed to Publish Post"), error.message);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportingPostId || !reportReason.trim()) return;

    setSubmittingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke("report-content", {
        body: {
          post_id: reportingPostId,
          reason: reportReason.trim(),
          reporter_id: currentUserId,
        },
      });

      if (error) throw error;

      showSuccess(
        t("community.reportSuccessTitle", "Report Submitted"),
        t("community.reportSuccessDesc", "Thank you. Our moderation team has been notified.")
      );
      setReportingPostId(null);
      setReportReason("");
    } catch (err: unknown) {
      const error = err as Error;
      showError(t("community.errors.reportFailed", "Report Failed"), error.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filter topics
  const topics = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => set.add(g.topic));
    return Array.from(set);
  }, [groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTopic = selectedTopic === "all" || g.topic === selectedTopic;
      return matchesSearch && matchesTopic;
    });
  }, [groups, searchQuery, selectedTopic]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const filteredPosts = useMemo(() => {
    if (postFilter === "all") return posts;
    return posts.filter((p) => p.post_type === postFilter);
  }, [posts, postFilter]);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Not Opted In View
  if (!optIn) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-cyan-500/10 text-cyan-400 mb-2">
            <HeartHandshake className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("community.optInTitle", "Anonymous Support Groups & Social Sharing")}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            {t(
              "community.optInSubtitle",
              "Connect with peers on shared health goals, celebrate achievements, and ask questions with complete anonymity."
            )}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <Lock className="w-6 h-6 text-cyan-400 mb-2" />
              <CardTitle className="text-lg">{t("community.features.privacyTitle", "100% Anonymous")}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {t(
                "community.features.privacyDesc",
                "Your real name, profile, and email are never shown. Each group generates a unique fun handle like SupportiveSquirrel7."
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <Trophy className="w-6 h-6 text-amber-400 mb-2" />
              <CardTitle className="text-lg">{t("community.features.progressTitle", "Share Milestones")}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {t(
                "community.features.progressDesc",
                "Share daily victories (e.g. hydration goals, workout streaks) without exposing any Personal Health Information (PHI)."
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <ShieldAlert className="w-6 h-6 text-emerald-400 mb-2" />
              <CardTitle className="text-lg">{t("community.features.moderationTitle", "Safe & Moderated")}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {t(
                "community.features.moderationDesc",
                "All content is sanitized against XSS threats and instant reporting routes flagged posts to our moderation engine."
              )}
            </CardContent>
          </Card>
        </div>

        {/* Opt in CTA Card */}
        <Card className="border-cyan-500/30 bg-cyan-950/20 text-center p-8">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-center">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold">
              {t("community.optInCTATitle", "Ready to Join Support Groups?")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t(
                "community.optInCTADesc",
                "Opt-in now to browse groups, join conversations, and share progress. You can opt-out anytime in your Settings."
              )}
            </p>
            <Button
              onClick={handleOptIn}
              disabled={optingIn}
              size="lg"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium"
            >
              {optingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.joining", "Joining...")}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t("community.optInButton", "Opt-In & Join Community")}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            {t("community.pageTitle", "Community Support Groups")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "community.pageSubtitle",
              "Connect with peers anonymously, celebrate health wins, and ask support questions safely."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="py-1 px-3 bg-card border-border flex items-center gap-1.5 text-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t("community.badgeAnonymous", "Anonymous Mode Active")}</span>
          </Badge>
          {selectedGroupId && (
            <Button variant="outline" size="sm" onClick={() => setSelectedGroupId(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("community.allGroups", "Browse All Groups")}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedGroupId ? (
        /* Group Browser View */
        <div className="space-y-6">
          {/* Search & Topic Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("community.searchPlaceholder", "Search groups by topic or name...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={selectedTopic === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTopic("all")}
                className="text-xs"
              >
                {t("common.all", "All Topics")}
              </Button>
              {topics.map((tName) => (
                <Button
                  key={tName}
                  variant={selectedTopic === tName ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTopic(tName)}
                  className="text-xs whitespace-nowrap"
                >
                  {tName}
                </Button>
              ))}
            </div>
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">{t("community.noGroupsFound", "No support groups match your search.")}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => {
                const isMember = group.is_member;
                return (
                  <Card key={group.id} className={`flex flex-col justify-between transition-all hover:border-cyan-500/40 ${isMember ? "border-cyan-500/30 bg-cyan-950/10" : ""}`}>
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          {group.topic}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span>{group.member_count} {t("community.members", "members")}</span>
                        </div>
                      </div>
                      <CardTitle className="text-base font-semibold">{group.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {group.description}
                      </CardDescription>
                    </CardHeader>

                    <CardFooter className="pt-2 flex items-center justify-between border-t border-border/50">
                      {isMember ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <UserCheck className="w-4 h-4" />
                            <span className="truncate max-w-[120px]">{group.anonymous_alias}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => setSelectedGroupId(group.id)}>
                              {t("community.viewFeed", "View Feed")}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoinGroup(group)}
                          className="w-full hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {t("community.joinGroup", "Join Group Anonymously")}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Active Group Feed View */
        activeGroup && (
          <div className="space-y-6">
            {/* Active Group Header Banner */}
            <Card className="border-border bg-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{activeGroup.topic}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {activeGroup.member_count} {t("community.membersCount", "members active")}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">{activeGroup.name}</h2>
                  <p className="text-xs text-muted-foreground max-w-2xl">{activeGroup.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-right hidden sm:block">
                    <p className="text-muted-foreground">{t("community.yourAliasInGroup", "Your handle in group:")}</p>
                    <p className="font-semibold text-cyan-400">
                      {memberships[activeGroup.id]?.anonymous_alias || "Anonymous"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleLeaveGroup(activeGroup.id, activeGroup.name)}
                  >
                    {t("community.leaveGroup", "Leave Group")}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Create Post Form Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>{t("community.shareTitle", "Share Progress or Ask a Question")}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {t("community.postingAs", "Posting as:")} <strong className="text-cyan-400">{memberships[activeGroup.id]?.anonymous_alias}</strong>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  {/* Post Type Selector */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={newPostType === "achievement" ? "default" : "outline"}
                      onClick={() => setNewPostType("achievement")}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      {t("community.postTypes.achievement", "Achievement / Progress")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={newPostType === "question" ? "default" : "outline"}
                      onClick={() => setNewPostType("question")}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      {t("community.postTypes.question", "Question / Advice")}
                    </Button>
                  </div>

                  <Textarea
                    placeholder={
                      newPostType === "achievement"
                        ? t("community.placeholderAchievement", "Share a health victory (e.g., 'Met my hydration goal today!'). Do not include personal identity details.")
                        : t("community.placeholderQuestion", "Ask a general question to group members...")
                    }
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {500 - newPostContent.length} {t("community.charsLeft", "characters remaining")}
                    </span>

                    <Button type="submit" size="sm" disabled={submittingPost || !newPostContent.trim()}>
                      {submittingPost ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          {t("community.publishPost", "Publish Anonymously")}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Post Feed Header & Filters */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                {t("community.groupFeedTitle", "Member Group Feed")}
              </h3>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant={postFilter === "all" ? "default" : "ghost"}
                  onClick={() => setPostFilter("all")}
                  className="text-xs h-7 px-2.5"
                >
                  {t("common.all", "All")}
                </Button>
                <Button
                  size="sm"
                  variant={postFilter === "achievement" ? "default" : "ghost"}
                  onClick={() => setPostFilter("achievement")}
                  className="text-xs h-7 px-2.5"
                >
                  {t("community.filterAchievements", "Achievements")}
                </Button>
                <Button
                  size="sm"
                  variant={postFilter === "question" ? "default" : "ghost"}
                  onClick={() => setPostFilter("question")}
                  className="text-xs h-7 px-2.5"
                >
                  {t("community.filterQuestions", "Questions")}
                </Button>
              </div>
            </div>

            {/* Feed Posts List */}
            {postsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t("community.noPostsYet", "No posts in this feed yet. Be the first to share your progress!")}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const isAchievement = post.post_type === "achievement";
                  return (
                    <Card key={post.id} className="border-border bg-card hover:border-cyan-500/30 transition-colors">
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/40 space-y-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-bold border border-cyan-500/20">
                            {post.anonymous_alias ? post.anonymous_alias[0] : "A"}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground">
                              {post.anonymous_alias}
                            </span>
                            <span className="text-[11px] text-muted-foreground ml-2">
                              {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              isAchievement
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]"
                                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px]"
                            }
                          >
                            {isAchievement ? (
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                {t("community.achievementBadge", "Achievement")}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" />
                                {t("community.questionBadge", "Question")}
                              </span>
                            )}
                          </Badge>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title={t("community.reportPostTooltip", "Report post")}
                            onClick={() => setReportingPostId(post.id)}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="py-3 px-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {unescapeSanitized(post.content)}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* Content Moderation Report Dialog */}
      <Dialog open={!!reportingPostId} onOpenChange={(open) => !open && setReportingPostId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="w-5 h-5" />
              {t("community.reportModalTitle", "Report Inappropriate Content")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t(
                "community.reportModalDesc",
                "Help keep our support groups safe and respectful. Flagged content is immediately sent to moderators for review."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder={t(
                "community.reportReasonPlaceholder",
                "Please describe why this post is inappropriate (e.g. spam, abusive language, medical misinformation)..."
              )}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReportingPostId(null)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={submittingReport || !reportReason.trim()}
              onClick={handleReportSubmit}
            >
              {submittingReport ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {t("community.submitReport", "Submit Report")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
