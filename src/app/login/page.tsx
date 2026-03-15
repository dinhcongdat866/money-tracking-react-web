import { LoginForm } from "./LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ returnUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnUrl = params?.returnUrl ?? null;
  return <LoginForm initialReturnUrl={returnUrl} />;
}


