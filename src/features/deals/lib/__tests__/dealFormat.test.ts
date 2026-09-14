import { describe, expect, it } from "vitest";
import {
  dollarsToCents,
  formatCents,
  isMyTurn,
  lastActivityText,
  parseDealMeta,
  proposalDescription,
  proposalTitle,
  statusMeta,
  termLabel,
  termsEqual,
  territoryLabel,
} from "../dealFormat";
import { defaultTerms } from "../constants";
import type { DealStatus } from "../../types/deal.types";

const BUYER = { _id: "b".repeat(24), username: "Scottmurr", avatar: null };
const SELLER = { _id: "a".repeat(24), username: "Unknown", avatar: null };

function deal(overrides: { status?: DealStatus; lastProposalBy?: string; proposalCount?: number } = {}) {
  return {
    status: "negotiating" as DealStatus,
    lastProposalBy: BUYER._id,
    proposalCount: 3,
    buyer: BUYER,
    seller: SELLER,
    ...overrides,
  };
}

describe("formatCents", () => {
  it("drops the fraction for whole-dollar amounts", () => {
    expect(formatCents(1_500_000)).toBe("$15,000");
  });

  it("keeps cents when present", () => {
    expect(formatCents(1050)).toBe("$10.50");
  });

  it("treats missing values as zero", () => {
    expect(formatCents(undefined)).toBe("$0");
  });
});

describe("dollarsToCents", () => {
  it("accepts commas and a dollar sign", () => {
    expect(dollarsToCents("$15,000")).toBe(1_500_000);
  });

  it("rounds to the nearest cent", () => {
    expect(dollarsToCents("19.999")).toBe(2000);
  });

  it("returns NaN for non-numeric input", () => {
    expect(dollarsToCents("abc")).toBeNaN();
  });
});

describe("labels", () => {
  it("formats term length, including perpetual", () => {
    expect(termLabel(0)).toBe("Perpetual");
    expect(termLabel(1)).toBe("1 month");
    expect(termLabel(24)).toBe("24 months");
  });

  it("uses the short territory label when asked", () => {
    expect(territoryLabel("us_canada")).toBe("United States & Canada");
    expect(territoryLabel("us_canada", true)).toBe("US & Canada");
  });

  it("falls back to a readable key for unknown options", () => {
    expect(territoryLabel("mars_colony")).toBe("mars colony");
  });

  it("maps statuses to the chip labels", () => {
    expect(statusMeta("pending").label).toBe("Awaiting Response");
    expect(statusMeta("paid").label).toBe("In Escrow");
    expect(statusMeta("nonsense").badgeClass).toBe("mp-badge-default");
  });
});

describe("isMyTurn", () => {
  it("is the viewer's turn when the other party proposed last", () => {
    expect(isMyTurn(deal({ lastProposalBy: BUYER._id }), SELLER._id)).toBe(true);
  });

  it("is not the viewer's turn right after they proposed", () => {
    expect(isMyTurn(deal({ lastProposalBy: BUYER._id }), BUYER._id)).toBe(false);
  });

  it("is nobody's turn once negotiation has closed", () => {
    expect(isMyTurn(deal({ status: "accepted" }), SELLER._id)).toBe(false);
  });

  it("is false without a viewer", () => {
    expect(isMyTurn(deal(), undefined)).toBe(false);
  });
});

describe("lastActivityText", () => {
  it("describes the viewer's own first offer", () => {
    expect(lastActivityText(deal({ status: "pending", proposalCount: 1 }), BUYER._id)).toBe("You sent an offer");
  });

  it("describes the viewer's own counter", () => {
    expect(lastActivityText(deal(), BUYER._id)).toBe("You sent a counter offer");
  });

  it("names the other party when they moved last", () => {
    expect(lastActivityText(deal({ lastProposalBy: SELLER._id }), BUYER._id)).toBe("Unknown sent a counter offer");
  });

  it("reports terminal states regardless of who moved", () => {
    expect(lastActivityText(deal({ status: "completed" }), BUYER._id)).toBe("Agreement finalized");
  });
});

describe("proposal copy", () => {
  it("matches the Offer History wording", () => {
    expect(proposalTitle("revised")).toBe("Revised Offer");
    expect(proposalDescription("initial", "Scottmurr", "buyer")).toBe("Scottmurr (Buyer) made an offer");
    expect(proposalDescription("counter", "Unknown", "seller")).toBe("Unknown (Creator) sent a counter offer");
  });
});

describe("termsEqual", () => {
  it("ignores surrounding whitespace in notes", () => {
    const a = defaultTerms("licensing", 1_000_000);
    expect(termsEqual(a, { ...a, notes: `  ${a.notes}  ` })).toBe(true);
  });

  it("detects a changed amount", () => {
    const a = defaultTerms("licensing", 1_000_000);
    expect(termsEqual(a, { ...a, amountCents: 1_500_000 })).toBe(false);
  });
});

describe("parseDealMeta", () => {
  const valid = {
    dealId: "c".repeat(24),
    event: "counter",
    actorId: SELLER._id,
    actorName: "Unknown",
    actorRole: "seller",
    amountCents: 1_800_000,
    dealType: "streaming_license",
    territory: "us_canada",
    termMonths: 24,
    dealStatus: "negotiating",
    listingTitle: "Spring",
  };

  it("accepts well-formed metadata", () => {
    expect(parseDealMeta(valid)).toMatchObject({ event: "counter", amountCents: 1_800_000 });
  });

  it("rejects a malformed deal id", () => {
    expect(parseDealMeta({ ...valid, dealId: "../../admin" })).toBeNull();
  });

  it("rejects unknown events", () => {
    expect(parseDealMeta({ ...valid, event: "hack" })).toBeNull();
  });

  it("rejects non-objects", () => {
    expect(parseDealMeta(null)).toBeNull();
    expect(parseDealMeta("deal")).toBeNull();
  });

  it("coerces bad field types to safe defaults", () => {
    expect(parseDealMeta({ ...valid, amountCents: "lots" })?.amountCents).toBe(0);
  });
});
