// Shared domain types used across components
export type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  error?: boolean;
};
