"""
Скрипт для установки разных статусов документов для тестирования
"""
import sqlite3
from datetime import datetime, timedelta
import os

DB_PATH = "./ebar.db"

def set_test_statuses():
    """Устанавливает разные статусы для документов для тестирования"""
    if not os.path.exists(DB_PATH):
        print(f"База данных {DB_PATH} не найдена.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Получаем все документы
        cursor.execute("SELECT id, document_type, document_name FROM documents")
        documents = cursor.fetchall()
        
        if not documents:
            print("Документы не найдены в базе данных.")
            return
        
        print(f"Найдено {len(documents)} документов. Устанавливаю тестовые статусы...\n")
        
        # Статусы для тестирования
        statuses = [
            'verified',           # Проверено
            'update_required',    # Обновить
            'update_by_date',     # Обновить до даты (через 30 дней)
            'update_by_date',     # Обновить до даты (через 5 дней - предупреждение)
            'invalid',            # Не действительно
        ]
        
        # Даты для тестирования
        dates = [
            None,                                    # verified - без даты
            None,                                    # update_required - без даты
            (datetime.now() + timedelta(days=30)).isoformat(),  # update_by_date - через 30 дней
            (datetime.now() + timedelta(days=5)).isoformat(),   # update_by_date - через 5 дней (предупреждение)
            None,                                    # invalid - без даты
        ]
        
        for i, (doc_id, doc_type, doc_name) in enumerate(documents):
            status_index = i % len(statuses)
            status = statuses[status_index]
            expiry_date = dates[status_index]
            
            # Обновляем статус
            cursor.execute(
                "UPDATE documents SET verification_status = ? WHERE id = ?",
                (status, doc_id)
            )
            
            # Обновляем дату окончания, если нужно
            if expiry_date:
                cursor.execute(
                    "UPDATE documents SET expiry_date = ? WHERE id = ?",
                    (expiry_date, doc_id)
                )
                print(f"✓ {doc_name} ({doc_type}): {status} до {expiry_date[:10]}")
            else:
                cursor.execute(
                    "UPDATE documents SET expiry_date = NULL WHERE id = ?",
                    (doc_id,)
                )
                print(f"✓ {doc_name} ({doc_type}): {status}")
        
        conn.commit()
        print(f"\n✓ Установлено {len(documents)} статусов для тестирования!")
        print("\nСтатусы:")
        print("  - verified: Проверено (зеленый)")
        print("  - update_required: Обновить (желтый)")
        print("  - update_by_date: Обновить до даты (желтый/оранжевый/красный)")
        print("  - invalid: Не действительно (красный)")
        print("\nПредупреждения будут показаны за неделю до окончания срока.")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Ошибка: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    set_test_statuses()





