"""
Structured logging with correlation IDs for distributed tracing.
"""
import logging
import json
import sys
import uuid
from contextvars import ContextVar
from typing import Any, Dict, Optional
from datetime import datetime
from pythonjsonlogger import jsonlogger


# Context variables for correlation tracking
correlation_id_var: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)
run_id_var: ContextVar[Optional[str]] = ContextVar("run_id", default=None)
step_var: ContextVar[Optional[str]] = ContextVar("step", default=None)
agent_var: ContextVar[Optional[str]] = ContextVar("agent", default=None)


class CorrelationFilter(logging.Filter):
    """Filter to add correlation context to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.correlation_id = correlation_id_var.get()
        record.run_id = run_id_var.get()
        record.step = step_var.get()
        record.agent = agent_var.get()
        return True


class StructuredFormatter(jsonlogger.JsonFormatter):
    """JSON formatter with correlation fields."""

    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)
        
        # Add correlation fields
        log_record["correlation_id"] = getattr(record, "correlation_id", None)
        log_record["run_id"] = getattr(record, "run_id", None)
        log_record["step"] = getattr(record, "step", None)
        log_record["agent"] = getattr(record, "agent", None)
        
        # Add timestamp
        log_record["timestamp"] = datetime.utcnow().isoformat() + "Z"
        
        # Add level
        log_record["level"] = record.levelname
        
        # Add logger name
        log_record["logger"] = record.name


def setup_logging(level: str = "INFO", json_format: bool = True) -> None:
    """Configure structured logging for the application."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(CorrelationFilter())
    
    if json_format:
        formatter = StructuredFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s",
            rename_fields={"levelname": "level", "asctime": "timestamp"}
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - "
            "[correlation_id=%(correlation_id)s run_id=%(run_id)s step=%(step)s agent=%(agent)s] - %(message)s"
        )
    
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)


def set_correlation_context(
    correlation_id: Optional[str] = None,
    run_id: Optional[str] = None,
    step: Optional[str] = None,
    agent: Optional[str] = None,
) -> None:
    """Set correlation context for current execution."""
    if correlation_id:
        correlation_id_var.set(correlation_id)
    if run_id:
        run_id_var.set(run_id)
    if step:
        step_var.set(step)
    if agent:
        agent_var.set(agent)


def clear_correlation_context() -> None:
    """Clear correlation context."""
    correlation_id_var.set(None)
    run_id_var.set(None)
    step_var.set(None)
    agent_var.set(None)


def generate_correlation_id() -> str:
    """Generate a new correlation ID."""
    return str(uuid.uuid4())[:8]


class LogContext:
    """Context manager for structured logging with correlation IDs."""
    
    def __init__(
        self,
        correlation_id: Optional[str] = None,
        run_id: Optional[str] = None,
        step: Optional[str] = None,
        agent: Optional[str] = None,
    ):
        self.correlation_id = correlation_id or generate_correlation_id()
        self.run_id = run_id
        self.step = step
        self.agent = agent
        self._tokens = []
    
    def __enter__(self):
        self._tokens.append(correlation_id_var.set(self.correlation_id))
        if self.run_id:
            self._tokens.append(run_id_var.set(self.run_id))
        if self.step:
            self._tokens.append(step_var.set(self.step))
        if self.agent:
            self._tokens.append(agent_var.set(self.agent))
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        for token in reversed(self._tokens):
            try:
                if token.var is correlation_id_var:
                    correlation_id_var.reset(token)
                elif token.var is run_id_var:
                    run_id_var.reset(token)
                elif token.var is step_var:
                    step_var.reset(token)
                elif token.var is agent_var:
                    agent_var.reset(token)
            except ValueError:
                pass


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name."""
    return logging.getLogger(name)


# Initialize logging on import
setup_logging()