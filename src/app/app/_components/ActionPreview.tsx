"use client";

import { type AgentAction, getActionLabel, groupActionsForPreview } from "@/lib/brain-dump-agent";
import { Check, Sparkles } from "lucide-react";

type RejectedAction = {
  action: AgentAction;
  reason: string;
};

type ActionPreviewProps = {
  actions: AgentAction[];
  rejected: RejectedAction[];
  onAccept: () => void;
  isApplying: boolean;
  isApplied: boolean;
  applyError: string | null;
};

function Section({
  title,
  items,
}: {
  title: string;
  items: AgentAction[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={`${item.action}-${item.entityType}-${"id" in item ? item.id : index}`}
            className="rounded-lg border border-stone-300/80 bg-stone-50 px-2.5 py-2 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-200"
          >
            <span className="mr-2 inline-flex rounded-md border border-stone-300 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-600 dark:border-stone-600 dark:text-stone-300">
              {item.entityType}
            </span>
            {getActionLabel(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActionPreview({
  actions,
  rejected,
  onAccept,
  isApplying,
  isApplied,
  applyError,
}: ActionPreviewProps) {
  const grouped = groupActionsForPreview(actions);
  const hasActions = actions.length > 0;

  return (
    <div className="space-y-3 rounded-2xl border border-stone-300 bg-white/90 p-3 dark:border-stone-700 dark:bg-stone-950/85">
      <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
        <Sparkles className="size-4" aria-hidden />
        Suggested actions
      </div>

      {hasActions ? (
        <div className="space-y-3">
          <Section title="Create" items={grouped.create} />
          <Section title="Update" items={grouped.update} />
          <Section title="Change status" items={grouped.changeStatus} />
          <Section title="Delete" items={grouped.delete} />
        </div>
      ) : (
        <p className="text-xs text-stone-600 dark:text-stone-300">No safe actions were suggested for this message.</p>
      )}

      {rejected.length > 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <p className="font-medium">Skipped invalid suggestions:</p>
          <ul className="mt-1 space-y-1">
            {rejected.map((item, index) => (
              <li key={`${item.reason}-${index}`}>- {item.reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {applyError ? (
        <p className="text-xs text-rose-700 dark:text-rose-300">{applyError}</p>
      ) : null}

      {!isApplied ? (
        <button
          type="button"
          onClick={onAccept}
          disabled={isApplying || !hasActions}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-stone-50 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          {isApplying ? "Applying..." : "Accept changes"}
        </button>
      ) : (
        <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <Check className="size-4" aria-hidden />
          Changes applied
        </p>
      )}
    </div>
  );
}
