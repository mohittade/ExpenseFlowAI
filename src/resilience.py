"""
Resilience patterns: retry, circuit breaker, and timeout handling.
"""
import asyncio
import logging
from functools import wraps
from typing import Callable, Any, TypeVar, Optional
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
    after_log,
)
from src.config import get_settings

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


class CircuitBreaker:
    """Circuit breaker implementation for external service calls."""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 30,
        expected_exception: type = Exception,
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.state = "closed"  # closed, open, half-open

    def call(self, func: Callable[..., Any], *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection."""
        if self.state == "open":
            if self._should_attempt_reset():
                self.state = "half-open"
                logger.info("Circuit breaker entering half-open state")
            else:
                raise CircuitBreakerOpenError("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise

    async def acall(self, func: Callable[..., Any], *args, **kwargs) -> Any:
        """Execute async function with circuit breaker protection."""
        if self.state == "open":
            if self._should_attempt_reset():
                self.state = "half-open"
                logger.info("Circuit breaker entering half-open state")
            else:
                raise CircuitBreakerOpenError("Circuit breaker is open")

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise

    def _should_attempt_reset(self) -> bool:
        import time
        if self.last_failure_time is None:
            return True
        return (time.time() - self.last_failure_time) >= self.recovery_timeout

    def _on_success(self):
        self.failure_count = 0
        self.state = "closed"

    def _on_failure(self):
        import time
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            logger.warning(f"Circuit breaker opened after {self.failure_count} failures")


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open."""
    pass


def get_llm_retry_decorator():
    """Get retry decorator configured for LLM calls."""
    settings = get_settings()
    return retry(
        stop=stop_after_attempt(settings.llm_max_retries),
        wait=wait_exponential(
            multiplier=1,
            min=settings.llm_retry_min_wait,
            max=settings.llm_retry_max_wait,
        ),
        retry=retry_if_exception_type((Exception,)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        after=after_log(logger, logging.INFO),
    )


def with_timeout(timeout_seconds: float):
    """Decorator to add timeout to async functions."""
    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=timeout_seconds)
            except asyncio.TimeoutError:
                logger.error(f"Function {func.__name__} timed out after {timeout_seconds}s")
                raise
        return wrapper  # type: ignore
    return decorator


# Global circuit breakers for different services
llm_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=30,
    expected_exception=Exception,
)

db_circuit_breaker = CircuitBreaker(
    failure_threshold=3,
    recovery_timeout=60,
    expected_exception=Exception,
)

email_circuit_breaker = CircuitBreaker(
    failure_threshold=3,
    recovery_timeout=120,
    expected_exception=Exception,
)