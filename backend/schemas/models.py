from pydantic import BaseModel, Field

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatMessage(BaseModel):
    role: str # 'user' or 'model'
    parts: list[str]

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="The user's query for the AI")
    history: list[ChatMessage] = Field(default=[], description="Previous conversation history")

class QueryResponse(BaseModel):
    response: str
    error: bool = False
