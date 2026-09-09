"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateProfile } from "@/lib/actions/settings";
import { idle } from "@/lib/actions/shared";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, idle);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="min-w-40 flex-1">
        <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted">
          Моє імʼя
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={profile.name}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="color" className="mb-1.5 block text-xs font-medium text-muted">
          Колір
        </label>
        <input
          id="color"
          name="color"
          type="color"
          defaultValue={profile.color}
          className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-surface-2 p-1"
        />
      </div>

      <button type="submit" className="btn btn-ghost" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state.ok ? (
          <Check className="h-4 w-4 text-ok" />
        ) : null}
        Зберегти
      </button>

      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
