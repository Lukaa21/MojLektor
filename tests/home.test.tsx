import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Home from "../src/app/page";

const mockFetch = (payload: unknown, ok = true) => {
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(payload),
  });
};

describe("Home page", () => {
  it("submits text to /api/process and renders result", async () => {
    const user = userEvent.setup({ delay: 0 });
    const edited = "Uloga: Korektor...\nTekst:\nTest.";
    global.fetch = mockFetch({
      edited,
      original: "Test.",
      diff: [{ type: "unchanged", value: edited }],
      cardCount: 1,
      status: "DONE",
    }) as unknown as typeof fetch;

    render(<Home />);

    await user.type(
      screen.getByLabelText("Tekst za obradu"),
      "Test."
    );
    await user.selectOptions(
      screen.getByLabelText("Vrsta teksta"),
      "akademski rad"
    );
    await user.selectOptions(
      screen.getByLabelText("Jezik"),
      "srpski"
    );

    await user.click(
      screen.getByRole("button", { name: "Posalji na obradu" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/process",
        expect.objectContaining({ method: "POST" })
      );
    });

    expect(await screen.findByText("Rezultat")).toBeInTheDocument();
    const editedNode = await screen.findByLabelText("Izmijenjeni tekst");
    expect(editedNode).toHaveTextContent("Uloga: Korektor... Tekst: Test.");
  });

  it("requests estimate and shows pricing", async () => {
    const user = userEvent.setup({ delay: 0 });
    const longText = "a".repeat(1501);
    global.fetch = mockFetch({
      cardCount: 2,
      priceBreakdown: {
        serviceType: "LEKTURA",
        perCard: 1,
        cardCount: 2,
        subtotal: 2,
      },
      totalPrice: 2,
    }) as unknown as typeof fetch;

    render(<Home />);

    fireEvent.change(screen.getByLabelText("Tekst za obradu"), {
      target: { value: longText },
    });
    await user.selectOptions(
      screen.getByLabelText("Vrsta teksta"),
      "akademski rad"
    );
    await user.selectOptions(
      screen.getByLabelText("Jezik"),
      "srpski"
    );

    await user.click(
      screen.getByRole("button", { name: "Procijeni cijenu" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/estimate",
        expect.objectContaining({ method: "POST" })
      );
    });

    expect(await screen.findByText("Procjena")).toBeInTheDocument();
    expect(screen.getByText("Kartice: 2")).toBeInTheDocument();
  }, 10000);

  it("blocks submit on empty input", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    await user.click(
      screen.getByRole("button", { name: "Posalji na obradu" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unesite tekst prije slanja."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("blocks submit when text type is missing", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    await user.type(
      screen.getByLabelText("Tekst za obradu"),
      "Test."
    );
    await user.click(
      screen.getByRole("button", { name: "Posalji na obradu" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Odaberite vrstu teksta."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("blocks submit when language is missing", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    await user.type(
      screen.getByLabelText("Tekst za obradu"),
      "Test."
    );
    await user.selectOptions(
      screen.getByLabelText("Vrsta teksta"),
      "akademski rad"
    );
    await user.click(
      screen.getByRole("button", { name: "Posalji na obradu" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Odaberite jezik."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits uploaded file to /api/upload with multipart/form-data", async () => {
    const user = userEvent.setup({ delay: 0 });
    const edited = "Izmijenjen sadrzaj.";
    global.fetch = mockFetch({
      edited,
      original: "Originalni sadrzaj.",
      diff: [{ type: "unchanged", value: edited }],
      cardCount: 1,
      status: "DONE",
    }) as unknown as typeof fetch;

    render(<Home />);

    const fileInput = screen.getByLabelText("Upload fajla") as HTMLInputElement;
    const file = new File(["Tekst iz fajla"], "test.txt", { type: "text/plain" });

    await user.upload(fileInput, file);
    await user.selectOptions(screen.getByLabelText("Vrsta teksta"), "akademski rad");
    await user.selectOptions(screen.getByLabelText("Jezik"), "srpski");
    await user.click(screen.getByRole("button", { name: "Posalji na obradu" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/upload",
        expect.objectContaining({ method: "POST" })
      );
    });

    const editedNode = await screen.findByLabelText("Izmijenjeni tekst");
    expect(editedNode).toHaveTextContent(edited);
  });

  it("estimates price from uploaded file without rawText error", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({
      rawText: "Ekstrahovani tekst iz fajla.",
      cardCount: 1,
      priceBreakdown: {
        serviceType: "LEKTURA",
        perCard: 1,
        cardCount: 1,
        subtotal: 1,
      },
      totalPrice: 1,
    }) as unknown as typeof fetch;

    render(<Home />);

    const fileInput = screen.getByLabelText("Upload fajla") as HTMLInputElement;
    const file = new File(["Tekst iz fajla"], "procjena.txt", { type: "text/plain" });

    await user.upload(fileInput, file);
    await user.selectOptions(screen.getByLabelText("Vrsta teksta"), "akademski rad");
    await user.selectOptions(screen.getByLabelText("Jezik"), "srpski");
    await user.click(screen.getByRole("button", { name: "Procijeni cijenu" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/estimate",
        expect.objectContaining({ method: "POST" })
      );
    });

    expect(await screen.findByText("Procjena")).toBeInTheDocument();
    expect(screen.queryByText(/rawText, serviceType, textType, and language are required/i)).not.toBeInTheDocument();
  });

  it("clears uploaded file and resets text/estimate state", async () => {
    const user = userEvent.setup({ delay: 0 });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          rawText: "Ekstrahovani tekst iz fajla.",
          cardCount: 1,
          priceBreakdown: {
            serviceType: "LEKTURA",
            perCard: 1,
            cardCount: 1,
            subtotal: 1,
          },
          totalPrice: 1,
        }),
      }) as unknown as typeof fetch;

    render(<Home />);

    const fileInput = screen.getByLabelText("Upload fajla") as HTMLInputElement;
    const file = new File(["Tekst iz fajla"], "clear-me.txt", {
      type: "text/plain",
    });

    await user.upload(fileInput, file);
    await user.selectOptions(screen.getByLabelText("Vrsta teksta"), "akademski rad");
    await user.selectOptions(screen.getByLabelText("Jezik"), "srpski");
    await user.click(screen.getByRole("button", { name: "Procijeni cijenu" }));

    expect(await screen.findByText("Procjena")).toBeInTheDocument();
    expect(await screen.findByText(/Odabran fajl:/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ukloni fajl" }));

    expect(screen.queryByText("Procjena")).not.toBeInTheDocument();
    expect(screen.queryByText(/Odabran fajl:/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tekst za obradu")).toHaveValue("");
    expect(screen.getByLabelText("Tekst za obradu")).not.toBeDisabled();
    expect(screen.getByLabelText("Upload fajla")).not.toBeDisabled();
  });
});
