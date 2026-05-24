export interface User {
  id: number;
  username: string;
  avatar_color: string;
  profile_picture_url?: string;
  created_at: string;
  last_seen_at: string;
}

export interface Channel {
  id: number;
  name: string;
  description: string;
  created_by: number;
  is_dm: number;
  created_at: string;
  unread_count?: number;
}

export interface Message {
  id: number;
  username: string;
  user_id: number;
  content: string;
  channel_id: number;
  parent_id: number | null;
  media_url: string | null;
  media_type: string | null;
  is_ai: number;
  created_at: string;
  edited_at: string | null;
  pinned_at: string | null;
  pinned_by: number | null;
  avatar_color?: string;
  profile_picture_url?: string;
  reactions?: Reaction[];
  reply_count?: number;
  channel_name?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  reacted: boolean;
}

export interface ReadReceipt {
  channel_id: number;
  user_id: number;
  last_read_message_id: number;
  read_at: string;
}

export interface TypingUser {
  username: string;
  avatar_color: string;
  profile_picture_url?: string;
}

export interface PollResponse {
  messages: Message[];
  typing: TypingUser[];
  unreadCounts: Record<number, number>;
}
