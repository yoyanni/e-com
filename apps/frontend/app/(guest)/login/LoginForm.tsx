"use client";

import { ILoginDto } from "@e-com/shared";
import { ChangeEvent, SubmitEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

const initialForm: ILoginDto = {
  email: "",
  password: "",
};

export const LoginForm = () => {
  const [formData, setFormData] = useState<ILoginDto>(initialForm);
  const { loginMutation } = useAuth();
    const { mutate, isPending, error } = loginMutation;


  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutate(formData);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const errorMessage = error ? getApiErrorMessage(error) : null;

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      {errorMessage ? (
        <p role="alert" data-testid="login-error" className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};
