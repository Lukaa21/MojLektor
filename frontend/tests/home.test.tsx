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
  const reversiblePayload = {
    edited: "Idem kuci s Markom. Idem s tobom.",
    original: "Idem kuci sa Markom. Idem sa tobom.",
    diff: [
      { type: "unchanged", value: "Idem kuci " },
      { type: "modified", original: "sa", edited: "s" },
      { type: "unchanged", value: " Markom. Idem " },
      { type: "modified", original: "sa", edited: "s" },
      { type: "unchanged", value: " tobom." },
    ],
    changes: [
      {
        id: "change_0",
        original: "sa",
        modified: "s",
        startIndex: 10,
        endIndex: 11,
        groupKey: "sa→s",
        status: "active",
      },
      {
        id: "change_1",
        original: "sa",
        modified: "s",
        startIndex: 25,
        endIndex: 26,
        groupKey: "sa→s",
        status: "active",
      },
    ],
    tokens: [
      { id: "token_0", text: "Idem kuci ", startIndex: 0, endIndex: 10, status: "static" },
      {
        id: "token_1",
        text: "s",
        startIndex: 10,
        endIndex: 11,
        changeId: "change_0",
        groupKey: "sa→s",
        status: "active",
      },
      { id: "token_2", text: " Markom. Idem ", startIndex: 11, endIndex: 25, status: "static" },
      {
        id: "token_3",
        text: "s",
        startIndex: 25,
        endIndex: 26,
        changeId: "change_1",
        groupKey: "sa→s",
        status: "active",
      },
      { id: "token_4", text: " tobom.", startIndex: 26, endIndex: 33, status: "static" },
    ],
    cardCount: 1,
    status: "DONE",
  };

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
      screen.getByRole("button", { name: "Pošalji na obradu" })
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

  it("reverts a single highlighted edit on click", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch(reversiblePayload) as unknown as typeof fetch;

    render(<Home />);

    await user.type(screen.getByLabelText("Tekst za obradu"), "Test.");
    await user.selectOptions(screen.getByLabelText("Vrsta teksta"), "akademski rad");
    await user.selectOptions(screen.getByLabelText("Jezik"), "srpski");
    await user.click(screen.getByRole("button", { name: "Pošalji na obradu" }));

    const editedNode = await screen.findByLabelText("Izmijenjeni tekst");
    const firstChange = editedNode.querySelector('[data-change-id="change_0"]');
    expect(firstChange).toBeInTheDocument();

    await user.click(firstChange as HTMLElement);

    expect(editedNode).toHaveTextContent("Idem kuci sa Markom. Idem s tobom.");
    expect(editedNode.querySelector('[data-change-id="change_0"]')).not.toBeInTheDocument();
  });

  it("opens batch modal and reverts selected identical edits on ctrl/cmd click", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch(reversiblePayload) as unknown as typeof fetch;

    render(<Home />);

    await user.type(screen.getByLabelText("Tekst za obradu"), "Test.");
    await user.selectOptions(screen.getByLabelText("Vrsta teksta"), "akademski rad");
    await user.selectOptions(screen.getByLabelText("Jezik"), "srpski");
    await user.click(screen.getByRole("button", { name: "Pošalji na obradu" }));

    const editedNode = await screen.findByLabelText("Izmijenjeni tekst");
    const firstChange = editedNode.querySelector('[data-change-id="change_0"]');
    expect(firstChange).toBeInTheDocument();

    fireEvent.click(firstChange as HTMLElement, { ctrlKey: true });

    expect(await screen.findByText("Potvrda grupnog vraćanja")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Potvrdi vraćanje" }));

    expect(editedNode).toHaveTextContent("Idem kuci sa Markom. Idem sa tobom.");
    expect(editedNode.querySelector('[data-change-id="change_1"]')).not.toBeInTheDocument();
  });

  it("updates pricing in real time while typing spaces", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    fireEvent.change(screen.getByLabelText("Tekst za obradu"), {
      target: { value: `a${" ".repeat(400)}` },
    });

    expect(screen.queryByText("Procjena")).not.toBeInTheDocument();

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

    expect(await screen.findByText("Procjena")).toBeInTheDocument();
    expect(screen.getByText("Kartice: 1")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tekst za obradu"), {
      target: { value: `a${" ".repeat(1500)}` },
    });

    expect(screen.getByText("Kartice: 2")).toBeInTheDocument();
  });

  it("blocks submit on empty input", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    await user.click(
      screen.getByRole("button", { name: "Pošalji na obradu" })
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
      screen.getByRole("button", { name: "Pošalji na obradu" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Odaberite vrstu teksta."
    );
    expect(global.fetch).not.toHaveBeenCalled();

    await user.selectOptions(
      screen.getByLabelText("Vrsta teksta"),
      "akademski rad"
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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
      screen.getByRole("button", { name: "Pošalji na obradu" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Odaberite jezik."
    );
    expect(global.fetch).not.toHaveBeenCalled();

    await user.selectOptions(
      screen.getByLabelText("Jezik"),
      "srpski"
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears empty-text alert when file becomes active", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    await user.click(
      screen.getByRole("button", { name: "Pošalji na obradu" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unesite tekst prije slanja."
    );

    const fileInput = screen.getByLabelText("Upload fajla") as HTMLInputElement;
    const file = new File(["Tekst iz fajla"], "alert-clear.txt", {
      type: "text/plain",
    });
    await user.upload(fileInput, file);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Pošalji na obradu" }));
    

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
    expect(screen.getByRole("button", { name: "Ukloni fajl" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ukloni fajl" }));

    expect(screen.queryByText("Procjena")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ukloni fajl" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tekst za obradu")).toHaveValue("");
    expect(screen.getByLabelText("Tekst za obradu")).not.toBeDisabled();
    expect(screen.getByLabelText("Upload fajla")).not.toBeDisabled();
  });

  it("shows warning when trying to upload while text input is active", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    await user.type(screen.getByLabelText("Tekst za obradu"), "Aktivan unos teksta");
    await user.click(screen.getByRole("button", { name: "Upozorenje: aktivan je unos teksta" }));

    expect(
      await screen.findByText(
        "Možete odabrati ili unos teksta ili upload fajla."
      )
    ).toBeInTheDocument();
  });

  it("typing while file is active clears file and switches to text input", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    const fileInput = screen.getByLabelText("Upload fajla") as HTMLInputElement;
    const file = new File(["Tekst iz fajla"], "warning.txt", { type: "text/plain" });
    await user.upload(fileInput, file);

    const textInput = screen.getByLabelText("Tekst za obradu");
    expect(textInput).not.toBeDisabled();

    await user.type(textInput, "Novi unos");

    expect(fileInput).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Ukloni fajl" })).not.toBeInTheDocument();
    expect(textInput).toHaveValue("Novi unos");
  });

  it("shows exact removal hint when last card has 1 character", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    fireEvent.change(screen.getByLabelText("Tekst za obradu"), {
      target: { value: "a".repeat(1501) },
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

    expect(
      await screen.findByText(
        /Ako uklonite još 1 karakter\/?a, cijena će biti [0-9]+\.[0-9]{2} EUR\./
      )
    ).toBeInTheDocument();
  });

  it("shows exact removal hint when sentence split makes last card larger than real overflow", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({}) as unknown as typeof fetch;

    render(<Home />);

    const firstSentence = `${"a".repeat(1464)}. `;
    const secondSentence = `${"b".repeat(34)}.`;

    fireEvent.change(screen.getByLabelText("Tekst za obradu"), {
      target: { value: `${firstSentence}${secondSentence}` },
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

    expect(
      await screen.findByText(
        /Ako uklonite još 1 karakter\/?a, cijena će biti [0-9]+\.[0-9]{2} EUR\./
      )
    ).toBeInTheDocument();
  });

  it("keeps add hint stable after upload estimate when editing around 8500 chars", async () => {
    const user = userEvent.setup({ delay: 0 });
    global.fetch = mockFetch({
      rawText: "a".repeat(8500),
      cardCount: 6,
      priceBreakdown: {
        serviceType: "LEKTURA",
        perCard: 1,
        cardCount: 6,
        subtotal: 6,
      },
      totalPrice: 6,
    }) as unknown as typeof fetch;

    render(<Home />);

    const fileInput = screen.getByLabelText("Upload fajla") as HTMLInputElement;
    const file = new File(["Tekst iz fajla"], "long.txt", { type: "text/plain" });

    await user.upload(fileInput, file);
    await user.selectOptions(screen.getByLabelText("Vrsta teksta"), "akademski rad");
    await user.selectOptions(screen.getByLabelText("Jezik"), "srpski");
    await user.click(screen.getByRole("button", { name: "Procijeni cijenu" }));

    expect(await screen.findByText("Kartice: 6")).toBeInTheDocument();
    expect(
      await screen.findByText(/Za istu cijenu možete dodati još 500 karakter\/?a\./)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tekst za obradu"), {
      target: { value: "a".repeat(8501) },
    });

    expect(await screen.findByText("Kartice: 6")).toBeInTheDocument();
    expect(
      await screen.findByText(/Za istu cijenu možete dodati još 499 karakter\/?a\./)
    ).toBeInTheDocument();
  });
});
