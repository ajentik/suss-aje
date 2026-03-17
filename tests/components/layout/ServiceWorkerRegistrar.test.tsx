import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

describe("ServiceWorkerRegistrar", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders null (no visible output)", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });

    const { default: ServiceWorkerRegistrar } = await import(
      "@/components/layout/ServiceWorkerRegistrar"
    );
    const { container } = render(<ServiceWorkerRegistrar />);
    expect(container.innerHTML).toBe("");
  });

  it("calls navigator.serviceWorker.register with /sw.js", async () => {
    const registerFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerFn },
      configurable: true,
      writable: true,
    });

    const { default: ServiceWorkerRegistrar } = await import(
      "@/components/layout/ServiceWorkerRegistrar"
    );
    render(<ServiceWorkerRegistrar />);

    expect(registerFn).toHaveBeenCalledWith("/sw.js");
  });

  it("handles registration failure silently", async () => {
    const registerFn = vi.fn().mockRejectedValue(new Error("SW failed"));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerFn },
      configurable: true,
      writable: true,
    });

    const { default: ServiceWorkerRegistrar } = await import(
      "@/components/layout/ServiceWorkerRegistrar"
    );

    expect(() => render(<ServiceWorkerRegistrar />)).not.toThrow();
  });
});
