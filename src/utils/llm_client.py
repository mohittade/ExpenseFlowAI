"""
LLM client for NVIDIA Nemotron API.
"""
import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class LLMClient:
    """Client for NVIDIA Nemotron API (OpenAI-compatible)."""

    def __init__(self):
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key or api_key == "your_nvidia_api_key_here":
            self.client = None
            self.model = "nemotron-3-ultra"
        else:
            if OPENAI_AVAILABLE:
                self.client = OpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=api_key
                )
            else:
                self.client = None
            self.model = "nvidia/nemotron-3-ultra"

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.1, max_tokens: int = 2000) -> str:
        """Send a chat completion request."""
        if not self.client:
            return self._mock_response(messages)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"

    def chat_json(self, messages: List[Dict[str, str]], temperature: float = 0.1) -> Dict[str, Any]:
        """Get JSON response from LLM."""
        messages = messages + [{
            "role": "system",
            "content": "You must respond with valid JSON only. No additional text."
        }]
        response = self.chat(messages, temperature=temperature)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw": response}

    def _mock_response(self, messages: List[Dict[str, str]]) -> str:
        """Mock response for testing without API key."""
        all_text = " ".join([m["content"].lower() for m in messages])

        # Check for planning request
        if any(kw in all_text for kw in ["plan", "step", "execution plan", "planning agent"]):
            date_range = self._extract_date_range(all_text)
            return self._plan_response(date_range)

        # Check for categorization request
        if "categorize" in all_text or "category" in all_text:
            return self._categorize_response()

        # Check for missing data request
        if "missing" in all_text or "exception" in all_text:
            return self._missing_data_response()

        # Check for policy validation request
        if "policy" in all_text or "violation" in all_text:
            return self._policy_response()

        # Check for approval request
        if "approval" in all_text or "approve" in all_text:
            return self._approval_response()

        return "I understand. Let me help with that."

    def _extract_date_range(self, text: str) -> str:
        """Extract date range from text - prioritize user request over system prompt."""
        # Get the last user message which contains the actual request
        # The text is all messages concatenated, so look for the user request pattern
        user_request_match = re.search(r'user request:\s*(.+?)(?:\s+you must respond|\s*$)', text, re.IGNORECASE)
        if user_request_match:
            user_text = user_request_match.group(1).lower()
        else:
            # Fallback: use the last portion of text (likely the user message)
            user_text = text[-500:].lower()
        
        # Check for specific month/year patterns in user request
        if re.search(r'july\s+2025', user_text):
            return "July 2025"
        if re.search(r'august\s+2025', user_text):
            return "August 2025"
        if re.search(r'july\s+2026', user_text):
            return "July 2026"
        if re.search(r'august\s+2026', user_text):
            return "August 2026"
        
        # Check for "last month", "this month", etc. in user request
        if "last month" in user_text or "previous month" in user_text:
            return "last month"
        if "this month" in user_text or "current month" in user_text:
            return "this month"
        if "last week" in user_text:
            return "last week"
        if "this week" in user_text:
            return "this week"
        if "last quarter" in user_text:
            return "last quarter"
        if "year to date" in user_text or "ytd" in user_text:
            return "year to date"
        if "last year" in user_text:
            return "last year"
        
        return "last month"

    def _plan_response(self, date_range: str) -> str:
        return f'''{{
  "plan": [
    {{"step": 1, "agent": "supervisor", "action": "parse_request", "description": "Parse user request for date range and intent"}},
    {{"step": 2, "agent": "expense_intelligence", "action": "retrieve_expenses", "description": "Retrieve expenses for date range"}},
    {{"step": 3, "agent": "expense_intelligence", "action": "categorize", "description": "Categorize uncategorized expenses"}},
    {{"step": 4, "agent": "exception", "action": "check_missing", "description": "Check for missing receipts/data"}},
    {{"step": 5, "agent": "validation", "action": "check_policy", "description": "Validate against expense policies"}},
    {{"step": 6, "agent": "validation", "action": "calculate_totals", "description": "Calculate category totals and grand total"}},
    {{"step": 7, "agent": "validation", "action": "generate_pdf", "description": "Generate PDF report"}},
    {{"step": 8, "agent": "supervisor", "action": "request_approval", "description": "Request human approval"}},
    {{"step": 9, "agent": "supervisor", "action": "send_email", "description": "Email report to finance"}}
  ],
  "date_range": "{date_range}"
}}'''

    def _categorize_response(self) -> str:
        return '''{
  "categorized": [
    {"id": 1, "category": "Flights", "confidence": 0.95},
    {"id": 2, "category": "Lodging", "confidence": 0.9},
    {"id": 3, "category": "Transport", "confidence": 0.85}
  ]
}'''

    def _missing_data_response(self) -> str:
        return '''{
  "missing_data": [
    {"expense_id": 15, "issue": "Missing Category", "severity": "high"},
    {"expense_id": 16, "issue": "Missing Description", "severity": "medium"}
  ],
  "requires_human": false
}'''

    def _policy_response(self) -> str:
        return '''{
  "violations": [
    {"expense_id": 2, "category": "Lodging", "amount": 320, "limit": 300, "excess": 20},
    {"expense_id": 5, "category": "Meals", "amount": 180, "limit": 75, "excess": 105}
  ]
}'''

    def _approval_response(self) -> str:
        return '''{
  "approved": true,
  "feedback": ""
}'''


# Global instance
llm_client = LLMClient()