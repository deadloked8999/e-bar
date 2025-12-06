from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class EstablishmentCreate(BaseModel):
    # Личная информация
    name: str
    username: str
    password: str
    position: str
    phone: str
    email: EmailStr
    # Информация о заведении
    business_name: str
    business_type: str
    address: str
    inn: str
    ogrn: str


class DocumentUpload(BaseModel):
    document_group: str
    document_type: str
    document_name: str
    required: bool = False


class EstablishmentUpdate(BaseModel):
    # Личная информация
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    # Информация о заведении
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    business_phone: Optional[str] = None
    website: Optional[str] = None
    logo_path: Optional[str] = None
    address: Optional[str] = None
    inn: Optional[str] = None
    ogrn: Optional[str] = None

class EstablishmentResponse(BaseModel):
    id: int
    # Личная информация
    name: str
    username: str
    position: str
    phone: str
    email: str
    # Информация о заведении
    business_name: str
    business_type: str
    business_phone: Optional[str] = None
    website: Optional[str] = None
    logo_path: Optional[str] = None
    address: str
    inn: str
    ogrn: str
    # Статус
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: int
    establishment_id: int
    document_group: str
    document_type: str
    document_name: str
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    required: bool
    uploaded: bool
    status: str
    uploaded_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

