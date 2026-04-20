import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Sign up | Money Tracker",
};

export default function SignupPage() {
  return <SignupForm />;
}
