"""
Миграция для добавления новых колонок в таблицу documents
ВАЖНО: Не удаляет существующие данные, только добавляет колонки
"""
import sqlite3
import os

DB_PATH = "./ebar.db"

def migrate_documents_table():
    """Добавляет новые колонки в таблицу documents через ALTER TABLE"""
    if not os.path.exists(DB_PATH):
        print(f"База данных {DB_PATH} не найдена. Создайте её сначала.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Проверяем, существует ли колонка verification_status
        cursor.execute("PRAGMA table_info(documents)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'verification_status' not in columns:
            print("Добавляю колонку verification_status...")
            cursor.execute("ALTER TABLE documents ADD COLUMN verification_status TEXT DEFAULT 'verified'")
            # Обновляем существующие записи
            cursor.execute("UPDATE documents SET verification_status = 'verified' WHERE verification_status IS NULL")
            print("✓ Колонка verification_status добавлена")
        else:
            print("✓ Колонка verification_status уже существует")
        
        if 'expiry_date' not in columns:
            print("Добавляю колонку expiry_date...")
            cursor.execute("ALTER TABLE documents ADD COLUMN expiry_date DATETIME")
            print("✓ Колонка expiry_date добавлена")
        else:
            print("✓ Колонка expiry_date уже существует")
        
        conn.commit()
        print("\n✓ Миграция успешно завершена!")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Ошибка при миграции: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_documents_table()

