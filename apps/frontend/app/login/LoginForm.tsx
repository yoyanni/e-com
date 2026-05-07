"use client";

import { ILoginDto } from "@e-com/shared";
import { useMutation } from "@tanstack/react-query";
import { ChangeEvent, SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser } from "@/api/service";

const initialForm: ILoginDto = {
  email: "",
  password: "",
};

export const LoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ILoginDto>(initialForm);

  const { mutate, isPending, error } = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      router.push("/products");
    },
  });

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
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};
