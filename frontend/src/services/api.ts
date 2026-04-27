export const API_URL = 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const clearAuthToken = () => localStorage.removeItem('token');

// Helper to handle API responses
async function handleResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    // If the backend returns a specific detail message, use it
    const errorMessage = data.detail || data.message || 'An unexpected error occurred.';
    throw new ApiError(response.status, errorMessage);
  }
  
  return data;
}

export const login = async (username: string, password: string) => {
  // OAuth2 Password Request Form requires x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  const data = await handleResponse(response);
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
};

// Define the history type locally to avoid circular dependencies
type MessageHistory = { sender: 'user' | 'ai'; text: string; error?: boolean };

export const queryAssistant = async (query: string, history: MessageHistory[] = []) => {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError(401, 'Not authenticated');
  }

  // Format frontend history to match backend/Gemini expected format
  const formattedHistory = history
    .filter(msg => !msg.error) // Do not send error messages as context
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [msg.text]
    }));

  const response = await fetch(`${API_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, history: formattedHistory }),
  });

  return handleResponse(response);
};

export const queryAssistantStream = async (
  query: string, 
  history: MessageHistory[] = [],
  onChunk: (chunk: string) => void
): Promise<void> => {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError(401, 'Not authenticated');
  }

  const formattedHistory = history
    .filter(msg => !msg.error)
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [msg.text]
    }));

  const response = await fetch(`${API_URL}/api/query-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, history: formattedHistory })
  });

  if (!response.ok) {
    let errorMsg = 'Failed to get stream response';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch (e) {}
    throw new ApiError(response.status, errorMsg);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No readable stream available');

  const decoder = new TextDecoder();
  let done = false;
  let buffer = '';
  
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // Check for error marker in buffer
      const errorMatch = buffer.match(/\[ERROR:(\d+):([^\]]+)\]/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        const errorMessage = errorMatch[2];
        throw new ApiError(errorCode, errorMessage);
      }
      
      onChunk(chunk);
    }
  }
};
