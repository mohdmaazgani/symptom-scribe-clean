import { Link } from "react-router-dom";
import { BookOpen, Clock, ArrowRight, Calendar } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const blogPosts = [
  {
    slug: "5-daily-habits-long-term-health",
    category: "Wellness",
    date: "May 20, 2026",
    readTime: "4 min read",
    title: "5 Daily Habits That Improve Your Long-Term Health",
    excerpt: "Small, consistent actions compound over time. Here are five science-backed habits that make a real difference to your health and wellbeing.",
    content: `
Good health isn't built in a single day — it's the result of small, consistent habits practiced over time. Here are five evidence-based daily habits that can significantly improve your long-term health.

## 1. Move for at Least 30 Minutes

Physical activity is one of the most powerful things you can do for your health. Even a brisk 30-minute walk each day reduces the risk of heart disease, type 2 diabetes, and certain cancers. You don't need a gym — dancing, cycling, or even gardening counts.

## 2. Prioritize Sleep

Sleep is when your body repairs itself. Adults need 7-9 hours per night. Poor sleep is linked to obesity, heart disease, and impaired immune function. Try to go to bed and wake up at the same time every day, even on weekends.

## 3. Eat More Whole Foods

Processed foods are convenient but often packed with added sugars, unhealthy fats, and excess sodium. Focus on whole foods — fruits, vegetables, legumes, nuts, and whole grains. These provide essential nutrients and fiber that support gut health and reduce inflammation.

## 4. Stay Hydrated

Your body is about 60% water. Even mild dehydration can cause fatigue, headaches, and difficulty concentrating. Aim for 8 glasses of water a day, and more if you're active or in a hot climate.

## 5. Manage Stress Proactively

Chronic stress is a silent killer. It raises cortisol levels, disrupts sleep, and weakens immunity. Build stress management into your daily routine — meditation, journaling, deep breathing, or simply spending time in nature can all help.

## The Bottom Line

You don't need to overhaul your life overnight. Pick one habit, practice it for a month, then add another. Consistency beats intensity every time.
    `,
  },
  {
    slug: "understanding-your-symptom-data",
    category: "Health Tips",
    date: "May 12, 2026",
    readTime: "6 min read",
    title: "Understanding Your Symptom Data: What the Numbers Mean",
    excerpt: "Your health metrics tell a story. We break down how to interpret common patterns in your symptom logs and what they might indicate.",
    content: `
Tracking your symptoms is one of the most valuable things you can do for your health. But raw numbers and logs are only useful if you know how to read them. Here's a guide to understanding your symptom data.

## Blood Pressure

Blood pressure is measured in two numbers — systolic (top) and diastolic (bottom). A normal reading is around 120/80 mmHg. Consistently high readings (above 140/90) indicate hypertension, which increases risk of heart disease and stroke.

## Heart Rate

A normal resting heart rate for adults is 60-100 beats per minute. Athletes may have lower resting rates (40-60 bpm), which is normal. An elevated resting heart rate can indicate stress, dehydration, or an underlying condition.

## Temperature

Normal body temperature is around 37°C (98.6°F). A fever is generally defined as 38°C (100.4°F) or higher. Persistent low-grade fever can be a sign of infection or inflammation.

## Symptom Patterns Over Time

Single data points are less useful than trends. Look for:
- Symptoms that appear at the same time each day (may indicate a trigger)
- Symptoms that worsen after certain foods or activities
- Clusters of symptoms that occur together

## When to See a Doctor

If you notice any of the following in your data, consult a healthcare professional:
- Persistent high blood pressure readings
- Heart rate consistently above 100 or below 50 at rest
- Fever lasting more than 3 days
- Unexplained weight loss or gain

Remember — your symptom data is a tool to inform conversations with your doctor, not to replace them.
    `,
  },
  {
    slug: "how-brain-games-improve-cognitive-function",
    category: "Brain Health",
    date: "April 30, 2026",
    readTime: "5 min read",
    title: "How Brain Games Improve Cognitive Function",
    excerpt: "Research suggests targeted cognitive exercises can improve memory and focus. Here's what the science says about brain training and mental wellness.",
    content: `
The brain is like a muscle — it responds to exercise. Cognitive training through brain games has been shown to improve specific mental skills, particularly in older adults. Here's what the research tells us.

## What Are Cognitive Brain Games?

Brain games are structured mental exercises designed to challenge specific cognitive functions like:
- **Memory** — recalling information after a delay
- **Processing speed** — how quickly you can respond to stimuli
- **Attention** — sustaining focus on a task
- **Problem solving** — working through logical challenges

## What the Science Says

A landmark study by the National Institute on Aging found that cognitive training produced improvements in the specific skills practiced, with some benefits lasting up to 10 years. While brain games won't make you smarter overall, they can sharpen the specific skills they target.

## Types of Brain Training

**Memory games** like card matching or word recall directly exercise your hippocampus — the brain region most associated with memory formation.

**Math and logic puzzles** engage your prefrontal cortex, improving executive function and planning ability.

**Pattern recognition** exercises your visual processing speed and attention to detail.

## Tips for Effective Brain Training

- Practice consistently — 15-20 minutes daily is more effective than long occasional sessions
- Challenge yourself — games that feel easy aren't producing growth
- Combine with physical exercise — cardiovascular activity boosts brain health too
- Stay socially engaged — social interaction is one of the best forms of cognitive stimulation

## The Bottom Line

Brain games are a fun and effective way to maintain cognitive health, especially as you age. Use Symptom Scribe's Brain Games feature as part of a broader healthy lifestyle.
    `,
  },
  {
    slug: "sleep-and-recovery-the-science",
    category: "Sleep",
    date: "April 15, 2026",
    readTime: "5 min read",
    title: "Sleep & Recovery: The Science of Rest",
    excerpt: "The science of sleep and why quality rest is critical for good health, recovery, and mental wellbeing.",
    content: `
We spend roughly a third of our lives asleep — and for good reason. Sleep is not a passive state. It's an active, complex process that is critical for physical and mental health.

## What Happens During Sleep?

Sleep occurs in cycles of about 90 minutes, cycling between light sleep, deep sleep, and REM (Rapid Eye Movement) sleep.

**Deep sleep** is when your body repairs tissues, builds muscle, and strengthens the immune system. Growth hormone is primarily released during this stage.

**REM sleep** is when your brain processes emotions and consolidates memories. Most dreaming occurs here.

## The Consequences of Poor Sleep

Chronic sleep deprivation has serious consequences:
- Impaired memory and concentration
- Weakened immune system
- Increased risk of obesity, diabetes, and heart disease
- Higher levels of anxiety and depression
- Reduced reaction time (comparable to being drunk)

## How Much Sleep Do You Need?

- Adults: 7-9 hours
- Teenagers: 8-10 hours
- Children: 9-11 hours
- Infants: 12-16 hours

## Tips for Better Sleep

1. Keep a consistent sleep schedule, even on weekends
2. Make your bedroom cool, dark, and quiet
3. Avoid screens for at least an hour before bed
4. Limit caffeine after 2pm
5. Avoid large meals close to bedtime
6. Get regular exercise — but not too close to bedtime

## Tracking Your Sleep

Using a health tracker to log sleep duration and quality can reveal patterns. Look for correlations between sleep quality and factors like stress levels, exercise, and diet.
    `,
  },
  {
    slug: "nutrition-tips-for-better-health",
    category: "Nutrition",
    date: "April 1, 2026",
    readTime: "6 min read",
    title: "Nutrition Tips for Better Health",
    excerpt: "Evidence-based guidance on balanced eating and nutritional choices that support long-term health and energy.",
    content: `
Good nutrition is one of the most powerful tools you have for improving your health. But with so much conflicting advice out there, it can be hard to know what to eat. Here's what the evidence actually says.

## The Foundation: Whole Foods

The single most impactful nutritional change most people can make is to eat more whole, minimally processed foods. This means:
- Fruits and vegetables of all colors
- Whole grains (oats, brown rice, quinoa)
- Legumes (beans, lentils, chickpeas)
- Nuts and seeds
- Lean proteins (fish, poultry, eggs)

## What to Limit

- **Ultra-processed foods** — chips, cookies, fast food, sugary drinks
- **Added sugars** — found in sodas, desserts, and many condiments
- **Refined carbohydrates** — white bread, white rice, pastries
- **Saturated and trans fats** — fried foods, margarine

## Key Nutrients to Focus On

**Fiber** — Most people don't get enough. Fiber supports gut health, lowers cholesterol, and reduces risk of colon cancer. Aim for 25-38g per day.

**Omega-3 fatty acids** — Found in fatty fish, flaxseeds, and walnuts. Reduces inflammation and supports brain health.

**Vitamin D** — Many people are deficient. Important for bone health, immune function, and mood. Consider getting levels tested.

**Protein** — Essential for muscle maintenance, especially as you age. Aim for 0.8-1.2g per kg of body weight.

## Practical Tips

1. Fill half your plate with vegetables at every meal
2. Eat slowly and mindfully — it takes 20 minutes to feel full
3. Plan meals in advance to avoid impulsive food choices
4. Read nutrition labels and watch serving sizes
5. Cook at home more — you control the ingredients

## The 80/20 Rule

You don't need to be perfect. Eating well 80% of the time while allowing treats 20% of the time is sustainable and effective.
    `,
  },
];

const Blog = () => {
  return (
    <LegalPageLayout title="Health Blog" icon={BookOpen} label="Resources">

      {/* Intro */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
        <p className="text-foreground text-sm leading-relaxed">
          Health insights, wellness tips, and platform updates — written to help you make
          informed decisions about your health and wellbeing.
        </p>
      </div>

      {/* Blog Posts */}
      <div className="flex flex-col gap-4">
        {blogPosts.map((post) => (
          <div
            key={post.slug}
            className="rounded-xl bg-card border border-border p-6 md:p-8 hover:border-primary/40 transition-colors"
          >
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                {post.date}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {post.readTime}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">{post.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">{post.excerpt}</p>
            <Link
              to={`/blog/${post.slug}`}
              aria-label={`Read more about ${post.title}`}
              className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
            >
              Read more
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

    </LegalPageLayout>
  );
};

export default Blog;
