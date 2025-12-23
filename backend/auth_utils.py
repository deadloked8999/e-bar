import bcrypt


def hash_password(password: str) -> str:
    """
    Хеширует пароль используя bcrypt
    
    Args:
        password: Пароль в открытом виде
        
    Returns:
        Хешированный пароль (строка)
    """
    # Bcrypt ограничивает длину пароля до 72 байт
    # Обрезаем до 72 байт если нужно
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        print(f"Password truncated from {len(password.encode('utf-8'))} bytes to 72 bytes")
    
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет соответствие пароля его хешу
    
    Args:
        plain_password: Пароль в открытом виде
        hashed_password: Хешированный пароль из БД
        
    Returns:
        True если пароль совпадает, False иначе
    """
    # Bcrypt ограничивает длину пароля до 72 байт
    # Обрезаем до 72 байт если нужно (как при хешировании)
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)
