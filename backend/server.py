from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from bson import ObjectId
import asyncio

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
conversations_collection = db["conversations"]
messages_collection = db["messages"]
usage_collection = db["usage"]

# Pydantic models
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
    total_conversations: int
    total_messages: int
    total_ai_responses: int
    created_at: str

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# Initialize usage tracking
def init_usage():
    usage = usage_collection.find_one()
    if not usage:
        usage_collection.insert_one({
            "total_conversations": 0,
            "total_messages": 0,
            "total_ai_responses": 0,
            "created_at": datetime.utcnow().isoformat()
        })

init_usage()

@app.get("/")
async def root():
    return {"message": "NeoChat API Server", "status": "running"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "database": "connected"}

# Create new conversation
@app.post("/api/conversations")
async def create_conversation():
    conversation = {
        "title": "New Chat",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    result = conversations_collection.insert_one(conversation)
    
    # Update usage
    usage_collection.update_one({}, {"$inc": {"total_conversations": 1}})
    
    conversation["_id"] = result.inserted_id
    return {"conversation": serialize_doc(conversation)}

# Get all conversations
@app.get("/api/conversations")
async def get_conversations():
    conversations = list(conversations_collection.find().sort("updated_at", -1))
    
    # Get message count for each conversation
    result = []
    for conv in conversations:
        conv_id = str(conv["_id"])
        message_count = messages_collection.count_documents({"conversation_id": conv_id})
        conv_data = serialize_doc(conv)
        conv_data["message_count"] = message_count
        result.append(conv_data)
    
    return {"conversations": result}

# Delete conversation
@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    # Delete conversation
    result = conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete all messages in this conversation
    messages_collection.delete_many({"conversation_id": conversation_id})
    
    return {"message": "Conversation deleted successfully"}

# Clear all conversations
@app.delete("/api/conversations/clear/all")
async def clear_all_conversations():
    conversations_collection.delete_many({})
    messages_collection.delete_many({})
    
    # Reset usage
    usage_collection.update_one({}, {
        "$set": {
            "total_conversations": 0,
            "total_messages": 0,
            "total_ai_responses": 0
        }
    })
    
    return {"message": "All conversations cleared"}

# Get messages for a conversation
@app.get("/api/messages/{conversation_id}")
async def get_messages(conversation_id: str):
    messages = list(messages_collection.find({"conversation_id": conversation_id}).sort("timestamp", 1))
    return {"messages": [serialize_doc(msg) for msg in messages]}

# Send message and get AI response
@app.post("/api/chat")
async def chat(message: Message):
    try:
        # Save user message
        user_message = {
            "conversation_id": message.conversation_id,
            "role": "user",
            "content": message.content,
            "timestamp": datetime.utcnow().isoformat()
        }
        messages_collection.insert_one(user_message)
        
        # Update conversation title if it's the first message
        conversation = conversations_collection.find_one({"_id": ObjectId(message.conversation_id)})
        if conversation and conversation.get("title") == "New Chat":
            # Use first message as title (truncated)
            new_title = message.content[:30] + "..." if len(message.content) > 30 else message.content
            conversations_collection.update_one(
                {"_id": ObjectId(message.conversation_id)},
                {"$set": {"title": new_title}}
            )
        
        # Get conversation history for context
        history = list(messages_collection.find(
            {"conversation_id": message.conversation_id}
        ).sort("timestamp", 1))
        
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
            "timestamp": datetime.utcnow().isoformat()
        }
        messages_collection.insert_one(ai_message)
        
        # Update conversation timestamp
        conversations_collection.update_one(
            {"_id": ObjectId(message.conversation_id)},
            {"$set": {"updated_at": datetime.utcnow().isoformat()}}
        )
        
        # Update usage
        usage_collection.update_one({}, {
            "$inc": {
                "total_messages": 1,
                "total_ai_responses": 1
            }
        })
        
        return {
            "user_message": serialize_doc(user_message),
            "ai_message": serialize_doc(ai_message)
        }
        
    except Exception as e:
        print(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# Get usage statistics
@app.get("/api/usage")
async def get_usage():
    usage = usage_collection.find_one()
    if usage:
        return serialize_doc(usage)
    return {
        "total_conversations": 0,
        "total_messages": 0,
        "total_ai_responses": 0,
        "created_at": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)