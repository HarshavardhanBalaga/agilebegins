export type WorkshopStatus = "live" | "coming-soon";

export interface HeroLine {
  text: string;
  accent?: boolean;
}

export interface WorkshopAudience {
  title: string;
  description: string;
}

export interface WorkshopTimelineItem {
  title: string;
  description: string;
}

export interface WorkshopInclude {
  title: string;
  description: string;
}

export interface WorkshopFaq {
  question: string;
  answer: string;
}

export interface Workshop {
  slug: string;
  number: string;
  status: WorkshopStatus;
  title: string;
  description: string;
  duration: string;
  platform: string;
  price: string;
  seats: string;
  liveQa: string;
  heroLines: HeroLine[];
  audience: WorkshopAudience[];
  learn: string[];
  timeline: WorkshopTimelineItem[];
  includes: WorkshopInclude[];
  faq: WorkshopFaq[];
  cta: string;
}

export const workshops: Workshop[] = [
  {
    slug: "workshop-001",
    number: "001",
    status: "live",
    title: "What I Wish I Knew in 2nd Year",
    description:
      "Everything I wish someone had explained before I started learning web development, internships and career building.",
    duration: "90 Minutes",
    platform: "Google Meet",
    price: "₹49",
    seats: "Only 50",
    liveQa: "Interactive",
    heroLines: [
      { text: "What I Wish" },
      { text: "I Knew" },
      { text: "in 2nd Year", accent: true },
    ],
    audience: [
      {
        title: "2nd Year Students",
        description: "You're starting to feel the pressure to figure everything out.",
      },
      {
        title: "Students Feeling Lost",
        description: "You don't know what to learn or where to even begin.",
      },
      {
        title: "Students Preparing for Internships",
        description: "You want to stand out before applications open.",
      },
      {
        title: "Anyone Wanting Career Clarity",
        description: "You want an honest, clear path forward.",
      },
    ],
    learn: [
      "What actually matters in 2nd year",
      "Building projects correctly",
      "Git & GitHub roadmap",
      "Internship strategy",
      "Common mistakes students make",
      "AI tools that actually help",
    ],
    timeline: [
  {
    title: "Where You Stand in 2nd Year",
    description: "Understanding what matters now, what can wait, and where most students lose time.",
  },
  {
    title: "What You Should Learn",
    description: "The skills, technologies, and fundamentals worth investing your time in during 2nd year.",
  },
  {
    title: "Stop Learning. Start Building.",
    description: "How to turn what you learn into projects that actually prove your skills.",
  },
  {
    title: "Build Your Developer Profile",
    description: "GitHub, LinkedIn, resume, and the online presence you should start building early.",
  },
  {
    title: "Use Your Time Better",
    description: "How to balance college, DSA, development, projects, and everything else without trying to learn everything.",
  },
  {
    title: "Your 2nd-Year Action Plan",
    description: "Turn everything from the session into a practical plan you can start following immediately.",
  },
  {
    title: "Live Q&A",
    description: "Ask your questions and get guidance based on your own situation.",
  },
],
    includes: [
      {
        title: "Live Session",
        description: "90 minutes on Google Meet with real-time guidance.",
      },
      {
        title: "Workshop Notes",
        description: "Clean notes so you can revisit everything later.",
      },
      {
        title: "Career Roadmap PDF",
        description: "A step-by-step plan you can follow long after.",
      },
      {
        title: "Q&A Session",
        description: "Your questions answered live at the end.",
      },
    ],
    faq: [
      {
        question: "How will I join?",
        answer: "You'll get the Google Meet link by email right after you register.",
      },
      {
        question: "Will the session be recorded?",
        answer: "Yes — registered attendees get the recording and notes.",
      },
      {
        question: "Who can attend?",
        answer: "Any student, especially those in their 2nd year.",
      },
      {
        question: "Do I need prior experience?",
        answer: "No. We start from the basics.",
      },
      {
        question: "How do I reserve my seat?",
        answer: "Click Reserve Your Seat and complete the ₹49 registration.",
      },
    ],
    cta: "Explore Workshop",
  },
  {
    slug: "workshop-002",
    number: "002",
    status: "coming-soon",
    title: "Build Your First Portfolio",
    description:
      "Create a portfolio that shows your real work — step by step, from nothing to something you'd be proud to share.",
    duration: "TBA",
    platform: "Google Meet",
    price: "TBA",
    seats: "TBA",
    liveQa: "Interactive",
    heroLines: [
      { text: "Build Your" },
      { text: "First Portfolio", accent: true },
    ],
    audience: [
      {
        title: "Students With No Projects",
        description: "You have nothing to show recruiters yet.",
      },
      {
        title: "Students Finishing Projects",
        description: "You've built things but don't know how to present them.",
      },
      {
        title: "Students Prepping Applications",
        description: "You want a portfolio that gets you noticed.",
      },
      {
        title: "Beginners Who Want Proof",
        description: "You want to back up your skills with real work.",
      },
    ],
    learn: [
      "What a strong portfolio includes",
      "Picking projects that stand out",
      "Writing clear case studies",
      "Designing a clean portfolio",
      "Hosting and sharing your build",
      "What recruiters actually look for",
    ],
    timeline: [
      {
        title: "Introduction",
        description: "What a good portfolio does for you.",
      },
      {
        title: "Choosing Projects",
        description: "Pick pieces that show real skill.",
      },
      {
        title: "Structure",
        description: "Lay out the sections that sell you.",
      },
      {
        title: "Design & Hosting",
        description: "Make it clean, fast, and live.",
      },
      {
        title: "Live Q&A",
        description: "Get feedback on your plan.",
      },
    ],
    includes: [
      {
        title: "Live Session",
        description: "A guided walkthrough from start to finish.",
      },
      {
        title: "Portfolio Checklist",
        description: "Every element your portfolio needs.",
      },
      {
        title: "Resource Pack",
        description: "Templates and tools to build faster.",
      },
      {
        title: "Q&A Session",
        description: "Questions answered live at the end.",
      },
    ],
    faq: [
      {
        question: "Who can attend?",
        answer: "Any student, beginner or not.",
      },
      {
        question: "Do I need code experience?",
        answer: "Some basics help, but templates are available.",
      },
      {
        question: "Will it be recorded?",
        answer: "Yes — registered attendees get the recording.",
      },
    ],
    cta: "Coming Soon",
  },
  {
    slug: "workshop-003",
    number: "003",
    status: "coming-soon",
    title: "Git & GitHub for Students",
    description:
      "Learn the version control workflow every team uses — commits, branches, and pull requests — in plain, student-friendly language.",
    duration: "TBA",
    platform: "Google Meet",
    price: "TBA",
    seats: "TBA",
    liveQa: "Interactive",
    heroLines: [
      { text: "Git & GitHub" },
      { text: "for Students", accent: true },
    ],
    audience: [
      {
        title: "Absolute Beginners",
        description: "You've never used Git before.",
      },
      {
        title: "Students Using Code Only Locally",
        description: "You code alone and don't know teams work.",
      },
      {
        title: "Open Source Curious",
        description: "You want to contribute but aren't sure how.",
      },
      {
        title: "Internship Seekers",
        description: "Git is expected in most technical roles.",
      },
    ],
    learn: [
      "What Git actually is",
      "Staging, commits and history",
      "Branches and merging",
      "Push, pull and remotes",
      "Pull requests explained",
      "Everyday team workflow",
    ],
    timeline: [
      {
        title: "Introduction",
        description: "Why Git is essential.",
      },
      {
        title: "Core Commands",
        description: "Commit, branch, push, pull.",
      },
      {
        title: "Real Workflow",
        description: "A typical day on a team.",
      },
      {
        title: "GitHub",
        description: "Repos, PRs and issues.",
      },
      {
        title: "Practice + Q&A",
        description: "Try it live and ask questions.",
      },
    ],
    includes: [
      {
        title: "Live Session",
        description: "Hands-on with your own repo.",
      },
      {
        title: "Command Cheat Sheet",
        description: "Every command on one page.",
      },
      {
        title: "Practice Repo",
        description: "A safe place to experiment.",
      },
      {
        title: "Q&A Session",
        description: "Get unstuck live.",
      },
    ],
    faq: [
      {
        question: "Do I need to install anything?",
        answer: "We'll guide you to set up Git + GitHub before starting.",
      },
      {
        question: "Is it beginner friendly?",
        answer: "Yes — we start from absolute zero.",
      },
      {
        question: "Will it be recorded?",
        answer: "Yes, and attendees get the cheat sheet.",
      },
    ],
    cta: "Coming Soon",
  },
  {
    slug: "workshop-004",
    number: "004",
    status: "coming-soon",
    title: "Resume That Gets Interviews",
    description:
      "Structure your resume the way recruiters actually read it, and turn limited experience into a compelling story.",
    duration: "TBA",
    platform: "Google Meet",
    price: "TBA",
    seats: "TBA",
    liveQa: "Interactive",
    heroLines: [
      { text: "Resume That" },
      { text: "Gets Interviews", accent: true },
    ],
    audience: [
      {
        title: "Students With Empty Resumes",
        description: "You don't know what to write yet.",
      },
      {
        title: "No-Response Job Hunters",
        description: "You apply but never hear back.",
      },
      {
        title: "Internship Seekers",
        description: "You want to pass ATS filters.",
      },
      {
        title: "Career Changers",
        description: "You want to frame experience the right way.",
      },
    ],
    learn: [
      "How recruiters scan resumes",
      "The sections that actually matter",
      "Writing impact statements",
      "Turning projects into bullets",
      "Avoiding ATS pitfalls",
      "Common resume mistakes",
    ],
    timeline: [
      {
        title: "Introduction",
        description: "How resumes really get read.",
      },
      {
        title: "Structure",
        description: "Layout recruiters expect.",
      },
      {
        title: "Writing Impact",
        description: "Turn tasks into results.",
      },
      {
        title: "ATS Checklist",
        description: "Pass the machine, impress the human.",
      },
      {
        title: "Q&A",
        description: "Feedback on your approach.",
      },
    ],
    includes: [
      {
        title: "Live Session",
        description: "A full resume reformatting walkthrough.",
      },
      {
        title: "Resume Template",
        description: "A recruiter-friendly starting point.",
      },
      {
        title: "Bullet Bank",
        description: "Phrases you can copy and adapt.",
      },
      {
        title: "Q&A Session",
        description: "Ask about your specific resume.",
      },
    ],
    faq: [
      {
        question: "Do I have experience to write?",
        answer: "Yes — we show you how to frame what you have.",
      },
      {
        question: "Is one page enough?",
        answer: "For students, yes — we'll show you how.",
      },
      {
        question: "Will it be recorded?",
        answer: "Yes, attendees get the template and notes.",
      },
    ],
    cta: "Coming Soon",
  },
  {
    slug: "workshop-005",
    number: "005",
    status: "coming-soon",
    title: "LinkedIn That Gets Noticed",
    description:
      "Optimise your profile, write a headline that sells you, and get noticed by recruiters — without feeling spammy.",
    duration: "TBA",
    platform: "Google Meet",
    price: "TBA",
    seats: "TBA",
    liveQa: "Interactive",
    heroLines: [
      { text: "LinkedIn That" },
      { text: "Gets Noticed", accent: true },
    ],
    audience: [
      {
        title: "Inactive Profiles",
        description: "You exist on LinkedIn but nobody sees you.",
      },
      {
        title: "Job Seekers",
        description: "You want recruiters to find you first.",
      },
      {
        title: "Networking Newbies",
        description: "You're unsure how to connect meaningfully.",
      },
      {
        title: "Students Building a Brand",
        description: "You want a profile that reflects your work.",
      },
    ],
    learn: [
      "Fixing your headline and photo",
      "Writing an 'About' that sells",
      "Optimising for recruiters",
      "Posting without feeling spammy",
      "Winning connection messages",
      "LinkedIn etiquette basics",
    ],
    timeline: [
      {
        title: "Introduction",
        description: "Why LinkedIn matters early.",
      },
      {
        title: "Profile Setup",
        description: "Headline, photo and banner.",
      },
      {
        title: "Content",
        description: "Share work without oversharing.",
      },
      {
        title: "Networking",
        description: "Reach out the right way.",
      },
      {
        title: "Action Plan + Q&A",
        description: "Leave with a clear next step.",
      },
    ],
    includes: [
      {
        title: "Live Session",
        description: "A guided LinkedIn makeover.",
      },
      {
        title: "Headline Bank",
        description: "Templates that get noticed.",
      },
      {
        title: "Message Templates",
        description: "Polite outreach done for you.",
      },
      {
        title: "Q&A Session",
        description: "Answers live at the end.",
      },
    ],
    faq: [
      {
        question: "Do I need 500+ connections?",
        answer: "No — quality connections beat numbers.",
      },
      {
        question: "Do I have to post often?",
        answer: "Not at first. We teach a realistic cadence.",
      },
      {
        question: "Will it be recorded?",
        answer: "Yes, and you keep the templates.",
      },
    ],
    cta: "Coming Soon",
  },
];