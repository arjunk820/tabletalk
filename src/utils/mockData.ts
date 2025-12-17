import { TableMember, Plan } from './storage';
import { YelpBusiness } from '../services/types';

// Mock user profiles for demo
const MOCK_USERS = [
  { name: 'Alex', avatar: null },
  { name: 'Sam', avatar: null },
  { name: 'Jordan', avatar: null },
  { name: 'Taylor', avatar: null },
  { name: 'Morgan', avatar: null },
  { name: 'Casey', avatar: null },
  { name: 'Riley', avatar: null },
  { name: 'Quinn', avatar: null },
];

// Demo configuration
export const DEMO_CONFIG = {
  // Number of mock members to add when joining a table (random between min and max)
  mockMembersMin: 2,
  mockMembersMax: 4,
  // Whether to enable mock data (set to false for production)
  enabled: true,
};

export function generateMockMembers(
  excludeUserId: string = 'current_user',
  count?: number
): TableMember[] {
  if (!DEMO_CONFIG.enabled) {
    return [];
  }

  const memberCount = count || 
    Math.floor(Math.random() * (DEMO_CONFIG.mockMembersMax - DEMO_CONFIG.mockMembersMin + 1)) + 
    DEMO_CONFIG.mockMembersMin;

  // Shuffle and take random users
  const shuffled = [...MOCK_USERS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, memberCount);

  return selected.map((user, index) => ({
    userId: `mock_user_${index + 1}`,
    name: user.name,
    avatar: user.avatar,
    joinedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
    timeIntent: ['tonight', 'thisWeek', 'weekend'][Math.floor(Math.random() * 3)] as 'tonight' | 'thisWeek' | 'weekend',
  }));
}

export function generateMockMessages(
  table: { restaurant: YelpBusiness; memberCount: number },
  memberCount: number = 0
): Array<{ id: string; userId: string; name: string; text: string; timestamp: Date }> {
  if (!DEMO_CONFIG.enabled) {
    return [];
  }

  const messages: Array<{ id: string; userId: string; name: string; text: string; timestamp: Date }> = [];
  const mockMembers = generateMockMembers('current_user', memberCount || table.memberCount - 1);
  
  if (mockMembers.length === 0) {
    return [];
  }

  // Generate conversation based on restaurant type/cuisine
  const restaurantName = table.restaurant.name;
  const cuisine = table.restaurant.categories?.[0]?.title?.toLowerCase() || 'restaurant';
  
  // Initial interest message
  const firstMember = mockMembers[0];
  const interestMessages = [
    `Anyone free ${firstMember.timeIntent === 'tonight' ? 'tonight' : firstMember.timeIntent === 'thisWeek' ? 'this week' : 'this weekend'}?`,
    `I've been wanting to try ${restaurantName}!`,
    `Who's down for ${restaurantName}?`,
    `Anyone else interested in ${restaurantName}?`,
  ];
  messages.push({
    id: `msg_${Date.now()}_1`,
    userId: firstMember.userId,
    name: firstMember.name,
    text: interestMessages[Math.floor(Math.random() * interestMessages.length)],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  });

  // Response messages
  if (mockMembers.length > 1) {
    const secondMember = mockMembers[1];
    const responseMessages = [
      "I'm in!",
      "Yes! Let's do it",
      "Count me in",
      "Sounds good to me",
      "I'm down",
    ];
    messages.push({
      id: `msg_${Date.now()}_2`,
      userId: secondMember.userId,
      name: secondMember.name,
      text: responseMessages[Math.floor(Math.random() * responseMessages.length)],
      timestamp: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
    });
  }

  // Additional messages if more members
  if (mockMembers.length > 2) {
    const thirdMember = mockMembers[2];
    const additionalMessages = [
      "What time works for everyone?",
      "I'm free after 6pm",
      "Weekend works better for me",
      "Let's make it happen!",
    ];
    messages.push({
      id: `msg_${Date.now()}_3`,
      userId: thirdMember.userId,
      name: thirdMember.name,
      text: additionalMessages[Math.floor(Math.random() * additionalMessages.length)],
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    });
  }

  // Sort by timestamp
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function addMockMembersToTable(table: {
  id: string;
  restaurantId: string;
  memberIds: string[];
  memberCount: number;
  timeIntent: {
    tonight: number;
    thisWeek: number;
    weekend: number;
  };
}): {
  memberIds: string[];
  memberCount: number;
  timeIntent: {
    tonight: number;
    thisWeek: number;
    weekend: number;
  };
} {
  if (!DEMO_CONFIG.enabled) {
    return {
      memberIds: table.memberIds,
      memberCount: table.memberCount,
      timeIntent: table.timeIntent,
    };
  }

  const mockMembers = generateMockMembers('current_user');
  const mockMemberIds = mockMembers.map((m) => m.userId);
  
  // Combine with existing members (avoid duplicates)
  const allMemberIds = [...new Set([...table.memberIds, ...mockMemberIds])];
  
  // Update time intent counts
  const updatedTimeIntent = { ...table.timeIntent };
  mockMembers.forEach((member) => {
    if (member.timeIntent === 'tonight') {
      updatedTimeIntent.tonight += 1;
    } else if (member.timeIntent === 'thisWeek') {
      updatedTimeIntent.thisWeek += 1;
    } else if (member.timeIntent === 'weekend') {
      updatedTimeIntent.weekend += 1;
    }
  });

  return {
    memberIds: allMemberIds,
    memberCount: allMemberIds.length,
    timeIntent: updatedTimeIntent,
  };
}

export function getMockMember(userId: string): TableMember | null {
  const mockMembers = generateMockMembers();
  return mockMembers.find((m) => m.userId === userId) || null;
}

export function getMockMembersForTable(table: {
  memberIds: string[];
}): TableMember[] {
  if (!DEMO_CONFIG.enabled) {
    return [];
  }

  const mockMembers = generateMockMembers();
  return mockMembers.filter((m) => table.memberIds.includes(m.userId));
}

