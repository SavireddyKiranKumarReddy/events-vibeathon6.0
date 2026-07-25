import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useMemo } from "react";
import { getEvent, submitAnswer } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { countdown, formatIST } from "@/lib/format";
import {
  CheckCircle2,
  Lock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Eye,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tech2")({
  head: () => ({
    meta: [
      { title: "Tech Event 2: IDOR Challenge — Vibeathon" },
      {
        name: "description",
        content: "Navigate through 100 pages. Find the hidden message left by a hacker.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 0,
  }),
  component: TechEvent2,
});

interface PageContent {
  title: string;
  category: string;
  body: string;
  special?: boolean;
}

const PAGES: PageContent[] = [
  // PAGE 0
  {
    title: "Welcome to TechPulse",
    category: "HOME",
    body: `<p class="text-lg">TechPulse is your daily source for the latest in technology, AI, cybersecurity, and developer culture.</p>
<p class="mt-4">We cover everything from cutting-edge research to practical tutorials — built for developers, by developers.</p>
<div class="mt-6 grid grid-cols-3 gap-4 text-center">
<div class="rounded-lg bg-white/5 p-4"><div class="text-2xl font-bold text-[#3b82f6]">500+</div><div class="text-xs text-white/50 mt-1">Articles</div></div>
<div class="rounded-lg bg-white/5 p-4"><div class="text-2xl font-bold text-[#22c55e]">50K+</div><div class="text-xs text-white/50 mt-1">Readers</div></div>
<div class="rounded-lg bg-white/5 p-4"><div class="text-2xl font-bold text-[#f97316]">100</div><div class="text-xs text-white/50 mt-1">Pages to explore</div></div>
</div>
<p class="mt-6 text-sm text-white/40">Start reading → Use the navigation to explore our content.</p>`,
  },
  // PAGE 1
  {
    title: "Vibeathon 6.0 — The Inside Story",
    category: "COMMUNITY",
    body: `<div class="space-y-3">
<div class="rounded-lg bg-white/5 p-3"><span class="text-[#22c55e] font-semibold">Rahul:</span> Hey, I'm participating in Vibeathon 6.0 — the vibecoding hackathon conducted by NXTGenSec!</div>
<div class="rounded-lg bg-white/5 p-3"><span class="text-[#3b82f6] font-semibold">Priya:</span> NXTGenSec? I haven't heard that name before. What do they do?</div>
<div class="rounded-lg bg-white/5 p-3"><span class="text-[#22c55e] font-semibold">Rahul:</span> They provide development services, AI & automation, and cybersecurity solutions. Plus they're building their own product called AwMate — an assistive workmate.</div>
<div class="rounded-lg bg-white/5 p-3"><span class="text-[#3b82f6] font-semibold">Priya:</span> Is it a product-based company or service-based?</div>
<div class="rounded-lg bg-white/5 p-3"><span class="text-[#22c55e] font-semibold">Rahul:</span> It's a mix of both, actually.</div>
<div class="rounded-lg bg-white/5 p-3"><span class="text-[#3b82f6] font-semibold">Priya:</span> Cool! I want to register too!</div>
<div class="rounded-lg bg-white/5 p-3"><span class="text-[#f97316] font-semibold">Rahul:</span> Sorry buddy, official registrations are closed. But you can still check out their work at nxtgensec.org</div>
</div>`,
  },
  // PAGE 2
  {
    title: "Connect With Us",
    category: "SOCIAL",
    body: `<p>Follow NXTGenSec and stay updated on upcoming events, tech drops, and community vibes.</p>
<div class="mt-6 space-y-3">
<a href="https://instagram.com/nxtgensec" target="_blank" class="flex items-center gap-3 rounded-lg bg-white/5 p-4 hover:bg-white/10 transition">
<div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">IG</div>
<div><div class="font-semibold">Instagram</div><div class="text-xs text-white/40">@nxtgensec — Behind the scenes, event recaps</div></div>
</a>
<a href="https://linkedin.com/company/nxtgensec" target="_blank" class="flex items-center gap-3 rounded-lg bg-white/5 p-4 hover:bg-white/10 transition">
<div class="w-10 h-10 rounded-full bg-[#0077b5] flex items-center justify-center font-bold text-sm">IN</div>
<div><div class="font-semibold">LinkedIn</div><div class="text-xs text-white/40">NXTGenSec — Professional updates & hiring</div></div>
</a>
<a href="https://x.com/nxtgensec" target="_blank" class="flex items-center gap-3 rounded-lg bg-white/5 p-4 hover:bg-white/10 transition">
<div class="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center font-bold text-sm">X</div>
<div><div class="font-semibold">X (Twitter)</div><div class="text-xs text-white/40">@nxtgensec — Quick takes & tech threads</div></div>
</a>
<a href="#" class="flex items-center gap-3 rounded-lg bg-white/5 p-4 hover:bg-white/10 transition">
<div class="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center font-bold text-sm">WA</div>
<div><div class="font-semibold">WhatsApp Community</div><div class="text-xs text-white/40">Join the community — network with participants</div></div>
</a>
</div>`,
  },
  // PAGE 3
  {
    title: "What is Vibecoding?",
    category: "GUIDE",
    body: `<p>Vibecoding is the art of building software by describing your intent to an AI — then iterating through natural language prompts until it works. No boilerplate. No syntax hunting. Just pure ideas to execution.</p>
<h3 class="mt-4 font-semibold text-[#3b82f6]">The Process</h3>
<ol class="mt-2 space-y-2 list-decimal list-inside text-white/70">
<li><strong class="text-white">Describe</strong> — Tell the AI what you want to build in plain English</li>
<li><strong class="text-white">Generate</strong> — AI produces the initial code structure</li>
<li><strong class="text-white">Iterate</strong> — Refine with follow-up prompts until it's right</li>
<li><strong class="text-white">Deploy</strong> — Ship it live. Yes, really.</li>
</ol>
<h3 class="mt-4 font-semibold text-[#22c55e]">Tools to Try</h3>
<div class="mt-2 flex flex-wrap gap-2">
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Lovable</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Cursor</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">v0 by Vercel</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Bolt.new</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Replit Agent</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Windsurf</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">GitHub Copilot</span>
</div>`,
  },
  // PAGE 4 - THE CLUE
  {
    title: "The Anomaly",
    category: "SECURITY",
    body: `<div class="rounded-lg border border-[#f97316]/30 bg-[#f97316]/5 p-6">
<p class="text-sm uppercase tracking-widest text-[#f97316]">⚠ Anomalous content detected on this page</p>
<p class="mt-3 text-white/70">Our security team noticed something unusual in the page metadata. A message was embedded by an unauthorized visitor. Here's what they left:</p>
</div>
<div class="mt-6 rounded-lg border border-white/10 bg-white/5 p-6 font-mono text-sm">
<p class="text-white/50">// anonymous_note.txt</p>
<p class="mt-2 text-[#22c55e]">"Dear curious one,</p>
<p class="text-[#22c55e]">I left something interesting on another page of this site.</p>
<p class="text-[#22c55e]">To find it, solve my puzzle:</p>
<p class="mt-3 text-white">My lucky numbers are: <span class="text-[#3b82f6] font-bold">4</span>, <span class="text-[#3b82f6] font-bold">8</span>, and <span class="text-[#3b82f6] font-bold">16</span></p>
<p class="text-white">My <span class="text-[#f97316] font-bold">favorite</span> number is <span class="text-[#f97316] font-bold text-lg">4</span></p>
<p class="mt-2 text-white">When you add my <span class="text-[#f97316]">favorite</span> to my <span class="text-[#3b82f6]">largest</span> lucky number...</p>
<p class="text-white">...you'll find where I made my mark.</p>
<p class="mt-3 text-[#22c55e]">Can you crack it?"</p>
</div>
<div class="mt-4 rounded-lg bg-white/5 p-4 text-center">
<p class="text-xs text-white/30">Hint: The answer is a page number. Navigate there using the URL parameter.</p>
</div>`,
  },
  // PAGE 5
  {
    title: "GPT-5 Rumors: What We Know",
    category: "AI NEWS",
    body: `<p>OpenAI's next-generation model is reportedly in late-stage testing. Here's what the rumor mill suggests:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li>Native multimodal — processes text, images, audio, and video in a single pass</li>
<li>10x context window over GPT-4 — potentially 1M+ tokens</li>
<li>Real-time reasoning with persistent memory across sessions</li>
<li>Native tool use without explicit function calling syntax</li>
</ul>
<p class="mt-3 text-sm text-white/40">Sources: Anonymous insiders + industry analysis. Take with a grain of salt.</p>`,
  },
  // PAGE 6
  {
    title: "Prompt Engineering is Not Dead",
    category: "AI",
    body: `<p>Every few months someone declares prompt engineering obsolete. Here's why it's not:</p>
<p class="mt-2 text-white/70">As models get smarter, the <em>quality</em> of your prompts matters more, not less. The difference between a mediocre and an expert prompt can mean 10x output quality.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Key Principles</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Be specific about format, tone, and constraints</li>
<li>• Use few-shot examples for complex tasks</li>
<li>• Chain your reasoning — don't ask for everything at once</li>
<li>• Test edge cases. Models fail silently.</li>
</ul>`,
  },
  // PAGE 7
  {
    title: "The Rise of Local AI Models",
    category: "AI",
    body: `<p>Running AI models locally is no longer a hobby — it's becoming a necessity. Privacy concerns, latency requirements, and cost control are driving the shift.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Top Local Models Right Now</h3>
<div class="mt-2 space-y-2">
<div class="rounded bg-white/5 p-2"><strong>Llama 3.1 405B</strong> — Meta's flagship. Competitive with GPT-4.</div>
<div class="rounded bg-white/5 p-2"><strong>Mistral Large</strong> — European alternative. Strong multilingual.</div>
<div class="rounded bg-white/5 p-2"><strong>Gemma 2</strong> — Google's open model. Great for research.</div>
<div class="rounded bg-white/5 p-2"><strong>Phi-3</strong> — Microsoft's small but mighty model.</div>
</div>`,
  },
  // PAGE 8
  {
    title: "CSS Has Changed Forever",
    category: "WEB DEV",
    body: `<p>The CSS landscape in 2025-26 is unrecognizable from just two years ago.</p>
<h3 class="mt-3 font-semibold text-[#f97316]">New Features You Should Be Using</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• <strong>Container Queries</strong> — Components that respond to their parent, not the viewport</li>
<li>• <strong>View Transitions API</strong> — Native page transitions without JS frameworks</li>
<li>• <strong>:has() selector</strong> — The "parent selector" we waited 15 years for</li>
<li>• <strong>CSS Nesting</strong> — Native nesting, no preprocessor needed</li>
<li>• <strong>Anchor Positioning</strong> — Position elements relative to any other element</li>
</ul>`,
  },
  // PAGE 9
  {
    title: "Zero Trust Architecture Explained",
    category: "SECURITY",
    body: `<p>Zero Trust isn't a product — it's a philosophy. The core principle: <strong>never trust, always verify.</strong></p>
<p class="mt-2 text-white/70">In traditional security, once you're inside the network perimeter, you're trusted. Zero Trust flips this. Every request is authenticated, authorized, and encrypted — regardless of origin.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Core Pillars</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Verify explicitly (identity, device, location)</li>
<li>• Use least privilege access</li>
<li>• Assume breach — segment access</li>
</ul>
<p class="mt-3 text-sm text-white/40">Implemented by Google BeyondCorp, Microsoft Entra, and Cloudflare Access.</p>`,
  },
  // PAGE 10
  {
    title: "Why TypeScript Won",
    category: "WEB DEV",
    body: `<p>TypeScript's adoption curve has been the most dramatic in frontend history. Here's why it became the default:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Refactoring confidence</strong> — Change a type, see every break instantly</li>
<li><strong class="text-white">IDE intelligence</strong> — Autocomplete that actually works</li>
<li><strong class="text-white">Documentation as code</strong> — Types tell you what functions expect</li>
<li><strong class="text-white">Gradual adoption</strong> — You can start with .js files and migrate incrementally</li>
</ul>
<p class="mt-3 text-sm text-white/40">Fun fact: TypeScript was created by Anders Hejlsberg, the same person who created C#.</p>`,
  },
  // PAGE 11
  {
    title: "Rust is Eating the World",
    category: "PROGRAMMING",
    body: `<p>From Linux kernel modules to JavaScript runtimes, Rust is quietly replacing C/C++ everywhere performance matters.</p>
<h3 class="mt-3 font-semibold text-[#f97316]">Where Rust is Dominating</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• <strong>System programming</strong> — Linux kernel, Windows kernel</li>
<li>• <strong>Web infrastructure</strong> — Cloudflare Workers, Fastly Compute</li>
<li>• <strong>Developer tools</strong> — SWC, Turbopack, Biome</li>
<li>• <strong>Browser engines</strong> — Servo components in Firefox</li>
<li>• <strong>Blockchain</strong> — Solana, Polkadot</li>
</ul>
<p class="mt-3 text-white/70">The borrow checker is harsh but fair. Once it clicks, you write better code in every language.</p>`,
  },
  // PAGE 12
  {
    title: "The 10x Developer Myth",
    category: "CULTURE",
    body: `<p>The "10x developer" is one of tech's most debated concepts. Here's a nuanced take:</p>
<p class="mt-2 text-white/70">10x isn't about typing speed or LeetCode scores. It's about <strong>impact</strong> — the ability to see the right problem, design the right solution, and communicate it clearly.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">What Actually Creates 10x Impact</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Avoiding unnecessary work (saying no to wrong solutions)</li>
<li>• Writing code that others can understand and maintain</li>
<li>• Identifying and fixing systemic issues before they cascade</li>
<li>• Mentoring — making the whole team better</li>
</ul>`,
  },
  // PAGE 13
  {
    title: "Docker in 30 Seconds",
    category: "DEVOPS",
    body: `<p>Docker containers package your app with everything it needs to run — OS, libraries, dependencies. "Works on my machine" becomes "works everywhere."</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Essential Commands</h3>
<div class="mt-2 rounded-lg bg-black/50 p-3 font-mono text-sm text-[#22c55e]">
<div>docker build -t myapp .</div>
<div>docker run -p 3000:3000 myapp</div>
<div>docker compose up -d</div>
<div>docker ps</div>
<div>docker logs -f container_id</div>
</div>
<p class="mt-3 text-sm text-white/40">Pro tip: Use multi-stage builds to reduce image size by 80%+.</p>`,
  },
  // PAGE 14
  {
    title: "API Design Best Practices",
    category: "WEB DEV",
    body: `<p>A well-designed API is invisible. A bad one causes endless support tickets.</p>
<h3 class="mt-3 font-semibold text-[#f97316]">Golden Rules</h3>
<ul class="mt-2 space-y-2 text-white/70">
<li><strong class="text-white">Use nouns, not verbs</strong> — GET /users, not GET /getUser</li>
<li><strong class="text-white">Version your API</strong> — /api/v1/ from day one</li>
<li><strong class="text-white">Return proper status codes</strong> — 201 Created, 404 Not Found, 422 Validation Error</li>
<li><strong class="text-white">Paginate list endpoints</strong> — Never return 100K rows</li>
<li><strong class="text-white">Rate limit everything</strong> — Protect your infrastructure</li>
</ul>`,
  },
  // PAGE 15
  {
    title: "SQL Injection: Still Alive in 2026",
    category: "SECURITY",
    body: `<p>Despite being one of the oldest attack vectors, SQL injection still appears in ~8% of all web applications.</p>
<p class="mt-2 text-white/70">The reason? Developers still concatenate user input into queries instead of using parameterized statements.</p>
<h3 class="mt-3 font-semibold text-[#ef4444]">Vulnerable Code</h3>
<div class="mt-1 rounded bg-red-950/30 p-2 font-mono text-sm text-red-400">query("SELECT * FROM users WHERE id=" + userId)</div>
<h3 class="mt-3 font-semibold text-[#22c55e]">Safe Code</h3>
<div class="mt-1 rounded bg-green-950/30 p-2 font-mono text-sm text-green-400">query("SELECT * FROM users WHERE id=$1", [userId])</div>
<p class="mt-3 text-sm text-white/40">Always use prepared statements. No exceptions.</p>`,
  },
  // PAGE 16
  {
    title: "The State of WebAssembly",
    category: "WEB DEV",
    body: `<p>WebAssembly (Wasm) is quietly becoming the universal runtime — not just for browsers anymore.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Where Wasm Runs Now</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Browsers (original use case)</li>
<li>• Server-side via Wasmtime, Wasmer</li>
<li>• Edge computing (Cloudflare Workers, Fermyon)</li>
<li>• Plugin systems (Figma, Zed editor)</li>
<li>• Blockchain smart contracts (Near, Polkadot)</li>
</ul>
<p class="mt-3 text-white/70">The Component Model proposal could make Wasm modules composable like npm packages.</p>`,
  },
  // PAGE 17
  {
    title: "Git Tips Nobody Told You",
    category: "DEV TOOLS",
    body: `<p>Beyond add/commit/push, Git has superpowers most developers never discover.</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-3"><code class="text-[#22c55e]">git stash -p</code> — Stash individual hunks, not entire files</div>
<div class="rounded bg-white/5 p-3"><code class="text-[#22c55e]">git log --graph --oneline --all</code> — Visual branch history</div>
<div class="rounded bg-white/5 p-3"><code class="text-[#22c55e]">git bisect</code> — Binary search to find which commit introduced a bug</div>
<div class="rounded bg-white/5 p-3"><code class="text-[#22c55e]">git commit --fixup &lt;sha&gt;</code> — Mark a commit as a fix, then autosquash</div>
<div class="rounded bg-white/5 p-3"><code class="text-[#22c55e]">git reflog</code> — Rescue "lost" commits. Your safety net.</div>
</div>`,
  },
  // PAGE 18
  {
    title: "Why Developers Should Write",
    category: "CAREER",
    body: `<p>Writing is thinking made visible. If you can explain a technical concept clearly, you understand it deeply.</p>
<p class="mt-2 text-white/70">Technical writing isn't about SEO or clout — it's a <strong>career accelerator</strong>. The developers who write are the ones who get noticed, trusted, and promoted.</p>
<h3 class="mt-3 font-semibold text-[#f97316]">Start Here</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Write about what you just learned (fresh perspective is valuable)</li>
<li>• Explain it to a junior developer (your target audience)</li>
<li>• Keep it short — 5-minute reads are perfect</li>
<li>• Share on dev.to, Hashnode, or your own blog</li>
</ul>`,
  },
  // PAGE 19
  {
    title: "Almost There...",
    category: "SYSTEM",
    body: `<div class="rounded-lg border border-white/10 bg-white/5 p-6">
<p class="text-sm uppercase tracking-widest text-white/40">System log entry #2847</p>
<p class="mt-3 text-white/70">Our monitoring detected unusual access patterns on page 20. An unauthorized visitor left content there before our security team could respond.</p>
<p class="mt-2 text-white/70">We've locked the affected page. Content inspection pending.</p>
<p class="mt-3 text-sm text-white/30">If you're reading this, you're close to something interesting. Keep going.</p>
</div>`,
  },
  // PAGE 20 - THE HACKED PAGE
  {
    title: "COMPROMISED",
    category: "⚠ SECURITY BREACH",
    special: true,
    body: `<div class="border-2 border-red-500/50 rounded-lg bg-red-950/20 p-6 relative overflow-hidden">
<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
<div class="flex items-center gap-2 mb-4">
<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
<span class="font-bold text-red-400 uppercase tracking-wider text-sm">Page Compromised — Security Breach Detected</span>
</div>
<div class="font-mono text-sm space-y-1 text-red-300/80">
<div>// ─── UNAUTHORIZED ACCESS LOG ───</div>
<div>// Timestamp: 2026-07-25T12:00:00Z</div>
<div>// Origin: Unknown</div>
<div>// Method: IDOR via page parameter manipulation</div>
<div>// ───────────────────────────────</div>
</div>
<div class="mt-6 rounded-lg bg-black/40 p-5 border border-red-500/20">
<p class="font-mono text-xs text-red-400/60 mb-3">[ENCRYPTED MESSAGE FROM ATTacker]</p>
<p class="text-lg text-white leading-relaxed">"Gotcha. You found me.</p>
<p class="text-lg text-white leading-relaxed">This is what happens when developers expose internal page IDs without authorization checks. A simple URL parameter — and I'm in.</p>
<p class="text-lg text-white leading-relaxed mt-2">The lesson? Always validate permissions server-side. Never trust client-provided identifiers. Every request must be authenticated and authorized.</p>
<p class="text-lg text-white leading-relaxed mt-2">I could have done worse. Consider this a free security audit.</p>
<p class="mt-3 text-[#f97316] font-semibold">— Agent_X"</p>
<p class="mt-4 text-xs text-white/30">P.S. My flag: <span class="text-[#22c55e] font-mono">NXTGenSec_Patched_2026</span></p>
</div>
<div class="mt-4 rounded bg-white/5 p-3">
<p class="text-xs text-white/40">This page demonstrates an Insecure Direct Object Reference (IDOR) vulnerability. The attacker manipulated the page parameter to access an internal resource that should have been protected.</p>
</div>
</div>`,
  },
  // PAGE 21
  {
    title: "Kubernetes is Overkill (Sometimes)",
    category: "DEVOPS",
    body: `<p>K8s is powerful, but not every project needs it. Here's when to use it — and when not to.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Use Kubernetes When</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• You have multiple services that need orchestration</li>
<li>• You need auto-scaling and self-healing</li>
<li>• Your team has ops expertise (or you're paying for managed K8s)</li>
</ul>
<h3 class="mt-3 font-semibold text-[#f97316]">Skip It When</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• You're a small team with a simple deployment</li>
<li>• A PaaS (Railway, Render, Fly.io) does the job</li>
<li>• You'd spend more time on K8s config than actual features</li>
</ul>`,
  },
  // PAGE 22
  {
    title: "The Authentication Landscape",
    category: "SECURITY",
    body: `<p>Auth in 2026 has never been more complex — or more important.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Modern Auth Stack</h3>
<div class="mt-2 space-y-2 text-white/70">
<div class="rounded bg-white/5 p-2"><strong class="text-white">Passkeys</strong> — FIDO2/WebAuthn. Phishing-resistant. The future.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">OAuth 2.1</strong> — Simplified flows, PKCE everywhere, no more implicit grant.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Session tokens</strong> — HTTP-only cookies still beat localStorage for security.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">MFA</strong> — TOTP > SMS. Always.</div>
</div>`,
  },
  // PAGE 23
  {
    title: "React Server Components: The Real Story",
    category: "WEB DEV",
    body: `<p>RSCs aren't just about performance — they're about changing how we think about the server/client boundary.</p>
<p class="mt-2 text-white/70">The key insight: not every component needs to be interactive. Most UI is static. RSCs let you send zero JS for those parts.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">When to Use Server Components</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Data fetching (no useEffect, no loading states)</li>
<li>• Static content (blog posts, product pages)</li>
<li>• Layout components that don't need interactivity</li>
</ul>
<h3 class="mt-3 font-semibold text-[#f97316]">Keep Client Components For</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Forms, modals, toggles — anything interactive</li>
<li>• Browser-only APIs (localStorage, geolocation)</li>
<li>• State-dependent UI (active tabs, accordions)</li>
</ul>`,
  },
  // PAGE 24
  {
    title: "The Database Wars: 2026 Edition",
    category: "BACKEND",
    body: `<p>The database landscape keeps evolving. Here's what's hot:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-3"><strong class="text-[#3b82f6]">PostgreSQL</strong> — Still the king. JSONB, pgvector for AI, and the extension ecosystem make it unbeatable for most use cases.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#22c55e]">Turso (libSQL)</strong> — Edge-first SQLite. Branching, replication, embedded deployments.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#f97316]">ClickHouse</strong> — Analytics at insane speed. Replaces your warehouse.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">DuckDB</strong> — SQLite for analytics. Run it in your browser, literally.</div>
</div>`,
  },
  // PAGE 25
  {
    title: "How to Read Code Effectively",
    category: "CAREER",
    body: `<p>You'll spend 10x more time reading code than writing it. Here's how to get better at it:</p>
<ol class="mt-3 space-y-2 list-decimal list-inside text-white/70">
<li><strong class="text-white">Start from the entry point</strong> — Follow the call stack, not the alphabet</li>
<li><strong class="text-white">Read tests first</strong> — They tell you what the code is supposed to do</li>
<li><strong class="text-white">Trace the data flow</strong> — Where does data enter, transform, and exit?</li>
<li><strong class="text-white">Don't try to understand everything</strong> — Focus on the relevant path</li>
<li><strong class="text-white">Take notes</strong> — Diagrams beat mental models</li>
</ol>`,
  },
  // PAGES 26-30: Programming Languages
  {
    title: "Python's GIL is Finally Optional",
    category: "PYTHON",
    body: `<p>PEP 703 made the Global Interpreter Lock optional in Python 3.13. This is the single biggest change to Python's concurrency model in its 30+ year history.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">What This Means</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• True multi-threaded parallelism for CPU-bound tasks</li>
<li>• No more multiprocessing workarounds for simple parallelism</li>
<li>• Backward compatible — existing code works unchanged</li>
</ul>
<p class="mt-3 text-sm text-white/40">The free-threaded build is experimental in 3.13, expected stable by 3.14.</p>`,
  },
  {
    title: "Go 2.0: What's Different",
    category: "GO",
    body: `<p>Go 2.0 finally brought the language features developers have been requesting for a decade:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Generics</strong> — Type parameters for functions and types</li>
<li><strong class="text-white">Error handling improvements</strong> — try/result patterns</li>
<li><strong class="text-white">Range over integers</strong> — for i := range 10 { }</li>
<li><strong class="text-white">WebAssembly target</strong> — First-class WASM support</li>
</ul>
<p class="mt-3 text-white/70">Go remains the language of choice for CLI tools, microservices, and cloud infrastructure.</p>`,
  },
  {
    title: "Why Zig is Interesting",
    category: "SYSTEMS",
    body: `<p>Zig is a systems language that competes with C — not by adding complexity, but by removing it.</p>
<p class="mt-2 text-white/70">No hidden allocations. No hidden control flow. No hidden function calls. What you write is what runs.</p>
<h3 class="mt-3 font-semibold text-[#f97316]">Killer Features</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Compile-time execution (replaces macros and codegen)</li>
<li>• Cross-compilation as a first-class feature</li>
<li>• C interop that actually works seamlessly</li>
<li>• Error handling with explicit unions</li>
</ul>`,
  },
  {
    title: "TypeScript 6.0 Highlights",
    category: "TYPESCRIPT",
    body: `<p>The latest TypeScript release brings quality-of-life improvements:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">satisfies operator improvements</strong> — Better type narrowing</li>
<li><strong class="text-white">const type parameters</strong> — Infer literal types automatically</li>
<li><strong class="text-white">Decorators (Stage 3)</strong> — Standardized, no more experimental flag</li>
<li><strong class="text-white">Import attributes</strong> — import data from "./file.json" with { type: "json" }</li>
</ul>
<p class="mt-3 text-sm text-white/40">TypeScript continues to be the most actively maintained language on GitHub.</p>`,
  },
  {
    title: "The Rise of Mojo",
    category: "AI / SYSTEMS",
    body: `<p>Mojo combines Python's ease of use with systems-level performance. It's designed specifically for AI/ML workloads.</p>
<p class="mt-2 text-white/70">Key claim: up to 35,000x faster than Python for certain operations. That's not a typo.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Why It Matters for AI</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Write ML kernels in a Python-like syntax</li>
<li>• Native GPU support without CUDA bindings</li>
<li>• Compile to optimized machine code</li>
<li>• Interop with existing Python libraries</li>
</ul>`,
  },
  // PAGES 31-35: More Security
  {
    title: "OWASP Top 10 (2025 Update)",
    category: "SECURITY",
    body: `<p>The OWASP Top 10 gets refreshed every few years. The 2025 edition reflects modern threat patterns:</p>
<ol class="mt-3 space-y-1 list-decimal list-inside text-white/70">
<li><strong class="text-white">Broken Access Control</strong> (moved up from #5)</li>
<li><strong class="text-white">Cryptographic Failures</strong></li>
<li><strong class="text-white">Injection</strong></li>
<li><strong class="text-white">Insecure Design</strong></li>
<li><strong class="text-white">Security Misconfiguration</strong></li>
<li><strong class="text-white">Vulnerable Components</strong></li>
<li><strong class="text-white">Authentication Failures</strong></li>
<li><strong class="text-white">Data Integrity Failures</strong></li>
<li><strong class="text-white">Logging Failures</strong></li>
<li><strong class="text-white">SSRF</strong></li>
</ol>
<p class="mt-3 text-sm text-white/40">Notice: IDOR falls under "Broken Access Control" — the #1 vulnerability.</p>`,
  },
  {
    title: "Bug Bounty Hunting for Beginners",
    category: "SECURITY",
    body: `<p>Bug bounty programs let you earn money for finding vulnerabilities. Here's how to start:</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Step-by-Step</h3>
<ol class="mt-2 space-y-1 list-decimal list-inside text-white/70">
<li>Learn web fundamentals (HTTP, cookies, auth flows)</li>
<li>Master browser DevTools (Network tab is your best friend)</li>
<li>Study the OWASP Top 10</li>
<li>Practice on HackerOne CTF and PortSwigger WebSecurity</li>
<li>Start with public programs on HackerOne and Bugcrowd</li>
</ol>
<p class="mt-3 text-sm text-white/40">Average bounty for critical: $5,000-$50,000+. Top hunters earn 6 figures annually.</p>`,
  },
  {
    title: "CSRF is Not Dead",
    category: "SECURITY",
    body: `<p>Cross-Site Request Forgery might sound old-school, but it still catches modern apps off guard.</p>
<p class="mt-2 text-white/70">Especially dangerous with: state-changing API calls, admin panels, and payment endpoints.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Modern Defenses</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• SameSite cookies (Lax or Strict)</li>
<li>• CSRF tokens for state-changing operations</li>
<li>• Origin/Referer header validation</li>
<li>• Double-submit cookie pattern</li>
</ul>`,
  },
  {
    title: "Securing Your Docker Containers",
    category: "SECURITY",
    body: `<p>Docker images are attack vectors. Here's how to harden them:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Use distroless images</strong> — No shell, no package manager, minimal attack surface</li>
<li><strong class="text-white">Scan with Trivy</strong> — <code>trivy image myapp:latest</code> finds CVEs</li>
<li><strong class="text-white">Don't run as root</strong> — USER directive in Dockerfile</li>
<li><strong class="text-white">Pin versions</strong> — Never use :latest in production</li>
<li><strong class="text-white">Read-only filesystem</strong> — --read-only flag</li>
</ul>`,
  },
  {
    title: "Network Fundamentals for Developers",
    category: "SECURITY",
    body: `<p>You don't need to be a network engineer, but understanding these concepts will make you a better developer:</p>
<div class="mt-3 space-y-2 text-white/70">
<div class="rounded bg-white/5 p-2"><strong class="text-white">DNS</strong> — How domain names become IP addresses</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">TLS/SSL</strong> — How HTTPS actually works (the handshake)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">HTTP/2 & HTTP/3</strong> — Multiplexing, header compression, QUIC</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">CDN</strong> — Why your assets load fast from everywhere</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">WebSocket vs SSE</strong> — Real-time communication patterns</div>
</div>`,
  },
  // PAGES 36-40: AI Deep Dives
  {
    title: "How Transformers Actually Work",
    category: "AI / DEEP DIVE",
    body: `<p>The Transformer architecture (2017) revolutionized AI. Here's the intuition:</p>
<p class="mt-2 text-white/70">Instead of processing tokens sequentially (like RNNs), Transformers process all tokens simultaneously using <strong>self-attention</strong> — letting each token look at every other token to understand context.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Key Components</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• <strong>Token Embedding</strong> — Convert words to vectors</li>
<li>• <strong>Positional Encoding</strong> — Tell the model about word order</li>
<li>• <strong>Multi-Head Attention</strong> — Parallel pattern matching</li>
<li>• <strong>Feed-Forward Network</strong> — Transform the representations</li>
<li>• <strong>Layer Normalization</strong> — Stabilize training</li>
</ul>`,
  },
  {
    title: "RAG vs Fine-Tuning",
    category: "AI",
    body: `<p>When to use Retrieval-Augmented Generation vs. fine-tuning your model:</p>
<div class="mt-3 grid grid-cols-2 gap-3">
<div class="rounded bg-[#3b82f6]/10 p-3">
<div class="font-semibold text-[#3b82f6]">RAG</div>
<ul class="mt-2 space-y-1 text-sm text-white/70">
<li>• Knowledge changes frequently</li>
<li>• You need source attribution</li>
<li>• Large, structured knowledge base</li>
<li>• No GPU budget for training</li>
</ul>
</div>
<div class="rounded bg-[#f97316]/10 p-3">
<div class="font-semibold text-[#f97316]">Fine-Tuning</div>
<ul class="mt-2 space-y-1 text-sm text-white/70">
<li>• Specific tone/style/format</li>
<li>• Domain-specific reasoning</li>
<li>• Consistent behavior patterns</li>
<li>• Low latency requirements</li>
</ul>
</div>
</div>
<p class="mt-3 text-sm text-white/40">Most production systems use both. RAG for knowledge, fine-tuning for behavior.</p>`,
  },
  {
    title: "AI Agents: Beyond Chatbots",
    category: "AI",
    body: `<p>AI agents can plan, use tools, and take actions autonomously. This changes everything.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Agent Architecture</h3>
<div class="mt-2 space-y-1 text-white/70">
<div class="rounded bg-white/5 p-2"><strong>1. Observe</strong> — Agent receives input from environment</div>
<div class="rounded bg-white/5 p-2"><strong>2. Think</strong> — LLM reasons about what to do next</div>
<div class="rounded bg-white/5 p-2"><strong>3. Act</strong> — Agent executes tools (search, code, APIs)</div>
<div class="rounded bg-white/5 p-2"><strong>4. Reflect</strong> — Agent evaluates results and decides next step</div>
</div>
<p class="mt-3 text-white/70">Frameworks: LangGraph, CrewAI, AutoGen, OpenAI Assistants API.</p>`,
  },
  {
    title: "Vector Databases Explained",
    category: "AI / DATA",
    body: `<p>Vector databases store embeddings — high-dimensional representations of data that capture semantic meaning.</p>
<p class="mt-2 text-white/70">When you search "best Italian restaurant near me," a vector database finds places whose descriptions are semantically close to your query, even if they don't contain the exact words.</p>
<h3 class="mt-3 font-semibold text-[#f97316]">Popular Options</h3>
<div class="mt-2 flex flex-wrap gap-2">
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Pinecone</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Weaviate</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Qdrant</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Chroma</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">pgvector</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Milvus</span>
</div>`,
  },
  {
    title: "The Ethics of AI-Generated Code",
    category: "AI / ETHICS",
    body: `<p>When AI writes your code, who owns it? Who's responsible when it breaks? These aren't hypothetical questions.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Open Questions</h3>
<ul class="mt-2 space-y-2 text-white/70">
<li><strong class="text-white">Licensing</strong> — Is AI-generated code a derivative of its training data?</li>
<li><strong class="text-white">Liability</strong> — If AI code has a security vulnerability, who's liable?</li>
<li><strong class="text-white">Attribution</strong> — Should AI-generated code be disclosed?</li>
<li><strong class="text-white">Bias</strong> — AI might reproduce biases from training data into critical systems</li>
</ul>
<p class="mt-3 text-sm text-white/40">Best practice: Always review AI-generated code. Treat it like code from a junior developer — useful but needs oversight.</p>`,
  },
  // PAGES 41-45: Mobile & Frontend
  {
    title: "React Native vs Flutter in 2026",
    category: "MOBILE",
    body: `<p>The cross-platform debate continues. Here's where each stands:</p>
<div class="mt-3 grid grid-cols-2 gap-3">
<div class="rounded bg-[#3b82f6]/10 p-3">
<div class="font-semibold text-[#3b82f6]">React Native</div>
<ul class="mt-2 space-y-1 text-sm text-white/70">
<li>• New Architecture (Fabric + TurboModules)</li>
<li>• Hermes engine as default</li>
<li>• Expo makes it almost effortless</li>
<li>• Huge ecosystem, easy hiring</li>
</ul>
</div>
<div class="rounded bg-[#22c55e]/10 p-3">
<div class="font-semibold text-[#22c55e]">Flutter</div>
<ul class="mt-2 space-y-1 text-sm text-white/70">
<li>• Pixel-perfect UI across platforms</li>
<li>• Dart is easy to learn</li>
<li>• Impeller renderer (no more jank)</li>
<li>• Web + desktop from single codebase</li>
</ul>
</div>
</div>`,
  },
  {
    title: "HTMX: The Return of Server-Side",
    category: "WEB DEV",
    body: `<p>HTMX lets you build dynamic UIs with HTML attributes instead of JavaScript. It's a return to server-side rendering — but done right.</p>
<div class="mt-3 rounded-lg bg-black/50 p-3 font-mono text-sm text-[#22c55e]">
<div>&lt;button hx-post="/api/like"</div>
<div>&nbsp;&nbsp;hx-target="#count"</div>
<div>&nbsp;&nbsp;hx-swap="innerHTML"&gt;</div>
<div>&nbsp;&nbsp;Like this post</div>
<div>&lt;/button&gt;</div>
</div>
<p class="mt-3 text-white/70">No build step. No JavaScript framework. No hydration. Just HTML that works.</p>`,
  },
  {
    title: "CSS Container Queries in Depth",
    category: "WEB DEV",
    body: `<p>Media queries respond to the viewport. Container queries respond to the parent. This changes everything for component design.</p>
<div class="mt-3 rounded-lg bg-black/50 p-3 font-mono text-sm text-[#3b82f6]">
<div>.card-container {</div>
<div>&nbsp;&nbsp;container-type: inline-size;</div>
<div>}</div>
<div><br></div>
<div>@container (min-width: 400px) {</div>
<div>&nbsp;&nbsp;.card { display: flex; }</div>
<div>}</div>
</div>
<p class="mt-3 text-white/70">Now your card component adapts to its container — not the screen. Perfect for design systems.</p>`,
  },
  {
    title: "Micro-Frontends: Worth the Complexity?",
    category: "WEB DEV",
    body: `<p>Micro-frontends let teams own and deploy pieces of a UI independently. Sounds great in theory.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">When It Makes Sense</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Large org, multiple teams, different tech stacks</li>
<li>• You need independent deploy cycles</li>
<li>• Legacy migration (wrap old apps in new shell)</li>
</ul>
<h3 class="mt-3 font-semibold text-[#ef4444]">When It Doesn't</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Small team (you'll spend more time on infra than features)</li>
<li>• Single tech stack across the app</li>
<li>• You haven't exhausted monorepo benefits</li>
</ul>`,
  },
  {
    title: "Performance Budgets That Actually Work",
    category: "WEB DEV",
    body: `<p>A performance budget is a set of limits on metrics that affect site performance. Here's how to make one that your team will follow:</p>
<h3 class="mt-3 font-semibold text-[#f97316]">Recommended Budgets</h3>
<div class="mt-2 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-white">LCP</strong> &lt; 2.5s (Largest Contentful Paint)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">FID</strong> &lt; 100ms (First Input Delay)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">CLS</strong> &lt; 0.1 (Cumulative Layout Shift)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Bundle size</strong> &lt; 200KB gzipped (initial JS)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Total page weight</strong> &lt; 1MB</div>
</div>`,
  },
  // PAGES 46-50: Cloud & Infrastructure
  {
    title: "Serverless in 2026: The Honest Truth",
    category: "CLOUD",
    body: `<p>Serverless has matured. Here's what actually works and what doesn't:</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Great For</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• APIs and webhooks with variable traffic</li>
<li>• Background jobs and cron tasks</li>
<li>• Event-driven architectures</li>
</ul>
<h3 class="mt-3 font-semibold text-[#ef4444]">Painful For</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Long-running processes (15min limit on most providers)</li>
<li>• WebSocket connections (possible but complex)</li>
<li>• Debugging — distributed tracing is still hard</li>
</ul>`,
  },
  {
    title: "PostgreSQL Tips That Save Hours",
    category: "DATABASE",
    body: `<p>PostgreSQL is the developer's database. Here are tips that will save you hours of debugging:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">EXPLAIN ANALYZE</code> — Always. Before optimizing anything.</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">CREATE INDEX CONCURRENTLY</code> — Don't lock your table while indexing</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">pg_stat_statements</code> — Find slow queries automatically</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">JSONB</strong> — Store flexible data without schema migration</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">CTEs with recursion</code> — Graph traversal in pure SQL</div>
</div>`,
  },
  {
    title: "Edge Computing Explained",
    category: "CLOUD",
    body: `<p>Edge computing moves computation closer to users. Instead of one data center, your code runs in 200+ locations worldwide.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Edge Platforms</h3>
<div class="mt-2 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-white">Cloudflare Workers</strong> — V8 isolates. 0ms cold starts. Free tier is generous.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Vercel Edge Functions</strong> — Integrates with Next.js. Deploy with git push.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Deno Deploy</strong> — TypeScript-first. Global distribution. KV storage built-in.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Fly.io</strong> — Containers at the edge. Full VM control. Great for databases too.</div>
</div>`,
  },
  {
    title: "Monitoring and Observability",
    category: "DEVOPS",
    body: `<p>Monitoring tells you when something's broken. Observability tells you why. Here's the modern stack:</p>
<h3 class="mt-3 font-semibold text-[#f97316]">The Three Pillars</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li><strong class="text-white">Logs</strong> — What happened (structured JSON, not printf)</li>
<li><strong class="text-white">Metrics</strong> — How much/often (Prometheus, Datadog)</li>
<li><strong class="text-white">Traces</strong> — Where time was spent (OpenTelemetry)</li>
</ul>
<h3 class="mt-3 font-semibold text-[#22c55e]">Tools</h3>
<div class="mt-2 flex flex-wrap gap-2">
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Grafana</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">OpenTelemetry</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Sentry</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">BetterStack</span>
</div>`,
  },
  {
    title: "CI/CD Pipeline in 15 Minutes",
    category: "DEVOPS",
    body: `<p>A modern CI/CD pipeline for a web app:</p>
<div class="mt-3 space-y-1 font-mono text-sm">
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">1.</span> Push to main</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">2.</span> Lint + type check (2 min)</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">3.</span> Unit tests (3 min)</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">4.</span> Build + Docker image (3 min)</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">5.</span> Integration tests (5 min)</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">6.</span> Deploy to staging (1 min)</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">7.</span> Smoke tests (1 min)</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#22c55e]">✓</span> Deploy to production</div>
</div>`,
  },
  // PAGES 51-55: Data & ML
  {
    title: "Data Modeling Best Practices",
    category: "DATA",
    body: `<p>Good data models make everything else easier. Bad ones create nightmares.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Principles</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Model your domain, not your UI</li>
<li>• Normalize to 3NF, denormalize for performance</li>
<li>• Use UUIDs for distributed systems, auto-increment for simple ones</li>
<li>• Always have created_at and updated_at</li>
<li>• Foreign keys aren't optional — they prevent orphaned data</li>
</ul>`,
  },
  {
    title: "MLOps: From Notebook to Production",
    category: "ML",
    body: `<p>The gap between a working Jupyter notebook and a production ML system is enormous. MLOps bridges it.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Key Components</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• <strong>Experiment tracking</strong> — MLflow, Weights & Biases</li>
<li>• <strong>Model registry</strong> — Version and stage models</li>
<li>• <strong>Feature store</strong> — Consistent features for training and serving</li>
<li>• <strong>Model monitoring</strong> — Detect data drift and performance degradation</li>
<li>• <strong>A/B testing</strong> — Validate model improvements with real users</li>
</ul>`,
  },
  {
    title: "Real-Time Data Pipelines",
    category: "DATA ENGINEERING",
    body: `<p>Batch processing is giving way to real-time. Here's the modern streaming stack:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-white">Apache Kafka</strong> — The gold standard for event streaming</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Apache Flink</strong> — Stateful stream processing with SQL support</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Redpanda</strong> — Kafka-compatible, but simpler and faster</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Temporal</strong> — Durable execution for complex workflows</div>
</div>`,
  },
  {
    title: "Feature Engineering Tips",
    category: "ML",
    body: `<p>Good features beat good models. Here are techniques that consistently improve predictions:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Time-based features</strong> — Day of week, hour, is_weekend, time_since_last_event</li>
<li><strong class="text-white">Aggregations</strong> — Rolling averages, counts, sums over time windows</li>
<li><strong class="text-white">Interactions</strong> — Product of two features (price × quantity)</li>
<li><strong class="text-white">Text features</strong> — TF-IDF, embeddings, sentiment scores</li>
<li><strong class="text-white">Categorical encoding</strong> — Target encoding > one-hot for high cardinality</li>
</ul>`,
  },
  {
    title: "The Future of Data Lakes",
    category: "DATA",
    body: `<p>Data lakes are evolving into "lakehouses" — combining the flexibility of lakes with the reliability of warehouses.</p>
<h3 class="mt-3 font-semibold text-[#f97316]">Key Technologies</h3>
<div class="mt-2 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-white">Apache Iceberg</strong> — Open table format. Schema evolution. Time travel queries.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Apache Delta Lake</strong> — ACID transactions on data lakes.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Apache Hudi</strong> — Incremental processing and CDC.</div>
</div>
<p class="mt-3 text-sm text-white/40">The trend: open formats, zero vendor lock-in, SQL-first interfaces.</p>`,
  },
  // PAGES 56-60: Fun & Culture
  {
    title: "Famous Programmer Quotes",
    category: "CULTURE",
    body: `<div class="mt-2 space-y-4">
<div class="border-l-2 border-[#3b82f6] pl-4"><p class="italic text-white/70">"Simplicity is prerequisite for reliability."</p><p class="text-sm text-white/40 mt-1">— Edsger W. Dijkstra</p></div>
<div class="border-l-2 border-[#22c55e] pl-4"><p class="italic text-white/70">"Premature optimization is the root of all evil."</p><p class="text-sm text-white/40 mt-1">— Donald Knuth</p></div>
<div class="border-l-2 border-[#f97316] pl-4"><p class="italic text-white/70">"First, solve the problem. Then, write the code."</p><p class="text-sm text-white/40 mt-1">— John Johnson</p></div>
<div class="border-l-2 border-white pl-4"><p class="italic text-white/70">"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."</p><p class="text-sm text-white/40 mt-1">— Martin Fowler</p></div>
</div>`,
  },
  {
    title: "Tech Interview Reality Check",
    category: "CAREER",
    body: `<p>Technical interviews are broken, but here's how to navigate them effectively:</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">What Actually Matters</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• <strong>Communication</strong> — Talk through your thought process</li>
<li>• <strong>Problem decomposition</strong> — Break big problems into small ones</li>
<li>• <strong>Edge cases</strong> — Always ask about boundaries</li>
<li>• <strong>Testing</strong> — Write test cases before/after coding</li>
</ul>
<p class="mt-3 text-white/70">The best engineers I've interviewed were the ones who asked clarifying questions before writing a single line.</p>`,
  },
  {
    title: "Open Source Sustainability Crisis",
    category: "COMMUNITY",
    body: `<p>Critical infrastructure maintained by one burnt-out developer. Sound familiar?</p>
<p class="mt-2 text-white/70">Projects like OpenSSL, Log4j, and left-pad showed us the fragility of open source. The maintainers get no funding, all the blame when things break.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">What's Being Done</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• <strong>GitHub Sponsors</strong> — Direct funding for maintainers</li>
<li>• <strong>Open Collective</strong> — Transparent project funding</li>
<li>• <strong>Tidelift</strong> — Enterprise support contracts for OSS</li>
<li>• <strong>Corporate backing</strong> — Companies funding their dependencies</li>
</ul>`,
  },
  {
    title: "The Best Developer Podcasts",
    category: "CULTURE",
    body: `<p>Podcasts you should have in your rotation:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-3"><strong class="text-[#3b82f6]">Syntax</strong> — Web dev with Wes Bos and Scott Tolinski. Entertaining and informative.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#22c55e]">The Changelog</strong> — Open source stories. Long-form interviews with maintainers.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#f97316]">Lex Fridman Podcast</strong> — Deep conversations with AI researchers and tech leaders.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">CoRecursive</strong> — The stories behind code. Beautifully produced.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#3b82f6]">Shopify Dev</strong> — E-commerce tech and Ruby/Rails engineering.</div>
</div>`,
  },
  {
    title: "Developer Productivity Myths",
    category: "CULTURE",
    body: `<p>Productivity advice that sounds good but doesn't work:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">"Wake up at 5 AM"</strong> — Sleep quality matters more than wake time</li>
<li><strong class="text-white">"No distractions"</strong> — Some distraction (music, breaks) improves focus</li>
<li><strong class="text-white">"More hours = more output"</strong> — Diminishing returns after 6 focused hours</li>
<li><strong class="text-white">"Multitasking"</strong> — Context switching costs 23 minutes per switch (UC Irvine study)</li>
</ul>
<h3 class="mt-3 font-semibold text-[#22c55e]">What Actually Works</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Deep work blocks (90 min, phone away)</li>
<li>• Clear daily priorities (max 3)</li>
<li>• Physical movement every 2 hours</li>
<li>• Saying no to unnecessary meetings</li>
</ul>`,
  },
  // PAGES 61-65: Advanced Topics
  {
    title: "Web Security Headers Cheat Sheet",
    category: "SECURITY",
    body: `<p>These HTTP headers can prevent entire categories of attacks:</p>
<div class="mt-3 space-y-2 font-mono text-sm">
<div class="rounded bg-white/5 p-2"><span class="text-[#22c55e]">Content-Security-Policy:</span> <span class="text-white/60">default-src 'self'</span></div>
<div class="rounded bg-white/5 p-2"><span class="text-[#22c55e]">Strict-Transport-Security:</span> <span class="text-white/60">max-age=31536000; includeSubDomains</span></div>
<div class="rounded bg-white/5 p-2"><span class="text-[#22c55e]">X-Content-Type-Options:</span> <span class="text-white/60">nosniff</span></div>
<div class="rounded bg-white/5 p-2"><span class="text-[#22c55e]">X-Frame-Options:</span> <span class="text-white/60">DENY</span></div>
<div class="rounded bg-white/5 p-2"><span class="text-[#22c55e]">Referrer-Policy:</span> <span class="text-white/60">strict-origin-when-cross-origin</span></div>
<div class="rounded bg-white/5 p-2"><span class="text-[#22c55e]">Permissions-Policy:</span> <span class="text-white/60">camera=(), microphone=()</span></div>
</div>`,
  },
  {
    title: "How DNS Actually Works",
    category: "NETWORKING",
    body: `<p>When you type a URL, here's what happens before you see a single pixel:</p>
<div class="mt-3 space-y-1 font-mono text-sm">
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">1.</span> Browser checks its cache</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">2.</span> OS checks its cache</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">3.</span> Query your ISP's recursive resolver</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">4.</span> Root server → TLD server (.com) → Authoritative server</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">5.</span> IP address returned</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#3b82f6]">6.</span> TCP handshake → TLS handshake → HTTP request</div>
<div class="rounded bg-white/5 p-2"><span class="text-[#22c55e]">✓</span> Page starts rendering</div>
</div>
<p class="mt-3 text-sm text-white/40">Total time: ~50ms for DNS, ~100ms for TLS. Most latency is server-side.</p>`,
  },
  {
    title: "GraphQL vs REST: The 2026 Verdict",
    category: "API DESIGN",
    body: `<p>After years of debate, the industry has largely settled:</p>
<div class="mt-3 grid grid-cols-2 gap-3">
<div class="rounded bg-[#3b82f6]/10 p-3">
<div class="font-semibold text-[#3b82f6]">Use REST When</div>
<ul class="mt-2 space-y-1 text-sm text-white/70">
<li>• Simple CRUD operations</li>
<li>• HTTP caching matters</li>
<li>• File uploads/downloads</li>
<li>• Public APIs</li>
</ul>
</div>
<div class="rounded bg-[#f97316]/10 p-3">
<div class="font-semibold text-[#f97316]">Use GraphQL When</div>
<ul class="mt-2 space-y-1 text-sm text-white/70">
<li>• Complex, nested data relationships</li>
<li>• Multiple frontend clients need different data</li>
<li>• Rapid frontend iteration</li>
<li>• Real-time subscriptions (via WebSocket)</li>
</ul>
</div>
</div>`,
  },
  {
    title: "The Art of Code Review",
    category: "ENGINEERING",
    body: `<p>Code review is the highest-leverage activity in software engineering. Here's how to do it well:</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">As a Reviewer</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Read the PR description first — understand intent</li>
<li>• Focus on logic and design, not style (automate formatting)</li>
<li>• Ask questions instead of making demands</li>
<li>• Praise good patterns when you see them</li>
</ul>
<h3 class="mt-3 font-semibold text-[#3b82f6]">As an Author</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Small PRs (< 400 lines) get better reviews</li>
<li>• Write a clear description of what and why</li>
<li>• Self-review before requesting others</li>
<li>• Don't take feedback personally — it's about the code</li>
</ul>`,
  },
  {
    title: "Linux Commands Every Dev Should Know",
    category: "DEV TOOLS",
    body: `<p>Beyond ls, cd, and mkdir:</p>
<div class="mt-3 space-y-2 font-mono text-sm">
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">grep -rn "pattern" .</code> — Search recursively with line numbers</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">find . -name "*.ts" -mtime -1</code> — Find files modified in last 24h</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">curl -s localhost:3000 | jq .</code> — API testing with formatted JSON</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">htop</code> — Interactive process monitor</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">tmux</code> — Terminal multiplexer. Detach and reattach sessions.</div>
<div class="rounded bg-white/5 p-2"><code class="text-[#22c55e]">watch -n 5 command</code> — Run a command every N seconds</div>
</div>`,
  },
  // PAGES 66-70: Emerging Tech
  {
    title: "Quantum Computing: Where Are We?",
    category: "EMERGING TECH",
    body: `<p>Quantum computing isn't replacing classical computers. It's a specialized tool for specific problems.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Where Quantum Excels</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Cryptography (breaking and making)</li>
<li>• Drug discovery (molecular simulation)</li>
<li>• Optimization (logistics, finance)</li>
<li>• Machine learning (quantum kernels)</li>
</ul>
<p class="mt-3 text-white/70">Current state: 1000+ qubit processors, but error correction is still the bottleneck. Useful quantum advantage is 5-10 years away for most applications.</p>`,
  },
  {
    title: "Web3 in 2026: Beyond the Hype",
    category: "BLOCKCHAIN",
    body: `<p>After the crash, what's actually useful in blockchain?</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-[#22c55e]">Smart contracts</strong> — Automated agreements with no middleman</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#3b82f6]">Decentralized identity</strong> — Self-sovereign credentials</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#f97316]">Supply chain</strong> — Transparent tracking from origin to consumer</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">DeFi protocols</strong> — Automated lending, borrowing, trading</div>
</div>
<p class="mt-3 text-sm text-white/40">The tech is real. The speculation was the problem. Focus on utility, not tokens.</p>`,
  },
  {
    title: "Edge AI: Intelligence at the Source",
    category: "AI / IOT",
    body: `<p>Running AI models on devices — phones, cameras, sensors — instead of cloud servers.</p>
<h3 class="mt-3 font-semibold text-[#f97316]">Why Edge AI Matters</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• <strong>Latency</strong> — No round-trip to the cloud</li>
<li>• <strong>Privacy</strong> — Data never leaves the device</li>
<li>• <strong>Cost</strong> — No cloud compute bills</li>
<li>• <strong>Reliability</strong> — Works offline</li>
</ul>
<p class="mt-3 text-white/70">Tools: TensorFlow Lite, ONNX Runtime, Core ML, MediaPipe.</p>`,
  },
  {
    title: "5G Beyond Speed",
    category: "TELECOM",
    body: `<p>5G isn't just faster 4G. Its three pillars enable new categories of applications:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-[#3b82f6]">eMBB</strong> — Enhanced Mobile Broadband (faster speeds, 4K streaming)</li>
<li><strong class="text-[#22c55e]">URLLC</strong> — Ultra-Reliable Low-Latency (remote surgery, autonomous vehicles)</li>
<li><strong class="text-[#f97316]">mMTC</strong> — Massive Machine-Type Communications (1M devices per km²)</li>
</ul>
<p class="mt-3 text-white/70">The real revolution is mMTC — enabling smart cities, industrial IoT, and connected healthcare at unprecedented scale.</p>`,
  },
  {
    title: "Sustainable Tech Practices",
    category: "ETHICS",
    body: `<p>The tech industry's carbon footprint equals aviation. Here's what developers can do:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Optimize images</strong> — WebP/AVIF, proper sizing, lazy loading</li>
<li><strong class="text-white">Green hosting</strong> — Choose providers powered by renewables</li>
<li><strong class="text-white">Efficient code</strong> — Fewer compute cycles = less energy</li>
<li><strong class="text-white">Right-size infrastructure</strong> — Don't run 16GB instances for a 2GB workload</li>
<li><strong class="text-white">Cache aggressively</strong> — Serving cached responses uses ~0 energy</li>
</ul>`,
  },
  // PAGES 71-75: Practical Guides
  {
    title: "Building a SaaS in a Weekend",
    category: "STARTUP",
    body: `<p>The modern stack for rapid SaaS prototyping:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-[#3b82f6]">Frontend</strong> — Next.js + Tailwind + shadcn/ui</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#22c55e]">Backend</strong> — Server actions or tRPC</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#f97316]">Database</strong> — Supabase (PostgreSQL + Auth + Storage)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Payments</strong> — Stripe or LemonSqueezy</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#3b82f6]">Hosting</strong> — Vercel + Cloudflare</div>
</div>
<p class="mt-3 text-white/70">Vibe coding with AI tools makes this achievable in a weekend. The barrier to launching has never been lower.</p>`,
  },
  {
    title: "Database Indexing Strategy",
    category: "DATABASE",
    body: `<p>Most performance problems are database problems. Most database problems are missing indexes.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">When to Index</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Columns in WHERE clauses (frequently queried)</li>
<li>• Columns in JOIN conditions (foreign keys)</li>
<li>• Columns in ORDER BY (sorting)</li>
<li>• Composite indexes for multi-column queries</li>
</ul>
<h3 class="mt-3 font-semibold text-[#ef4444]">When NOT to Index</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Small tables (sequential scan is faster)</li>
<li>• Columns with low cardinality (boolean, status)</li>
<li>• Columns that are frequently updated (index maintenance cost)</li>
</ul>`,
  },
  {
    title: "Web Accessibility (a11y) Basics",
    category: "WEB DEV",
    body: `<p>15% of the world has a disability. If your site isn't accessible, you're excluding millions of users.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Quick Wins</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Use semantic HTML (button, nav, main, article)</li>
<li>• Add alt text to all images</li>
<li>• Ensure keyboard navigation works</li>
<li>• Maintain sufficient color contrast (4.5:1 minimum)</li>
<li>• Add ARIA labels when HTML semantics aren't enough</li>
<li>• Test with a screen reader (VoiceOver on Mac, NVDA on Windows)</li>
</ul>`,
  },
  {
    title: "Error Handling Patterns",
    category: "ENGINEERING",
    body: `<p>Good error handling is the difference between a resilient app and a fragile one.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Patterns</h3>
<div class="mt-2 space-y-2">
<div class="rounded bg-white/5 p-3"><strong class="text-white">Result Types</strong> — Return { ok: true, data } or { ok: false, error }. No thrown exceptions.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">Error Boundaries</strong> — Catch rendering errors in React. Show fallback UI, not white screen.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">Retry with backoff</strong> — For transient failures (network, rate limits).</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">Structured logging</strong> — Log error codes, not just messages. Makes debugging 10x faster.</div>
</div>`,
  },
  {
    title: "The Cost of Microservices",
    category: "ARCHITECTURE",
    body: `<p>Microservices solve organizational problems, not technical ones. And they introduce new ones:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Network complexity</strong> — Service discovery, load balancing, circuit breakers</li>
<li><strong class="text-white">Data consistency</strong> — Distributed transactions are painful (sagas, eventual consistency)</li>
<li><strong class="text-white">Debugging</strong> — Tracing a request across 10 services requires serious tooling</li>
<li><strong class="text-white">Deployment</strong> — Each service needs its own CI/CD pipeline</li>
</ul>
<p class="mt-3 text-white/70">Start with a well-structured monolith. Extract services only when you feel real pain.</p>`,
  },
  // PAGES 76-80: Tools & Productivity
  {
    title: "VS Code Extensions Worth Installing",
    category: "DEV TOOLS",
    body: `<div class="mt-2 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-[#3b82f6]">Error Lens</strong> — Shows errors inline, right where the code is</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#22c55e]">GitLens</strong> — See who wrote each line, blame annotations, rich diff</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#f97316]">Thunder Client</strong> — API testing without leaving VS Code</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Pretty TypeScript Errors</strong> — Readable TS error messages</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#3b82f6]">Tailwind CSS IntelliSense</strong> — Autocomplete for Tailwind classes</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#22c55e]">Copilot</strong> — AI pair programming. Worth the $10/month.</div>
</div>`,
  },
  {
    title: "Terminal Customization Guide",
    category: "DEV TOOLS",
    body: `<p>Your terminal is your primary workspace. Make it efficient:</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Recommended Setup</h3>
<div class="mt-2 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-white">Shell</strong> — zsh + oh-my-zsh or fish</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Terminal</strong> — Warp or iTerm2 (macOS), Alacritty (cross-platform)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Prompt</strong> — Starship (fast, configurable, beautiful)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Multiplexer</strong> — tmux (persistent sessions, split panes)</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">File manager</strong> — nnn or lf (terminal-based, blazing fast)</div>
</div>`,
  },
  {
    title: "Postman Alternatives in 2026",
    category: "DEV TOOLS",
    body: `<p>Postman got bloated. Here are better alternatives:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-3"><strong class="text-[#3b82f6]">Bruno</strong> — Open source. Git-friendly collections (stores requests as files). No cloud sync required.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#22c55e]">HTTPie</strong> — Beautiful CLI. <code>http GET api.example.com/users</code> is all you need.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#f97316]">Insomnia</strong> — Clean UI. GraphQL-first. OpenAPI support.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">Hoppscotch</strong> — Open source, web-based. Works in browser, no install needed.</div>
</div>`,
  },
  {
    title: "The Art of Git Commit Messages",
    category: "DEV TOOLS",
    body: `<p>Good commit messages are free documentation. Bad ones are cryptic puzzles nobody wants to solve.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Conventional Commits</h3>
<div class="mt-2 rounded-lg bg-black/50 p-3 font-mono text-sm">
<div class="text-[#3b82f6]">feat:</span> <span class="text-white/70">add user authentication</div>
<div class="text-[#22c55e]">fix:</span> <span class="text-white/70">resolve race condition in checkout</div>
<div class="text-[#f97316]">refactor:</span> <span class="text-white/70">extract validation into middleware</div>
<div class="text-white">chore:</span> <span class="text-white/70">update dependencies</div>
<div class="text-white">docs:</span> <span class="text-white/70">add API documentation for /users</div>
</div>
<p class="mt-3 text-sm text-white/40">Pro tip: Write commit messages in imperative mood. "Add feature" not "Added feature".</p>`,
  },
  {
    title: "Remote Work Productivity",
    category: "CAREER",
    body: `<p>Remote work is a skill. Here's how to be good at it:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Dedicated workspace</strong> — Even a corner desk. Physical separation = mental separation.</li>
<li><strong class="text-white">Async-first communication</strong> — Write it down. Don't schedule a meeting for what an email handles.</li>
<li><strong class="text-white">Time blocks</strong> — Deep work 9-12, meetings 2-4, admin 4-5.</li>
<li><strong class="text-white">Camera on for sync, off for deep work</strong> — Respect focus time.</li>
<li><strong class="text-white">Overcommunicate</strong> — Remote work lacks hallway context. Share more, not less.</li>
</ul>`,
  },
  // PAGES 81-85: Fun Facts
  {
    title: "Mind-Blowing Tech Facts",
    category: "FUN",
    body: `<div class="mt-2 space-y-3">
<div class="rounded bg-white/5 p-3"><span class="text-[#3b82f6] font-bold">Fact 1:</span> The first computer bug was an actual bug — a moth found in a Harvard Mark II in 1947.</div>
<div class="rounded bg-white/5 p-3"><span class="text-[#22c55e] font-bold">Fact 2:</span> The entire Apollo guidance computer had less processing power than a modern Texas Instruments calculator.</div>
<div class="rounded bg-white/5 p-3"><span class="text-[#f97316] font-bold">Fact 3:</span> Amazon's first name was "Cadabra" — Jeff Bezos changed it because "cadaver" came to mind.</div>
<div class="rounded bg-white/5 p-3"><span class="text-white font-bold">Fact 4:</span> The first email was sent in 1971 by Ray Tomlinson to himself. He doesn't remember what it said.</div>
<div class="rounded bg-white/5 p-3"><span class="text-[#3b82f6] font-bold">Fact 5:</span> Google's original name was "BackRub" because it analyzed "back links."</div>
</div>`,
  },
  {
    title: "The Most Expensive Software Bugs",
    category: "HISTORY",
    body: `<div class="mt-2 space-y-3">
<div class="rounded bg-white/5 p-3"><span class="text-[#ef4444] font-bold">$440M:</span> Knight Capital (2012) — A deployment bug caused rogue trading for 45 minutes.</div>
<div class="rounded bg-white/5 p-3"><span class="text-[#ef4444] font-bold">$1.7B:</span> Mars Climate Orbiter (1999) — One team used metric, another used imperial.</div>
<div class="rounded bg-white/5 p-3"><span class="text-[#ef4444] font-bold">$400M:</span> AT&T outage (1990) — A single bad <code>break</code> statement crashed the entire network.</div>
<div class="rounded bg-white/5 p-3"><span class="text-[#ef4444] font-bold">$300M+:</span> Log4Shell (2021) — A 20-year-old vulnerability in a widely-used Java library.</div>
</div>
<p class="mt-3 text-sm text-white/40">Testing isn't optional. It's the cheapest insurance you can buy.</p>`,
  },
  {
    title: "Developer Salary Data 2026",
    category: "CAREER",
    body: `<p>Based on aggregated data from major platforms:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-3"><strong class="text-white">Full-Stack Developer</strong> — $95K-180K (US average: $128K)</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">ML Engineer</strong> — $120K-250K (US average: $165K)</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">Security Engineer</strong> — $110K-220K (US average: $145K)</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">Platform Engineer</strong> — $130K-240K (US average: $160K)</div>
</div>
<p class="mt-3 text-sm text-white/40">Location, company size, and specialization significantly impact these ranges. Remote roles are narrowing the gap.</p>`,
  },
  {
    title: "Famous Side Projects That Became Companies",
    category: "HISTORY",
    body: `<div class="mt-2 space-y-3">
<div class="rounded bg-white/5 p-3"><strong class="text-[#3b82f6]">GitHub</strong> — Started as a weekend project to make Git hosting easier. Acquired by Microsoft for $7.5B.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#22c55e]">Instagram</strong> — Built in 8 weeks as a side project called Burbn. Sold for $1B to Facebook.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#f97316]">Craigslist</strong> — Craig Newmark started it as a simple email list. Still one of the most visited sites.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">Twitter</strong> — Was a side project inside a podcast company (Odeo). You know the rest.</div>
</div>
<p class="mt-3 text-sm text-white/40">The best products solve the maker's own problem first.</p>`,
  },
  {
    title: "Why Every Developer Should Know Networking",
    category: "FUNDAMENTALS",
    body: `<p>You don't need to be a CCNA, but understanding networking makes you a better developer:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Debugging</strong> — "It works on my machine" usually means a network issue</li>
<li><strong class="text-white">Security</strong> — Most vulnerabilities live at the network layer</li>
<li><strong class="text-white">Performance</strong> — Knowing about TCP, DNS, and caching saves hours</li>
<li><strong class="text-white">Architecture</strong> — Load balancers, reverse proxies, CDNs — all networking</li>
</ul>
<p class="mt-3 text-white/70">Start with: DNS resolution, HTTP/HTTPS, TLS handshake, TCP vs UDP, and how load balancers work.</p>`,
  },
  // PAGES 86-90: Vibe Coding Focus
  {
    title: "The Vibe Coding Manifesto",
    category: "VIBE CODING",
    body: `<div class="mt-2 space-y-3">
<div class="rounded border border-white/10 bg-white/5 p-4">
<p class="text-lg font-semibold text-white">I. Intent Over Syntax</p>
<p class="mt-1 text-white/70">Describe what you want. The AI handles how.</p>
</div>
<div class="rounded border border-white/10 bg-white/5 p-4">
<p class="text-lg font-semibold text-white">II. Iterate, Don't Script</p>
<p class="mt-1 text-white/70">Converse with the machine. Refine until it's right.</p>
</div>
<div class="rounded border border-white/10 bg-white/5 p-4">
<p class="text-lg font-semibold text-white">III. Ship Fast, Learn Faster</p>
<p class="mt-1 text-white/70">Launch in hours, not months. Real feedback beats perfect code.</p>
</div>
<div class="rounded border border-white/10 bg-white/5 p-4">
<p class="text-lg font-semibold text-white">IV. Human Judgment is Irreplaceable</p>
<p class="mt-1 text-white/70">AI writes code. You decide what's worth building.</p>
</div>
</div>`,
  },
  {
    title: "Prompt Engineering for Code Generation",
    category: "VIBE CODING",
    body: `<p>The difference between "make a website" and a production-quality prompt is 10x in output quality.</p>
<h3 class="mt-3 font-semibold text-[#3b82f6]">Template</h3>
<div class="mt-2 rounded-lg bg-black/50 p-3 font-mono text-sm text-[#22c55e]">
<div>Build a [TYPE] that [DOES WHAT]</div>
<div>Tech stack: [FRAMEWORK] + [CSS] + [DB]</div>
<div>Features:</div>
<div>  - [Feature 1]</div>
<div>  - [Feature 2]</div>
<div>Design: [STYLE] with [COLOR SCHEME]</div>
<div>Constraints: [PERFORMANCE/ACCESSIBILITY]</div>
</div>
<p class="mt-3 text-white/70">The more specific your prompt, the less iteration needed. But leave room for creative AI solutions.</p>`,
  },
  {
    title: "Debugging with AI: A Framework",
    category: "VIBE CODING",
    body: `<p>AI is amazing at generating code. It's also incredible at debugging — if you prompt it right.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">The Debug Prompt Template</h3>
<ol class="mt-2 space-y-2 list-decimal list-inside text-white/70">
<li><strong class="text-white">Context</strong> — "I'm building X with Y framework"</li>
<li><strong class="text-white">Symptom</strong> — "When I do Z, I get this error"</li>
<li><strong class="text-white">Evidence</strong> — Paste the error message and relevant code</li>
<li><strong class="text-white">What I tried</strong> — "I've already tried A and B"</li>
</ol>
<p class="mt-3 text-white/70">Never: "it doesn't work, help." That's the fastest way to get a useless answer.</p>`,
  },
  {
    title: "Rapid Prototyping Checklist",
    category: "VIBE CODING",
    body: `<p>Before you start vibe coding, check off these items:</p>
<div class="mt-3 space-y-2">
<label class="flex items-center gap-2 rounded bg-white/5 p-2"><input type="checkbox" class="accent-[#22c55e]"> <span class="text-white/70">Define the core problem in one sentence</span></label>
<label class="flex items-center gap-2 rounded bg-white/5 p-2"><input type="checkbox" class="accent-[#22c55e]"> <span class="text-white/70">List maximum 3 core features (not 30)</span></label>
<label class="flex items-center gap-2 rounded bg-white/5 p-2"><input type="checkbox" class="accent-[#22c55e]"> <span class="text-white/70">Choose a simple tech stack (don't over-engineer)</span></label>
<label class="flex items-center gap-2 rounded bg-white/5 p-2"><input type="checkbox" class="accent-[#22c55e]"> <span class="text-white/70">Set a time limit (a weekend, not a month)</span></label>
<label class="flex items-center gap-2 rounded bg-white/5 p-2"><input type="checkbox" class="accent-[#22c55e]"> <span class="text-white/70">Plan to deploy early (Vercel, Railway, Fly.io)</span></label>
<label class="flex items-center gap-2 rounded bg-white/5 p-2"><input type="checkbox" class="accent-[#22c55e]"> <span class="text-white/70">Accept imperfection — shipped beats perfect</span></label>
</div>`,
  },
  {
    title: "Vibe Coding Tools Comparison",
    category: "VIBE CODING",
    body: `<p>The vibe coding landscape in 2026:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-3">
<div class="font-semibold text-[#3b82f6]">Lovable</div>
<p class="text-sm text-white/70 mt-1">Full-stack apps from prompts. Built-in auth, database, deployment. Best for: complete applications.</p>
</div>
<div class="rounded bg-white/5 p-3">
<div class="font-semibold text-[#22c55e]">Cursor</div>
<p class="text-sm text-white/70 mt-1">AI-first code editor. Best for: developers who want AI assistance in their existing workflow.</p>
</div>
<div class="rounded bg-white/5 p-3">
<div class="font-semibold text-[#f97316]">v0</div>
<p class="text-sm text-white/70 mt-1">UI generation from prompts. Best for: React component creation, rapid prototyping.</p>
</div>
<div class="rounded bg-white/5 p-3">
<div class="font-semibold text-white">Bolt.new</div>
<p class="text-sm text-white/70 mt-1">Browser-based full-stack. Best for: quick prototypes without local setup.</p>
</div>
</div>`,
  },
  // PAGES 91-95: More Content
  {
    title: "The Science of Learning to Code",
    category: "CAREER",
    body: `<p>Neuroscience tells us how to learn effectively:</p>
<ul class="mt-3 space-y-2 text-white/70">
<li><strong class="text-white">Spaced repetition</strong> — Review concepts at increasing intervals (Anki for code)</li>
<li><strong class="text-white">Active recall</strong> — Close the docs and try from memory first</li>
<li><strong class="text-white">Interleaving</strong> — Mix different topics in a study session</li>
<li><strong class="text-white">Feynman Technique</strong> — Explain concepts in simple terms to solidify understanding</li>
<li><strong class="text-white">Project-based learning</strong> — Build something real. Context makes knowledge stick.</li>
</ul>
<p class="mt-3 text-sm text-white/40">The 10,000 hour rule is a myth. Deliberate practice of 1-2 hours daily beats 12-hour marathons.</p>`,
  },
  {
    title: "Clean Code in 2026",
    category: "ENGINEERING",
    body: `<p>Clean code principles haven't changed, but their application has evolved:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-3"><strong class="text-[#3b82f6]">Meaningful names</strong> — <code>user</code> not <code>u</code>. <code>calculateTotalPrice</code> not <code>calc</code>. Self-documenting code.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#22c55e]">Small functions</strong> — If a function doesn't fit on screen, it's too long. Extract, extract, extract.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-[#f97316]">Single responsibility</strong> — Each function does one thing. Each module has one reason to change.</div>
<div class="rounded bg-white/5 p-3"><strong class="text-white">DRY but smart</strong> — Don't repeat yourself, but don't create abstractions too early either.</div>
</div>`,
  },
  {
    title: "System Design Interview Patterns",
    category: "CAREER",
    body: `<p>System design interviews test your ability to think at scale. Here are the patterns that come up repeatedly:</p>
<div class="mt-3 space-y-2">
<div class="rounded bg-white/5 p-2"><strong class="text-[#3b82f6]">Caching</strong> — Redis, CDN, browser cache. Every layer helps.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#22c55e]">Load Balancing</strong> — Round-robin, consistent hashing, geo-based.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#f97316]">Database Sharding</strong> — Split data across multiple databases by key.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-white">Message Queues</strong> — Decouple services. Kafka, RabbitMQ, SQS.</div>
<div class="rounded bg-white/5 p-2"><strong class="text-[#3b82f6]">CDN</strong> — Serve static assets from edge locations.</div>
</div>`,
  },
  {
    title: "Building in Public",
    category: "STARTUP",
    body: `<p>Building in public means sharing your journey transparently — wins, failures, metrics, everything.</p>
<h3 class="mt-3 font-semibold text-[#22c55e]">Benefits</h3>
<ul class="mt-2 space-y-1 text-white/70">
<li>• Build an audience before you launch</li>
<li>• Get feedback early and often</li>
<li>• Accountability — public commitments drive action</li>
<li>• Network with other builders</li>
</ul>
<h3 class="mt-3 font-semibold text-[#f97316]">Platforms</h3>
<div class="mt-2 flex flex-wrap gap-2">
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">Twitter/X</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">LinkedIn</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">IndieHackers</span>
<span class="rounded-full bg-white/10 px-3 py-1 text-sm">ProductHunt</span>
</div>`,
  },
  {
    title: "The Future of Programming",
    category: "FUTURE",
    body: `<p>Where is software development heading?</p>
<div class="mt-3 space-y-3">
<div class="rounded border-l-2 border-[#3b82f6] pl-4">
<p class="font-semibold text-[#3b82f6]">2025-2027</p>
<p class="text-white/70">AI pair programming becomes standard. No developer works without an AI assistant.</p>
</div>
<div class="rounded border-l-2 border-[#22c55e] pl-4">
<p class="font-semibold text-[#22c55e]">2027-2030</p>
<p class="text-white/70">Natural language replaces most boilerplate. Developers focus on architecture, design, and validation.</p>
</div>
<div class="rounded border-l-2 border-[#f97316] pl-4">
<p class="font-semibold text-[#f97316]">2030+</p>
<p class="text-white/70">Autonomous coding agents handle 80% of routine development. Humans guide strategy and creativity.</p>
</div>
</div>
<p class="mt-3 text-sm text-white/40">The developers who thrive will be the ones who learn to direct AI, not compete with it.</p>`,
  },
  // PAGES 96-99
  {
    title: "The Hacker's Trail",
    category: "SECURITY",
    body: `<div class="rounded-lg border border-white/10 bg-white/5 p-6">
<p class="text-sm uppercase tracking-widest text-white/40">Forensic analysis — page access logs</p>
<div class="mt-3 space-y-1 font-mono text-xs text-white/50">
<div><span class="text-white/30">12:01:03</span> GET /?page=0 <span class="text-[#22c55e]">200</span></div>
<div><span class="text-white/30">12:01:05</span> GET /?page=1 <span class="text-[#22c55e]">200</span></div>
<div><span class="text-white/30">12:01:08</span> GET /?page=2 <span class="text-[#22c55e]">200</span></div>
<div><span class="text-white/30">12:01:10</span> GET /?page=3 <span class="text-[#22c55e]">200</span></div>
<div><span class="text-white/30">12:01:12</span> GET /?page=4 <span class="text-[#22c55e]">200</span></div>
<div><span class="text-white/30">...</span> <span class="text-white/30">normal browsing pattern</span></div>
<div><span class="text-white/30">12:05:33</span> GET /?page=20 <span class="text-[#ef4444]">200</span> <span class="text-[#ef4444]">← breach detected</span></div>
<div><span class="text-white/30">12:05:34</span> GET /?page=20 <span class="text-[#ef4444]">200</span></div>
<div><span class="text-white/30">12:05:35</span> POST /?page=20 <span class="text-[#f97316]">200</span> <span class="text-[#f97316]">← message posted</span></div>
</div>
</div>`,
  },
  {
    title: "Lessons From This Challenge",
    category: "SECURITY",
    body: `<p>You've just experienced an IDOR vulnerability firsthand. Here's what to take away:</p>
<div class="mt-3 space-y-3">
<div class="rounded bg-white/5 p-4">
<p class="font-semibold text-[#3b82f6]">1. Never trust client input</p>
<p class="mt-1 text-sm text-white/70">The page parameter was manipulated to access hidden content. Always validate and sanitize.</p>
</div>
<div class="rounded bg-white/5 p-4">
<p class="font-semibold text-[#22c55e]">2. Implement access control checks</p>
<p class="mt-1 text-sm text-white/70">Every resource access must verify the user has permission to view it.</p>
</div>
<div class="rounded bg-white/5 p-4">
<p class="font-semibold text-[#f97316]">3. Use indirect references</p>
<p class="mt-1 text-sm text-white/70">Map public IDs to internal IDs. Never expose raw database keys in URLs.</p>
</div>
<div class="rounded bg-white/5 p-4">
<p class="font-semibold text-white">4. Security is everyone's job</p>
<p class="mt-1 text-sm text-white/70">Not just the security team. Every developer writes security-sensitive code.</p>
</div>
</div>`,
  },
  {
    title: "One More Thing...",
    category: "EASTER EGG",
    body: `<div class="text-center py-8">
<p class="text-4xl mb-4">🏁</p>
<p class="text-xl font-semibold text-white">You explored all 100 pages.</p>
<p class="mt-2 text-white/60">That's dedication. Most people stop at page 10.</p>
<div class="mt-6 rounded-lg bg-white/5 p-4 max-w-md mx-auto text-left">
<p class="text-sm text-white/40">Fun stats:</p>
<p class="text-sm text-white/60 mt-1">• 100 pages of content</p>
<p class="text-sm text-white/60">• ~15,000 words of tech knowledge</p>
<p class="text-sm text-white/60">• 1 hidden vulnerability to find</p>
<p class="text-sm text-white/60">• Countless hours of reading</p>
</div>
</div>`,
  },
  {
    title: "End of Line",
    category: "SYSTEM",
    body: `<div class="text-center py-12">
<p class="text-6xl mb-6 opacity-20">⟨/⟩</p>
<p class="text-lg text-white/40">TechPulse — Built with ❤ for developers</p>
<p class="mt-2 text-sm text-white/20">A Vibeathon 6.0 production by NXTGenSec</p>
<p class="mt-6 text-xs text-white/10">This page intentionally left minimal.</p>
</div>`,
  },
];

function getPageData(pageNum: number): PageContent {
  if (pageNum >= 0 && pageNum < PAGES.length) {
    return PAGES[pageNum];
  }
  return {
    title: "Page Not Found",
    category: "ERROR",
    body: `<p class="text-center text-white/40">Page ${pageNum} doesn't exist. Valid pages: 0–${PAGES.length - 1}</p>`,
  };
}

function TechEvent2() {
  const getFn = useServerFn(getEvent);
  const subFn = useServerFn(submitAnswer);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const pageNum = search.page ?? 0;

  const { data, refetch } = useQuery({
    queryKey: ["event", "tech", 2],
    queryFn: () => getFn({ data: { track: "tech", slot: 2 } }),
    refetchInterval: 15000,
  });
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: (ans: string) => subFn({ data: { eventId: data!.event.id, answer: ans } }),
    onSuccess: () => {
      setAnswer("");
      setErr(null);
      refetch();
    },
    onError: (e: any) => setErr(e?.message ?? "Failed to submit"),
  });

  if (!data) return <div className="text-white/60">Loading…</div>;
  const { event, open, started, submission } = data as any;

  if (!started) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">Tech Event 2: IDOR Challenge</h1>
        <p className="text-white/60">Not yet open</p>
        <div className="font-mono text-4xl text-primary">{countdown(event.start_at)}</div>
      </div>
    );
  }

  if (submission) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassCard>
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Answer Submitted</span>
          </div>
          <div className="mt-2 text-sm text-white/50">Submitted at {formatIST(submission.submitted_at)}</div>
          <p className="mt-3 text-xs text-white/50">This event is now locked for your team.</p>
        </GlassCard>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassCard>
          <div className="text-center text-white/60">
            <Lock className="mx-auto h-6 w-6" />
            <div className="mt-3 font-semibold">This event is closed</div>
            <p className="mt-1 text-sm">You did not submit an answer in the window.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const page = getPageData(pageNum);
  const isHacked = page.special;
  const totalPages = PAGES.length;

  const goToPage = (p: number) => {
    navigate({ search: { page: p } });
  };

  return (
    <div className={`mx-auto max-w-3xl space-y-6 ${isHacked ? "bg-black min-h-screen -mx-4 px-4" : ""}`}>
      {/* Site header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#3b82f6] text-xs font-bold text-white">TP</div>
          <span className="font-semibold text-white">TechPulse</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <Terminal className="h-3 w-3" />
          <span>Page {pageNum} / {totalPages - 1}</span>
        </div>
      </div>

      {/* Page navigation bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => goToPage(Math.max(0, pageNum - 1))}
          disabled={pageNum === 0}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 text-white/50 hover:bg-white/5 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 20) }, (_, i) => {
          let displayPage: number;
          if (totalPages <= 20) {
            displayPage = i;
          } else if (pageNum < 10) {
            displayPage = i;
          } else if (pageNum > totalPages - 11) {
            displayPage = totalPages - 20 + i;
          } else {
            displayPage = pageNum - 10 + i;
          }
          return (
            <button
              key={displayPage}
              onClick={() => goToPage(displayPage)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-mono transition ${
                displayPage === pageNum
                  ? isHacked
                    ? "bg-red-500 text-white"
                    : "bg-primary text-primary-foreground"
                  : "border border-white/10 text-white/50 hover:bg-white/5"
              }`}
            >
              {displayPage}
            </button>
          );
        })}
        <button
          onClick={() => goToPage(Math.min(totalPages - 1, pageNum + 1))}
          disabled={pageNum === totalPages - 1}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 text-white/50 hover:bg-white/5 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Page content */}
      <article className={`rounded-lg border p-6 ${isHacked ? "border-red-500/30 bg-red-950/10" : "border-white/10 bg-white/5"}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
            isHacked ? "bg-red-500/20 text-red-400" : "bg-[#3b82f6]/20 text-[#3b82f6]"
          }`}>
            {page.category}
          </span>
          {isHacked && (
            <span className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
              <ShieldAlert className="h-3 w-3" /> Breach
            </span>
          )}
        </div>
        <h1 className={`text-2xl font-bold ${isHacked ? "text-red-400" : "text-white"}`}>{page.title}</h1>
        <div className="prose prose-invert mt-4 max-w-none text-sm leading-relaxed text-white/70 [&_p]:mb-3 [&_strong]:text-white" dangerouslySetInnerHTML={{ __html: page.body }} />
      </article>

      {/* Submit answer section */}
      <GlassCard>
        <div className="text-xs uppercase tracking-widest text-white/50">Your Answer</div>
        <p className="mt-1 text-sm text-white/60">Found the hidden message? Enter it exactly as shown.</p>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={2}
          className="mt-3 w-full resize-none rounded-md border border-white/10 bg-black/40 p-3 font-mono text-white outline-none focus:border-primary"
          placeholder="Enter the hacker's message…"
        />
        {err && <div className="mt-2 text-xs text-red-400">{err}</div>}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-white/50 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            One submission only. Event locks after submitting.
          </div>
          <button
            disabled={!answer.trim() || submit.isPending}
            onClick={() => submit.mutate(answer.trim())}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            {submit.isPending ? "Submitting…" : "Submit Answer"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
