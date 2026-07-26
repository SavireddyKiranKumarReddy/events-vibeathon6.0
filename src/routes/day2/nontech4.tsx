import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/day2/nontech4")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Non-Tech 4: Coming Soon — Vibeathon" }],
  }),
  component: NonTech4,
});

function NonTech4() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-strong w-full max-w-md p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-white/20" />
        <h1 className="mt-4 text-2xl font-bold text-white">Coming Soon</h1>
        <p className="mt-2 text-sm text-white/50">
          This challenge hasn't been revealed yet. Stay tuned!
        </p>
        <Link
          to="/day2"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Day 2
        </Link>
      </div>
    </div>
  );
}
