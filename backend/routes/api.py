from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from schemas.models import Token, QueryRequest, QueryResponse
from utils.security import MOCK_USERS, create_access_token, verify_token
from config import settings
from services.ai_service import generate_ai_response, generate_ai_response_stream

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = MOCK_USERS.get(form_data.username)
    if not user or user["password"] != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/query", response_model=QueryResponse)
def process_query(request: QueryRequest, current_user: str = Depends(verify_token)):
    """Standard synchronous completion endpoint"""
    return generate_ai_response(request)

@router.post("/query-stream")
def process_query_stream(request: QueryRequest, current_user: str = Depends(verify_token)):
    """Streaming completion endpoint (Server-Sent Events / Chunked response)"""
    return generate_ai_response_stream(request)

@router.get("/health")
async def health_check():
    return {"status": "ok"}
