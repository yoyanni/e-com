import type { Metadata } from "next";

import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create an account to start shopping.",
};

const RegisterPage = () => {
  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <RegisterForm />
    </main>
  );
};

export default RegisterPage;
