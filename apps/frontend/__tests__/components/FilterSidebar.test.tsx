import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterSidebar from "@/app/products/FilterSidebar";
import { renderWithQuery } from "../test-utils";

// Mocks
const replaceMock = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
}));

const categories = [
  { id: "cat-1", name: "Books", slug: "books" },
  { id: "cat-2", name: "Games", slug: "games" },
];

function lastReplacedParams() {
  const url = replaceMock.mock.calls.at(-1)[0] as string;
  return new URLSearchParams(url.split("?")[1] ?? "");
}

// Per-test setup
beforeEach(() => {
  jest.clearAllMocks();
  searchParams = new URLSearchParams();
});

// Tests
describe("FilterSidebar", () => {
  describe("category select", () => {
    it("shows All categories when there's no category in the URL", () => {
      renderWithQuery(<FilterSidebar categories={categories} />);

      expect(
        screen.getByRole("combobox", { name: "Category" }),
      ).toHaveTextContent("All categories");
    });

    it("sets the category and resets the page", async () => {
      searchParams = new URLSearchParams("page=3");
      const user = userEvent.setup();
      renderWithQuery(<FilterSidebar categories={categories} />);

      await user.click(screen.getByRole("combobox", { name: "Category" }));
      await user.click(screen.getByRole("option", { name: "Games" }));

      const params = lastReplacedParams();
      expect(params.get("category")).toBe("games");
      expect(params.has("page")).toBe(false);
    });

    it("removes the category when All categories is chosen", async () => {
      searchParams = new URLSearchParams("category=books&search=x");
      const user = userEvent.setup();
      renderWithQuery(<FilterSidebar categories={categories} />);

      await user.click(screen.getByRole("combobox", { name: "Category" }));
      await user.click(screen.getByRole("option", { name: "All categories" }));

      const params = lastReplacedParams();
      expect(params.has("category")).toBe(false);
      expect(params.get("search")).toBe("x");
    });
  });

  describe("sort select", () => {
    it("defaults to Newest", () => {
      renderWithQuery(<FilterSidebar categories={categories} />);

      expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent(
        "Newest",
      );
    });

    it("sets the sort", async () => {
      const user = userEvent.setup();
      renderWithQuery(<FilterSidebar categories={categories} />);

      await user.click(screen.getByRole("combobox", { name: "Sort" }));
      await user.click(
        screen.getByRole("option", { name: "Price: Low to High" }),
      );

      expect(lastReplacedParams().get("sort")).toBe("price_asc");
    });
  });
});
