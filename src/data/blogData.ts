export interface BlogPost {
  id: string;
  slug: string;
  category: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  content: Section[];
  prevPost?: { title: string; slug: string };
  nextPost?: { title: string; slug: string };
}

export interface Section {
  heading?: string;
  body: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "5-daily-habits-long-term-health",
    category: "Wellness",
    date: "May 20, 2026",
    readTime: "4 min read",
    title: "5 Daily Habits That Improve Your Long-Term Health",
    excerpt: "Small, consistent actions compound over time. Here are five science-backed habits that make a real difference.",
    content: [
      {
        body: "Good health isn't built in a single day — it's the result of small, consistent habits practiced over time. Here are five evidence-based daily habits that can significantly improve your long-term health.",
      },
      {
        heading: "1. Move for at Least 30 Minutes",
        body: "Physical activity is one of the most powerful things you can do for your health. Even a brisk 30-minute walk each day reduces the risk of heart disease, type 2 diabetes, and certain cancers. You don't need a gym — dancing, cycling, or even gardening counts.",
      },
      {
        heading: "2. Prioritize Sleep",
        body: "Sleep is when your body repairs itself. Adults need 7-9 hours per night. Poor sleep is linked to obesity, heart disease, and impaired immune function. Try to go to bed and wake up at the same time every day, even on weekends.",
      },
      {
        heading: "3. Eat More Whole Foods",
        body: "Processed foods are convenient but often packed with added sugars, unhealthy fats, and excess sodium. Focus on whole foods — fruits, vegetables, legumes, nuts, and whole grains. These provide essential nutrients and fiber that support gut health and reduce inflammation.",
      },
      {
        heading: "4. Stay Hydrated",
        body: "Your body is about 60% water. Even mild dehydration can cause fatigue, headaches, and difficulty concentrating. Aim for 8 glasses of water a day, and more if you're active or in a hot climate.",
      },
      {
        heading: "5. Manage Stress Proactively",
        body: "Chronic stress is a silent killer. It raises cortisol levels, disrupts sleep, and weakens immunity. Build stress management into your daily routine — meditation, journaling, deep breathing, or simply spending time in nature can all help.",
      },
      {
        heading: "The Bottom Line",
        body: "You don't need to overhaul your life overnight. Pick one habit, practice it for a month, then add another. Consistency beats intensity every time.",
      },
    ],
    nextPost: {
      title: "Understanding Your Symptom Data: What the Numbers Mean",
      slug: "understanding-your-symptom-data",
    },
  },
  {
    id: "2",
    slug: "understanding-your-symptom-data",
    category: "Health Tips",
    date: "May 12, 2026",
    readTime: "6 min read",
    title: "Understanding Your Symptom Data: What the Numbers Mean",
    excerpt: "Your health metrics tell a story. We break down how to interpret common patterns in your symptom logs.",
    content: [
      {
        body: "When you log symptoms consistently, patterns begin to emerge. Understanding what those patterns mean can help you make better decisions about your health and have more informed conversations with your doctor.",
      },
      {
        heading: "Why Tracking Matters",
        body: "Symptom data gives you a historical view of your health. A single data point means little — but weeks of logs can reveal triggers, cycles, and trends that would otherwise go unnoticed.",
      },
      {
        heading: "Reading Frequency Patterns",
        body: "If a symptom appears consistently at the same time of day or week, that timing is meaningful. Morning headaches may suggest sleep issues or dehydration. Evening fatigue could point to blood sugar dips or stress accumulation.",
      },
      {
        heading: "Severity Scores",
        body: "Most tracking apps use a 1–10 severity scale. Don't fixate on individual scores — look at averages and trends. A gradual upward trend in severity over two weeks is more concerning than a single spike.",
      },
      {
        heading: "Correlating Symptoms with Lifestyle",
        body: "The most valuable insight comes from connecting symptoms to lifestyle factors: sleep quality, diet, stress levels, and physical activity. When you track these alongside symptoms, you start to see cause-and-effect relationships.",
      },
      {
        heading: "When to Talk to a Doctor",
        body: "Use your data as a conversation starter, not a diagnosis. Bring your symptom log to appointments — it gives your doctor a clearer picture than memory alone and can speed up diagnosis significantly.",
      },
      {
        heading: "The Bottom Line",
        body: "Your symptom data is only as useful as your ability to interpret it. Focus on trends, correlations, and context — not individual readings. Over time, you'll develop a clearer picture of what your body is telling you.",
      },
    ],
    prevPost: {
      title: "5 Daily Habits That Improve Your Long-Term Health",
      slug: "5-daily-habits-long-term-health",
    },
    nextPost: {
      title: "How Brain Games Improve Cognitive Function",
      slug: "how-brain-games-improve-cognitive-function",
    },
  },
  {
    id: "3",
    slug: "how-brain-games-improve-cognitive-function",
    category: "Brain Health",
    date: "April 30, 2026",
    readTime: "5 min read",
    title: "How Brain Games Improve Cognitive Function",
    excerpt: "Research suggests targeted cognitive exercises can improve memory and focus. Here's what the science says.",
    content: [
      {
        body: "The idea that you can train your brain like a muscle has gained significant scientific support. Targeted cognitive exercises — commonly called brain games — have been shown to improve specific mental functions when practiced consistently.",
      },
      {
        heading: "What the Research Shows",
        body: "Studies from neuroscience labs worldwide suggest that certain types of mental exercises can strengthen neural pathways. Working memory tasks, pattern recognition, and processing speed exercises have the most evidence behind them.",
      },
      {
        heading: "Memory and Recall",
        body: "Games that challenge you to remember sequences, faces, or patterns can improve short-term memory capacity. This type of training works best when the exercises are slightly beyond your comfort zone — a principle called 'desirable difficulty.'",
      },
      {
        heading: "Focus and Attention",
        body: "Tasks requiring sustained concentration — like dual n-back training or timed problem-solving — strengthen your ability to filter distractions. Regular practice can improve both focus duration and task-switching efficiency.",
      },
      {
        heading: "Processing Speed",
        body: "Reaction-time games and rapid decision-making tasks have been linked to improvements in how quickly the brain processes information. This benefit has real-world applications in driving, sports, and everyday decision-making.",
      },
      {
        heading: "The Transfer Problem",
        body: "One important caveat: getting better at a brain game doesn't automatically mean you'll get better at unrelated tasks. The most effective cognitive training targets skills that directly overlap with activities you care about improving.",
      },
      {
        heading: "The Bottom Line",
        body: "Brain games work best as one part of a broader cognitive health strategy — alongside physical exercise, quality sleep, social engagement, and a nutrient-rich diet. Play consistently, challenge yourself, and don't expect overnight miracles.",
      },
    ],
    prevPost: {
      title: "Understanding Your Symptom Data: What the Numbers Mean",
      slug: "understanding-your-symptom-data",
    },
    nextPost: {
      title: "When to See a Doctor vs. Monitor Symptoms at Home",
      slug: "when-to-see-a-doctor-vs-monitor-symptoms",
    },
  },
  {
    id: "4",
    slug: "when-to-see-a-doctor-vs-monitor-symptoms",
    category: "Guidance",
    date: "April 18, 2026",
    readTime: "7 min read",
    title: "When to See a Doctor vs. Monitor Symptoms at Home",
    excerpt: "Not every symptom requires an emergency visit. Learn how to make that call confidently.",
    content: [
      {
        body: "One of the most common health decisions people face isn't which treatment to choose — it's whether to seek care at all. Knowing when to see a doctor versus when to watch and wait can save you time, money, and unnecessary anxiety.",
      },
      {
        heading: "The General Rule of Thumb",
        body: "If a symptom is severe, sudden, or accompanied by other warning signs, always seek care promptly. When symptoms are mild, familiar, and improving over time, home monitoring is usually appropriate.",
      },
      {
        heading: "Red Flags: Go See a Doctor",
        body: "Certain symptoms should never be ignored: chest pain or pressure, difficulty breathing, sudden severe headache, high fever (above 39.5°C / 103°F), signs of stroke (facial drooping, arm weakness, speech difficulty), or any symptom that feels dramatically different from what you've experienced before.",
      },
      {
        heading: "Yellow Flags: Monitor Closely",
        body: "Symptoms like a mild sore throat, low-grade fever, minor muscle aches, or a new but manageable rash often resolve on their own within a few days. Track their progression — if they worsen after 48–72 hours or new symptoms appear, escalate to a doctor.",
      },
      {
        heading: "Green Flags: Home Care is Fine",
        body: "The common cold, minor cuts and scrapes, mild indigestion, tension headaches, and seasonal allergies are generally safe to manage at home with rest, hydration, and over-the-counter remedies.",
      },
      {
        heading: "How Symptom Tracking Helps",
        body: "Logging your symptoms over time removes guesswork from this decision. A symptom diary shows you patterns — whether things are trending better or worse — and gives you concrete information to share with a healthcare provider if you do need to go in.",
      },
      {
        heading: "When in Doubt, Call First",
        body: "Many clinics and healthcare providers offer nurse helplines or telehealth consultations. These are excellent middle-ground options when you're unsure — you get professional guidance without the time and cost of an in-person visit.",
      },
      {
        heading: "The Bottom Line",
        body: "Trust your instincts, but back them up with information. Symptom tracking, awareness of red flags, and access to telehealth make it easier than ever to make smart, confident decisions about your care.",
      },
    ],
    prevPost: {
      title: "How Brain Games Improve Cognitive Function",
      slug: "how-brain-games-improve-cognitive-function",
    },
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}