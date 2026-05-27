import axios from "axios";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

// We need a real AxiosError so axios.isAxiosError() returns true.
// Creating one via axios.AxiosError is the cleanest way to do that.
function makeAxiosError(
  message: string,
  data?: { message?: string; error?: string },
) {
  const error = new axios.AxiosError(message);
  if (data) {
    error.response = {
      data,
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    };
  }
  return error;
}

describe("getApiErrorMessage", () => {
  it("returns response.data.message for an Axios error", () => {
    const error = makeAxiosError("ignored", {
      message: "Email already in use",
    });

    expect(getApiErrorMessage(error)).toBe("Email already in use");
  });

  it("falls back to response.data.error when message is absent", () => {
    const error = makeAxiosError("ignored", { error: "Conflict" });

    expect(getApiErrorMessage(error)).toBe("Conflict");
  });

  it("falls back to error.message when response.data has neither field", () => {
    const error = makeAxiosError("Network Error");
    // no response attached

    expect(getApiErrorMessage(error)).toBe("Network Error");
  });

  it("returns error.message for a plain Error instance", () => {
    const error = new Error("Something went wrong");

    expect(getApiErrorMessage(error)).toBe("Something went wrong");
  });

  it("returns the fallback string for unknown error types", () => {
    expect(getApiErrorMessage("a string")).toBe("An unexpected error occurred");
    expect(getApiErrorMessage(null)).toBe("An unexpected error occurred");
    expect(getApiErrorMessage(42)).toBe("An unexpected error occurred");
    expect(getApiErrorMessage({ weird: true })).toBe(
      "An unexpected error occurred",
    );
  });
});
