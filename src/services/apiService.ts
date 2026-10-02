export interface IdentifyResult {
  item: string;
  material: string;
  confidence: number;
  recyclable: boolean;
  instructions: string;
}

type AIProvider = 'huggingface' | 'nyckel' | 'mock';

function getProvider(): AIProvider {
  return (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'mock';
}

// Map HF model labels to app material types
const HF_LABEL_MAP: Record<string, { material: string; recyclable: boolean; instructions: string }> = {
  plastic: {
    material: "PET Plastic (#1)",
    recyclable: true,
    instructions: "Rinse clean, remove cap, and place in recycling bin.",
  },
  cardboard: {
    material: "Cardboard",
    recyclable: true,
    instructions: "Flatten box and place in recycling bin.",
  },
  metal: {
    material: "Aluminum",
    recyclable: true,
    instructions: "Rinse clean and crush to save space. Highly recyclable!",
  },
  paper: {
    material: "Paper",
    recyclable: true,
    instructions: "Keep dry and place in recycling bin.",
  },
  glass: {
    material: "Glass",
    recyclable: true,
    instructions: "Remove lid, rinse clean. Can be recycled infinitely!",
  },
  trash: {
    material: "General Waste",
    recyclable: false,
    instructions: "This item is not recyclable. Please dispose in general waste.",
  },
};

// Map item names from HF labels
const HF_ITEM_NAMES: Record<string, string> = {
  plastic: "Plastic Bottle",
  cardboard: "Cardboard Box",
  metal: "Aluminum Can",
  paper: "Paper Product",
  glass: "Glass Bottle",
  trash: "Non-recyclable Item",
};

async function identifyWithHuggingFace(imageData: string): Promise<IdentifyResult> {
  const token = import.meta.env.VITE_HF_API_TOKEN;
  if (!token) throw new Error("Hugging Face API token not configured");

  // Remove data URL prefix if present
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/akmalia31/trash-classification-cnn-mobilnetv2',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: base64 }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  // HF returns: [ { label: "cardboard", score: 0.95 }, ... ] or similar
  const topResult = Array.isArray(data) && data.length > 0 ? data[0] : data;

  const label = (topResult.label || 'trash').toLowerCase();
  const confidence = Math.round((topResult.score || 0) * 100);
  const mapping = HF_LABEL_MAP[label] || HF_LABEL_MAP.trash;

  return {
    item: HF_ITEM_NAMES[label] || "Unknown Item",
    material: mapping.material,
    confidence,
    recyclable: mapping.recyclable,
    instructions: mapping.instructions,
  };
}

async function identifyWithNyckel(imageData: string): Promise<IdentifyResult> {
  const apiKey = import.meta.env.VITE_NYCKEL_API_KEY;
  if (!apiKey) throw new Error("Nyckel API key not configured");

  // Nyckel expects base64 without data URL prefix
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch('https://www.nyckel.com/v1/functions/prefab-recycling-identifier/invoke', {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: base64 }),
  });

  if (!response.ok) {
    throw new Error(`Nyckel API error: ${response.status}`);
  }

  const data = await response.json();
  // Nyckel returns label name directly
  const label = (data.label || 'unknown').toLowerCase();
  const confidence = Math.round((data.confidence || 0.5) * 100);

  const recyclableLabels = ['recyclable', 'recycling', 'yes', 'true'];
  const isRecyclable = recyclableLabels.includes(label);

  return {
    item: "Scanned Item",
    material: isRecyclable ? "PET Plastic (#1)" : "General Waste",
    confidence,
    recyclable: isRecyclable,
    instructions: isRecyclable
      ? "Rinse clean and place in recycling bin."
      : "This item is not recyclable. Please dispose in general waste.",
  };
}

function getMockIdentification(): IdentifyResult {
  const mockResults: IdentifyResult[] = [
    {
      item: "Plastic Water Bottle",
      material: "PET Plastic (#1)",
      confidence: 94,
      recyclable: true,
      instructions: "Rinse clean, remove cap, and place in recycling bin.",
    },
    {
      item: "Aluminum Can",
      material: "Aluminum",
      confidence: 97,
      recyclable: true,
      instructions: "Rinse clean and crush to save space. Highly recyclable!",
    },
    {
      item: "Glass Bottle",
      material: "Glass",
      confidence: 89,
      recyclable: true,
      instructions: "Remove lid, rinse clean. Can be recycled infinitely!",
    },
    {
      item: "Pizza Box",
      material: "Cardboard",
      confidence: 92,
      recyclable: false,
      instructions: "Cannot be recycled if greasy. Remove clean parts or compost.",
    },
    {
      item: "Cardboard Box",
      material: "Cardboard",
      confidence: 95,
      recyclable: true,
      instructions: "Flatten box and place in recycling bin.",
    },
  ];
  return mockResults[Math.floor(Math.random() * mockResults.length)];
}

class APIService {
  async identifyItem(imageData: string): Promise<IdentifyResult> {
    const provider = getProvider();

    try {
      switch (provider) {
        case 'huggingface':
          return await identifyWithHuggingFace(imageData);
        case 'nyckel':
          return await identifyWithNyckel(imageData);
        default:
          return getMockIdentification();
      }
    } catch (error) {
      console.warn(`[${provider}] AI identification failed, falling back to mock:`, error);
      return getMockIdentification();
    }
  }
}

// Create singleton instance
export const apiService = new APIService();
