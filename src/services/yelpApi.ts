/**
 * Yelp AI API Service
 * Handles all interactions with Yelp's AI Chat API v2
 */

import axios, { AxiosError } from 'axios';
import {
  YelpChatRequest,
  YelpChatResponse,
  YelpUserContext,
} from './types';

const YELP_API_BASE_URL = 'https://api.yelp.com/ai/chat/v2';

/**
 * Get Yelp API key from environment variables
 * For Expo, we'll use process.env which can be set via app.config.js or .env
 */
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

/**
 * Create axios instance with default config
 */
const yelpApiClient = axios.create({
  baseURL: YELP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Interceptor to add authorization header
 */
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

/**
 * Handle API errors
 */
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

/**
 * Send a chat request to Yelp AI API
 */
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

/**
 * Search for businesses using natural language query
 */
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

/**
 * Ask a one-shot question about a business
 */
export const askBusinessQuestion = async (
  question: string,
  locale: string = 'en_US'
): Promise<YelpChatResponse> => {
  const userContext: YelpUserContext = {
    locale,
    latitude: null,
    longitude: null,
  };

  return sendChatRequest(question, userContext);
};

/**
 * Follow-up question in an existing chat context
 */
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

