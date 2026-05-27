import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/app/(guest)/login/LoginForm";
import { renderWithQuery } from "../test-utils";

// Mocks
const mutateMock = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/getApiErrorMessage", () => ({
  getApiErrorMessage: jest.fn(() => "mocked error"),
}));

import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
const mockUseAuth = useAuth as jest.Mock;
const mockGetApiErrorMessage = getApiErrorMessage as jest.Mock;

/**
 * Per-test setup
 * `error` is typed loosely as `unknown` because the tests pass Axios-shaped
 * error objects which are not @tanstack/query error objects
 */
interface LoginMutationOverrides {
  mutate?: jest.Mock;
  isPending?: boolean;
  error?: unknown;
}

function makeAuthHook(overrides: LoginMutationOverrides = {}) {
  return {
    loginMutation: {
      mutate: mutateMock,
      isPending: false,
      error: null,
      ...overrides,
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue(makeAuthHook());
  mockGetApiErrorMessage.mockReturnValue("mocked error");
});

// Tests
describe("LoginForm", () => {
  it("renders email and password inputs", () => {
    renderWithQuery(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the submit button with label 'Login'", () => {
    renderWithQuery(<LoginForm />);

    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
  });

  it("calls mutate with form values on submit", async () => {
    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(mutateMock).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "secret",
    });
  });

  it("disables the button and shows 'Logging in…' while pending", () => {
    mockUseAuth.mockReturnValue(makeAuthHook({ isPending: true }));

    renderWithQuery(<LoginForm />);

    const button = screen.getByRole("button", { name: /logging in/i });
    expect(button).toBeDisabled();
  });

  it("displays the message returned by getApiErrorMessage when error is present", () => {
    mockGetApiErrorMessage.mockReturnValue("Invalid credentials");
    mockUseAuth.mockReturnValue(makeAuthHook({ error: new Error("raw") }));

    renderWithQuery(<LoginForm />);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    expect(mockGetApiErrorMessage).toHaveBeenCalledTimes(1);
  });

  it("shows no error paragraph when error is null", () => {
    renderWithQuery(<LoginForm />);

    expect(screen.queryByText("mocked error")).toBeNull();
    expect(mockGetApiErrorMessage).not.toHaveBeenCalled();
  });
});
