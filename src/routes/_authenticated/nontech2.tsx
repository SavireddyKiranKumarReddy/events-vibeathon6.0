import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { getEvent, submitAnswer } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/AppShell";
import { countdown, formatIST } from "@/lib/format";
import { CheckCircle2, Lock, Upload, Image as ImageIcon, X, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nontech2")({
  head: () => ({
    meta: [
      { title: "Non-Tech Event 2: Design Challenge — Vibeathon" },
      { name: "description", content: "Create a design for Vibeathon 6.0 and submit it." },
    ],
  }),
  component: NonTechEvent2,
});

function NonTechEvent2() {
  const getFn = useServerFn(getEvent);
  const subFn = useServerFn(submitAnswer);
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ["event", "nontech", 2],
    queryFn: () => getFn({ data: { track: "nontech", slot: 2 } }),
    refetchInterval: 15000,
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async (imageUrl: string) => {
      return subFn({ data: { eventId: data!.event.id, answer: imageUrl } });
    },
    onSuccess: () => {
      setFile(null);
      setPreview(null);
      setErr(null);
      refetch();
    },
    onError: (e: any) => {
      setErr(e?.message ?? "Failed to submit");
      setUploading(false);
    },
  });

  if (!data) return <div className="text-white/60">Loading…</div>;
  const { event, open, started, submission } = data as any;

  if (!started) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">Non-Tech Event 2: Design Challenge</h1>
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
            <span className="font-semibold">Design Submitted</span>
          </div>
          <div className="mt-2 text-sm text-white/50">Submitted at {formatIST(submission.submitted_at)}</div>
          {submission.answer && (
            <div className="mt-4">
              <p className="text-xs text-white/40 mb-2">Your submission:</p>
              <img src={submission.answer} alt="Your submission" className="max-h-64 rounded-lg border border-white/10" />
            </div>
          )}
          <p className="mt-3 text-xs text-white/50">This event is now locked for your team. Our judges will review all submissions.</p>
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
            <p className="mt-1 text-sm">You did not submit a design in the window.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      setErr("File too large. Max 10MB.");
      return;
    }
    if (!selected.type.startsWith("image/")) {
      setErr("Only image files are allowed (PNG, JPG, GIF, WebP).");
      return;
    }
    setFile(selected);
    setErr(null);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (dropped.size > 10 * 1024 * 1024) {
      setErr("File too large. Max 10MB.");
      return;
    }
    if (!dropped.type.startsWith("image/")) {
      setErr("Only image files are allowed.");
      return;
    }
    setFile(dropped);
    setErr(null);
    const url = URL.createObjectURL(dropped);
    setPreview(url);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setErr(null);

    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `${data.event.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("event-submissions")
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("event-submissions")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

      submit.mutate(urlData.publicUrl);
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Challenge Header */}
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Non-Tech · Event 2 · Challenge</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Design Challenge: Vibeathon 6.0</h1>
        <p className="mt-1 text-sm text-white/60">
          Create something creative for Vibeathon 6.0 — a social media post, meme, poster, theme, or any visual design.
        </p>
      </div>

      {/* Challenge Details */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">What to Create</span>
        </div>
        <div className="space-y-3 text-sm text-white/70">
          <p>Design anything that represents <strong className="text-white">Vibeathon 6.0</strong> — the vibecoding hackathon by NXTGenSec. Your design could be:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded bg-white/5 p-2">📸 Social media post / Story</div>
            <div className="rounded bg-white/5 p-2">😂 Meme about hackathon culture</div>
            <div className="rounded bg-white/5 p-2">🎨 Event poster / Banner</div>
            <div className="rounded bg-white/5 p-2">🎭 Any creative visual</div>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-white/50 text-xs">Evaluation criteria:</p>
            <ul className="mt-1 space-y-1 text-white/70">
              <li>• Creativity & originality</li>
              <li>• Relevance to Vibeathon 6.0 / vibecoding theme</li>
              <li>• Visual appeal & design quality</li>
              <li>• Effort & craftsmanship</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Upload Area */}
      <GlassCard>
        <div className="text-xs uppercase tracking-widest text-white/50">Your Design</div>
        <p className="mt-1 text-sm text-white/60">Upload your creation (PNG, JPG, GIF, WebP — max 10MB)</p>

        {!preview ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 p-8 transition hover:border-primary hover:bg-white/5"
          >
            <Upload className="h-10 w-10 text-white/30" />
            <p className="mt-3 text-sm text-white/50">Click to browse or drag & drop</p>
            <p className="mt-1 text-xs text-white/30">PNG, JPG, GIF, WebP — Max 10MB</p>
          </div>
        ) : (
          <div className="mt-4 relative">
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute -top-2 -right-2 z-10 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={preview} alt="Preview" className="max-h-80 rounded-lg border border-white/10 object-contain" />
            <p className="mt-2 text-xs text-white/40">{file?.name} ({((file?.size ?? 0) / 1024 / 1024).toFixed(2)} MB)</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {err && <div className="mt-3 text-xs text-red-400">{err}</div>}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-white/50 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            One submission only. Event locks after submitting.
          </div>
          <button
            disabled={!file || uploading || submit.isPending}
            onClick={handleSubmit}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : submit.isPending ? "Submitting…" : "Submit Design"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
