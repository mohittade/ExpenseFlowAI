"""
Persistent state store using Redis for workflow state management.
"""
import json
import redis
from typing import Any, Dict, Optional
from datetime import timedelta
from src.config import get_settings
import logging

logger = logging.getLogger(__name__)


class StateStore:
    """Redis-backed state store for workflow persistence."""

    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[redis.Redis] = None

    @property
    def client(self) -> redis.Redis:
        """Lazy initialization of Redis client."""
        if self._client is None:
            self._client = redis.from_url(
                self.settings.redis_url,
                max_connections=self.settings.redis_max_connections,
                decode_responses=True,
            )
        return self._client

    def _state_key(self, run_id: str) -> str:
        return f"workflow:state:{run_id}"

    def _logs_key(self, run_id: str) -> str:
        return f"workflow:logs:{run_id}"

    def _lock_key(self, run_id: str) -> str:
        return f"workflow:lock:{run_id}"

    def save_state(self, run_id: str, state: Dict[str, Any], ttl: int = 86400) -> bool:
        """Save workflow state to Redis with TTL."""
        try:
            key = self._state_key(run_id)
            self.client.setex(key, timedelta(seconds=ttl), json.dumps(state, default=str))
            logger.debug(f"Saved state for run_id: {run_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to save state for {run_id}: {e}")
            return False

    def load_state(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Load workflow state from Redis."""
        try:
            key = self._state_key(run_id)
            data = self.client.get(key)
            if data:
                logger.debug(f"Loaded state for run_id: {run_id}")
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to load state for {run_id}: {e}")
            return None

    def delete_state(self, run_id: str) -> bool:
        """Delete workflow state from Redis."""
        try:
            self.client.delete(self._state_key(run_id))
            self.client.delete(self._logs_key(run_id))
            logger.debug(f"Deleted state for run_id: {run_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete state for {run_id}: {e}")
            return False

    def append_log(self, run_id: str, log_entry: Dict[str, Any]) -> bool:
        """Append log entry to workflow logs."""
        try:
            key = self._logs_key(run_id)
            self.client.rpush(key, json.dumps(log_entry, default=str))
            self.client.expire(key, 86400)
            return True
        except Exception as e:
            logger.error(f"Failed to append log for {run_id}: {e}")
            return False

    def get_logs(self, run_id: str, limit: int = 100) -> list:
        """Get workflow logs."""
        try:
            key = self._logs_key(run_id)
            logs = self.client.lrange(key, -limit, -1)
            return [json.loads(log) for log in logs]
        except Exception as e:
            logger.error(f"Failed to get logs for {run_id}: {e}")
            return []

    def acquire_lock(self, run_id: str, timeout: int = 30) -> bool:
        """Acquire distributed lock for workflow."""
        key = self._lock_key(run_id)
        return self.client.set(key, "locked", nx=True, ex=timeout)

    def release_lock(self, run_id: str) -> bool:
        """Release distributed lock."""
        key = self._lock_key(run_id)
        return self.client.delete(key) > 0

    def health_check(self) -> bool:
        """Check Redis connectivity."""
        try:
            return self.client.ping()
        except Exception:
            return False

    def close(self):
        """Close Redis connection."""
        if self._client:
            self._client.close()
            self._client = None


_state_store: Optional[StateStore] = None


def get_state_store() -> StateStore:
    """Get singleton state store instance."""
    global _state_store
    if _state_store is None:
        _state_store = StateStore()
    return _state_store