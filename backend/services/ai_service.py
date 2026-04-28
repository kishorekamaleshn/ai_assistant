import os
import json
from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from schemas.models import QueryRequest, QueryResponse
from config import settings

# Initialize client globally if key exists
client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

def _extract_error_details(error: Exception) -> tuple[int, str]:
    """Extract HTTP status code and concise error message from Gemini exceptions."""
    error_str = str(error)
    
    # Try to parse JSON more robustly - extract balanced JSON
    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', error_str)
    if json_match:
        try:
            error_data = json.loads(json_match.group())
            if "error" in error_data:
                error_obj = error_data["error"]
                code = error_obj.get("code", 502)
                message = error_obj.get("message", "Unknown error")
                
                # Extract first sentence/line, truncate if needed
                first_line = message.split('\n')[0].split('. ')[0]
                if len(first_line) > 150:
                    first_line = first_line[:150] + "..."
                
                return code, first_line
        except (json.JSONDecodeError, KeyError):
            pass
    
    # Fully case-insensitive fallback (compute error_lower once)
    error_lower = error_str.lower()
    if any(x in error_str for x in ["429", "RESOURCE_EXHAUSTED"]) or "quota" in error_lower:
        return 429, "Rate limit or quota exceeded. Please try again later."
    elif any(x in error_str for x in ["401"]) or "unauthenticated" in error_lower:
        return 401, "Authentication failed. Invalid API credentials."
    elif any(x in error_str for x in ["403"]) or "permissiondenied" in error_lower:
        return 403, "Permission denied. Check API key permissions."
    elif any(x in error_str for x in ["400"]) or "invalidargument" in error_lower:
        return 400, "Invalid request. Please check your input."
    elif any(x in error_str for x in ["404", "NOT_FOUND"]) or "not_found" in error_lower:
        return 404, "Invalid model name provided. Please check your configuration."
    elif any(x in error_lower for x in ["blocked", "policy"]):
        return 400, "Content blocked by safety policy."
    else:
        return 502, "An error occurred with the AI service. Please try again."


def _build_contents(request: QueryRequest):
    """Converts the request history and new query into the expected Contents list."""
    contents = []
    # Add history
    for msg in request.history:
        contents.append(
            types.Content(
                role=msg.role,
                parts=[types.Part.from_text(text=p) for p in msg.parts]
            )
        )
    # Append the new user query as the final turn
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=request.query)]
        )
    )
    return contents

def generate_ai_response(request: QueryRequest) -> QueryResponse:
    if not client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API Key is not configured on the server."
        )

    try:
        contents = _build_contents(request)
        
        # Simple synchronous call
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents
        )
        
        return QueryResponse(response=response.text)

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        error_code, error_message = _extract_error_details(e)
        raise HTTPException(
            status_code=error_code,
            detail=error_message
        )

def generate_ai_response_stream(request: QueryRequest) -> StreamingResponse:
    if not client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API Key is not configured on the server."
        )

    contents = _build_contents(request)

    try:
        response_stream = client.models.generate_content_stream(
            model=settings.GEMINI_MODEL,
            contents=contents
        )
        iterator = iter(response_stream)
        
        # Pre-fetch the first chunk to catch auth/model errors immediately
        try:
            first_chunk = next(iterator)
        except StopIteration:
            first_chunk = None
            
    except Exception as e:
        print(f"Gemini API initialization error: {e}")
        error_code, error_message = _extract_error_details(e)
        raise HTTPException(
            status_code=error_code,
            detail=error_message
        )

    def stream_generator():
        try:
            if first_chunk and first_chunk.text:
                yield f"data: {first_chunk.text}\n\n"
            for chunk in iterator:
                if chunk.text:
                    yield f"data: {chunk.text}\n\n"
        except Exception as e:
            print(f"Streaming Error mid-stream: {e}")
            error_code, error_message = _extract_error_details(e)
            yield f"data: [ERROR:{error_code}:{error_message}]\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
