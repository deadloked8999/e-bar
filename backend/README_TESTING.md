# Руководство по тестированию безопасности

## Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

## Запуск тестов

### Запуск всех тестов:
```bash
pytest test_security.py -v
```

### Запуск с подробным выводом:
```bash
pytest test_security.py -v -s
```

### Запуск конкретного теста:
```bash
pytest test_security.py::test_registration_success -v
```

### Запуск с отчетом:
```bash
pytest test_security.py -v --tb=short
```

## Структура тестов

Тесты выполняются в определенном порядке (используя `@pytest.mark.order`):

1. **test_registration_success** - Регистрация нового пользователя
2. **test_registration_duplicate_username** - Дубликат username
3. **test_registration_duplicate_email** - Дубликат email
4. **test_login_success** - Успешный логин
5. **test_login_wrong_password** - Неправильный пароль
6. **test_login_nonexistent_user** - Несуществующий пользователь
7. **test_rate_limiting** - Rate limiting (может занять ~60 секунд)
8. **test_protected_endpoint_without_token** - Запрос без токена
9. **test_protected_endpoint_with_invalid_token** - Невалидный токен
10. **test_protected_endpoint_with_valid_token** - Валидный токен
11. **test_access_other_user_data** - Доступ к чужим данным
12. **test_update_own_establishment** - Обновление своих данных
13. **test_update_other_establishment** - Обновление чужих данных
14. **test_upload_document_without_token** - Загрузка без токена
15. **test_upload_document_with_token** - Загрузка с токеном
16. **test_upload_document_for_other_user** - Загрузка для чужого пользователя
17. **test_get_documents** - Получение документов
18. **test_delete_own_document** - Удаление своего документа
19. **test_delete_other_user_document** - Удаление чужого документа
20. **test_password_hashing** - Проверка хеширования пароля

## Требования

- Backend сервер должен быть запущен на `http://localhost:8000`
- База данных должна быть доступна (файл `ebar.db` в папке `backend/`)

## Очистка данных

Тесты автоматически очищают созданные данные после выполнения:
- Тестовые пользователи удаляются из БД
- Тестовые документы удаляются
- Временные файлы удаляются

## Пример вывода

```
[TEST 1] Регистрация нового пользователя...
✅ test_registration_success - PASSED
   - Пользователь создан: testuser_1234567890
   - Access token получен: eyJhbGciOiJIUzI1NiIs...
   - Пароль захеширован в БД

[TEST 2] Попытка регистрации с существующим username...
✅ test_registration_duplicate_username - PASSED
   - Правильно отклонена регистрация с дубликатом username

...

==========================================
Total: 20 tests
Passed: 20
Failed: 0
Duration: 65.23 seconds
==========================================
```

## Устранение проблем

### Ошибка подключения к серверу
- Убедитесь что backend запущен: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### Ошибка подключения к БД
- Убедитесь что файл `ebar.db` существует в папке `backend/`

### Rate limiting тест не проходит
- Тест ждет 61 секунду, это нормально
- Убедитесь что rate limiting настроен на 5 попыток в минуту

### Ошибки очистки данных
- Тесты автоматически очищают данные, но если что-то пошло не так, можно вручную удалить тестовых пользователей из БД

