import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  handleStripeEvent: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/env", () => ({
  stripeEnv: { STRIPE_WEBHOOK_SECRET: "whsec_test" },
}));
vi.mock("@/lib/stripe", () => ({
  stripe: { webhooks: { constructEvent: mocks.constructEvent } },
}));
vi.mock("@/lib/stripe-webhook", () => ({
  handleStripeEvent: mocks.handleStripeEvent,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

const event = { id: "evt_1", type: "customer.subscription.updated" };

function request(
  headers: Record<string, string> = {},
  body = '{"id":"evt_1"}',
) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.constructEvent.mockReturnValue(event);
    mocks.handleStripeEvent.mockResolvedValue(true);
  });

  it("rejects a request without a signature before doing anything", async () => {
    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(mocks.constructEvent).not.toHaveBeenCalled();
    expect(mocks.handleStripeEvent).not.toHaveBeenCalled();
  });

  it("rejects a bad signature without handling the event", async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    const response = await POST(request({ "stripe-signature": "bad" }));

    expect(response.status).toBe(400);
    expect(mocks.handleStripeEvent).not.toHaveBeenCalled();
  });

  it("verifies the signature against the raw body and the webhook secret", async () => {
    await POST(request({ "stripe-signature": "sig" }));

    expect(mocks.constructEvent).toHaveBeenCalledWith(
      '{"id":"evt_1"}',
      "sig",
      "whsec_test",
    );
  });

  it("handles a verified event and refreshes the pages when the plan changed", async () => {
    const response = await POST(request({ "stripe-signature": "sig" }));

    expect(response.status).toBe(200);
    expect(mocks.handleStripeEvent).toHaveBeenCalledWith(event);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("answers 200 without refreshing when nothing changed", async () => {
    mocks.handleStripeEvent.mockResolvedValue(false);

    const response = await POST(request({ "stripe-signature": "sig" }));

    expect(response.status).toBe(200);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("answers 500 so Stripe retries, logging the ids and not the error message", async () => {
    mocks.handleStripeEvent.mockRejectedValue(
      Object.assign(
        new Error("Unique constraint failed on email dev@example.com"),
        { code: "P2002" },
      ),
    );

    const response = await POST(request({ "stripe-signature": "sig" }));

    expect(response.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith("Stripe webhook failed", {
      eventId: "evt_1",
      type: "customer.subscription.updated",
      error: "Error",
      code: "P2002",
    });
  });

  it("verifies the body byte for byte, whitespace included", async () => {
    const raw = '{ "id" :  "evt_1" ,\n  "type": "x" }\n';

    await POST(request({ "stripe-signature": "sig" }, raw));

    expect(mocks.constructEvent.mock.calls[0][0]).toBe(raw);
  });
});
