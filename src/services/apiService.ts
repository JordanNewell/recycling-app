// Data foundation for real API integrations
export interface RecyclingLocation {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  acceptedMaterials: string[];
  operatingHours: {
    [key: string]: { open: string; close: string } | 'closed';
  };
  specialInstructions?: string;
  lastUpdated: string;
}

export interface RecyclingGuidelines {
  locationId: string;
  municipality: string;
  state: string;
  curbsideAccepted: string[];
  curbsideRestrictions: Record<string, string>;
  specialPrograms: Array<{
    material: string;
    instructions: string;
    locations: string[];
  }>;
  lastUpdated: string;
}

class APIService {
  // AI-powered item identification
  async identifyItem(imageData: string): Promise<{
    item: string;
    material: string;
    confidence: number;
    recyclable: boolean;
    instructions: string;
  }> {
    try {
      // For demo purposes, we'll use the fallback identification
      // In production, this would call a real AI API
      return this.getFallbackIdentification();
    } catch (error) {
      console.warn('Failed to identify item via API:', error);
      return this.getFallbackIdentification();
    }
  }

  private getFallbackIdentification() {
    const mockResults = [
      { 
        item: "Plastic Water Bottle", 
        material: "PET Plastic (#1)", 
        confidence: 94,
        recyclable: true,
        instructions: "Rinse clean, remove cap, and place in recycling bin."
      },
      { 
        item: "Aluminum Can", 
        material: "Aluminum", 
        confidence: 97,
        recyclable: true,
        instructions: "Rinse clean and crush to save space. Highly recyclable!"
      },
      { 
        item: "Glass Bottle", 
        material: "Glass", 
        confidence: 89,
        recyclable: true,
        instructions: "Remove lid, rinse clean. Can be recycled infinitely!"
      },
      { 
        item: "Pizza Box", 
        material: "Cardboard", 
        confidence: 92,
        recyclable: false,
        instructions: "Cannot be recycled if greasy. Remove clean parts or compost."
      },
      { 
        item: "Cardboard Box", 
        material: "Cardboard", 
        confidence: 95,
        recyclable: true,
        instructions: "Flatten box and place in recycling bin."
      }
    ];
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  }
}

// Create singleton instance
export const apiService = new APIService();
