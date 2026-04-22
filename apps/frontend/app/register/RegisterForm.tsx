"use client";

import { IRegisterDto } from "@e-com/shared";
import { ChangeEvent, SubmitEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const initialForm: IRegisterDto = {
  name: "",
  email: "",
  password: "",
};

export const RegisterForm = () => {
  const [formData, setFormData] = useState<IRegisterDto>(initialForm);

  const { registerMutation } = useAuth();
  const { mutate, isPending, error } = registerMutation;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutate(formData);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const errorMessage = error
    ? ((error as { response?: { data?: { message?: string; error?: string } } })
        .response?.data?.message ??
      (error as { response?: { data?: { error?: string } } }).response?.data
        ?.error ??
      error.message)
    : null;

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          Name
        </label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

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
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Creating account..." : "Register"}
      </Button>
    </form>
  );
};
