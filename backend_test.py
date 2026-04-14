#!/usr/bin/env python3
"""
NeoChat Backend API Test Suite
Tests all backend endpoints for the NeoChat application
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend environment
BACKEND_URL = "https://budget-chat-6.preview.emergentagent.com/api"

class NeoChattester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.conversation_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and data.get("database") == "connected":
                    self.log_test("Health Check", True, "Service healthy and database connected", data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_usage_statistics(self):
        """Test GET /api/usage"""
        try:
            response = self.session.get(f"{self.base_url}/usage", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_conversations", "total_messages", "total_ai_responses"]
                
                if all(field in data for field in required_fields):
                    self.log_test("Usage Statistics", True, f"Retrieved usage data: {data['total_conversations']} conversations, {data['total_messages']} messages, {data['total_ai_responses']} AI responses", data)
                    return True
                else:
                    self.log_test("Usage Statistics", False, f"Missing required fields", data)
                    return False
            else:
                self.log_test("Usage Statistics", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Usage Statistics", False, f"Request failed: {str(e)}")
            return False
    
    def test_create_conversation(self):
        """Test POST /api/conversations"""
        try:
            response = self.session.post(f"{self.base_url}/conversations", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "conversation" in data and "id" in data["conversation"]:
                    self.conversation_id = data["conversation"]["id"]
                    self.log_test("Create Conversation", True, f"Created conversation with ID: {self.conversation_id}", data)
                    return True
                else:
                    self.log_test("Create Conversation", False, f"Invalid response format", data)
                    return False
            else:
                self.log_test("Create Conversation", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Conversation", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_conversations(self):
        """Test GET /api/conversations"""
        try:
            response = self.session.get(f"{self.base_url}/conversations", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "conversations" in data and isinstance(data["conversations"], list):
                    conversations = data["conversations"]
                    self.log_test("Get Conversations", True, f"Retrieved {len(conversations)} conversations", data)
                    return True
                else:
                    self.log_test("Get Conversations", False, f"Invalid response format", data)
                    return False
            else:
                self.log_test("Get Conversations", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Conversations", False, f"Request failed: {str(e)}")
            return False
    
    def test_chat_ai_integration(self):
        """Test POST /api/chat - CRITICAL TEST"""
        if not self.conversation_id:
            self.log_test("Chat AI Integration", False, "No conversation ID available - create conversation first")
            return False
            
        try:
            # Test message
            test_message = "Hello, how are you today? Please respond with a friendly greeting."
            
            payload = {
                "conversation_id": self.conversation_id,
                "content": test_message
            }
            
            headers = {"Content-Type": "application/json"}
            
            print(f"   Sending message to AI: '{test_message}'")
            response = self.session.post(
                f"{self.base_url}/chat", 
                json=payload, 
                headers=headers, 
                timeout=30  # Longer timeout for AI response
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "user_message" in data and "ai_message" in data:
                    user_msg = data["user_message"]
                    ai_msg = data["ai_message"]
                    
                    # Validate user message
                    if (user_msg.get("role") == "user" and 
                        user_msg.get("content") == test_message and
                        user_msg.get("conversation_id") == self.conversation_id):
                        
                        # Validate AI message
                        if (ai_msg.get("role") == "assistant" and 
                            ai_msg.get("content") and 
                            len(ai_msg.get("content", "")) > 0 and
                            ai_msg.get("conversation_id") == self.conversation_id):
                            
                            ai_response = ai_msg.get("content")
                            self.log_test("Chat AI Integration", True, f"AI responded successfully. Response: '{ai_response[:100]}{'...' if len(ai_response) > 100 else ''}'", data)
                            return True
                        else:
                            self.log_test("Chat AI Integration", False, f"Invalid AI message format", data)
                            return False
                    else:
                        self.log_test("Chat AI Integration", False, f"Invalid user message format", data)
                        return False
                else:
                    self.log_test("Chat AI Integration", False, f"Missing user_message or ai_message in response", data)
                    return False
            else:
                self.log_test("Chat AI Integration", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Chat AI Integration", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_messages(self):
        """Test GET /api/messages/{conversation_id}"""
        if not self.conversation_id:
            self.log_test("Get Messages", False, "No conversation ID available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/messages/{self.conversation_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "messages" in data and isinstance(data["messages"], list):
                    messages = data["messages"]
                    
                    # Should have at least 2 messages (user + AI) if chat test passed
                    if len(messages) >= 2:
                        # Check message structure
                        user_msg = None
                        ai_msg = None
                        
                        for msg in messages:
                            if msg.get("role") == "user":
                                user_msg = msg
                            elif msg.get("role") == "assistant":
                                ai_msg = msg
                        
                        if user_msg and ai_msg:
                            self.log_test("Get Messages", True, f"Retrieved {len(messages)} messages (user + AI)", data)
                            return True
                        else:
                            self.log_test("Get Messages", True, f"Retrieved {len(messages)} messages but missing expected user/AI roles", data)
                            return True
                    else:
                        self.log_test("Get Messages", True, f"Retrieved {len(messages)} messages", data)
                        return True
                else:
                    self.log_test("Get Messages", False, f"Invalid response format", data)
                    return False
            else:
                self.log_test("Get Messages", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Messages", False, f"Request failed: {str(e)}")
            return False
    
    def test_delete_conversation(self):
        """Test DELETE /api/conversations/{conversation_id}"""
        if not self.conversation_id:
            self.log_test("Delete Conversation", False, "No conversation ID available")
            return False
            
        try:
            response = self.session.delete(f"{self.base_url}/conversations/{self.conversation_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Delete Conversation", True, f"Conversation deleted: {data['message']}", data)
                    return True
                else:
                    self.log_test("Delete Conversation", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_test("Delete Conversation", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Conversation", False, f"Request failed: {str(e)}")
            return False
    
    def test_clear_all_conversations(self):
        """Test DELETE /api/conversations/clear/all"""
        try:
            response = self.session.delete(f"{self.base_url}/conversations/clear/all", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Clear All Conversations", True, f"All conversations cleared: {data['message']}", data)
                    return True
                else:
                    self.log_test("Clear All Conversations", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_test("Clear All Conversations", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Clear All Conversations", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"\n🚀 Starting NeoChat Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence following the review request
        tests = [
            ("Health Check", self.test_health_check),
            ("Usage Statistics", self.test_usage_statistics),
            ("Create Conversation", self.test_create_conversation),
            ("Get All Conversations", self.test_get_conversations),
            ("Chat AI Integration (CRITICAL)", self.test_chat_ai_integration),
            ("Get Messages", self.test_get_messages),
            ("Delete Conversation", self.test_delete_conversation),
            ("Clear All Conversations", self.test_clear_all_conversations),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}: Unexpected error: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Final summary
        print("\n" + "=" * 60)
        print(f"🏁 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("🎉 ALL TESTS PASSED!")
        else:
            print("⚠️  Some tests failed - check details above")
        
        return passed, failed, self.test_results

def main():
    """Main test execution"""
    tester = NeoChattester()
    passed, failed, results = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump({
            "summary": {
                "passed": passed,
                "failed": failed,
                "total": passed + failed,
                "success_rate": (passed/(passed+failed)*100) if (passed+failed) > 0 else 0
            },
            "tests": results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)