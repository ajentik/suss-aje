import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import ToolResultCard from "@/components/chat/ToolResultCard";
import type { POI } from "@/types";

const mockPOI: POI = {
  id: "poi-lib",
  name: "SUSS Library",
  lat: 1.314,
  lng: 103.764,
  category: "On-campus",
  description: "Main campus library with study spaces",
  address: "463 Clementi Rd",
  hours: "Mon-Fri 8AM-10PM",
  rating: 4.2,
};

describe("ToolResultCard", () => {
  describe("loading state (shimmer)", () => {
    it("shows 'Finding location...' shimmer for navigate_to", () => {
      render(
        <ToolResultCard
          toolName="navigate_to"
          output={{}}
          state="pending"
        />,
      );
      expect(screen.getByText("Finding location...")).toBeInTheDocument();
    });

    it("shows 'Searching events...' shimmer for show_events", () => {
      render(
        <ToolResultCard
          toolName="show_events"
          output={{}}
          state="pending"
        />,
      );
      expect(screen.getByText("Searching events...")).toBeInTheDocument();
    });

    it("shows 'Looking up info...' shimmer for campus_info", () => {
      render(
        <ToolResultCard
          toolName="campus_info"
          output={{}}
          state="pending"
        />,
      );
      expect(screen.getByText("Looking up info...")).toBeInTheDocument();
    });
  });

  describe("navigate_to — LocationCard", () => {
    it("renders POI name and description", () => {
      render(
        <ToolResultCard
          toolName="navigate_to"
          output={{ success: true, poi: mockPOI, message: "Found it" }}
          state="output-available"
        />,
      );

      expect(screen.getByText("SUSS Library")).toBeInTheDocument();
      expect(
        screen.getByText("Main campus library with study spaces"),
      ).toBeInTheDocument();
    });

    it("renders address, hours, and rating", () => {
      render(
        <ToolResultCard
          toolName="navigate_to"
          output={{ success: true, poi: mockPOI, message: "Found" }}
          state="output-available"
        />,
      );

      expect(screen.getByText("463 Clementi Rd")).toBeInTheDocument();
      expect(screen.getByText("Mon-Fri 8AM-10PM")).toBeInTheDocument();
      expect(screen.getByText("4.2/5")).toBeInTheDocument();
    });

    it("renders category badge", () => {
      render(
        <ToolResultCard
          toolName="navigate_to"
          output={{ success: true, poi: mockPOI, message: "Found" }}
          state="output-available"
        />,
      );

      expect(screen.getByText("On-campus")).toBeInTheDocument();
    });

    it("renders error message when POI is missing", () => {
      render(
        <ToolResultCard
          toolName="navigate_to"
          output={{ success: false, message: "Location not found" }}
          state="output-available"
        />,
      );

      expect(screen.getByText("Location not found")).toBeInTheDocument();
    });
  });

  describe("show_events — EventListCard", () => {
    const mockEvents = [
      {
        id: "evt-1",
        title: "Orientation Day",
        date: "2026-01-15",
        time: "9:00 AM",
        location: "SUSS Auditorium",
        category: "Academic",
        description: "Welcome event",
        type: "On-Campus",
        school: "SUSS",
      },
      {
        id: "evt-2",
        title: "Career Fair",
        date: "2026-01-20",
        time: "10:00 AM",
        location: "Block A",
        category: "Career",
        description: "Job opportunities",
        type: "On-Campus",
        school: "SUSS",
      },
    ];

    it("renders event titles and details", () => {
      render(
        <ToolResultCard
          toolName="show_events"
          output={{
            success: true,
            events: mockEvents,
            filters: { date: "today" },
            message: "Found 2 events",
          }}
          state="output-available"
        />,
      );

      expect(screen.getByText("Orientation Day")).toBeInTheDocument();
      expect(screen.getByText("Career Fair")).toBeInTheDocument();
      expect(screen.getByText("Found 2 events")).toBeInTheDocument();
    });

    it("shows empty message when no events", () => {
      render(
        <ToolResultCard
          toolName="show_events"
          output={{
            success: true,
            events: [],
            filters: {},
            message: "No events found",
          }}
          state="output-available"
        />,
      );

      expect(screen.getByText("No events found")).toBeInTheDocument();
    });

    it("shows '+N more' when events exceed display limit", () => {
      const manyEvents = Array.from({ length: 7 }, (_, i) => ({
        id: `evt-${i}`,
        title: `Event ${i + 1}`,
        date: "2026-01-15",
        time: "9:00 AM",
        location: "SUSS",
        category: "Academic",
        description: `Event ${i + 1}`,
        type: "On-Campus",
        school: "SUSS",
      }));

      render(
        <ToolResultCard
          toolName="show_events"
          output={{
            success: true,
            events: manyEvents,
            filters: {},
            message: "Found 7 events",
          }}
          state="output-available"
        />,
      );

      expect(screen.getByText(/\+2 more events/)).toBeInTheDocument();
    });
  });

  describe("campus_info — CampusInfoCard", () => {
    it("renders answer text", () => {
      render(
        <ToolResultCard
          toolName="campus_info"
          output={{
            success: true,
            query: "parking",
            answer: "Parking is available at Basement 1",
          }}
          state="output-available"
        />,
      );

      expect(
        screen.getByText("Parking is available at Basement 1"),
      ).toBeInTheDocument();
    });

    it("renders venue list when venues are provided", () => {
      render(
        <ToolResultCard
          toolName="campus_info"
          output={{
            success: true,
            query: "food",
            answer: "Here are nearby eateries",
            venues: [
              {
                id: "v-1",
                name: "Foodclique",
                lat: 1.314,
                lng: 103.764,
                category: "Restaurant",
                description: "Campus canteen",
                address: "SUSS Block A",
                hours: "7AM-8PM",
                rating: 3.8,
              },
            ],
          }}
          state="output-available"
        />,
      );

      expect(screen.getByText("Foodclique")).toBeInTheDocument();
      expect(screen.getByText(/SUSS Block A/)).toBeInTheDocument();
    });
  });

  describe("unknown tool", () => {
    it("renders nothing for an unknown tool name", () => {
      const { container } = render(
        <ToolResultCard
          toolName="unknown_tool"
          output={{}}
          state="output-available"
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
