"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    login,
    initialState
  );

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Sign in to Money Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="demo@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="password123"
                required
                autoComplete="current-password"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" className="w-full">
              Sign in
            </Button>

            <p className="mt-2 text-xs text-muted-foreground">
              Demo account: <span className="font-mono">demo@example.com</span>{" "}
              / <span className="font-mono">password123</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


