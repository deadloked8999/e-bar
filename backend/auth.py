from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db, Establishment

# Секретный ключ для подписи JWT (в продакшене должен быть в переменных окружения)
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Срок жизни токена - 7 дней для тестирования
ACCESS_TOKEN_EXPIRE_DAYS = 7

# OAuth2 схема для получения токена из заголовка Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(establishment_id: int) -> str:
    """
    Создает JWT токен для пользователя
    
    Args:
        establishment_id: ID заведения
        
    Returns:
        JWT токен в виде строки
    """
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(establishment_id),  # subject - ID пользователя
        "exp": expire,  # expiration time
        "iat": datetime.utcnow()  # issued at
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_establishment(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Establishment:
    """
    Проверяет JWT токен и возвращает текущего пользователя
    
    Args:
        token: JWT токен из заголовка Authorization
        db: Сессия базы данных
        
    Returns:
        Объект Establishment текущего пользователя
        
    Raises:
        HTTPException: Если токен невалиден или пользователь не найден
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        establishment_id: str = payload.get("sub")
        if establishment_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    establishment = db.query(Establishment).filter(
        Establishment.id == int(establishment_id)
    ).first()
    
    if establishment is None:
        raise credentials_exception
    
    return establishment

