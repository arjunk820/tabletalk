import axios, { AxiosError } from 'axios';
import { askBusinessQuestion } from './yelpApi';

const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const getGroqApiKey = (): string => {
  const apiKey = 
    process.env.GROQ_API_KEY || 
    process.env.EXPO_PUBLIC_GROQ_API_KEY || 
    '';
  
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Please add it to your .env file as GROQ_API_KEY=your_key'
    );
  }
  return apiKey;
};

const groqApiClient = axios.create({
  baseURL: GROQ_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

groqApiClient.interceptors.request.use(
  (config) => {
    const apiKey = getGroqApiKey();
    config.headers.Authorization = `Bearer ${apiKey}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const handleApiError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: { message?: string } }>;
    if (axiosError.response) {
      const status = axiosError.response.status;
      const message = axiosError.response.data?.error?.message || 
                     axiosError.response.data?.message || 
                     axiosError.message;
      
      if (status === 401) {
        return new Error('Invalid Groq API key. Please check your GROQ_API_KEY.');
      }
      if (status === 429) {
        return new Error('Rate limit exceeded. Please try again later.');
      }
      if (status >= 500) {
        return new Error('Groq API server error. Please try again later.');
      }
      return new Error(`API Error: ${message}`);
    }
    if (axiosError.request) {
      return new Error('Network error. Please check your internet connection.');
    }
  }
  return error instanceof Error ? error : new Error('An unknown error occurred');
};

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: GroqMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const chatWithGroq = async (
  messages: GroqMessage[],
  temperature: number = 0.7,
  maxTokens: number = 512
): Promise<string> => {
  try {
    const request: GroqChatRequest = {
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    const response = await groqApiClient.post<GroqChatResponse>('/chat/completions', request);
    
    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content.trim();
    }
    
    throw new Error('No response from Groq API');
  } catch (error) {
    throw handleApiError(error);
  }
};

export const chatWithRestaurant = async (
  restaurantName: string,
  restaurantData: {
    cuisine?: string;
    price?: string;
    rating?: number;
    location?: string;
  },
  userQuestion: string,
  conversationHistory: GroqMessage[] = []
): Promise<{ response: string; shouldUseYelp: boolean }> => {
  try {
    // Build system prompt with restaurant context
    const restaurantContext = [
      `You are a helpful assistant for ${restaurantName}.`,
      restaurantData.cuisine && `It's a ${restaurantData.cuisine} restaurant.`,
      restaurantData.price && `Price range: ${restaurantData.price}.`,
      restaurantData.rating && `Rating: ${restaurantData.rating}/5.`,
      restaurantData.location && `Location: ${restaurantData.location}.`,
      '',
      'Answer questions about the restaurant in a friendly, helpful way.',
      'If asked about specific facts (hours, menu items, reservations), mention that you can help find that information.',
      'Keep responses concise (1-3 sentences) and conversational.',
    ].filter(Boolean).join(' ');

    // Check if question needs Yelp API (factual queries)
    const factualKeywords = ['hours', 'open', 'close', 'menu', 'reservation', 'phone', 'address', 'dietary', 'vegetarian', 'vegan', 'gluten'];
    const needsYelpData = factualKeywords.some(keyword => 
      userQuestion.toLowerCase().includes(keyword)
    );

    // Build messages array
    const messages: GroqMessage[] = [
      {
        role: 'system',
        content: restaurantContext,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userQuestion,
      },
    ];

    // Get Groq response
    const groqResponse = await chatWithGroq(messages, 0.7, 256);

    return {
      response: groqResponse,
      shouldUseYelp: needsYelpData,
    };
  } catch (error) {
    // Fallback: try Yelp AI API
    try {
      const yelpResponse = await askBusinessQuestion(
        `About ${restaurantName}: ${userQuestion}`
      );
      return {
        response: yelpResponse.response.text,
        shouldUseYelp: true,
      };
    } catch (yelpError) {
      throw new Error('Unable to get response. Please try again.');
    }
  }
};

export const getRestaurantFacts = async (
  restaurantName: string,
  question: string,
  latitude?: number,
  longitude?: number
): Promise<string> => {
  try {
    const response = await askBusinessQuestion(
      `About ${restaurantName}: ${question}`,
      'en_US',
      latitude,
      longitude
    );
    return response.response.text;
  } catch (error) {
    throw handleApiError(error);
  }
};

