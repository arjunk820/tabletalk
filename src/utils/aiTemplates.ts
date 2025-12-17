import { UserPreferences } from './storage';
import { YelpBusiness } from '../services/types';
import { 
  generateWhyThisTableAI, 
  generateTimeSuggestionsAI, 
  generateInviteCopyAI,
  generatePlanCopilotAI 
} from '../services/yelpApi';
import { getCachedAIResponse, cacheAIResponse } from './aiCache';

function generateWhyThisTableFallback(
  restaurant: YelpBusiness,
  preferences: UserPreferences | null
): string {
  if (!preferences) {
    return 'Based on your preferences';
  }

  const reasons: string[] = [];

  // Check cuisine match
  if (preferences.cuisines.length > 0) {
    const restaurantCuisine = restaurant.categories[0]?.title.toLowerCase() || '';
    const matchesCuisine = preferences.cuisines.some((c) =>
      restaurantCuisine.includes(c.toLowerCase()) || c.toLowerCase().includes(restaurantCuisine)
    );
    if (matchesCuisine) {
      const matchedCuisine = preferences.cuisines.find((c) =>
        restaurantCuisine.includes(c.toLowerCase()) || c.toLowerCase().includes(restaurantCuisine)
      );
      if (matchedCuisine) {
        reasons.push(`you picked ${matchedCuisine}`);
      }
    }
  }

  // Check vibe/ambience
  if (restaurant.attributes?.Ambience) {
    const ambience = restaurant.attributes.Ambience as Record<string, boolean>;
    if (ambience.lively) {
      reasons.push('lively');
    } else if (ambience.casual) {
      reasons.push('casual');
    } else if (ambience.romantic) {
      reasons.push('romantic');
    }
  }

  // Check budget
  if (preferences.budget.length > 0 && restaurant.price) {
    if (preferences.budget.includes(restaurant.price)) {
      reasons.push(`$${restaurant.price.length}`);
    }
  }

  if (reasons.length > 0) {
    return `Queued because ${reasons.slice(0, 2).join(' + ')}`;
  }

  return 'Based on your preferences';
}

export async function generateWhyThisTable(
  restaurant: YelpBusiness,
  preferences: UserPreferences | null
): Promise<string> {
  if (!preferences) {
    return 'Based on your preferences';
  }

  const cacheKey = 'why_this_table';
  
  // Try to get from cache first
  const cached = await getCachedAIResponse(restaurant.id, cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Generate AI response
    const aiResponse = await generateWhyThisTableAI(
      restaurant.name,
      preferences.cuisines,
      preferences.budget,
      preferences.dietary
    );
    
    // Cache the response
    await cacheAIResponse(restaurant.id, cacheKey, aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.warn('AI generation failed, using fallback:', error);
    // Fallback to template
    return generateWhyThisTableFallback(restaurant, preferences);
  }
}

function generateTableStarterFallback(
  restaurant: YelpBusiness
): {
  timeWindow: string[];
  vibe: string[];
  inviteCopy: string;
} {
  const timeWindows = ['Tonight', 'This week', 'Weekend'];
  const vibes = ['Quick bite', 'Drinks', 'Dinner'];
  const inviteCopy = `Want to try ${restaurant.name}? Let's make it happen!`;

  return {
    timeWindow: timeWindows,
    vibe: vibes,
    inviteCopy,
  };
}

export async function generateTableStarter(
  restaurant: YelpBusiness,
  preferences: UserPreferences | null
): Promise<{
  timeWindow: string[];
  vibe: string[];
  inviteCopy: string;
}> {
  const timeWindows = ['Tonight', 'This week', 'Weekend'];
  const vibes = ['Quick bite', 'Drinks', 'Dinner'];
  
  const inviteCopyCacheKey = 'table_starter_invite';
  
  // Try to get cached invite copy
  let inviteCopy = await getCachedAIResponse(restaurant.id, inviteCopyCacheKey);
  
  if (!inviteCopy) {
    try {
      // Generate AI invite copy
      inviteCopy = await generateInviteCopyAI(restaurant.name);
      await cacheAIResponse(restaurant.id, inviteCopyCacheKey, inviteCopy);
    } catch (error) {
      console.warn('AI invite generation failed, using fallback:', error);
      inviteCopy = `Want to try ${restaurant.name}? Let's make it happen!`;
    }
  }

  return {
    timeWindow: timeWindows,
    vibe: vibes,
    inviteCopy,
  };
}

function generatePlanCopilotFallback(
  action: 'suggest-times' | 'draft-invite' | 'make-group-friendly',
  restaurant: YelpBusiness,
  currentPlan?: {
    timeWindow?: 'tonight' | 'thisWeek' | 'weekend';
    vibe?: 'quickBite' | 'drinks' | 'dinner';
  }
): string {
  switch (action) {
    case 'suggest-times':
      return 'How about this week or weekend?';
    
    case 'draft-invite':
      return `Let's grab ${restaurant.name} - who's in?`;
    
    case 'make-group-friendly':
      if (currentPlan?.vibe === 'quickBite') {
        return 'Perfect for groups - quick and casual';
      }
      return 'Great for groups - spacious and welcoming';
    
    default:
      return 'Let\'s make a plan!';
  }
}

export async function generatePlanCopilot(
  action: 'suggest-times' | 'draft-invite' | 'make-group-friendly',
  restaurant: YelpBusiness,
  currentPlan?: {
    timeWindow?: 'tonight' | 'thisWeek' | 'weekend';
    vibe?: 'quickBite' | 'drinks' | 'dinner';
  }
): Promise<string> {
  const cacheKey = `plan_copilot_${action}`;
  
  // Try to get from cache first
  const cached = await getCachedAIResponse(restaurant.id, cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Generate AI response
    const aiResponse = await generatePlanCopilotAI(
      action,
      restaurant.name,
      currentPlan
    );
    
    // Cache the response
    await cacheAIResponse(restaurant.id, cacheKey, aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.warn('AI plan copilot generation failed, using fallback:', error);
    // Fallback to template
    return generatePlanCopilotFallback(action, restaurant, currentPlan);
  }
}


