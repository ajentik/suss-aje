import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import HealthNavigationSuggestions, {
  HEALTH_SUGGESTIONS,
  type HealthConcern,
} from "@/components/navigation/HealthNavigationSuggestions";

describe("HealthNavigationSuggestions", () => {
  const allConcerns: HealthConcern[] = [
    "mobility issues",
    "medication concerns",
    "cognitive decline",
    "general checkup",
    "caregiver stress",
  ];

  it("renders nothing when concerns array is empty", () => {
    const { container } = render(
      <HealthNavigationSuggestions concerns={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when no concerns match known health concerns", () => {
    const { container } = render(
      <HealthNavigationSuggestions concerns={["unknown issue", "random"]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a suggestion for each matched concern", () => {
    render(<HealthNavigationSuggestions concerns={allConcerns} />);

    for (const concern of allConcerns) {
      const { label } = HEALTH_SUGGESTIONS[concern];
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders correct labels for each health concern", () => {
    render(<HealthNavigationSuggestions concerns={allConcerns} />);

    expect(
      screen.getByText("Find physiotherapy clinic nearby"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Walk to nearest pharmacy"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Find memory clinic nearby"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Navigate to nearest polyclinic"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Find caregiver support centre nearby"),
    ).toBeInTheDocument();
  });

  it("links each suggestion to /navigation?destination=TYPE", () => {
    render(<HealthNavigationSuggestions concerns={allConcerns} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);

    const expectedDestinations = [
      "physiotherapy",
      "pharmacy",
      "memory-clinic",
      "polyclinic",
      "caregiver-support",
    ];

    links.forEach((link, i) => {
      expect(link).toHaveAttribute(
        "href",
        `/navigation?destination=${expectedDestinations[i]}`,
      );
    });
  });

  it("renders only matched concerns and ignores unknown ones", () => {
    render(
      <HealthNavigationSuggestions
        concerns={["mobility issues", "unknown", "caregiver stress"]}
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    expect(
      screen.getByText("Find physiotherapy clinic nearby"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Find caregiver support centre nearby"),
    ).toBeInTheDocument();
  });

  it("renders a Navigate button for each suggestion", () => {
    render(
      <HealthNavigationSuggestions concerns={["general checkup"]} />,
    );

    expect(screen.getByText("Navigate")).toBeInTheDocument();
  });

  it("renders the section heading", () => {
    render(
      <HealthNavigationSuggestions concerns={["mobility issues"]} />,
    );

    expect(screen.getByText("Suggested nearby places")).toBeInTheDocument();
  });

  it("has accessible section labelling", () => {
    render(
      <HealthNavigationSuggestions concerns={["mobility issues"]} />,
    );

    expect(
      screen.getByRole("region", { name: "Health navigation suggestions" }),
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <HealthNavigationSuggestions
        concerns={["mobility issues"]}
        className="mt-4"
      />,
    );

    const section = screen.getByRole("region");
    expect(section.className).toContain("mt-4");
  });

  it("renders a single suggestion correctly", () => {
    render(
      <HealthNavigationSuggestions concerns={["medication concerns"]} />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute(
      "href",
      "/navigation?destination=pharmacy",
    );
    expect(
      screen.getByText("Walk to nearest pharmacy"),
    ).toBeInTheDocument();
  });
});

describe("HEALTH_SUGGESTIONS", () => {
  it("maps all five health concerns", () => {
    expect(Object.keys(HEALTH_SUGGESTIONS)).toHaveLength(5);
  });

  it("each suggestion has icon, label, and destination", () => {
    for (const config of Object.values(HEALTH_SUGGESTIONS)) {
      expect(config).toHaveProperty("icon");
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("destination");
      expect(typeof config.label).toBe("string");
      expect(typeof config.destination).toBe("string");
      expect(config.label.length).toBeGreaterThan(0);
      expect(config.destination.length).toBeGreaterThan(0);
    }
  });
});
