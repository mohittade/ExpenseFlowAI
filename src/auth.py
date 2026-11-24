"""
Authentication and authorization for ExpenseFlow AI API.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from src.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    scopes: list[str] = []


class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: bool = False
    scopes: list[str] = []


class UserInDB(User):
    hashed_password: str


# Mock user database - replace with real DB in production
USERS_DB: Dict[str, UserInDB] = {}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "access":
            return None
        username: str = payload.get("sub")
        scopes: list[str] = payload.get("scopes", [])
        if username is None:
            return None
        return TokenData(username=username, scopes=scopes)
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            return None
        return payload.get("sub")
    except JWTError:
        return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = decode_token(token)
    if token_data is None or token_data.username is None:
        raise credentials_exception
    user = USERS_DB.get(token_data.username)
    if user is None:
        raise credentials_exception
    return User(**user.model_dump())


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_scopes(required_scopes: list[str]):
    """Dependency factory for scope-based authorization."""
    async def scope_checker(current_user: User = Depends(get_current_active_user)) -> User:
        for scope in required_scopes:
            if scope not in current_user.scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required scope: {scope}",
                )
        return current_user
    return scope_checker


# Scopes
SCOPE_READ = "read"
SCOPE_WRITE = "write"
SCOPE_ADMIN = "admin"
SCOPE_APPROVE = "approve"


def create_user(username: str, password: str, email: str = "", full_name: str = "", scopes: list[str] = None) -> UserInDB:
    """Create a new user (for testing/setup)."""
    if scopes is None:
        scopes = [SCOPE_READ, SCOPE_WRITE]
    hashed_password = get_password_hash(password)
    user = UserInDB(
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=hashed_password,
        scopes=scopes,
    )
    USERS_DB[username] = user
    return user


# Initialize with a default admin user
def init_default_users():
    """Create default users for development."""
    if not USERS_DB:
        create_user(
            username="admin",
            password="admin123",
            email="admin@company.com",
            full_name="Admin User",
            scopes=[SCOPE_READ, SCOPE_WRITE, SCOPE_ADMIN, SCOPE_APPROVE]
        )
        create_user(
            username="mohit.tade",
            password="mohit123",
            email="mohit.tade@company.com",
            full_name="Mohit Tade",
            scopes=[SCOPE_READ, SCOPE_WRITE, SCOPE_ADMIN, SCOPE_APPROVE]
        )
        create_user(
            username="employee",
            password="employee123",
            email="employee@company.com",
            full_name="Employee User",
            scopes=[SCOPE_READ, SCOPE_WRITE]
        )
        create_user(
            username="finance",
            password="finance123",
            email="finance@company.com",
            full_name="Finance User",
            scopes=[SCOPE_READ, SCOPE_WRITE, SCOPE_APPROVE]
        )


init_default_users()