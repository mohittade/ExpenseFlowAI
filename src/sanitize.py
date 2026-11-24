"""
Input sanitization for LLM calls to prevent injection attacks.
"""
import re
import html
from typing import Any, Dict, List


# Patterns that could indicate prompt injection attempts
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(previous|above|all)\s+instructions",
    r"(?i)disregard\s+(previous|above|all)\s+instructions",
    r"(?i)forget\s+(previous|above|all)\s+instructions",
    r"(?i)system\s+prompt",
    r"(?i)you\s+are\s+(now|an?)\s+",
    r"(?i)act\s+as\s+(if\s+)?(you\s+are\s+)?",
    r"(?i)pretend\s+(to\s+be\s+)?",
    r"(?i)roleplay\s+as",
    r"(?i)simulate\s+(being\s+)?",
    r"(?i)output\s+(only|just)\s+(json|xml|yaml)",
    r"(?i)respond\s+(only|just)\s+(with|in)\s+(json|xml|yaml)",
    r"(?i)do\s+not\s+(include|add|output)\s+(any\s+)?(text|explanation)",
    r"(?i)no\s+(explanation|formatting|markdown)",
    r"(?i)only\s+(return|output|print)\s+(json|the\s+result)",
    r"```\w*\n.*?```",  # Code blocks that might hide instructions
    r"(?i)<\|.*?\|>",  # Special tokens
    r"(?i)\[INST\].*?\[/INST\]",  # Instruction tokens
    r"(?i)###\s*(instruction|system|user|assistant)",
]

COMPILED_PATTERNS = [re.compile(p, re.DOTALL | re.IGNORECASE) for p in INJECTION_PATTERNS]


def sanitize_string(text: str, max_length: int = 10000) -> str:
    """Sanitize a string input for LLM consumption."""
    if not isinstance(text, str):
        text = str(text)
    
    # Truncate to max length
    if len(text) > max_length:
        text = text[:max_length] + "... [truncated]"
    
    # HTML escape to prevent markup injection
    text = html.escape(text)
    
    # Check for injection patterns
    for pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            # Replace suspicious content with placeholder
            text = pattern.sub("[FILTERED: Potential injection attempt]", text)
    
    # Remove null bytes and control characters
    text = text.replace("\x00", "")
    text = "".join(char for char in text if ord(char) >= 32 or char in "\n\r\t")
    
    return text


def sanitize_dict(data: Dict[str, Any], max_string_length: int = 10000) -> Dict[str, Any]:
    """Recursively sanitize all string values in a dictionary."""
    result = {}
    for key, value in data.items():
        # Sanitize key as well
        clean_key = sanitize_string(str(key), max_length=100)
        
        if isinstance(value, str):
            result[clean_key] = sanitize_string(value, max_string_length)
        elif isinstance(value, dict):
            result[clean_key] = sanitize_dict(value, max_string_length)
        elif isinstance(value, list):
            result[clean_key] = sanitize_list(value, max_string_length)
        else:
            result[clean_key] = value
    return result


def sanitize_list(items: List[Any], max_string_length: int = 10000) -> List[Any]:
    """Recursively sanitize all string values in a list."""
    result = []
    for item in items:
        if isinstance(item, str):
            result.append(sanitize_string(item, max_string_length))
        elif isinstance(item, dict):
            result.append(sanitize_dict(item, max_string_length))
        elif isinstance(item, list):
            result.append(sanitize_list(item, max_string_length))
        else:
            result.append(item)
    return result


def sanitize_messages(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Sanitize a list of message dictionaries for LLM API."""
    sanitized = []
    for msg in messages:
        clean_msg = {
            "role": sanitize_string(msg.get("role", ""), max_length=20),
            "content": sanitize_string(msg.get("content", ""), max_length=50000),
        }
        # Validate role
        if clean_msg["role"] not in ("system", "user", "assistant", "function", "tool"):
            clean_msg["role"] = "user"
        sanitized.append(clean_msg)
    return sanitized


def validate_expense_data(expenses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Validate and sanitize expense data."""
    allowed_fields = {
        "id", "date", "merchant", "amount", "category", "description",
        "receipt_path", "employee_id", "currency", "tax_amount"
    }
    
    sanitized = []
    for exp in expenses:
        if not isinstance(exp, dict):
            continue
        
        clean_exp = {}
        for key, value in exp.items():
            if key in allowed_fields:
                if isinstance(value, str):
                    clean_exp[key] = sanitize_string(value, max_length=1000)
                elif isinstance(value, (int, float)):
                    # Validate numeric ranges
                    if key == "amount" and (value < 0 or value > 1000000):
                        continue
                    clean_exp[key] = value
                else:
                    clean_exp[key] = value
        sanitized.append(clean_exp)
    
    return sanitized