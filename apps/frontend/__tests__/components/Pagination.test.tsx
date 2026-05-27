import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "@/app/products/Pagination";
import { renderWithQuery } from "../test-utils";

// Mocks
const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

// Per-test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Tests
describe("Pagination", () => {
  describe("page indicator", () => {
    it("displays the current page and total pages", () => {
      renderWithQuery(<Pagination total={60} page={2} limit={12} />);

      expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    });

    it("shows page 1 of 1 for a single page of results", () => {
      renderWithQuery(<Pagination total={10} page={1} limit={12} />);

      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    });
  });

  describe("Previous button", () => {
    it("is disabled on page 1", () => {
      renderWithQuery(<Pagination total={60} page={1} limit={12} />);

      expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    });

    it("is enabled when not on page 1", () => {
      renderWithQuery(<Pagination total={60} page={3} limit={12} />);

      expect(
        screen.getByRole("button", { name: /previous/i }),
      ).not.toBeDisabled();
    });

    it("calls router.replace with page - 1", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Pagination total={60} page={3} limit={12} />);

      await user.click(screen.getByRole("button", { name: /previous/i }));

      expect(replaceMock).toHaveBeenCalledTimes(1);
      const url = replaceMock.mock.calls[0][0] as string;
      expect(new URLSearchParams(url.split("?")[1]).get("page")).toBe("2");
    });
  });

  describe("Next button", () => {
    it("is disabled on the last page", () => {
      renderWithQuery(<Pagination total={60} page={5} limit={12} />);

      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });

    it("is enabled when not on the last page", () => {
      renderWithQuery(<Pagination total={60} page={2} limit={12} />);

      expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
    });

    it("calls router.replace with page + 1", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Pagination total={60} page={2} limit={12} />);

      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(replaceMock).toHaveBeenCalledTimes(1);
      const url = replaceMock.mock.calls[0][0] as string;
      expect(new URLSearchParams(url.split("?")[1]).get("page")).toBe("3");
    });
  });

  describe("per-page select", () => {
    it("renders all three per-page options", () => {
      renderWithQuery(<Pagination total={60} page={1} limit={12} />);

      expect(
        screen.getByRole("option", { name: "12 / page" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "24 / page" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "48 / page" }),
      ).toBeInTheDocument();
    });

    it("changing the limit calls router.replace with new limit and no page param", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Pagination total={60} page={1} limit={12} />);

      await user.selectOptions(screen.getByRole("combobox"), "24");

      expect(replaceMock).toHaveBeenCalledTimes(1);
      const url = replaceMock.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("limit")).toBe("24");
      expect(params.has("page")).toBe(false);
    });
  });
});
