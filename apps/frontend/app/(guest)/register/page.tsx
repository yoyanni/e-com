import type { Metadata } from "next";

import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create an account to start shopping.",
};

const RegisterPage = () => {
  return (
    <div className="w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
