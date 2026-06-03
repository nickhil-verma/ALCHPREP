"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Target,
  BookOpen,
  MessageSquare,
  Brain,
  LogOut,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  User,
  Activity,
  ChevronRight,
  ChevronLeft,
  Smile,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Search,
  FileText,
  ArrowLeft,
  Check,
  Menu
} from "lucide-react";

const MOOD_EMOJIS = {
  GREAT: "🤩",
  GOOD: "🙂",
  OKAY: "😐",
  BAD: "🙁",
  TERRIBLE: "😢"
};

const MOOD_COLORS = {
  GREAT: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/30",
  GOOD: "bg-blue-950/40 text-blue-400 border-blue-500/20 hover:bg-blue-900/30",
  OKAY: "bg-zinc-800/40 text-zinc-300 border-zinc-700/20 hover:bg-zinc-700/30",
  BAD: "bg-orange-950/40 text-orange-400 border-orange-500/20 hover:bg-orange-900/30",
  TERRIBLE: "bg-red-950/40 text-red-400 border-red-500/20 hover:bg-red-900/30"
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, goals, journal, chat, memory
  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState(null);
  const [user, setUser] = useState(null);

  // Sidebar Controls State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Form States
  // 1. Goal Form
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalPriority, setGoalPriority] = useState("MEDIUM");
  const [goalDailyHours, setGoalDailyHours] = useState(2);
  const [goalTags, setGoalTags] = useState("");
  const [goalCurrentSkill, setGoalCurrentSkill] = useState("BEGINNER");
  const [goalTargetSkill, setGoalTargetSkill] = useState("ADVANCED");
  const [goalDependencies, setGoalDependencies] = useState([]);
  const [goalLoading, setGoalLoading] = useState(false);

  // 2. Journal Form (Notion Database & Editor States)
  const [journals, setJournals] = useState([]);
  const [selectedJournalId, setSelectedJournalId] = useState(null);
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [journalMood, setJournalMood] = useState("GOOD");
  const [journalTags, setJournalTags] = useState("");
  const [journalSearch, setJournalSearch] = useState("");
  const [journalLoading, setJournalLoading] = useState(false);

  // 3. Chat Form
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [mentorPersonality, setMentorPersonality] = useState("MOTIVATIONAL"); // MOTIVATIONAL, STRICT, FRIENDLY, ANALYTICAL
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 4. Memory Form
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryType, setMemoryType] = useState("SHORT");
  const [memoryScore, setMemoryScore] = useState(5);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memories, setMemories] = useState([]);

  // Roadmap view state: maps goalId -> boolean (expanded)
  const [expandedRoadmaps, setExpandedRoadmaps] = useState({});
  const [roadmaps, setRoadmaps] = useState({});
  const [roadmapLoading, setRoadmapLoading] = useState({});

  // Sync user details and sidebar preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user_name");
      const storedEmail = localStorage.getItem("user_email");
      if (storedName || storedEmail) {
        setUser({
          name: storedName || "User Account",
          email: storedEmail || "active_user@example.com"
        });
      }
      const savedCollapsed = localStorage.getItem("sidebar_collapsed");
      if (savedCollapsed !== null) {
        setSidebarCollapsed(savedCollapsed === "true");
      }
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const toggleDependency = (goalId) => {
    setGoalDependencies((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const navigateTab = (tab) => {
    setActiveTab(tab);
    setMobileOpen(false); // Mobile sidebar automatically collapse after navigation
  };

  const getMilestoneStatus = (milestone) => {
    if (milestone.status === "COMPLETED") return "completed";
    const now = new Date();
    const targetDate = new Date(milestone.expected_completion_date);
    if (now > targetDate) return "overdue";
    return milestone.status === "IN_PROGRESS" ? "in-progress" : "upcoming";
  };

  const renderGanttChart = (goal, roadmap) => {
    const now = new Date();
    const start = goal.recommended_start_date
      ? new Date(goal.recommended_start_date)
      : (goal.created_at ? new Date(goal.created_at) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(goal.deadline);

    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) return null;

    const getPercent = (date) => {
      const d = new Date(date);
      const pct = ((d.getTime() - start.getTime()) / totalMs) * 100;
      return Math.max(0, Math.min(100, pct));
    };

    const todayPercent = getPercent(now);
    const prepStartPercent = goal.preparation_start_date ? getPercent(goal.preparation_start_date) : 0;
    const prepEndPercent = goal.preparation_end_date ? getPercent(goal.preparation_end_date) : 0;
    const prepWidth = Math.max(0, prepEndPercent - prepStartPercent);

    return (
      <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        <div className="flex justify-between items-center text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">
            Prep Window: {goal.preparation_start_date ? new Date(goal.preparation_start_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'N/A'} - {goal.preparation_end_date ? new Date(goal.preparation_end_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'N/A'}
          </span>
          <span className="font-mono text-[10px]">
            Target Date: {end.toLocaleDateString()}
          </span>
        </div>

        {/* Timeline track container */}
        <div className="relative h-12 bg-zinc-950/60 rounded-lg border border-zinc-900 flex items-center overflow-visible px-2 mt-4">
          {/* Track Line */}
          <div className="absolute left-2 right-2 h-1 bg-zinc-800 rounded"></div>

          {/* Preparation Window Block */}
          {prepWidth > 0 && (
            <div
              className="absolute h-6 bg-amber-500/20 border border-amber-500/30 rounded-md flex items-center justify-center text-[9px] text-amber-400 font-semibold"
              style={{
                left: `${prepStartPercent}%`,
                width: `${prepWidth}%`,
              }}
              title={`Prep Window: ${new Date(goal.preparation_start_date).toLocaleDateString()} - ${new Date(goal.preparation_end_date).toLocaleDateString()}`}
            >
              <span>Prep Window</span>
            </div>
          )}

          {/* Milestones */}
          {roadmap?.milestones?.map((milestone, idx) => {
            const msPercent = getPercent(milestone.expected_completion_date);
            const msStatus = getMilestoneStatus(milestone);
            const statusColors = {
              completed: "bg-emerald-500 border-emerald-400",
              "in-progress": "bg-violet-500 border-violet-400 animate-pulse",
              upcoming: "bg-zinc-800 border-zinc-700",
              overdue: "bg-red-500 border-red-400",
            };
            return (
              <div
                key={idx}
                className={`absolute h-3.5 w-3.5 rounded-full border-2 ${statusColors[msStatus]} -translate-x-1/2 cursor-help group/ms`}
                style={{ left: `${msPercent}%` }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-850 text-[10px] text-zinc-200 px-2 py-1 rounded shadow-xl opacity-0 group-hover/ms:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                  <p className="font-bold">{milestone.title}</p>
                  <p className="text-zinc-400">
                    {new Date(milestone.expected_completion_date).toLocaleDateString()} ({msStatus})
                  </p>
                </div>
              </div>
            );
          })}

          {/* Today cursor line */}
          {todayPercent >= 0 && todayPercent <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-red-500/80 -translate-x-1/2 flex flex-col justify-between items-center z-10"
              style={{ left: `${todayPercent}%` }}
            >
              <span className="text-[8px] bg-red-500 text-white px-1 py-0.25 rounded -translate-y-2 select-none">Today</span>
              <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVerticalTimeline = (goal, roadmap) => {
    const now = new Date();
    const deadline = new Date(goal.deadline);

    const prepStart = goal.preparation_start_date ? new Date(goal.preparation_start_date) : null;
    const prepEnd = goal.preparation_end_date ? new Date(goal.preparation_end_date) : null;

    const nodes = [];

    // 1. Today Node
    nodes.push({
      title: "Today",
      date: now,
      status: "current",
      displayDate: now.toDateString(),
    });

    // 2. Start Preparation Node
    if (prepStart) {
      let prepStatus = "upcoming";
      if (now >= prepStart) {
        prepStatus = now <= (prepEnd || deadline) ? "in-progress" : "completed";
      }
      nodes.push({
        title: "Start Preparation",
        date: prepStart,
        status: prepStatus,
        displayDate: prepStart.toDateString(),
      });
    }

    // 3. Milestones
    if (roadmap?.milestones) {
      roadmap.milestones.forEach((ms) => {
        nodes.push({
          title: ms.title,
          date: new Date(ms.expected_completion_date),
          status: getMilestoneStatus(ms),
          displayDate: new Date(ms.expected_completion_date).toDateString(),
        });
      });
    }

    // 4. Final Goal Date
    let finalStatus = "upcoming";
    if (goal.progress_percentage === 100 || goal.status === "COMPLETED") {
      finalStatus = "completed";
    } else if (now > deadline) {
      finalStatus = "overdue";
    }
    nodes.push({
      title: `Final Goal Deadline: ${goal.title}`,
      date: deadline,
      status: finalStatus,
      displayDate: deadline.toDateString(),
    });

    // Sort nodes chronologically
    const sortedNodes = [...nodes].sort((a, b) => a.date.getTime() - b.date.getTime());

    return (
      <div className="mt-4 border-l border-zinc-800 ml-4 pl-6 space-y-6 relative">
        {sortedNodes.map((node, index) => {
          const isToday = node.status === "current";

          const statusColors = {
            current: "bg-red-500 border-red-400 ring-4 ring-red-500/20",
            completed: "bg-emerald-500 border-emerald-400",
            "in-progress": "bg-violet-500 border-violet-400 animate-pulse ring-4 ring-violet-500/20",
            upcoming: "bg-zinc-950 border-zinc-800 text-zinc-500",
            overdue: "bg-red-500 border-red-400 animate-bounce",
          };

          return (
            <div key={index} className="relative group">
              {/* Timeline connector circle */}
              <div
                className={`absolute left-[-30px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${statusColors[node.status]} flex items-center justify-center z-10`}
              >
                {isToday && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>

              <div
                className={`p-3 rounded-lg border transition-all ${
                  isToday
                    ? "bg-red-950/10 border-red-500/20 shadow-md shadow-red-950/5"
                    : "bg-zinc-900/10 border-zinc-800/80 hover:border-zinc-700/80"
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className={`text-xs font-semibold ${isToday ? "text-red-400" : "text-zinc-200"}`}>
                    {node.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase tracking-wider ${
                      node.status === "completed"
                        ? "text-emerald-400 border-emerald-500/20"
                        : node.status === "in-progress"
                        ? "text-violet-400 border-violet-500/20"
                        : node.status === "overdue"
                        ? "text-red-400 border-red-500/20"
                        : node.status === "current"
                        ? "text-red-400 border-red-500/20"
                        : "text-zinc-500 border-zinc-850"
                    }`}
                  >
                    {node.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">Date: {node.displayDate}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 1. Initial Load of Dashboard Metrics
  const fetchDashboardData = async () => {
    try {
      // First, get user context (auth session check)
      const testRes = await fetch("/api/dashboard");
      if (testRes.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("user_name");
          localStorage.removeItem("user_email");
        }
        router.push("/login");
        return;
      }
      
      const dashboardJson = await testRes.json();
      if (dashboardJson.success) {
        setDbData(dashboardJson.data);
        
        if (typeof window !== "undefined") {
          const storedName = localStorage.getItem("user_name") || "User Account";
          const storedEmail = localStorage.getItem("user_email") || "active_user@example.com";
          setUser({
            name: storedName,
            email: storedEmail
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Load memories when clicking Memory Tab
  const fetchMemories = async () => {
    try {
      const res = await fetch("/api/memory");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setMemories(json.data);
      }
    } catch (e) {
      console.error("Error loading memories", e);
    }
  };

  useEffect(() => {
    if (activeTab === "memory") {
      fetchMemories();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "journal") {
      fetchJournals();
    }
  }, [activeTab]);

  // 3. Load chat history when clicking Chat Tab
  const fetchChatHistory = async () => {
    try {
      const res = await fetch("/api/mentor/chat");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setChatHistory(json.data);
      }
    } catch (e) {
      console.error("Error loading chat", e);
    }
  };

  useEffect(() => {
    if (activeTab === "chat") {
      fetchChatHistory();
      // Scroll to bottom
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [activeTab]);

  // Load roadmap details for a goal
  const loadRoadmap = async (goalId) => {
    if (roadmaps[goalId]) {
      setExpandedRoadmaps(prev => ({ ...prev, [goalId]: !prev[goalId] }));
      return;
    }

    setRoadmapLoading(prev => ({ ...prev, [goalId]: true }));
    try {
      const res = await fetch(`/api/roadmaps/${goalId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setRoadmaps(prev => ({ ...prev, [goalId]: json.data }));
          setExpandedRoadmaps(prev => ({ ...prev, [goalId]: true }));
        }
      } else if (res.status === 404) {
        // Automatically generate if not exists!
        const genRes = await fetch("/api/roadmaps/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalId }),
        });
        const genJson = await genRes.json();
        if (genJson.success) {
          setRoadmaps(prev => ({ ...prev, [goalId]: genJson.data }));
          setExpandedRoadmaps(prev => ({ ...prev, [goalId]: true }));
        }
      }
    } catch (e) {
      console.error("Failed to load roadmap", e);
    } finally {
      setRoadmapLoading(prev => ({ ...prev, [goalId]: false }));
    }
  };

  // Logout trigger
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
    }
    router.push("/login");
  };

  // Check/Complete Task Handler
  const toggleTaskCompletion = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      // Optimistic Update
      setDbData(prev => {
        if (!prev) return null;
        const updatedTasks = prev.todayTasks.map(t =>
          t._id === taskId ? { ...t, status: nextStatus } : t
        );
        return { ...prev, todayTasks: updatedTasks };
      });

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        // Reload aggregates silently
        fetchDashboardData();
      }
    } catch (e) {
      console.error("Task completion update failed", e);
    }
  };

  // Generate Tasks manually
  const triggerTaskGeneration = async (goalId) => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: goalId }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Submit Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setGoalLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalTitle,
          description: goalDesc,
          deadline: goalDeadline,
          priority: goalPriority,
          daily_hours: Number(goalDailyHours),
          tags: goalTags ? goalTags.split(",").map(t => t.trim()) : [],
          current_skill_level: goalCurrentSkill,
          target_skill_level: goalTargetSkill,
          goal_dependencies: goalDependencies
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const goalId = json.data._id;
          // Auto-trigger roadmap generation
          await fetch("/api/roadmaps/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goalId }),
          }).catch((err) => console.error("Failed to generate roadmap", err));
        }

        // Clear form and reload data
        setGoalTitle("");
        setGoalDesc("");
        setGoalDeadline("");
        setGoalTags("");
        setGoalCurrentSkill("BEGINNER");
        setGoalTargetSkill("ADVANCED");
        setGoalDependencies([]);
        await fetchDashboardData();
        // Switch to main dashboard
        navigateTab("dashboard");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGoalLoading(false);
    }
  };

  // Notion-style Helper to parse markdown titles
  const parseJournalContent = (rawContent) => {
    if (rawContent && rawContent.startsWith("# ")) {
      const firstNewLine = rawContent.indexOf("\n");
      if (firstNewLine !== -1) {
        const title = rawContent.substring(2, firstNewLine).trim();
        const body = rawContent.substring(firstNewLine + 1).trim();
        return { title, body };
      }
    }
    return { title: "", body: rawContent || "" };
  };

  // Initialize form state for writing a new journal entry
  const initNewJournal = () => {
    setSelectedJournalId(null);
    setJournalTitle("");
    setJournalContent("");
    setJournalMood("GOOD");
    setJournalTags("");
  };

  // Select and load a journal entry into the editor workspace
  const handleSelectJournal = (journal) => {
    setSelectedJournalId(journal._id);
    const parsed = parseJournalContent(journal.content);
    setJournalTitle(parsed.title);
    setJournalContent(parsed.body);
    setJournalMood(journal.mood || "GOOD");
    setJournalTags(journal.tags ? journal.tags.join(", ") : "");
  };

  // Fetch all user journals for the sidebar database
  const fetchJournals = async () => {
    try {
      const res = await fetch("/api/journal?limit=100");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setJournals(json.data);
          // If editing a document, update its values in case it changed in background
          if (selectedJournalId) {
            const currentDoc = json.data.find(d => d._id === selectedJournalId);
            if (currentDoc) {
              const parsed = parseJournalContent(currentDoc.content);
              setJournalTitle(parsed.title);
              setJournalContent(parsed.body);
              setJournalMood(currentDoc.mood || "GOOD");
              setJournalTags(currentDoc.tags ? currentDoc.tags.join(", ") : "");
            }
          }
        }
      }
    } catch (e) {
      console.error("Error loading journals", e);
    }
  };

  // Submit/Save Journal (creates or updates)
  const handleCreateJournal = async (e) => {
    if (e) e.preventDefault();
    setJournalLoading(true);
    try {
      // Serialize Title + Content Notion-style
      const defaultTitleDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const finalTitle = journalTitle.trim() || `Diary — ${defaultTitleDate}`;
      const serializedContent = `# ${finalTitle}\n\n${journalContent}`;

      const url = selectedJournalId ? `/api/journal/${selectedJournalId}` : "/api/journal";
      const method = selectedJournalId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: serializedContent,
          mood: journalMood,
          tags: journalTags ? journalTags.split(",").map(t => t.trim()).filter(Boolean) : []
        }),
      });

      if (res.ok) {
        const json = await res.json();
        fetchDashboardData();
        await fetchJournals();
        
        if (json.success && json.data) {
          // Keep the current journal selected with the updated parsed properties
          handleSelectJournal(json.data);
        } else if (!selectedJournalId) {
          // If it was a new entry and succeeded, clean form or navigate
          initNewJournal();
        }
      }
    } catch (e) {
      console.error("Failed to save journal", e);
    } finally {
      setJournalLoading(false);
    }
  };

  // Delete a journal entry
  const handleDeleteJournal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reflection?")) return;
    setJournalLoading(true);
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedJournalId === id) {
          initNewJournal();
        }
        fetchDashboardData();
        fetchJournals();
      }
    } catch (e) {
      console.error("Error deleting journal", e);
    } finally {
      setJournalLoading(false);
    }
  };

  // Submit Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { role: "user", content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage("");
    setChatLoading(true);

    try {
      // Persist the mentor personality setting to the database
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_personality: mentorPersonality,
        })
      }).catch((err) => console.warn("Failed to save personality preference", err));

      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          contextType: "MENTOR"
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setChatHistory(prev => [...prev, { role: "assistant", content: json.data.response }]);
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  // Clear Chat History
  const handleClearChat = async () => {
    if (confirm("Are you sure you want to clear your conversation history?")) {
      await fetch("/api/mentor/chat", { method: "DELETE" });
      setChatHistory([]);
    }
  };

  // Submit Memory
  const handleCreateMemory = async (e) => {
    e.preventDefault();
    setMemoryLoading(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: memoryContent,
          type: memoryType,
          importanceScore: Number(memoryScore)
        }),
      });

      if (res.ok) {
        setMemoryContent("");
        setMemoryScore(5);
        fetchMemories();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMemoryLoading(false);
    }
  };

  // Delete Memory
  const handleDeleteMemory = async (memoryId) => {
    try {
      const res = await fetch(`/api/memory?id=${memoryId}`, { method: "DELETE" });
      if (res.ok) {
        fetchMemories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper logic
  const activeStreak = dbData?.stats?.streak || 0;
  const weeklyCompletionRate = dbData?.stats?.weeklyCompletionRate || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin mb-4" />
        <span className="text-zinc-400 font-medium">Syncing profile metrics...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100 font-sans">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between bg-zinc-950 border-b border-zinc-900 p-4 sticky top-0 z-35 text-white">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-violet-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wider">ALCHPREP</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="text-zinc-400 hover:text-white p-1"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* 1. LEFT SIDEBAR */}
      <aside className={`border-r border-zinc-900 bg-zinc-950 flex flex-col transition-all duration-300 shrink-0 h-screen sticky top-0 ${
        sidebarCollapsed ? "w-16 p-2" : "w-64 p-4"
      } ${
        mobileOpen
          ? "fixed inset-y-0 left-0 z-50 translate-x-0 w-64 p-4"
          : "hidden md:flex"
      }`}>
        <div className={`flex items-center mb-6 ${
          sidebarCollapsed && !mobileOpen ? "flex-col gap-4 px-0 py-2" : "justify-between px-2 py-3"
        }`}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {(!sidebarCollapsed || mobileOpen) && (
              <span className="font-bold text-lg tracking-wider text-white">ALCHPREP</span>
            )}
          </div>
          {(!sidebarCollapsed || mobileOpen) && (
            <Badge variant="outline" className="text-violet-400 border-violet-500/30 text-[10px] py-0">PRO</Badge>
          )}
        </div>

        {/* Sidebar Collapse/Expand Toggle Button (Desktop only) */}
        <button
          onClick={toggleSidebar}
          className={`hidden md:flex items-center justify-center p-1.5 rounded-lg border border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-white mb-4 ${
            sidebarCollapsed ? "mx-auto" : "self-end"
          }`}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          <button
            onClick={() => navigateTab("dashboard")}
            title="Dashboard"
            className={`w-full flex items-center rounded-lg text-sm font-medium transition-all ${
              sidebarCollapsed && !mobileOpen ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
            } ${
              activeTab === "dashboard"
                ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {(!sidebarCollapsed || mobileOpen) && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => navigateTab("goals")}
            title="Goals & Roadmaps"
            className={`w-full flex items-center rounded-lg text-sm font-medium transition-all ${
              sidebarCollapsed && !mobileOpen ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
            } ${
              activeTab === "goals"
                ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
            }`}
          >
            <Target className="h-4 w-4 shrink-0" />
            {(!sidebarCollapsed || mobileOpen) && <span>Goals & Roadmaps</span>}
          </button>

          <button
            onClick={() => navigateTab("journal")}
            title="Journal Entries"
            className={`w-full flex items-center rounded-lg text-sm font-medium transition-all ${
              sidebarCollapsed && !mobileOpen ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
            } ${
              activeTab === "journal"
                ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            {(!sidebarCollapsed || mobileOpen) && <span>Journal entries</span>}
          </button>

          <button
            onClick={() => navigateTab("chat")}
            title="AI Mentor Chat"
            className={`w-full flex items-center rounded-lg text-sm font-medium transition-all ${
              sidebarCollapsed && !mobileOpen ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
            } ${
              activeTab === "chat"
                ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            {(!sidebarCollapsed || mobileOpen) && <span>AI Mentor Chat</span>}
          </button>

          <button
            onClick={() => navigateTab("memory")}
            title="AI Memory Profile"
            className={`w-full flex items-center rounded-lg text-sm font-medium transition-all ${
              sidebarCollapsed && !mobileOpen ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
            } ${
              activeTab === "memory"
                ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
            }`}
          >
            <Brain className="h-4 w-4 shrink-0" />
            {(!sidebarCollapsed || mobileOpen) && <span>AI Memory Profile</span>}
          </button>
        </nav>

        <div className="pt-4 border-t border-zinc-900 space-y-3">
          <div className={`flex items-center gap-3 py-1 ${
            sidebarCollapsed && !mobileOpen ? "justify-center" : "px-2"
          }`}>
            <div className="h-9 w-9 rounded-full bg-violet-950 border border-violet-800 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-violet-400" />
            </div>
            {(!sidebarCollapsed || mobileOpen) && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name || "User Account"}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email || "active_user@example.com"}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className={`w-full flex items-center rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 transition-all ${
              sidebarCollapsed && !mobileOpen ? "justify-center py-2.5" : "gap-3 px-3 py-2"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!sidebarCollapsed || mobileOpen) && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE AREA */}
      <main className="flex-1 bg-zinc-950 overflow-y-auto px-8 py-6">
        {/* HEADER */}
        <header className="flex justify-between items-center pb-6 border-b border-zinc-900 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Welcome back, {user?.name || "User"}
            </h1>
            <p className="text-xs text-zinc-500">Track milestones, study tasks, and reflect on your days.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* STREAK WIDGET */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-400">
              <Flame className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="font-bold text-sm">{activeStreak} Days Streak</span>
            </div>

            {/* COMPLETION RATE */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-400">
              <Activity className="h-5 w-5 text-emerald-500" />
              <span className="font-bold text-sm">{weeklyCompletionRate}% Completion</span>
            </div>
          </div>
        </header>

        {/* -------------------- TAB PANELS -------------------- */}

        {/* PANEL A: DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT SIDE: PRIORITY QUEUE, CHECKLIST, GANTT CHART */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* PRIORITY QUEUE: TOP GOALS REQUIRING ATTENTION */}
                <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Priority Queue: Goals Requiring Attention
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Top goals prioritized dynamically by progress gap, skill gap, and time remaining
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-3">
                    {dbData?.topGoals?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {dbData.topGoals.map((goal) => {
                          const statusColors = {
                            ON_TRACK: "text-emerald-400 bg-emerald-950/40 border-emerald-500/20",
                            SLIGHTLY_BEHIND: "text-amber-400 bg-amber-950/40 border-amber-500/20",
                            BEHIND: "text-orange-400 bg-orange-950/40 border-orange-500/20",
                            CRITICAL: "text-red-400 bg-red-950/40 border-red-500/20 animate-pulse"
                          };
                          return (
                            <div
                              key={goal._id}
                              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/10 flex flex-col justify-between space-y-3 animate-fade-in"
                            >
                              <div>
                                <div className="flex justify-between items-start gap-1">
                                  <h4 className="text-xs font-bold text-white truncate" title={goal.title}>
                                    {goal.title}
                                  </h4>
                                  <Badge className="text-[9px] font-mono shrink-0 py-0 px-1 bg-zinc-850 border-zinc-700 text-zinc-300">
                                    Score: {goal.metrics.priorityScore}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <Badge variant="outline" className={`text-[8px] py-0 px-1 font-bold ${statusColors[goal.metrics.urgencyStatus]}`}>
                                    {goal.metrics.urgencyStatus.replace("_", " ")}
                                  </Badge>
                                  <span className="text-[9px] text-zinc-500 font-medium">{goal.metrics.daysRemaining}d left</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-zinc-500">Progress</span>
                                  <span className="text-violet-400 font-bold">{goal.progress_percentage}%</span>
                                </div>
                                <Progress value={goal.progress_percentage} className="h-1 bg-zinc-800" />
                              </div>

                              <div className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-850 flex items-start gap-1">
                                <Sparkles className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />
                                <p className="leading-snug text-zinc-300">{goal.metrics.recommendation}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-500">No active goals found. Set up a goal to begin tracking.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TODAY'S MISSION CHECKLIST */}
                <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-violet-400" />
                        Today's Mission Checklist
                      </CardTitle>
                      <CardDescription className="text-zinc-400">Complete tasks to update active goals</CardDescription>
                    </div>
                    {dbData?.goals?.length > 0 && dbData?.todayTasks?.length === 0 && (
                      <Button
                        size="sm"
                        onClick={() => triggerTaskGeneration(dbData.goals[0]._id)}
                        className="bg-violet-600 hover:bg-violet-500 text-white"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Gen Today's Tasks
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 pt-3">
                    {dbData?.todayTasks?.length > 0 ? (
                      dbData.todayTasks.map((task) => (
                        <div
                          key={task._id}
                          className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                            task.status === "COMPLETED"
                              ? "bg-zinc-900/50 border-zinc-800/40 opacity-70"
                              : "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700/80"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.status === "COMPLETED"}
                            onChange={() => toggleTaskCompletion(task._id, task.status)}
                            className="mt-1 h-4.5 w-4.5 rounded border-zinc-800 text-violet-600 focus:ring-violet-500 bg-zinc-900"
                          />
                          <div className="flex-1">
                            <p
                              className={`text-sm font-semibold text-white ${
                                task.status === "COMPLETED" ? "line-through text-zinc-500" : ""
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">{task.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  task.priority === "URGENT"
                                    ? "text-red-400 border-red-500/20"
                                    : task.priority === "HIGH"
                                    ? "text-amber-400 border-amber-500/20"
                                    : "text-zinc-400 border-zinc-700"
                                }`}
                              >
                                {task.priority}
                              </Badge>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ⏰ {task.estimated_duration} mins
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 border border-dashed border-zinc-800 rounded-2xl">
                        <AlertTriangle className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-zinc-300">No tasks scheduled for today</p>
                        <p className="text-xs text-zinc-500 mt-1 mb-4">
                          {dbData?.goals?.length > 0
                            ? "Trigger AI generation to get your schedule."
                            : "Create a goal first to start generating roadmaps."}
                        </p>
                        {dbData?.goals?.length > 0 ? (
                          <Button
                            onClick={() => triggerTaskGeneration(dbData.goals[0]._id)}
                            className="bg-violet-600 hover:bg-violet-500 text-white"
                          >
                            <Sparkles className="mr-1.5 h-4 w-4" />
                            Generate Daily Tasks
                          </Button>
                        ) : (
                          <Button
                            onClick={() => navigateTab("goals")}
                            className="bg-violet-600 hover:bg-violet-500 text-white"
                          >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Create Your First Goal
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* INTERACTIVE ROADMAP GANTT CHART */}
                <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-violet-400" />
                      Interactive Roadmap Gantt Chart
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Visualize preparation windows, milestones, and deadlines across your timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-3">
                    {dbData?.goals?.length > 0 ? (
                      dbData.goals.slice(0, 3).map((goal) => {
                        const goalRoadmap = roadmaps[goal._id];
                        return (
                          <div key={goal._id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-zinc-300 truncate max-w-[200px]">{goal.title}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => loadRoadmap(goal._id)}
                                className="h-6 text-[9px] text-violet-400 hover:text-violet-300 hover:bg-violet-950/20 px-2 py-0"
                              >
                                {roadmapLoading[goal._id] && <Loader2 className="h-2.5 w-2.5 animate-spin mr-1 inline" />}
                                {goalRoadmap ? "Hide details" : "Load milestones & prep"}
                              </Button>
                            </div>
                            {renderGanttChart(goal, goalRoadmap)}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-zinc-500 py-2 text-center">No active goals to visualize.</p>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* SIDE METRICS / NOTIFICATIONS */}
              <div className="space-y-6">
                
                {/* APPROACHING GOALS / UPCOMING DEADLINES */}
                <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-violet-400" />
                      Upcoming Deadlines
                    </CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500">Sorted by Urgency Status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    {dbData?.approachingGoals?.length > 0 ? (
                      dbData.approachingGoals.map((goal) => {
                        const statusColors = {
                          ON_TRACK: "text-emerald-400 bg-emerald-950/40 border-emerald-500/20",
                          SLIGHTLY_BEHIND: "text-amber-400 bg-amber-950/40 border-amber-500/20",
                          BEHIND: "text-orange-400 bg-orange-950/40 border-orange-500/20",
                          CRITICAL: "text-red-400 bg-red-950/40 border-red-500/20"
                        };
                        return (
                          <div key={goal._id} className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-850 flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-semibold text-zinc-200 truncate">{goal.title}</span>
                              <Badge variant="outline" className={`text-[8px] py-0 font-bold ${statusColors[goal.metrics.urgencyStatus]}`}>
                                {goal.metrics.urgencyStatus.replace("_", " ")}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] text-zinc-555">
                              <span>{goal.metrics.daysRemaining} Days Remaining</span>
                              <span className="text-violet-400 font-bold">{goal.progress_percentage}% Done</span>
                            </div>
                            
                            <Progress value={goal.progress_percentage} className="h-1 bg-zinc-850" />
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-zinc-500 py-2">No upcoming goals tracked.</p>
                    )}
                  </CardContent>
                </Card>

                {/* RECENT NOTIFICATIONS / MENTOR ALERTS */}
                <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      AI Mentor Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dbData?.notifications?.length > 0 ? (
                      dbData.notifications.slice(0, 3).map((notif) => (
                        <div key={notif._id} className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
                          <p className="text-xs font-semibold text-zinc-200">{notif.title}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{notif.body}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-lg bg-violet-950/20 border border-violet-900/20 text-center">
                        <Smile className="h-5 w-5 text-violet-400 mx-auto mb-1" />
                        <p className="text-[10px] text-violet-400">All caught up! Start studying to log stats.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* RECENT REFLECTION LOG */}
            <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-violet-400" />
                    Latest Reflection Analysis
                  </CardTitle>
                  <CardDescription className="text-zinc-400">Recent journal insights analyzed by your AI Mentor</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    initNewJournal();
                    setActiveTab("journal");
                  }}
                  className="text-zinc-300 border-zinc-800 hover:bg-zinc-800"
                >
                  Write Journal
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-3">
                {dbData?.recentJournals?.length > 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/70 space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge className="bg-violet-950/50 text-violet-400 border border-violet-900/50">
                        {dbData.recentJournals[0].mood}
                      </Badge>
                      <span className="text-zinc-500">
                        {new Date(dbData.recentJournals[0].created_at).toDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-300 italic">
                      "{dbData.recentJournals[0].content}"
                    </p>
                    {dbData.recentJournals[0].ai_analysis && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs text-zinc-400">
                        <p className="font-bold text-zinc-200 mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-violet-400 animate-pulse" />
                          AI Mentor Feedback:
                        </p>
                        {dbData.recentJournals[0].ai_analysis}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-4">No journal entries logged yet. Write one to unlock AI analysis!</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* PANEL B: GOALS & ROADMAPS VIEW */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* GOAL CREATION FORM */}
              <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl h-fit">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-violet-400" />
                    Establish New Goal
                  </CardTitle>
                  <CardDescription className="text-zinc-400">Set boundaries and deadlines to let AI map your path</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-300">Goal Title</label>
                      <Input
                        type="text"
                        placeholder="e.g., Learn Actix Rust Web APIs"
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        required
                        className="bg-zinc-950 border-zinc-800 text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-300">Description</label>
                      <Input
                        type="text"
                        placeholder="Detail the metrics of success..."
                        value={goalDesc}
                        onChange={(e) => setGoalDesc(e.target.value)}
                        required
                        className="bg-zinc-950 border-zinc-800 text-zinc-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Target Deadline</label>
                        <Input
                          type="date"
                          value={goalDeadline}
                          onChange={(e) => setGoalDeadline(e.target.value)}
                          required
                          className="bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Daily Study Hours</label>
                        <Input
                          type="number"
                          min="0.5"
                          max="16"
                          step="0.5"
                          value={goalDailyHours}
                          onChange={(e) => setGoalDailyHours(Number(e.target.value))}
                          required
                          className="bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Priority</label>
                        <select
                          value={goalPriority}
                          onChange={(e) => setGoalPriority(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Tags (comma-separated)</label>
                        <Input
                          type="text"
                          placeholder="rust, coding, backend"
                          value={goalTags}
                          onChange={(e) => setGoalTags(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Current Skill Level</label>
                        <select
                          value={goalCurrentSkill}
                          onChange={(e) => setGoalCurrentSkill(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                        >
                          <option value="BEGINNER">BEGINNER</option>
                          <option value="INTERMEDIATE">INTERMEDIATE</option>
                          <option value="ADVANCED">ADVANCED</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Target Skill Level</label>
                        <select
                          value={goalTargetSkill}
                          onChange={(e) => setGoalTargetSkill(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                        >
                          <option value="BEGINNER">BEGINNER</option>
                          <option value="INTERMEDIATE">INTERMEDIATE</option>
                          <option value="ADVANCED">ADVANCED</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-300">Prerequisite Goals (Dependencies)</label>
                      <div className="max-h-24 overflow-y-auto border border-zinc-800 bg-zinc-950 p-2.5 rounded-lg space-y-2 mt-1">
                        {dbData?.goals?.length > 0 ? (
                          dbData.goals.map((g) => (
                            <label key={g._id} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-200">
                              <input
                                type="checkbox"
                                checked={goalDependencies.includes(g._id)}
                                onChange={() => toggleDependency(g._id)}
                                className="h-3.5 w-3.5 rounded border-zinc-800 text-violet-600 focus:ring-violet-500 bg-zinc-900"
                              />
                              <span className="truncate">{g.title}</span>
                            </label>
                          ))
                        ) : (
                          <span className="text-[11px] text-zinc-500 italic">No other active goals to select as prerequisites.</span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={goalLoading}
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                    >
                      {goalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mapping Goal...
                        </>
                      ) : (
                        "Create & Generate Roadmap"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* LIST OF GOALS */}
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Your Active Goals</h3>
                {dbData?.goals?.length > 0 ? (
                  dbData.goals.map((goal) => (
                    <Card key={goal._id} className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl">
                      <CardHeader className="pb-3 flex flex-row justify-between items-start gap-4 space-y-0">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-md font-bold text-white">{goal.title}</CardTitle>
                            <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-500/20 bg-violet-950/20">
                              {goal.priority}
                            </Badge>
                          </div>
                          <CardDescription className="text-zinc-400 text-xs mt-1">{goal.description}</CardDescription>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                          Deadline: {new Date(goal.deadline).toDateString()}
                        </span>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Roadmap Progress:</span>
                            <span className="text-violet-400 font-bold">{goal.progress_percentage}%</span>
                          </div>
                          <Progress value={goal.progress_percentage} className="h-1.5 bg-zinc-800" />
                        </div>

                        {/* ROADMAP ACTION BUTTONS */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadRoadmap(goal._id)}
                            disabled={roadmapLoading[goal._id]}
                            className="text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                          >
                            {roadmapLoading[goal._id] ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            {expandedRoadmaps[goal._id] ? "Hide Milestones" : "Load AI Roadmap"}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => triggerTaskGeneration(goal._id)}
                            className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Generate Tasks
                          </Button>
                        </div>

                        {/* EXPANDED ROADMAP ROADMAP INFO */}
                        {expandedRoadmaps[goal._id] && roadmaps[goal._id] && (
                          <div className="pt-4 border-t border-zinc-800/80 space-y-4">
                            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Roadmap Gantt Visualization</h4>
                            {renderGanttChart(goal, roadmaps[goal._id])}

                            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mt-4">AI Timeline & Milestone Visualizer</h4>
                            {renderVerticalTimeline(goal, roadmaps[goal._id])}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">Establish your first goal to trigger AI roadmap breakdowns.</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* PANEL C: JOURNAL LOGS (NOTION-STYLE WORKSPACE) */}
        {activeTab === "journal" && (() => {
          const activeJournal = journals.find(j => j._id === selectedJournalId);
          return (
            <div className="flex bg-zinc-950/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-xl h-[calc(100vh-180px)]">
              
              {/* NOTION SIDEBAR: DOCUMENT DATABASE */}
              <div className="w-80 border-r border-zinc-900 bg-zinc-950/60 flex flex-col h-full select-none shrink-0">
                
                {/* Search Database */}
                <div className="p-3 border-b border-zinc-900/80 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search reflections..."
                      value={journalSearch}
                      onChange={(e) => setJournalSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-md border border-zinc-900 bg-zinc-950 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                    />
                  </div>
                </div>

                {/* Sidebar Document List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span>Reflections</span>
                    <button
                      onClick={initNewJournal}
                      className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                      title="New reflection"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {journals
                    .filter((j) => {
                      const parsed = parseJournalContent(j.content);
                      const titleMatch = (parsed.title || "").toLowerCase().includes(journalSearch.toLowerCase());
                      const bodyMatch = (parsed.body || "").toLowerCase().includes(journalSearch.toLowerCase());
                      const tagsMatch = j.tags?.some(t => t.toLowerCase().includes(journalSearch.toLowerCase()));
                      return titleMatch || bodyMatch || tagsMatch;
                    })
                    .map((journal) => {
                      const parsed = parseJournalContent(journal.content);
                      const formattedDate = new Date(journal.created_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                      const title = parsed.title || `Diary — ${formattedDate}`;
                      const moodEmoji = MOOD_EMOJIS[journal.mood] || "📝";
                      const isSelected = selectedJournalId === journal._id;

                      return (
                        <div
                          key={journal._id}
                          onClick={() => handleSelectJournal(journal)}
                          className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                            isSelected
                              ? "bg-zinc-900 text-zinc-100"
                              : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-base shrink-0">{moodEmoji}</span>
                            <span className="truncate font-medium">{title}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJournal(journal._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-opacity shrink-0"
                            title="Delete page"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}

                  {journals.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-8">No reflections found.</p>
                  )}
                </div>

                {/* Inline Add Action */}
                <div
                  onClick={initNewJournal}
                  className="p-3.5 border-t border-zinc-900/80 bg-zinc-950/20 hover:bg-zinc-900/20 cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New entry page</span>
                </div>
              </div>

              {/* NOTION EDITOR CANVAS */}
              <div className="flex-1 flex flex-col h-full bg-zinc-950/20 overflow-y-auto relative">
                
                {/* Header bar / Workspace actions */}
                <div className="h-12 px-6 border-b border-zinc-900/60 flex items-center justify-between bg-zinc-950/40 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium truncate">
                    <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                    <span>Workspace</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Journal</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-zinc-300 truncate max-w-[150px]">
                      {journalTitle.trim() || "Untitled"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedJournalId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteJournal(selectedJournalId)}
                        className="h-8 text-xs border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-950/50"
                        disabled={journalLoading}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={handleCreateJournal}
                      disabled={journalLoading}
                      className="h-8 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                    >
                      {journalLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Save & Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Cover Gradient Art */}
                <div className="h-36 bg-gradient-to-r from-violet-900/70 via-indigo-900/60 to-zinc-950 w-full relative group shrink-0">
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Page Content Workspace Area */}
                <div className="max-w-3xl w-full mx-auto px-10 md:px-16 pb-16 pt-3 flex-1 flex flex-col">
                  
                  {/* Mood Icon Picker Trigger Area */}
                  <div className="relative -mt-14 mb-4 select-none w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-4xl shadow-xl">
                    {MOOD_EMOJIS[journalMood] || "📝"}
                  </div>

                  {/* Document Title input */}
                  <input
                    type="text"
                    placeholder="Untitled"
                    value={journalTitle}
                    onChange={(e) => setJournalTitle(e.target.value)}
                    className="w-full text-4xl font-extrabold text-zinc-100 bg-transparent border-none outline-none focus:ring-0 placeholder-zinc-800 mb-6"
                  />

                  {/* Notion Properties Block */}
                  <div className="border-y border-zinc-900/60 py-3 mb-6 space-y-2 text-xs">
                    
                    {/* Property: Created Date */}
                    <div className="flex items-center py-1">
                      <span className="w-32 text-zinc-500 font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Date Created
                      </span>
                      <span className="text-zinc-300">
                        {activeJournal
                          ? new Date(activeJournal.created_at).toLocaleString()
                          : "Today (Draft)"}
                      </span>
                    </div>

                    {/* Property: Mood Pill Selector */}
                    <div className="flex items-center py-1">
                      <span className="w-32 text-zinc-500 font-medium flex items-center gap-1.5">
                        <Smile className="h-3.5 w-3.5" />
                        Mood State
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.keys(MOOD_EMOJIS).map((m) => (
                          <button
                            key={m}
                            onClick={() => setJournalMood(m)}
                            className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                              journalMood === m
                                ? MOOD_COLORS[m]
                                : "bg-transparent text-zinc-500 border-zinc-900 hover:text-zinc-300 hover:border-zinc-800"
                            }`}
                          >
                            <span>{MOOD_EMOJIS[m]}</span>
                            <span>{m}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Property: Tags Field */}
                    <div className="flex items-center py-1">
                      <span className="w-32 text-zinc-500 font-medium flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5" />
                        Tags
                      </span>
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Add tags separated by commas..."
                          value={journalTags}
                          onChange={(e) => setJournalTags(e.target.value)}
                          className="bg-transparent border-none outline-none focus:ring-0 text-zinc-300 text-xs w-full placeholder-zinc-800 p-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Main canvas editor block */}
                  <textarea
                    placeholder="Press '/' for commands or start writing your study reflection..."
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    className="w-full flex-1 min-h-[250px] bg-transparent border-none outline-none focus:ring-0 text-zinc-200 text-sm md:text-base leading-relaxed placeholder-zinc-800 resize-none p-0"
                  />

                  {/* AI callout box if analysis is ready */}
                  {selectedJournalId && activeJournal?.ai_analysis && (
                    <div className="mt-8 p-4 rounded-xl bg-violet-950/10 border border-violet-900/30 shadow-inner flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">AI Mentor Insights</p>
                        <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                          {activeJournal.ai_analysis}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* PANEL D: AI MENTOR CHAT */}
        {activeTab === "chat" && (
          <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl h-[calc(100vh-180px)] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-violet-400 animate-pulse" />
                  AI Mentor Dialogue
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">Personality settings shape prompts automatically</CardDescription>
              </div>

              {/* PERSONALITY SELECTOR & CLEAR ACTION */}
              <div className="flex items-center gap-2">
                <select
                  value={mentorPersonality}
                  onChange={(e) => setMentorPersonality(e.target.value)}
                  className="h-8 px-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500 text-xs"
                >
                  <option value="MOTIVATIONAL">Tony Robbins (Motivational)</option>
                  <option value="STRICT">Marcus Aurelius (Strict)</option>
                  <option value="FRIENDLY">Ted Lasso (Friendly)</option>
                  <option value="ANALYTICAL">Andrew Huberman (Analytical)</option>
                </select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearChat}
                  className="h-8 text-xs border-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  Clear History
                </Button>
              </div>
            </CardHeader>

            {/* CHAT MESSAGES WINDOW */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.length > 0 ? (
                chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-br-none"
                          : "bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-bl-none"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <Sparkles className="h-8 w-8 text-violet-400 mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-zinc-300">Start conversation with your AI Mentor</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Ask for strategy advice, habit checks, or help resolving blockers.
                  </p>
                </div>
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl rounded-bl-none px-4 py-3">
                    <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CHAT FORM */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-900 flex gap-2">
              <Input
                type="text"
                placeholder="Ask your mentor..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={chatLoading}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 flex-1 h-11"
              />
              <Button
                type="submit"
                disabled={chatLoading || !chatMessage.trim()}
                className="bg-violet-600 hover:bg-violet-500 text-white px-5 h-11"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        )}

        {/* PANEL E: AI MEMORY PROFILE */}
        {activeTab === "memory" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* WRITE MANUAL MEMORY */}
              <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl h-fit">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Brain className="h-5 w-5 text-violet-400" />
                    Log Custom Preferences
                  </CardTitle>
                  <CardDescription className="text-zinc-400">Inject qualitative preferences directly to shape LLM prompts</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateMemory} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-300">Memory Content</label>
                      <textarea
                        rows="3"
                        placeholder="Write down personal preference (e.g., 'User struggles with CSS syntax' or 'User prefers structured summaries')"
                        value={memoryContent}
                        onChange={(e) => setMemoryContent(e.target.value)}
                        required
                        className="w-full p-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Retention Tier</label>
                        <select
                          value={memoryType}
                          onChange={(e) => setMemoryType(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                        >
                          <option value="SHORT">SHORT (Expires in 7 days)</option>
                          <option value="MEDIUM">MEDIUM (Intermediate logs)</option>
                          <option value="LONG">LONG (Permanent profile)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Importance (1-10)</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={memoryScore}
                          onChange={(e) => setMemoryScore(Number(e.target.value))}
                          required
                          className="bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={memoryLoading}
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                    >
                      {memoryLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging Memory...
                        </>
                      ) : (
                        "Save Memory"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* MEMORY ITEMS */}
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Memory Index</h3>
                {memories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memories.map((mem) => (
                      <Card key={mem._id} className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-xl relative overflow-hidden group">
                        <CardContent className="pt-6 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-violet-950/50 text-violet-400 border border-violet-900/50 text-[9px] py-0">
                                {mem.type}
                              </Badge>
                              <Badge variant="outline" className="text-zinc-400 border-zinc-800 text-[9px] py-0">
                                Score: {mem.importance_score}
                              </Badge>
                            </div>
                            <button
                              onClick={() => handleDeleteMemory(mem._id)}
                              className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs font-medium text-zinc-300 mt-1">{mem.content}</p>
                          <p className="text-[9px] text-zinc-500 pt-1 border-t border-zinc-800/40">
                            Source: {mem.source || "system"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">Your AI Mentor has not established any key memories about you yet. Try write a journal or trigger a dialogue.</p>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}