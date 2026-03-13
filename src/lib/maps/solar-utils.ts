export interface SolarInsight {
  maxSunshineHoursPerYear: number;
  solarPanelCount: number;
  sunExposure: "High" | "Moderate" | "Low";
}

export async function getBuildingInsights(
  lat: number,
  lng: number,
  apiKey: string
): Promise<SolarInsight | null> {
  try {
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=LOW&key=${apiKey}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const solar = data.solarPotential;
    if (!solar) return null;

    const maxHours = solar.maxSunshineHoursPerYear || 0;
    const panelCount = solar.solarPanels?.length || solar.maxArrayPanelsCount || 0;

    let sunExposure: SolarInsight["sunExposure"] = "Moderate";
    if (maxHours > 1500) sunExposure = "High";
    else if (maxHours < 1000) sunExposure = "Low";

    return {
      maxSunshineHoursPerYear: Math.round(maxHours),
      solarPanelCount: panelCount,
      sunExposure,
    };
  } catch {
    return null;
  }
}
