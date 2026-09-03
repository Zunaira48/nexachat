export const CONVERSATION_TYPES = ['DIRECT', 'GROUP'] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const MEMBER_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];