import axios, { AxiosError } from 'axios';
import {
  YelpChatRequest,
  YelpChatResponse,
  YelpUserContext,
} from './types';

const YELP_API_BASE_URL = 'https://api.yelp.com/ai/chat/v2';

const getApiKey = (): string => {
  // Try multiple ways to get the API key
  const apiKey = 
    process.env.YELP_API_KEY || 
    process.env.EXPO_PUBLIC_YELP_API_KEY || 
    '';
  
  if (!apiKey) {
    throw new Error(
      'YELP_API_KEY is not set. Please add it to your .env file as YELP_API_KEY=your_key'
    );
  }
  return apiKey;
};

const yelpApiClient = axios.create({
  baseURL: YELP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

yelpApiClient.interceptors.request.use(
  (config) => {
    const apiKey = getApiKey();
    config.headers.Authorization = `Bearer ${apiKey}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const handleApiError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response) {
      // API returned error response
      const status = axiosError.response.status;
      const message = axiosError.response.data?.message || axiosError.message;
      
      if (status === 401) {
        return new Error('Invalid API key. Please check your YELP_API_KEY.');
      }
      if (status === 429) {
        return new Error('Rate limit exceeded. Please try again later.');
      }
      if (status >= 500) {
        return new Error('Yelp API server error. Please try again later.');
      }
      return new Error(`API Error: ${message}`);
    }
    if (axiosError.request) {
      // Request made but no response
      return new Error('Network error. Please check your internet connection.');
    }
  }
  return error instanceof Error ? error : new Error('An unknown error occurred');
};

export const sendChatRequest = async (
  query: string,
  userContext: YelpUserContext,
  chatId?: string | null
): Promise<YelpChatResponse> => {
  try {
    const request: YelpChatRequest = {
      query,
      chat_id: chatId || null,
      user_context: userContext,
    };

    const response = await yelpApiClient.post<YelpChatResponse>('', request);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const searchBusinesses = async (
  query: string,
  latitude?: number,
  longitude?: number,
  locale: string = 'en_US'
): Promise<YelpChatResponse> => {
  const userContext: YelpUserContext = {
    locale,
    latitude: latitude || null,
    longitude: longitude || null,
  };

  return sendChatRequest(query, userContext);
};

export const askBusinessQuestion = async (
  question: string,
  locale: string = 'en_US',
  latitude?: number,
  longitude?: number
): Promise<YelpChatResponse> => {
  const userContext: YelpUserContext = {
    locale,
    latitude: latitude || null,
    longitude: longitude || null,
  };

  return sendChatRequest(question, userContext);
};

export const askFollowUpQuestion = async (
  question: string,
  chatId: string,
  locale: string = 'en_US'
): Promise<YelpChatResponse> => {
  const userContext: YelpUserContext = {
    locale,
    latitude: null,
    longitude: null,
  };

  return sendChatRequest(question, userContext, chatId);
};

export const generateWhyThisTableAI = async (
  restaurantName: string,
  cuisines: string[],
  budget: string[],
  dietary: string[],
  locale: string = 'en_US'
): Promise<string> => {
  try {
    const cuisineText = cuisines.length > 0 ? cuisines.join(', ') : 'various cuisines';
    const budgetText = budget.length > 0 ? budget.join(', ') : '';
    const dietaryText = dietary.length > 0 ? ` with ${dietary.join(', ')} preferences` : '';
    
    const query = `Why would someone interested in ${cuisineText}${budgetText ? ` with a ${budgetText} budget` : ''}${dietaryText} love ${restaurantName}? Give a brief 1-2 sentence explanation highlighting what makes it special. Keep it concise and under 100 words.`;
    
    const userContext: YelpUserContext = {
      locale,
      latitude: null,
      longitude: null,
    };

    const response = await sendChatRequest(query, userContext);
    return response.response.text.trim();
  } catch (error) {
    throw error;
  }
};

export const generateTimeSuggestionsAI = async (
  restaurantName: string,
  vibe: 'quickBite' | 'drinks' | 'dinner' | null,
  locale: string = 'en_US'
): Promise<string[]> => {
  try {
    const vibeText = vibe === 'quickBite' ? 'quick bite' : vibe === 'drinks' ? 'drinks' : vibe === 'dinner' ? 'dinner' : 'visit';
    const query = `What are the best times to visit ${restaurantName} for a ${vibeText}? Consider their hours and typical crowd patterns. Suggest 2-3 specific time windows in a concise format (e.g., "Tonight 7-9pm", "This weekend 12-2pm").`;
    
    const userContext: YelpUserContext = {
      locale,
      latitude: null,
      longitude: null,
    };

    const response = await sendChatRequest(query, userContext);
    const text = response.response.text.trim();
    
    // Parse the response to extract time suggestions
    // Try to extract time windows from the response
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
      return lines.slice(0, 3).map(line => line.trim().replace(/^[-•]\s*/, ''));
    }
    
    // Fallback: return the text as a single suggestion
    return [text];
  } catch (error) {
    throw error;
  }
};

export const generateInviteCopyAI = async (
  restaurantName: string,
  timeWindow?: 'tonight' | 'thisWeek' | 'weekend',
  vibe?: 'quickBite' | 'drinks' | 'dinner',
  locale: string = 'en_US'
): Promise<string> => {
  try {
    const timeText = timeWindow === 'tonight' ? 'tonight' : timeWindow === 'thisWeek' ? 'this week' : timeWindow === 'weekend' ? 'this weekend' : '';
    const vibeText = vibe === 'quickBite' ? 'quick bite' : vibe === 'drinks' ? 'drinks' : vibe === 'dinner' ? 'dinner' : 'meal';
    
    const query = `Write a friendly, casual 1-sentence invite message for ${restaurantName}${timeText ? ` for ${timeText}` : ''}${vibeText ? ` for a ${vibeText}` : ''}. Mention what makes it special - keep it under 15 words and engaging.`;
    
    const userContext: YelpUserContext = {
      locale,
      latitude: null,
      longitude: null,
    };

    const response = await sendChatRequest(query, userContext);
    return response.response.text.trim();
  } catch (error) {
    throw error;
  }
};

export const generatePlanCopilotAI = async (
  action: 'suggest-times' | 'draft-invite' | 'make-group-friendly',
  restaurantName: string,
  currentPlan?: {
    timeWindow?: 'tonight' | 'thisWeek' | 'weekend';
    vibe?: 'quickBite' | 'drinks' | 'dinner';
  },
  locale: string = 'en_US'
): Promise<string> => {
  try {
    let query = '';
    
    switch (action) {
      case 'suggest-times': {
        const vibe = currentPlan?.vibe === 'quickBite' ? 'quick bite' : currentPlan?.vibe === 'drinks' ? 'drinks' : currentPlan?.vibe === 'dinner' ? 'dinner' : 'visit';
        query = `Based on ${restaurantName}'s hours and typical crowd, suggest 2-3 specific time windows for a ${vibe} experience this week. Keep it concise, under 50 words.`;
        break;
      }
      case 'draft-invite': {
        const timeWindow = currentPlan?.timeWindow === 'tonight' ? 'tonight' : currentPlan?.timeWindow === 'thisWeek' ? 'this week' : currentPlan?.timeWindow === 'weekend' ? 'this weekend' : '';
        const vibe = currentPlan?.vibe === 'quickBite' ? 'quick bite' : currentPlan?.vibe === 'drinks' ? 'drinks' : currentPlan?.vibe === 'dinner' ? 'dinner' : 'meal';
        query = `Write a casual, friendly 1-sentence invite message for ${restaurantName}${timeWindow ? ` for ${timeWindow}` : ''}${vibe ? ` for a ${vibe}` : ''}. Keep it under 15 words.`;
        break;
      }
      case 'make-group-friendly': {
        query = `Is ${restaurantName} good for groups? If yes, mention why in 1 sentence. If no, suggest how to make it work. Keep it concise, under 50 words.`;
        break;
      }
    }
    
    const userContext: YelpUserContext = {
      locale,
      latitude: null,
      longitude: null,
    };

    const response = await sendChatRequest(query, userContext);
    return response.response.text.trim();
  } catch (error) {
    throw error;
  }
};

