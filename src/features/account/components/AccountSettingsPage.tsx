"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccountProfile, useUpdateAccountProfile } from "../hooks/use-profile";

const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh" },
  { value: "America/New_York", label: "New York" },
  { value: "UTC", label: "UTC" },
] as const;

export function AccountSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useAccountProfile();
  const updateMutation = useUpdateAccountProfile();

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Europe/London");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDisplayName(data.displayName);
    setTimezone(data.timezone);
    setMarketingOptIn(data.marketingOptIn);
  }, [data]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!data) return;
    await updateMutation.mutateAsync({
      displayName: displayName.trim(),
      timezone,
      marketingOptIn,
    });
  };

  const dirty =
    !!data &&
    (displayName.trim() !== data.displayName ||
      timezone !== data.timezone ||
      marketingOptIn !== data.marketingOptIn);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile settings loaded and saved via REST (<code className="text-xs">GET/PATCH /api/account/profile</code>
          ), with the session cookie sent automatically — similar to account areas on map or product sites.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          )}
          {isError && (
            <div className="space-y-2 text-sm">
              <p className="text-destructive">{error.message}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}
          {data && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" value={data.email} readOnly className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Read-only in this demo.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display name
                </label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  maxLength={80}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="timezone" className="text-sm font-medium">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-1 size-4 rounded border-input"
                />
                <span>
                  <span className="font-medium">Product updates</span>
                  <span className="block text-muted-foreground">
                    Optional emails about new features (demo checkbox).
                  </span>
                </span>
              </label>

              <Button type="submit" disabled={!dirty || updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>

              {updateMutation.isError && (
                <p className="text-sm text-destructive">{updateMutation.error.message}</p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
