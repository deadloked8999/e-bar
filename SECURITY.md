# Система безопасности E-Bar

## Содержание

1. [Обзор](#обзор)
2. [Хеширование паролей](#хеширование-паролей)
3. [JWT авторизация](#jwt-авторизация)
4. [Защита endpoints](#защита-endpoints)
5. [Rate Limiting](#rate-limiting)
6. [CORS настройки](#cors-настройки)
7. [Frontend безопасность](#frontend-безопасность)
8. [Тестирование безопасности](#тестирование-безопасности)
9. [Рекомендации для продакшена](#рекомендации-для-продакшена)

---

## Обзор

Система безопасности E-Bar включает:

- ✅ **Хеширование паролей** с использованием bcrypt
- ✅ **JWT токены** для авторизации
- ✅ **Защита критичных endpoints** с проверкой прав доступа
- ✅ **Rate limiting** для защиты от брутфорс-атак
- ✅ **CORS настройки** для контроля доступа
- ✅ **Автоматический logout** при истечении токена
- ✅ **Проверка прав доступа** (пользователь может изменять только свои данные)

---

## Хеширование паролей

### Реализация

Пароли хешируются с использованием библиотеки `bcrypt` перед сохранением в базу данных.

**Файл:** `backend/auth_utils.py`

```python
import bcrypt

def hash_password(password: str) -> str:
    """Хеширует пароль используя bcrypt"""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]  # Bcrypt ограничение
    
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет соответствие пароля его хешу"""
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)
```

### Как это работает

1. **При регистрации:**
   - Пароль пользователя хешируется через `hash_password()`
   - В БД сохраняется только хеш, никогда не сохраняется открытый пароль

2. **При логине:**
   - Введенный пароль проверяется через `verify_password()`
   - Сравнивается хеш введенного пароля с хешем из БД
   - Если совпадают - доступ разрешен

3. **Особенности:**
   - Bcrypt автоматически генерирует уникальную соль для каждого пароля
   - Пароли длиннее 72 байт обрезаются (ограничение bcrypt)
   - Хеширование занимает время, что защищает от брутфорса

### Где используется

- `POST /api/establishments` - регистрация нового пользователя
- `POST /api/auth/login` - проверка пароля при входе

---

## JWT авторизация

### Реализация

Система использует JSON Web Tokens (JWT) для авторизации пользователей.

**Файл:** `backend/auth.py`

```python
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

def create_access_token(establishment_id: int) -> str:
    """Создает JWT токен для пользователя"""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(establishment_id),  # ID пользователя
        "exp": expire,                 # Время истечения
        "iat": datetime.utcnow()      # Время создания
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_establishment(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Establishment:
    """Проверяет JWT токен и возвращает текущего пользователя"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        establishment_id = payload.get("sub")
        # ... проверки и поиск пользователя в БД
    except JWTError:
        raise HTTPException(401, "Could not validate credentials")
```

### Как это работает

1. **Создание токена:**
   - При успешном логине/регистрации создается JWT токен
   - Токен содержит ID пользователя (`sub`), время создания (`iat`) и истечения (`exp`)
   - Токен подписывается секретным ключом (`SECRET_KEY`)

2. **Использование токена:**
   - Токен отправляется в заголовке `Authorization: Bearer {token}`
   - Frontend автоматически добавляет токен ко всем запросам через Axios interceptor
   - Backend проверяет токен через `get_current_establishment()` dependency

3. **Проверка токена:**
   - Декодируется токен с проверкой подписи
   - Проверяется время истечения (`exp`)
   - Извлекается ID пользователя и проверяется существование в БД
   - При любой ошибке возвращается 401 Unauthorized

4. **Срок жизни токена:**
   - Текущая настройка: **7 дней** (для тестирования)
   - В продакшене рекомендуется: **15-30 минут** для access token

### Где используется

- `POST /api/auth/login` - возвращает токен после успешного входа
- `POST /api/establishments` - возвращает токен после регистрации
- Все защищенные endpoints используют `Depends(get_current_establishment)`

---

## Защита endpoints

### Защищенные endpoints

Следующие endpoints требуют JWT авторизации:

1. `GET /api/establishments/{id}` - получение данных заведения
2. `PUT /api/establishments/{id}` - обновление данных заведения
3. `POST /api/documents/upload` - загрузка документа
4. `DELETE /api/documents/{doc_id}` - удаление документа
5. `POST /api/establishments/{id}/logo` - загрузка логотипа
6. `DELETE /api/establishments/{id}/documents/{document_id}` - удаление документа заведения

### Проверка прав доступа

Каждый защищенный endpoint проверяет, что пользователь может изменять только свои данные:

```python
@app.put("/api/establishments/{establishment_id}")
async def update_establishment(
    establishment_id: int,
    current_establishment: Establishment = Depends(get_current_establishment),
    ...
):
    # Проверка: пользователь может изменять только свои данные
    if current_establishment.id != establishment_id:
        raise HTTPException(
            status_code=403,
            detail="You can only modify your own establishment data"
        )
    # ... обновление данных
```

### Коды ответов

- **401 Unauthorized** - токен отсутствует, невалиден или истек
- **403 Forbidden** - токен валиден, но пользователь пытается изменить чужие данные
- **200 OK** - запрос успешен, пользователь имеет права

---

## Rate Limiting

### Реализация

Rate limiting защищает endpoint логина от брутфорс-атак.

**Файл:** `backend/main.py`

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Слишком много попыток входа. Попробуйте через минуту"}
    )

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(...):
    # ... логика входа
```

### Как это работает

1. **Лимит:** 5 попыток входа в минуту с одного IP адреса
2. **Отслеживание:** Используется IP адрес клиента (`get_remote_address`)
3. **При превышении:** Возвращается 429 Too Many Requests
4. **Сброс:** Лимит сбрасывается через 1 минуту

### Защищенные endpoints

- `POST /api/auth/login` - 5 попыток в минуту

---

## CORS настройки

### Реализация

CORS (Cross-Origin Resource Sharing) настроен для контроля доступа к API.

**Файл:** `backend/main.py`

```python
from fastapi.middleware.cors import CORSMiddleware
import os

# Читаем разрешенные origins из переменных окружения
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Как это работает

1. **Разрешенные origins:** Читаются из переменной окружения `ALLOWED_ORIGINS`
2. **По умолчанию:** `http://localhost:5173,http://localhost:3000` (для разработки)
3. **В продакшене:** Указываются конкретные домены через `.env` файл

### Настройка

Создайте файл `backend/.env`:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECRET_KEY=your-strong-secret-key-here
```

---

## Frontend безопасность

### Хранение токена

Токен сохраняется в `localStorage` после успешного логина/регистрации:

```typescript
// frontend/src/api/auth.ts
if (response.data.access_token) {
  localStorage.setItem('access_token', response.data.access_token)
}
```

### Автоматическое добавление токена

Axios interceptor автоматически добавляет токен ко всем запросам:

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Автоматический logout

При получении 401 Unauthorized автоматически выполняется logout:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Очищаем все данные
      localStorage.removeItem('access_token')
      localStorage.removeItem('establishmentId')
      localStorage.removeItem('pendingRegistrationData')
      localStorage.removeItem('rememberedUsername')
      localStorage.removeItem('rememberMe')
      
      // Перенаправляем на страницу логина
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)
```

### Обработка ошибок

Frontend обрабатывает различные HTTP ошибки:

- **401 Unauthorized** - автоматический logout и редирект
- **403 Forbidden** - показ сообщения о недостатке прав
- **404 Not Found** - показ сообщения о ненайденном ресурсе
- **429 Too Many Requests** - показ сообщения о превышении лимита
- **500+ Server Error** - показ сообщения об ошибке сервера

---

## Тестирование безопасности

### Автоматические тесты

Создан полный набор автоматических тестов безопасности.

**Файл:** `backend/test_security.py`

**Запуск тестов:**

```bash
cd backend
pip install -r requirements.txt
python -m pytest test_security.py -v -s
```

### Покрытие тестами

1. ✅ **Регистрация** - успешная регистрация, дубликаты username/email
2. ✅ **Логин** - успешный логин, неправильный пароль, несуществующий пользователь
3. ✅ **Rate limiting** - проверка срабатывания лимита и сброса
4. ✅ **Защищенные endpoints** - без токена, с невалидным токеном, с валидным токеном
5. ✅ **Проверка прав доступа** - доступ к чужим данным (403)
6. ✅ **Обновление данных** - своих данных (200), чужих данных (403)
7. ✅ **Загрузка документов** - без токена (401), с токеном (200), для чужого пользователя (403)
8. ✅ **Удаление документов** - своих документов (200), чужих документов (403)
9. ✅ **Хеширование паролей** - проверка что пароль захеширован в БД

### Ручное тестирование

#### Тест JWT авторизации

```bash
# 1. Регистрация
curl -X POST http://localhost:8000/api/establishments \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123",...}'

# 2. Логин (получить токен)
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=test&password=test123"

# 3. Запрос с токеном
curl -X GET http://localhost:8000/api/establishments/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. Запрос без токена (должен вернуть 401)
curl -X GET http://localhost:8000/api/establishments/1

# 5. Запрос с невалидным токеном (должен вернуть 401)
curl -X GET http://localhost:8000/api/establishments/1 \
  -H "Authorization: Bearer invalid_token_12345"
```

#### Тест Rate Limiting

```bash
# Отправить 6 запросов подряд (6-й должен вернуть 429)
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -d "username=test&password=wrong"
  echo ""
done
```

#### Тест проверки прав доступа

```bash
# 1. Создать двух пользователей (user1 и user2)
# 2. Получить токен user1
# 3. Попытаться изменить данные user2 (должен вернуть 403)
curl -X PUT http://localhost:8000/api/establishments/2 \
  -H "Authorization: Bearer USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}'
```

---

## Рекомендации для продакшена

### 1. Секретный ключ JWT

**❌ НЕ ДЕЛАЙТЕ:**
```python
SECRET_KEY = "your-secret-key-change-in-production"  # Слабая константа
```

**✅ ДЕЛАЙТЕ:**
```python
# Генерация сильного ключа:
# python -c "import secrets; print(secrets.token_urlsafe(32))"

# В .env файле:
SECRET_KEY=your-very-strong-random-secret-key-minimum-32-characters
```

### 2. Срок жизни токена

**Текущая настройка (для тестирования):**
```python
ACCESS_TOKEN_EXPIRE_DAYS = 7  # 7 дней
```

**Рекомендация для продакшена:**
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # 15 минут для access token
```

**Дополнительно:** Реализовать refresh tokens для долгоживущих сессий.

### 3. HTTPS обязателен

- Все запросы должны идти через HTTPS
- Токены передаются в заголовках, но HTTPS защищает от перехвата
- Настройте SSL/TLS сертификаты

### 4. CORS настройки

**❌ НЕ ДЕЛАЙТЕ:**
```python
allow_origins=["*"]  # Разрешает все домены
```

**✅ ДЕЛАЙТЕ:**
```env
# В .env файле укажите конкретные домены:
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 5. Rate Limiting

**Текущая настройка:**
```python
@limiter.limit("5/minute")  # 5 попыток в минуту
```

**Рекомендации:**
- Для продакшена можно увеличить до 10-15 попыток в минуту
- Добавить более строгий лимит после нескольких неудачных попыток
- Рассмотреть блокировку IP после N неудачных попыток

### 6. Хранение токенов на фронтенде

**Текущая реализация:**
- Токены хранятся в `localStorage`

**Альтернативы:**
- `sessionStorage` - токен удаляется при закрытии вкладки
- `httpOnly` cookies - защита от XSS (требует настройки на бэкенде)

**Рекомендация:** Для продакшена рассмотреть использование `httpOnly` cookies.

### 7. Логирование

**Добавьте логирование:**
- Неудачные попытки входа
- Попытки доступа к чужим данным (403)
- Превышение rate limit (429)
- Невалидные токены (401)

**Пример:**
```python
import logging

logger = logging.getLogger(__name__)

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(...):
    if not verify_password(password, establishment.password):
        logger.warning(f"Failed login attempt for username: {username}")
        raise HTTPException(401, "Invalid credentials")
```

### 8. Валидация входных данных

**Убедитесь что:**
- Все входные данные валидируются через Pydantic схемы
- Проверяется длина пароля (минимум 8 символов)
- Проверяется сложность пароля (буквы, цифры, спецсимволы)
- Email валидируется на корректный формат

### 9. Защита от SQL Injection

**Текущая реализация:**
- Используется SQLAlchemy ORM, который защищает от SQL injection
- Все запросы используют параметризованные запросы

**Рекомендация:** Продолжайте использовать ORM, избегайте raw SQL запросов.

### 10. Защита от XSS

**На фронтенде:**
- React автоматически экранирует данные
- Не используйте `dangerouslySetInnerHTML` без санитизации

**Рекомендация:** Используйте библиотеки для санитизации HTML (например, `DOMPurify`).

### 11. Мониторинг и алерты

**Настройте:**
- Мониторинг количества неудачных попыток входа
- Алерты при подозрительной активности
- Логирование всех критичных операций

### 12. Резервное копирование

**Обеспечьте:**
- Регулярное резервное копирование базы данных
- Шифрование резервных копий
- Тестирование восстановления из резервных копий

---

## Чеклист безопасности

Перед деплоем в продакшен проверьте:

- [ ] `SECRET_KEY` установлен в переменных окружения (не в коде)
- [ ] `SECRET_KEY` достаточно длинный и случайный (минимум 32 символа)
- [ ] `ALLOWED_ORIGINS` содержит только разрешенные домены
- [ ] Срок жизни токена уменьшен (15-30 минут вместо 7 дней)
- [ ] HTTPS настроен и работает
- [ ] Rate limiting настроен адекватно
- [ ] Логирование критичных событий включено
- [ ] Валидация входных данных работает
- [ ] Тесты безопасности проходят успешно
- [ ] Резервное копирование настроено
- [ ] Мониторинг и алерты настроены

---

## Контакты

При обнаружении уязвимостей безопасности, пожалуйста, сообщите об этом ответственным лицам.

---

**Последнее обновление:** 2025

