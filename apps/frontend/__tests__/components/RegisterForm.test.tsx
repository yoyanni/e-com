import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/app/(guest)/register/RegisterForm";
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
interface RegisterMutationOverrides {
  mutate?: jest.Mock;
  isPending?: boolean;
  error?: unknown;
}

function makeAuthHook(overrides: RegisterMutationOverrides = {}) {
  return {
    registerMutation: {
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
describe("RegisterForm", () => {
  it("renders name, email, and password inputs", () => {
    renderWithQuery(<RegisterForm />);

    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the submit button with label 'Register'", () => {
    renderWithQuery(<RegisterForm />);

    expect(screen.getByRole("button", { name: /^register$/i })).toBeInTheDocument();
  });

  it("calls mutate with all three fields on submit", async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await user.type(screen.getByLabelText(/^name$/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /^register$/i }));

    expect(mutateMock).toHaveBeenCalledWith({
      name: "Alice",
      email: "alice@example.com",
      password: "secret",
    });
  });

  it("disables the button and shows 'Creating account…' while pending", () => {
    mockUseAuth.mockReturnValue(makeAuthHook({ isPending: true }));

    renderWithQuery(<RegisterForm />);

    const button = screen.getByRole("button", { name: /creating account/i });
    expect(button).toBeDisabled();
  });

  it("displays the message returned by getApiErrorMessage when error is present", () => {
    mockGetApiErrorMessage.mockReturnValue("Email already in use");
    mockUseAuth.mockReturnValue(makeAuthHook({ error: new Error("raw") }));

    renderWithQuery(<RegisterForm />);

    expect(screen.getByText("Email already in use")).toBeInTheDocument();
    expect(mockGetApiErrorMessage).toHaveBeenCalledTimes(1);
  });

  it("shows no error paragraph when error is null", () => {
    renderWithQuery(<RegisterForm />);

    expect(screen.queryByText("mocked error")).toBeNull();
    expect(mockGetApiErrorMessage).not.toHaveBeenCalled();
  });
});
