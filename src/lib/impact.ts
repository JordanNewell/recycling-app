interface EnvironmentalImpact {
  co2: number;
  energy: number;
  drivingKm: number;
  phoneCharges: number;
}

const impactByMaterial: Record<string, { co2: number; energy: number }> = {
  "PET Plastic (#1)": { co2: 0.8, energy: 1.2 },
  "PET Plastic": { co2: 0.8, energy: 1.2 },
  "Plastic": { co2: 0.6, energy: 0.9 },
  "Aluminum": { co2: 1.5, energy: 2.5 },
  "Metal": { co2: 1.2, energy: 2.0 },
  "Glass": { co2: 0.3, energy: 0.5 },
  "Cardboard": { co2: 0.6, energy: 0.8 },
  "Paper": { co2: 0.4, energy: 0.6 },
  "Electronics": { co2: 2.0, energy: 3.0 },
  "Batteries": { co2: 1.8, energy: 2.5 },
  "Paper with Plastic Lining": { co2: 0.3, energy: 0.4 },
};

export function getEnvironmentalImpact(material: string): EnvironmentalImpact {
  const impact = impactByMaterial[material] || { co2: 0.5, energy: 0.7 };

  return {
    co2: impact.co2,
    energy: impact.energy,
    // 0.21 kg CO2 per km driven (average passenger car)
    drivingKm: impact.co2 / 0.21,
    // ~12 Wh per phone charge (average smartphone)
    phoneCharges: Math.round((impact.energy * 1000) / 12),
  };
}

export function getTotalEnvironmentalImpact(entries: { material: string; points: number }[]): { totalCo2: number; totalEnergy: number } {
  return entries.reduce(
    (total, entry) => {
      const impact = getEnvironmentalImpact(entry.material);
      return {
        totalCo2: total.totalCo2 + impact.co2,
        totalEnergy: total.totalEnergy + impact.energy,
      };
    },
    { totalCo2: 0, totalEnergy: 0 }
  );
}
