# NeoChat - AI Chatbot dengan Gaya Neon Cyberpunk

## Overview
NeoChat adalah aplikasi AI chatbot mobile dengan desain neon cyberpunk yang modern dan simple. Dibangun dengan Expo (React Native), FastAPI backend, dan MongoDB database. Menggunakan Claude Haiku dari Anthropic untuk AI responses.

## Fitur Utama

### ✅ Multiple Conversations
- Create multiple chat conversations
- Each conversation has unique ID and title
- Auto-generate title from first message
- View all conversations in list format
- Delete individual conversations
- Clear all conversations at once

### ✅ AI Chat Integration
- Powered by Claude Haiku (Anthropic)
- Real-time messaging
- Contextual responses
- Fast and efficient AI responses
- Using Emergent LLM Universal Key

### ✅ Credit/Usage Tracking
- Track total conversations created
- Track total messages sent
- Track total AI responses received
- Display stats in neon card on home screen
- Prevents credit wastage with efficient tracking

### ✅ Neon Cyberpunk UI Design
- Blue/Cyan neon color scheme (#00d9ff primary)
- Glowing effects on UI elements
- Dark background (#0a0a0f, #1a1a2e)
- Linear gradients on buttons
- Smooth animations
- Professional mobile-first design
- Touch-optimized interface

## Tech Stack

### Frontend (Expo - React Native)
- React 19.1.0
- React Native 0.81.5
- Expo Router 6.0.22 (file-based routing)
- Expo Linear Gradient (neon effects)
- Date-fns (date formatting)
- TypeScript

### Backend (FastAPI)
- FastAPI 0.110.1
- Python 3.11
- Emergentintegrations (LLM integration)
- PyMongo 4.5.0
- Uvicorn

### Database
- MongoDB (local)
- Collections: conversations, messages, usage

### AI Integration
- Provider: Anthropic
- Model: claude-haiku-4-5-20251001
- API: Emergent LLM Universal Key

## API Endpoints

### Health & Usage
- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `GET /api/usage` - Get usage statistics

### Conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations` - Get all conversations
- `DELETE /api/conversations/{id}` - Delete specific conversation
- `DELETE /api/conversations/clear/all` - Clear all conversations

### Messages & Chat
- `GET /api/messages/{conversation_id}` - Get all messages in conversation
- `POST /api/chat` - Send message and get AI response

## Database Schema

### Conversations Collection
```json
{
  "_id": ObjectId,
  "title": String,
  "created_at": ISO DateTime,
  "updated_at": ISO DateTime
}
```

### Messages Collection
```json
{
  "_id": ObjectId,
  "conversation_id": String,
  "role": "user" | "assistant",
  "content": String,
  "timestamp": ISO DateTime
}
```

### Usage Collection
```json
{
  "_id": ObjectId,
  "total_conversations": Number,
  "total_messages": Number,
  "total_ai_responses": Number,
  "created_at": ISO DateTime
}
```

## App Structure

### Frontend Routes
- `/` - Home screen (conversation list)
- `/chat/[id]` - Chat screen (individual conversation)

### Key Files
- `/app/frontend/app/_layout.tsx` - Root layout
- `/app/frontend/app/index.tsx` - Home screen
- `/app/frontend/app/chat/[id].tsx` - Chat screen
- `/app/backend/server.py` - FastAPI backend
- `/app/backend/.env` - Environment variables

## Design Specifications

### Color Palette
- Background Dark: `#0a0a0f`
- Background Secondary: `#1a1a2e`
- Neon Blue Primary: `#00d9ff`
- Neon Blue Secondary: `#0066ff`
- Text Primary: `#ffffff`
- Text Secondary: `#6b7280`
- Accent Red: `#ff0066`

### Typography
- Header Title: 28px Bold
- Screen Title: 18-20px Bold
- Message Text: 15px Regular
- Stat Value: 24px Bold
- Stat Label: 12px Uppercase

### UI Components
- Neon borders with glow effect
- Linear gradient buttons
- Floating action button
- Touch-optimized (44px minimum)
- Safe area insets handled
- Keyboard-aware input

## User Flow

1. **Home Screen**
   - View usage statistics (chats, messages, AI replies)
   - See list of all conversations
   - Tap floating + button to create new chat
   - Tap conversation to open
   - Long press conversation to delete
   - Tap trash icon to clear all

2. **Chat Screen**
   - View conversation header with AI indicator
   - See all messages (user on right, AI on left)
   - Type message in input field
   - Tap send button (disabled when empty)
   - See loading indicator while AI responds
   - Auto-scroll to latest message
   - Tap back arrow to return home

## Features Summary

### ✅ Implemented
- Multiple conversation support
- Claude Haiku AI integration
- Real-time chat messaging
- Usage/credit tracking
- Neon cyberpunk UI design
- Delete conversations
- Clear all conversations
- Auto-title generation
- Message timestamps
- Optimistic UI updates
- Error handling
- Loading states

### Ready for Production
- All backend APIs tested ✅
- All frontend features working ✅
- AI integration verified ✅
- Mobile-optimized UI ✅
- Ready to download and use ✅

## Testing Results

### Backend Testing (100% Pass Rate)
- ✅ Health check endpoint
- ✅ Usage statistics endpoint  
- ✅ Create conversation endpoint
- ✅ Get conversations endpoint
- ✅ Chat with AI endpoint (Claude Haiku working)
- ✅ Get messages endpoint
- ✅ Delete conversation endpoint
- ✅ Clear all conversations endpoint

### Frontend Testing
- ✅ Home screen loads correctly
- ✅ Usage stats display properly
- ✅ Create new conversation works
- ✅ Chat interface functional
- ✅ AI responses received and displayed
- ✅ Navigation between screens works
- ✅ Neon UI design looks amazing
- ✅ Mobile-optimized and responsive

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=neochat_db
EMERGENT_LLM_KEY=sk-emergent-b026d14D8C3E847035
```

### Frontend (.env)
```
EXPO_PUBLIC_BACKEND_URL=https://budget-chat-6.preview.emergentagent.com
```

## How to Use

1. Open the app on mobile or web
2. See the NeoChat home screen with neon logo
3. Tap the blue floating + button to create new chat
4. Type your message and tap send
5. Watch AI respond in real-time
6. Return home to see conversation saved
7. View usage stats to track credit usage
8. Long press to delete individual chats
9. Tap trash icon to clear all

## Key Highlights

🎨 **Beautiful Neon Design**: Blue cyberpunk theme with glowing effects
🤖 **Claude Haiku AI**: Fast, efficient AI responses
📊 **Credit Tracking**: Monitor usage to prevent wastage
💬 **Multiple Chats**: Organize conversations
📱 **Mobile-First**: Optimized for mobile devices
⚡ **Fast & Simple**: Like DeepSeek - simple and efficient
✨ **Production Ready**: Fully tested and working

## Credits
- Built with Expo + FastAPI + MongoDB
- AI powered by Claude Haiku (Anthropic)
- Using Emergent LLM Universal Key
- Designed with neon cyberpunk aesthetics
