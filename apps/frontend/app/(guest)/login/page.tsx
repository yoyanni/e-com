import type { Metadata } from "next";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account to start shopping.",
};

const LoginPage = () => {
  return (
    <div className="w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
