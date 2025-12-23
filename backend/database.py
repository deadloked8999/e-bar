from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./ebar.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Establishment(Base):
    __tablename__ = "establishments"

    id = Column(Integer, primary_key=True, index=True)
    # Личная информация
    name = Column(String, nullable=False)  # Имя пользователя
    username = Column(String, nullable=False, unique=True, index=True)  # Логин
    password = Column(String, nullable=False)  # Пароль (в продакшене должен быть хеширован)
    position = Column(String, nullable=False)  # Должность
    phone = Column(String, nullable=False)  # Телефон
    email = Column(String, nullable=False, unique=True, index=True)  # Email
    # Информация о заведении
    business_name = Column(String, nullable=False)  # Название заведения
    business_type = Column(String, nullable=False)  # bar, restaurant, club, hotel, other
    business_phone = Column(String, nullable=True)  # Телефон заведения
    website = Column(String, nullable=True)  # Сайт заведения
    logo_path = Column(String, nullable=True)  # Путь к логотипу компании (не используется)
    address = Column(String, nullable=False)  # Адрес заведения
    inn = Column(String, nullable=False)  # ИНН
    ogrn = Column(String, nullable=False)  # ОГРН
    # Статус
    status = Column(String, default="pending")  # pending, verified, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = relationship("Document", back_populates="establishment")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    establishment_id = Column(Integer, ForeignKey("establishments.id"))
    document_group = Column(String, nullable=False)  # founding, licenses, financial, additional
    document_type = Column(String, nullable=False)  # charter, registration, inn, etc.
    document_name = Column(String, nullable=False)
    file_path = Column(String)
    file_name = Column(String)
    required = Column(Boolean, default=False)
    uploaded = Column(Boolean, default=False)
    status = Column(String, default="pending")  # pending, verified, rejected
    verification_status = Column(String, default="verified")  # verified, update_required, update_by_date, invalid
    expiry_date = Column(DateTime, nullable=True)  # Дата окончания действия документа
    uploaded_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    establishment = relationship("Establishment", back_populates="documents")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, nullable=False, unique=True, index=True)  # Уникальный токен (6 цифр или UUID)
    establishment_id = Column(Integer, ForeignKey("establishments.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)  # Токен живет 1 час
    used = Column(Boolean, default=False, nullable=False)  # Использован ли токен

    establishment = relationship("Establishment")


# Создаем таблицы при импорте
def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

