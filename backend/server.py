from fastapi import FastAPI, HTTPException, Request, Response, Cookie, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from bson import ObjectId
import asyncio
import uuid
import httpx

# Load environment variables
load_dotenv()

# Import LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
user_sessions_collection = db["user_sessions"]
conversations_collection = db["conversations"]
messages_collection = db["messages"]
usage_collection = db["usage"]
user_preferences_collection = db["user_preferences"]

# Pydantic models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: str

class SessionData(BaseModel):
    session_id: str

class Message(BaseModel):
    conversation_id: str
    content: str

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    timestamp: str

class UsageResponse(BaseModel):
    user_id: str
    total_conversations: int
    total_messages: int
    total_ai_responses: int

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# Auth helper - get user from session token
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    # Try cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session = user_sessions_collection.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check session expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user data
    user = users_collection.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@app.get("/")
async def root():
    return {"message": "NeoChat API Server with Google Auth", "status": "running"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "database": "connected", "auth": "enabled"}

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/session")
async def create_session(session_data: SessionData, response: Response):
    """Exchange session_id for session_token after Google OAuth"""
    try:
        # Call Emergent Auth API to get user data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_data.session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            user_data = auth_response.json()
        
        # Generate custom user_id
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Check if user exists by email
        existing_user = users_collection.find_one({"email": user_data["email"]}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user data if needed
            users_collection.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": user_data["name"],
                    "picture": user_data["picture"]
                }}
            )
        else:
            # Create new user
            users_collection.insert_one({
                "user_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data["picture"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Initialize usage for new user
            usage_collection.insert_one({
                "user_id": user_id,
                "total_conversations": 0,
                "total_messages": 0,
                "total_ai_responses": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Create session
        session_token = user_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        user_sessions_collection.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        # Return user data with session_token for mobile apps
        user = users_collection.find_one({"user_id": user_id}, {"_id": 0})
        return {"user": {**user, "session_token": session_token}}
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")

@app.get("/api/auth/me")
async def get_me(request: Request, authorization: Optional[str] = Header(None)):
    """Get current authenticated user"""
    user = await get_current_user(request, authorization)
    return user

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        # Delete session from database
        user_sessions_collection.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(key="session_token", path="/")
    
    return {"message": "Logged out successfully"}

# ==================== CONVERSATION ENDPOINTS (PROTECTED) ====================

@app.post("/api/conversations")
async def create_conversation(request: Request, authorization: Optional[str] = Header(None)):
    """Create new conversation for authenticated user"""
    user = await get_current_user(request, authorization)
    
    conversation = {
        "user_id": user["user_id"],
        "title": "New Chat",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = conversations_collection.insert_one(conversation)
    
    # Update usage
    usage_collection.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"total_conversations": 1}}
    )
    
    conversation["_id"] = result.inserted_id
    return {"conversation": serialize_doc(conversation)}

@app.get("/api/conversations")
async def get_conversations(request: Request, authorization: Optional[str] = Header(None)):
    """Get all conversations for authenticated user"""
    user = await get_current_user(request, authorization)
    
    conversations = list(conversations_collection.find(
        {"user_id": user["user_id"]}
    ).sort("updated_at", -1))
    
    # Get message count for each conversation
    result = []
    for conv in conversations:
        conv_id = str(conv["_id"])
        message_count = messages_collection.count_documents({"conversation_id": conv_id})
        conv_data = serialize_doc(conv)
        conv_data["message_count"] = message_count
        result.append(conv_data)
    
    return {"conversations": result}

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Delete conversation (only if owned by user)"""
    user = await get_current_user(request, authorization)
    
    # Verify ownership
    conversation = conversations_collection.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": user["user_id"]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete conversation
    conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
    
    # Delete all messages in this conversation
    messages_collection.delete_many({"conversation_id": conversation_id})
    
    return {"message": "Conversation deleted successfully"}

@app.delete("/api/conversations/clear/all")
async def clear_all_conversations(request: Request, authorization: Optional[str] = Header(None)):
    """Clear all conversations for authenticated user"""
    user = await get_current_user(request, authorization)
    
    # Get all conversation IDs for this user
    user_conversations = list(conversations_collection.find(
        {"user_id": user["user_id"]},
        {"_id": 1}
    ))
    
    conversation_ids = [str(conv["_id"]) for conv in user_conversations]
    
    # Delete conversations
    conversations_collection.delete_many({"user_id": user["user_id"]})
    
    # Delete messages
    if conversation_ids:
        messages_collection.delete_many({"conversation_id": {"$in": conversation_ids}})
    
    # Reset usage
    usage_collection.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "total_conversations": 0,
            "total_messages": 0,
            "total_ai_responses": 0
        }}
    )
    
    return {"message": "All conversations cleared"}

# ==================== MESSAGES & CHAT ENDPOINTS (PROTECTED) ====================

@app.get("/api/messages/{conversation_id}")
async def get_messages(conversation_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Get messages for a conversation (only if owned by user)"""
    user = await get_current_user(request, authorization)
    
    # Verify ownership
    conversation = conversations_collection.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": user["user_id"]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = list(messages_collection.find({"conversation_id": conversation_id}).sort("timestamp", 1))
    return {"messages": [serialize_doc(msg) for msg in messages]}

@app.post("/api/chat")
async def chat(message: Message, request: Request, authorization: Optional[str] = Header(None)):
    """Send message and get AI response"""
    user = await get_current_user(request, authorization)
    
    # Verify conversation ownership
    conversation = conversations_collection.find_one({
        "_id": ObjectId(message.conversation_id),
        "user_id": user["user_id"]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    try:
        # Save user message
        user_message = {
            "conversation_id": message.conversation_id,
            "role": "user",
            "content": message.content,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        messages_collection.insert_one(user_message)
        
        # Update conversation title if it's the first message
        if conversation.get("title") == "New Chat":
            new_title = message.content[:30] + "..." if len(message.content) > 30 else message.content
            conversations_collection.update_one(
                {"_id": ObjectId(message.conversation_id)},
                {"$set": {"title": new_title}}
            )
        
        # Initialize LLM Chat with Claude Haiku
        api_key = os.getenv("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=message.conversation_id,
            system_message="You are NeoChat, a helpful and friendly AI assistant. Be concise and helpful."
        ).with_model("anthropic", "claude-haiku-4-5-20251001")
        
        # Send message to AI
        user_msg = UserMessage(text=message.content)
        ai_response = await chat.send_message(user_msg)
        
        # Save AI response
        ai_message = {
            "conversation_id": message.conversation_id,
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        messages_collection.insert_one(ai_message)
        
        # Update conversation timestamp
        conversations_collection.update_one(
            {"_id": ObjectId(message.conversation_id)},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update usage
        usage_collection.update_one(
            {"user_id": user["user_id"]},
            {"$inc": {
                "total_messages": 1,
                "total_ai_responses": 1
            }}
        )
        
        return {
            "user_message": serialize_doc(user_message),
            "ai_message": serialize_doc(ai_message)
        }
        
    except Exception as e:
        print(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# ==================== USAGE ENDPOINTS (PROTECTED) ====================

@app.get("/api/usage")
async def get_usage(request: Request, authorization: Optional[str] = Header(None)):
    """Get usage statistics for authenticated user"""
    user = await get_current_user(request, authorization)
    
    usage = usage_collection.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if usage:
        return usage
    
    return {
        "user_id": user["user_id"],
        "total_conversations": 0,
        "total_messages": 0,
        "total_ai_responses": 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
