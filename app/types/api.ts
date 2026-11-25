// Shapes of CGserver responses that the UI reads loosely.

export type ApiParticipant = {
  conversationId: number;
  participantId: string;
  lastReadAt?: string | null;
  participant?: { id: string; userName: string; profileImg: string | null };
};

export type ApiMessage = {
  id: number;
  content: string;
  createdAt: string;
  senderId: string;
  conversationId: number;
};

export type ApiConversation = {
  id: number;
  isGroup: boolean;
  participants?: ApiParticipant[];
  messages?: ApiMessage[];
  unreadCount?: number;
};

export type ApiGroupMember = {
  memberId: string;
  groupId: number;
  role: string;
  member?: { id?: string; userName: string; profileImg: string | null };
};
