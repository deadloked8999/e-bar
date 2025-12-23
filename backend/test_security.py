import pytest
import requests
import time
import sqlite3
import sys
from pathlib import Path

# Добавляем путь к backend для импорта модулей
sys.path.insert(0, str(Path(__file__).parent))

from auth_utils import verify_password

DATABASE_URL = "ebar.db"


@pytest.mark.order(1)
def test_registration_success(api_url, test_user_data):
    """Тест успешной регистрации нового пользователя"""
    print("\n[TEST 1] Регистрация нового пользователя...")
    
    response = requests.post(f"{api_url}/establishments", json=test_user_data)
    
    assert response.status_code == 200, f"Ожидался 200, получен {response.status_code}: {response.text}"
    
    data = response.json()
    assert "access_token" in data, "Access token не найден в ответе"
    assert "establishment" in data, "Данные заведения не найдены в ответе"
    assert data["establishment"]["username"] == test_user_data["username"]
    
    # Проверяем что пароль захеширован в БД
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM establishments WHERE id = ?", (data["establishment"]["id"],))
    db_password = cursor.fetchone()[0]
    conn.close()
    
    assert db_password != test_user_data["password"], "Пароль не захеширован в БД!"
    assert len(db_password) > 50, "Пароль не похож на bcrypt хеш"
    
    print(f"✅ test_registration_success - PASSED")
    print(f"   - Пользователь создан: {data['establishment']['username']}")
    print(f"   - Access token получен: {data['access_token'][:20]}...")
    print(f"   - Пароль захеширован в БД")


@pytest.mark.order(2)
def test_registration_duplicate_username(api_url, registered_user):
    """Тест регистрации с существующим username"""
    print("\n[TEST 2] Попытка регистрации с существующим username...")
    
    duplicate_data = {
        "name": "Another User",
        "username": registered_user["username"],  # Дубликат
        "password": "test123456",
        "email": "another@test.com",
        "business_name": "Another Business",
        "business_type": "bar",
        "position": "owner",
        "phone": "+79991234569",
        "address": "Another Address",
        "inn": "1111111111",
        "ogrn": "1111111111111"
    }
    
    response = requests.post(f"{api_url}/establishments", json=duplicate_data)
    
    assert response.status_code == 400, f"Ожидался 400, получен {response.status_code}"
    assert "already exists" in response.json()["detail"].lower() or "уже существует" in response.json()["detail"].lower()
    
    print(f"✅ test_registration_duplicate_username - PASSED")
    print(f"   - Правильно отклонена регистрация с дубликатом username")


@pytest.mark.order(3)
def test_registration_duplicate_email(api_url, registered_user):
    """Тест регистрации с существующим email"""
    print("\n[TEST 3] Попытка регистрации с существующим email...")
    
    duplicate_data = {
        "name": "Another User",
        "username": "anotheruser",
        "password": "test123456",
        "email": registered_user["email"],  # Дубликат
        "business_name": "Another Business",
        "business_type": "bar",
        "position": "owner",
        "phone": "+79991234569",
        "address": "Another Address",
        "inn": "2222222222",
        "ogrn": "2222222222222"
    }
    
    response = requests.post(f"{api_url}/establishments", json=duplicate_data)
    
    assert response.status_code == 400, f"Ожидался 400, получен {response.status_code}"
    assert "already exists" in response.json()["detail"].lower() or "уже существует" in response.json()["detail"].lower()
    
    print(f"✅ test_registration_duplicate_email - PASSED")
    print(f"   - Правильно отклонена регистрация с дубликатом email")


@pytest.mark.order(4)
def test_login_success(api_url, registered_user):
    """Тест успешного логина"""
    print("\n[TEST 4] Логин с правильными данными...")
    
    login_data = {
        "username": registered_user["username"],
        "password": registered_user["password"]
    }
    
    response = requests.post(
        f"{api_url}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 200, f"Ожидался 200, получен {response.status_code}: {response.text}"
    
    data = response.json()
    assert "access_token" in data, "Access token не найден в ответе"
    assert data["establishment"]["id"] == registered_user["establishment_id"]
    
    # Проверяем что токен валидный (можем использовать его для запроса)
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    check_response = requests.get(
        f"{api_url}/establishments/{registered_user['establishment_id']}",
        headers=headers
    )
    assert check_response.status_code == 200, "Токен невалидный"
    
    print(f"✅ test_login_success - PASSED")
    print(f"   - Логин успешен, токен получен и валиден")


@pytest.mark.order(5)
def test_login_wrong_password(api_url, registered_user):
    """Тест логина с неправильным паролем"""
    print("\n[TEST 5] Логин с неправильным паролем...")
    
    login_data = {
        "username": registered_user["username"],
        "password": "wrong_password_123"
    }
    
    response = requests.post(
        f"{api_url}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 401, f"Ожидался 401, получен {response.status_code}"
    
    print(f"✅ test_login_wrong_password - PASSED")
    print(f"   - Правильно отклонен логин с неправильным паролем")


@pytest.mark.order(6)
def test_login_nonexistent_user(api_url):
    """Тест логина с несуществующим пользователем"""
    print("\n[TEST 6] Логин с несуществующим username...")
    
    login_data = {
        "username": "nonexistent_user_12345",
        "password": "any_password"
    }
    
    response = requests.post(
        f"{api_url}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 401, f"Ожидался 401, получен {response.status_code}"
    
    print(f"✅ test_login_nonexistent_user - PASSED")
    print(f"   - Правильно отклонен логин несуществующего пользователя")


@pytest.mark.order(7)
def test_rate_limiting(api_url, registered_user):
    """Тест rate limiting на endpoint логина"""
    print("\n[TEST 7] Тест rate limiting (5 попыток в минуту)...")
    
    login_data = {
        "username": registered_user["username"],
        "password": "wrong_password"
    }
    
    # Отправляем запросы до тех пор, пока не получим 429
    # Не важно на какой попытке сработает rate limit
    rate_limit_triggered = False
    attempt = 0
    
    while not rate_limit_triggered and attempt < 10:  # Максимум 10 попыток для безопасности
        attempt += 1
        response = requests.post(
            f"{api_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 429:
            rate_limit_triggered = True
            print(f"   Попытка {attempt}: 429 (rate limit сработал) ✅")
        elif response.status_code == 401:
            print(f"   Попытка {attempt}: 401 (неправильный пароль, ожидаемо)")
        else:
            print(f"   Попытка {attempt}: {response.status_code} (неожиданный статус)")
    
    # Проверяем что rate limit сработал
    assert rate_limit_triggered, f"Rate limit не сработал после {attempt} попыток. Последний статус: {response.status_code}"
    
    # Ждем 61 секунду для сброса лимита
    print("   Ожидание 61 секунды для сброса rate limit...")
    time.sleep(61)
    
    # Проверяем что снова можно логиниться (с правильным паролем)
    correct_login = {
        "username": registered_user["username"],
        "password": registered_user["password"]
    }
    response = requests.post(
        f"{api_url}/auth/login",
        data=correct_login,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 200, f"После ожидания логин должен работать, получен статус {response.status_code}"
    assert "access_token" in response.json(), "После ожидания должен вернуться access_token"
    
    print(f"✅ test_rate_limiting - PASSED")
    print(f"   - Rate limiting работает: попытка {attempt} вернула 429")
    print(f"   - После ожидания лимит сбросился, логин работает")


@pytest.mark.order(8)
def test_protected_endpoint_without_token(api_url, registered_user):
    """Тест защищенного endpoint без токена"""
    print("\n[TEST 8] Запрос к защищенному endpoint без токена...")
    
    # PUT endpoint требует токен
    response = requests.put(
        f"{api_url}/establishments/{registered_user['establishment_id']}",
        json={"name": "Test"}
    )
    
    assert response.status_code == 401, f"Ожидался 401, получен {response.status_code}"
    
    print(f"✅ test_protected_endpoint_without_token - PASSED")
    print(f"   - Правильно отклонен запрос без токена")


@pytest.mark.order(9)
def test_protected_endpoint_with_invalid_token(api_url, registered_user):
    """Тест защищенного endpoint с невалидным токеном"""
    print("\n[TEST 9] Запрос с невалидным токеном...")
    
    headers = {"Authorization": "Bearer invalid_token_12345"}
    response = requests.get(
        f"{api_url}/establishments/{registered_user['establishment_id']}",
        headers=headers
    )
    
    assert response.status_code == 401, f"Ожидался 401, получен {response.status_code}"
    
    print(f"✅ test_protected_endpoint_with_invalid_token - PASSED")
    print(f"   - Правильно отклонен запрос с невалидным токеном")


@pytest.mark.order(10)
def test_protected_endpoint_with_valid_token(api_url, registered_user):
    """Тест защищенного endpoint с валидным токеном"""
    print("\n[TEST 10] Запрос с валидным токеном...")
    
    headers = {"Authorization": f"Bearer {registered_user['access_token']}"}
    response = requests.get(
        f"{api_url}/establishments/{registered_user['establishment_id']}",
        headers=headers
    )
    
    assert response.status_code == 200, f"Ожидался 200, получен {response.status_code}: {response.text}"
    
    data = response.json()
    assert data["id"] == registered_user["establishment_id"]
    assert data["username"] == registered_user["username"]
    
    print(f"✅ test_protected_endpoint_with_valid_token - PASSED")
    print(f"   - Успешно получены данные с валидным токеном")


@pytest.mark.order(11)
def test_access_other_user_data(api_url, registered_user, second_user):
    """Тест доступа к данным другого пользователя"""
    print("\n[TEST 11] Попытка доступа к данным другого пользователя...")
    
    # Первый пользователь пытается получить данные второго
    headers = {"Authorization": f"Bearer {registered_user['access_token']}"}
    response = requests.get(
        f"{api_url}/establishments/{second_user['establishment_id']}",
        headers=headers
    )
    
    # GET может вернуть 200 (если endpoint не защищен) или 403
    # Проверяем что хотя бы нельзя изменить чужие данные
    put_response = requests.put(
        f"{api_url}/establishments/{second_user['establishment_id']}",
        headers=headers,
        json={"name": "Hacked"}
    )
    
    assert put_response.status_code == 403, f"Ожидался 403, получен {put_response.status_code}"
    
    print(f"✅ test_access_other_user_data - PASSED")
    print(f"   - Правильно отклонена попытка изменить чужие данные (403)")


@pytest.mark.order(12)
def test_update_own_establishment(api_url, registered_user):
    """Тест обновления своего заведения"""
    print("\n[TEST 12] Обновление своего заведения...")
    
    headers = {"Authorization": f"Bearer {registered_user['access_token']}"}
    new_name = f"Updated Business {int(time.time())}"
    
    response = requests.put(
        f"{api_url}/establishments/{registered_user['establishment_id']}",
        headers=headers,
        json={"business_name": new_name}
    )
    
    assert response.status_code == 200, f"Ожидался 200, получен {response.status_code}: {response.text}"
    
    data = response.json()
    assert data["business_name"] == new_name, "Данные не обновились"
    
    print(f"✅ test_update_own_establishment - PASSED")
    print(f"   - Успешно обновлены данные своего заведения")


@pytest.mark.order(13)
def test_update_other_establishment(api_url, registered_user, second_user):
    """Тест обновления чужого заведения"""
    print("\n[TEST 13] Попытка обновить чужое заведение...")
    
    headers = {"Authorization": f"Bearer {registered_user['access_token']}"}
    response = requests.put(
        f"{api_url}/establishments/{second_user['establishment_id']}",
        headers=headers,
        json={"business_name": "Hacked Business"}
    )
    
    assert response.status_code == 403, f"Ожидался 403, получен {response.status_code}"
    
    print(f"✅ test_update_other_establishment - PASSED")
    print(f"   - Правильно отклонена попытка изменить чужое заведение (403)")


@pytest.mark.order(14)
def test_upload_document_without_token(api_url, registered_user, test_pdf_file):
    """Тест загрузки документа без токена"""
    print("\n[TEST 14] Загрузка документа без токена...")
    
    with open(test_pdf_file, "rb") as f:
        files = {"file": ("test.pdf", f, "application/pdf")}
        data = {
            "document_type": "ogrn_inn",
            "establishment_id": str(registered_user["establishment_id"])
        }
        response = requests.post(
            f"{api_url}/documents/upload",
            files=files,
            data=data
        )
    
    assert response.status_code == 401, f"Ожидался 401, получен {response.status_code}"
    
    print(f"✅ test_upload_document_without_token - PASSED")
    print(f"   - Правильно отклонена загрузка без токена")


@pytest.mark.order(15)
def test_upload_document_with_token(api_url, registered_user, test_pdf_file):
    """Тест загрузки документа с токеном"""
    print("\n[TEST 15] Загрузка документа с токеном...")
    
    headers = {"Authorization": f"Bearer {registered_user['access_token']}"}
    
    with open(test_pdf_file, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        data = {
            "document_type": "charter",
            "establishment_id": str(registered_user["establishment_id"])
        }
        response = requests.post(
            f"{api_url}/documents/upload",
            headers=headers,
            files=files,
            data=data
        )
    
    assert response.status_code == 200, f"Ожидался 200, получен {response.status_code}: {response.text}"
    
    doc_data = response.json()
    assert "id" in doc_data
    assert doc_data["document_type"] == "charter"
    
    # Cleanup
    requests.delete(
        f"{api_url}/documents/{doc_data['id']}",
        headers=headers
    )
    
    print(f"✅ test_upload_document_with_token - PASSED")
    print(f"   - Документ успешно загружен и сохранен")


@pytest.mark.order(16)
def test_upload_document_for_other_user(api_url, registered_user, second_user, test_pdf_file):
    """Тест загрузки документа для чужого пользователя"""
    print("\n[TEST 16] Попытка загрузить документ для чужого пользователя...")
    
    headers = {"Authorization": f"Bearer {registered_user['access_token']}"}
    
    with open(test_pdf_file, "rb") as f:
        files = {"file": ("test.pdf", f, "application/pdf")}
        data = {
            "document_type": "ogrn_inn",
            "establishment_id": str(second_user["establishment_id"])  # Чужой ID
        }
        response = requests.post(
            f"{api_url}/documents/upload",
            headers=headers,
            files=files,
            data=data
        )
    
    assert response.status_code == 403, f"Ожидался 403, получен {response.status_code}"
    
    print(f"✅ test_upload_document_for_other_user - PASSED")
    print(f"   - Правильно отклонена загрузка для чужого пользователя (403)")


@pytest.mark.order(17)
def test_get_documents(api_url, uploaded_document):
    """Тест получения документов"""
    print("\n[TEST 17] Получение списка документов...")
    
    headers = {"Authorization": f"Bearer {uploaded_document['access_token']}"}
    params = {"establishment_id": uploaded_document["establishment_id"]}
    
    response = requests.get(
        f"{api_url}/documents",
        headers=headers,
        params=params
    )
    
    assert response.status_code == 200, f"Ожидался 200, получен {response.status_code}: {response.text}"
    
    data = response.json()
    documents = data.get("documents", [])
    assert len(documents) > 0, "Документы не найдены"
    
    # Проверяем что наш документ в списке
    doc_ids = [doc["id"] for doc in documents]
    assert uploaded_document["document_id"] in doc_ids, "Загруженный документ не найден в списке"
    
    print(f"✅ test_get_documents - PASSED")
    print(f"   - Получено документов: {len(documents)}")
    print(f"   - Загруженный документ найден в списке")


@pytest.mark.order(18)
def test_delete_own_document(api_url, uploaded_document):
    """Тест удаления своего документа"""
    print("\n[TEST 18] Удаление своего документа...")
    
    headers = {"Authorization": f"Bearer {uploaded_document['access_token']}"}
    
    # Удаляем документ
    response = requests.delete(
        f"{api_url}/documents/{uploaded_document['document_id']}",
        headers=headers
    )
    
    assert response.status_code == 200, f"Ожидался 200, получен {response.status_code}: {response.text}"
    
    # Проверяем что документ удален
    get_response = requests.get(
        f"{api_url}/documents",
        headers=headers,
        params={"establishment_id": uploaded_document["establishment_id"]}
    )
    documents = get_response.json().get("documents", [])
    doc_ids = [doc["id"] for doc in documents]
    assert uploaded_document["document_id"] not in doc_ids, "Документ не удален"
    
    print(f"✅ test_delete_own_document - PASSED")
    print(f"   - Документ успешно удален")


@pytest.mark.order(19)
def test_delete_other_user_document(api_url, registered_user, second_user, test_pdf_file):
    """Тест удаления чужого документа"""
    print("\n[TEST 19] Попытка удалить чужой документ...")
    
    # Создаем документ для второго пользователя
    headers_second = {"Authorization": f"Bearer {second_user['access_token']}"}
    
    with open(test_pdf_file, "rb") as f:
        files = {"file": ("test.pdf", f, "application/pdf")}
        data = {
            "document_type": "ogrn_inn",
            "establishment_id": str(second_user["establishment_id"])
        }
        upload_response = requests.post(
            f"{api_url}/documents/upload",
            headers=headers_second,
            files=files,
            data=data
        )
    
    if upload_response.status_code == 200:
        doc_id = upload_response.json()["id"]
        
        # Первый пользователь пытается удалить документ второго
        headers_first = {"Authorization": f"Bearer {registered_user['access_token']}"}
        response = requests.delete(
            f"{api_url}/documents/{doc_id}",
            headers=headers_first
        )
        
        assert response.status_code == 403, f"Ожидался 403, получен {response.status_code}"
        
        # Cleanup: удаляем документ правильным пользователем
        requests.delete(
            f"{api_url}/documents/{doc_id}",
            headers=headers_second
        )
        
        print(f"✅ test_delete_other_user_document - PASSED")
        print(f"   - Правильно отклонено удаление чужого документа (403)")
    else:
        pytest.skip("Не удалось создать документ для теста")


@pytest.mark.order(20)
def test_password_hashing(api_url, registered_user):
    """Тест что пароль правильно захеширован"""
    print("\n[TEST 20] Проверка хеширования пароля...")
    
    import sqlite3
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM establishments WHERE id = ?", (registered_user["establishment_id"],))
    db_password = cursor.fetchone()[0]
    conn.close()
    
    # Проверяем что пароль не равен исходному
    assert db_password != registered_user["password"], "Пароль не захеширован!"
    
    # Проверяем что это bcrypt хеш (начинается с $2b$ или $2a$)
    assert db_password.startswith("$2"), "Пароль не похож на bcrypt хеш"
    assert len(db_password) > 50, "Пароль слишком короткий для bcrypt хеша"
    
    # Проверяем что verify_password работает
    assert verify_password(registered_user["password"], db_password), "verify_password не работает!"
    assert not verify_password("wrong_password", db_password), "verify_password принимает неправильный пароль!"
    
    print(f"✅ test_password_hashing - PASSED")
    print(f"   - Пароль захеширован в БД (bcrypt)")
    print(f"   - verify_password работает корректно")

