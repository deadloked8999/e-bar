import pytest
import requests
import os
import time
import sqlite3
from pathlib import Path

BASE_URL = "http://localhost:8000/api"
DATABASE_URL = "ebar.db"


@pytest.fixture(scope="session")
def base_url():
    """Базовый URL API"""
    return BASE_URL


@pytest.fixture(scope="session")
def api_url(base_url):
    """URL для API запросов"""
    return base_url


@pytest.fixture(scope="function")
def test_user_data():
    """Данные для тестового пользователя"""
    timestamp = int(time.time())
    return {
        "name": f"Test User {timestamp}",
        "username": f"testuser_{timestamp}",
        "password": "test123456",
        "email": f"test_{timestamp}@test.com",
        "business_name": f"Test Business {timestamp}",
        "business_type": "bar",
        "position": "owner",
        "phone": "+79991234567",
        "address": "Test Address",
        "inn": f"123456789{timestamp % 10000:04d}",
        "ogrn": f"123456789012{timestamp % 1000:03d}"
    }


@pytest.fixture(scope="function")
def registered_user(api_url, test_user_data):
    """Создает зарегистрированного пользователя и возвращает его данные"""
    response = requests.post(f"{api_url}/establishments", json=test_user_data)
    
    if response.status_code == 200:
        data = response.json()
        user_data = {
            "establishment_id": data["establishment"]["id"],
            "access_token": data["access_token"],
            "username": test_user_data["username"],
            "password": test_user_data["password"],
            "email": test_user_data["email"]
        }
        yield user_data
        
        # Cleanup: удаляем тестового пользователя из БД
        try:
            conn = sqlite3.connect(DATABASE_URL)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM establishments WHERE id = ?", (user_data["establishment_id"],))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Ошибка при очистке тестового пользователя: {e}")
    else:
        pytest.fail(f"Не удалось создать тестового пользователя: {response.text}")


@pytest.fixture(scope="function")
def second_user(api_url):
    """Создает второго пользователя для тестов доступа"""
    timestamp = int(time.time())
    user_data = {
        "name": f"Second User {timestamp}",
        "username": f"seconduser_{timestamp}",
        "password": "test123456",
        "email": f"second_{timestamp}@test.com",
        "business_name": f"Second Business {timestamp}",
        "business_type": "restaurant",
        "position": "manager",
        "phone": "+79991234568",
        "address": "Second Address",
        "inn": f"987654321{timestamp % 10000:04d}",
        "ogrn": f"987654321098{timestamp % 1000:03d}"
    }
    
    response = requests.post(f"{api_url}/establishments", json=user_data)
    
    if response.status_code == 200:
        data = response.json()
        user_info = {
            "establishment_id": data["establishment"]["id"],
            "access_token": data["access_token"],
            "username": user_data["username"]
        }
        yield user_info
        
        # Cleanup
        try:
            conn = sqlite3.connect(DATABASE_URL)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM establishments WHERE id = ?", (user_info["establishment_id"],))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Ошибка при очистке второго пользователя: {e}")
    else:
        pytest.fail(f"Не удалось создать второго пользователя: {response.text}")


@pytest.fixture(scope="function")
def test_pdf_file():
    """Создает тестовый PDF файл"""
    # Минимальный валидный PDF
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Size 1\n>>\nstartxref\n9\n%%EOF"
    
    test_file_path = "test_document.pdf"
    with open(test_file_path, "wb") as f:
        f.write(pdf_content)
    
    yield test_file_path
    
    # Cleanup
    if os.path.exists(test_file_path):
        try:
            os.remove(test_file_path)
        except:
            pass


@pytest.fixture(scope="function")
def uploaded_document(api_url, registered_user, test_pdf_file):
    """Создает загруженный документ для тестов"""
    headers = {"Authorization": f"Bearer {registered_user['access_token']}"}
    
    with open(test_pdf_file, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        data = {
            "document_type": "ogrn_inn",
            "establishment_id": str(registered_user["establishment_id"])
        }
        response = requests.post(
            f"{api_url}/documents/upload",
            headers=headers,
            files=files,
            data=data
        )
    
    if response.status_code == 200:
        doc_data = response.json()
        doc_info = {
            "document_id": doc_data["id"],
            "establishment_id": registered_user["establishment_id"],
            "access_token": registered_user["access_token"]
        }
        yield doc_info
        
        # Cleanup: удаляем документ и файл
        try:
            headers = {"Authorization": f"Bearer {registered_user['access_token']}"}
            delete_response = requests.delete(
                f"{api_url}/documents/{doc_data['id']}",
                headers=headers
            )
            # Также удаляем файл из uploads если он существует
            if doc_data.get("file_path") and os.path.exists(doc_data["file_path"]):
                try:
                    os.remove(doc_data["file_path"])
                except:
                    pass
        except Exception as e:
            print(f"Ошибка при очистке документа: {e}")
    else:
        pytest.fail(f"Не удалось загрузить тестовый документ: {response.text}")

