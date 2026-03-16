import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import type { CampusEvent, POI } from "@/types";

const mockWalkTo = vi.fn();

vi.mock("@/hooks/useWalkingRoute", () => ({
  useWalkingRoute: vi.fn(() => ({ walkTo: mockWalkTo, isLoading: false })),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      routeInfo: null,
      setRouteInfo: vi.fn(),
      selectedDestination: null,
      setSelectedDestination: vi.fn(),
      flyToTarget: null,
      setFlyToTarget: vi.fn(),
      userLocation: null,
      setUserLocation: vi.fn(),
    }),
  ),
}));

const sampleEvent: CampusEvent = {
  id: "aac-evt-test-001",
  title: "Morning Tai Chi",
  date: "2026-03-16",
  endDate: "2026-06-30",
  time: "09:00",
  location: "Test AAC Centre",
  category: "Active Ageing",
  description: "A relaxing session.",
  type: "External",
  school: "SUSS",
  lat: 1.3,
  lng: 103.8,
  venueAddress: "Blk 123 Test St, Singapore 123456",
};

const sampleEventNoEnd: CampusEvent = {
  id: "aac-evt-test-002",
  title: "Afternoon Art Class",
  date: "2026-03-16",
  time: "14:00",
  location: "Test AAC Centre",
  category: "Active Ageing",
  description: "Painting and drawing.",
  type: "External",
  school: "SUSS",
  lat: 1.3,
  lng: 103.8,
};

const matchingPOI: POI = {
  id: "aac-test-centre",
  name: "Test AAC Centre",
  lat: 1.3,
  lng: 103.8,
  category: "Active Ageing Centre",
  description: "Test centre",
  address: "Blk 123 Test St, Singapore 123456",
  contact: "+65 6123 4567",
};

const noContactPOI: POI = {
  id: "aac-no-contact",
  name: "No Contact AAC",
  lat: 1.31,
  lng: 103.81,
  category: "Active Ageing Centre",
  description: "No phone",
  address: "Blk 456 Other St",
};

vi.mock("@/../public/aac-events.json", () => ({
  default: [] as CampusEvent[],
}));

vi.mock("@/lib/maps/active-ageing-centres", () => ({
  ACTIVE_AGEING_CENTRES: [] as POI[],
}));

vi.mock("@/lib/maps/active-ageing-centres-new", () => ({
  ACTIVE_AGEING_CENTRES_NEW: [] as POI[],
}));

import * as aacModule from "@/../public/aac-events.json";
import * as oldCentres from "@/lib/maps/active-ageing-centres";
import * as newCentres from "@/lib/maps/active-ageing-centres-new";

function setMockData(events: CampusEvent[], pois: POI[]) {
  vi.mocked(aacModule).default = events as typeof aacModule.default;
  vi.mocked(oldCentres).ACTIVE_AGEING_CENTRES = [];
  vi.mocked(newCentres).ACTIVE_AGEING_CENTRES_NEW = pois;
}

describe("TodaysActivities", () => {
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    dateSpy = vi.spyOn(globalThis, "Date").mockImplementation(
      (...args: unknown[]) => {
        if (args.length === 0) {
          return new (vi.mocked(Date).getMockImplementation()
            ? Object
            : (dateSpy.getMockImplementation() as unknown as { new (): Date }) ?? Object
          )() as unknown as Date;
        }
        return new (Object.getPrototypeOf(dateSpy).constructor as DateConstructor)(
          ...(args as [string]),
        );
      },
    );
  });

  afterEach(() => {
    dateSpy.mockRestore();
    vi.restoreAllMocks();
  });

  function mockDate(isoString: string) {
    const fakeDate = new (Object.getPrototypeOf(vi.fn()).constructor === Function
      ? globalThis.Date
      : globalThis.Date)(isoString) as Date;

    dateSpy.mockRestore();

    const RealDate = globalThis.Date;
    dateSpy = vi.spyOn(globalThis, "Date").mockImplementation(
      (...args: unknown[]) => {
        if (args.length === 0) return new RealDate(fakeDate.getTime());
        return new RealDate(...(args as [string]));
      },
    );

    Object.defineProperty(dateSpy, "now", {
      value: () => fakeDate.getTime(),
      writable: true,
      configurable: true,
    });
  }

  it("shows morning greeting before noon", async () => {
    mockDate("2026-03-16T08:00:00");
    setMockData([], []);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(screen.getByText("Good morning!")).toBeInTheDocument();
  });

  it("shows afternoon greeting between 12-17", async () => {
    mockDate("2026-03-16T14:00:00");
    setMockData([], []);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(screen.getByText("Good afternoon!")).toBeInTheDocument();
  });

  it("shows evening greeting after 17", async () => {
    mockDate("2026-03-16T19:00:00");
    setMockData([], []);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(screen.getByText("Good evening!")).toBeInTheDocument();
  });

  it("renders empty state when no events today", async () => {
    mockDate("2026-03-16T09:00:00");
    setMockData([], []);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(
      screen.getByText(/No activities scheduled nearby today/),
    ).toBeInTheDocument();
  });

  it("renders activity cards for today's events", async () => {
    mockDate("2026-03-16T09:00:00");
    setMockData([sampleEvent, sampleEventNoEnd], [matchingPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(screen.getByText("Morning Tai Chi")).toBeInTheDocument();
    expect(screen.getByText("Afternoon Art Class")).toBeInTheDocument();
  });

  it("shows dynamic activity count subtitle", async () => {
    mockDate("2026-03-16T09:00:00");
    setMockData([sampleEvent], [matchingPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(screen.getByText("1 activity near you today")).toBeInTheDocument();
  });

  it("pluralises subtitle for multiple activities", async () => {
    mockDate("2026-03-16T09:00:00");
    setMockData([sampleEvent, sampleEventNoEnd], [matchingPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(
      screen.getByText("2 activities near you today"),
    ).toBeInTheDocument();
  });

  it("renders Get Directions button that triggers walkTo", async () => {
    mockDate("2026-03-16T09:00:00");
    setMockData([sampleEvent], [matchingPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    const dirBtn = screen.getByRole("button", {
      name: /get directions/i,
    });
    expect(dirBtn).toBeInTheDocument();
    fireEvent.click(dirBtn);
    expect(mockWalkTo).toHaveBeenCalled();
  });

  it("renders Call Centre as tel: link when POI has contact", async () => {
    mockDate("2026-03-16T09:00:00");
    setMockData([sampleEvent], [matchingPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    const callLink = screen.getByRole("link", { name: /call centre/i });
    expect(callLink).toHaveAttribute("href", "tel:+6561234567");
  });

  it("renders disabled Call Centre button when POI has no contact", async () => {
    mockDate("2026-03-16T09:00:00");
    const eventAtNoContact: CampusEvent = {
      ...sampleEvent,
      id: "evt-no-contact",
      location: "No Contact AAC",
    };
    setMockData([eventAtNoContact], [noContactPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    const callBtn = screen.getByRole("button", { name: /call centre/i });
    expect(callBtn).toBeDisabled();
  });

  it("renders Share with Family button", async () => {
    mockDate("2026-03-16T09:00:00");
    setMockData([sampleEvent], [matchingPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(
      screen.getByRole("button", { name: /share with family/i }),
    ).toBeInTheDocument();
  });

  it("formats time correctly (AM/PM)", async () => {
    mockDate("2026-03-16T09:00:00");
    setMockData([sampleEvent], [matchingPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument();
  });

  it("filters out events not happening today", async () => {
    mockDate("2026-01-01T09:00:00");
    const futureEvent: CampusEvent = {
      ...sampleEvent,
      date: "2026-06-01",
      endDate: "2026-06-30",
    };
    setMockData([futureEvent], [matchingPOI]);

    vi.resetModules();
    const { default: TodaysActivities } = await import(
      "@/components/senior/TodaysActivities"
    );
    render(<TodaysActivities />);

    expect(
      screen.getByText(/No activities scheduled nearby today/),
    ).toBeInTheDocument();
  });
});
