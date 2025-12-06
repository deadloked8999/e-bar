from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Optional, List
import os
import shutil
from datetime import datetime
import uuid
from pydantic import BaseModel
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db, Establishment, Document, init_db
from schemas import EstablishmentCreate, EstablishmentResponse, EstablishmentUpdate, DocumentResponse

# Инициализируем БД при запуске
init_db()

# Вспомогательная функция для преобразования SQLAlchemy объекта в Pydantic модель
def document_to_response(doc: Document) -> DocumentResponse:
    """Преобразует SQLAlchemy Document в Pydantic DocumentResponse"""
    # Используем model_validate с from_attributes=True для Pydantic v2
    try:
        return DocumentResponse.model_validate(doc, from_attributes=True)
    except Exception as e:
        # Если model_validate не работает, создаем вручную
        print(f"model_validate failed: {e}, creating manually")
        return DocumentResponse(
            id=doc.id,
            establishment_id=doc.establishment_id,
            document_group=doc.document_group,
            document_type=doc.document_type,
            document_name=doc.document_name,
            file_name=doc.file_name,
            file_path=doc.file_path,
            required=doc.required,
            uploaded=doc.uploaded,
            status=doc.status,
            uploaded_at=doc.uploaded_at,
            created_at=doc.created_at
        )

app = FastAPI(title="E-Bar Document Management System")

# Обработчик ошибок валидации
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("=" * 50)
    print("VALIDATION ERROR:")
    print(f"Request URL: {request.url}")
    print(f"Request method: {request.method}")
    print(f"Validation errors: {exc.errors()}")
    print(f"Request body: {await request.body()}")
    print("=" * 50)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(await request.body())}
    )

# CORS для локальной разработки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем папку для хранения документов
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "logos"), exist_ok=True)
print(f"Upload directory: {UPLOAD_DIR}")

# Монтируем статические файлы для доступа к загруженным файлам
from fastapi.staticfiles import StaticFiles
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

class DocumentStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class DocumentType(str, Enum):
    # Блок 1 - Юр. лицо
    OGRN_INN = "ogrn_inn"
    CHARTER = "charter"
    REGISTRATION_CERTIFICATE = "registration_certificate"
    EGRYUL_EXTRACT = "egryul_extract"
    AUTHORIZED_CAPITAL = "authorized_capital"
    OKVED = "okved"
    PASSPORT_POWER_OF_ATTORNEY = "passport_power_of_attorney"
    GENERAL_DIRECTOR_APPOINTMENT = "general_director_appointment"
    COMPANY_CARD = "company_card"
    
    # Блок 2 - Алкогольная деятельность
    ALCOHOL_LICENSE = "alcohol_license"
    LEASE_OWNERSHIP = "lease_ownership"
    EGAIS = "egais"
    
    # Блок 3 - Помещения и требования
    MCHS_CONCLUSION = "mchs_conclusion"
    ROSPOTREBNADZOR_CONCLUSION = "rospotrebnadzor_conclusion"
    
    # Блок 4 - Финансы и отчетность
    KKT_REGISTRATION = "kkt_registration"
    BANK_DETAILS = "bank_details"
    FNS_CERTIFICATE = "fns_certificate"

# Хранилище документов теперь в БД (documents_storage удалено)
# DocumentResponse импортируется из schemas.py

@app.get("/")
async def root():
    return {"message": "E-Bar Document Management System API", "version": "1.0"}

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    establishment_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Загрузка документа"""
    try:
        print("=" * 50)
        print("DOCUMENT UPLOAD REQUEST:")
        print(f"Filename: {file.filename}")
        print(f"Document type: {document_type}")
        print(f"Establishment ID: {establishment_id}")
        print("=" * 50)
        
        # Проверяем существование заведения
        establishment = db.query(Establishment).filter(Establishment.id == establishment_id).first()
        if not establishment:
            print(f"ERROR: Establishment with ID {establishment_id} not found in database")
            raise HTTPException(status_code=404, detail=f"Establishment with ID {establishment_id} not found")
        
        print(f"Establishment found: {establishment.business_name}")
        
        # Проверяем наличие файла
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Валидация файла
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Определяем группу документа по типу
        document_groups = {
            'ogrn_inn': 'founding', 'charter': 'founding', 'registration_certificate': 'founding',
            'egryul_extract': 'founding', 'authorized_capital': 'founding', 'okved': 'founding',
            'passport_power_of_attorney': 'founding', 'general_director_appointment': 'founding',
            'company_card': 'founding',
            'alcohol_license': 'licenses', 'lease_ownership': 'licenses', 'egais': 'licenses',
            'mchs_conclusion': 'additional', 'rospotrebnadzor_conclusion': 'additional',
            'kkt_registration': 'financial', 'bank_details': 'financial', 'fns_certificate': 'financial'
        }
        document_group = document_groups.get(document_type, 'additional')
        
        # Маппинг названий документов
        document_names = {
            'ogrn_inn': 'ОГРН/ИНН',
            'charter': 'Устав',
            'registration_certificate': 'Свидетельство о регистрации',
            'egryul_extract': 'Выписка ЕГРЮЛ',
            'authorized_capital': 'Уставной капитал',
            'okved': 'ОКВЭД',
            'passport_power_of_attorney': 'Паспорт/Доверенность',
            'general_director_appointment': 'Приказ о назначении Ген. Директора',
            'company_card': 'Карточка предприятия',
            'alcohol_license': 'Лицензия на алкоголь',
            'lease_ownership': 'Договор аренды/собственности',
            'egais': 'ЕГАИС',
            'mchs_conclusion': 'МЧС',
            'rospotrebnadzor_conclusion': 'Роспотребнадзор',
            'kkt_registration': 'ККТ',
            'bank_details': 'Банковские реквизиты',
            'fns_certificate': 'Справка из ФНС'
        }
        document_name = document_names.get(document_type, document_type)
        
        # Сохраняем файл
        doc_id = str(uuid.uuid4())
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._- ")
        file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{safe_filename}")
        
        print(f"Saving file to: {file_path}")
        
        try:
            contents = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(contents)
            print(f"File saved successfully: {file_path}")
        except Exception as file_error:
            import traceback
            print(f"Error saving file: {str(file_error)}")
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(file_error)}")
        
        # Создаем запись в БД
        db_document = Document(
            establishment_id=establishment_id,
            document_group=document_group,
            document_type=document_type,
            document_name=document_name,
            file_path=file_path,
            file_name=file.filename,
            uploaded=True,
            uploaded_at=datetime.utcnow()
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        print(f"Document stored in DB: {db_document.id}")
        print("=" * 50)
        
        return document_to_response(db_document)
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Server error: {str(e)}\n{traceback.format_exc()}"
        print("=" * 50)
        print("ERROR IN DOCUMENT UPLOAD:")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        print("Full traceback:")
        print(traceback.format_exc())
        print("=" * 50)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/documents")
async def get_documents(establishment_id: int = None, db: Session = Depends(get_db)):
    """Получить все документы для заведения"""
    if establishment_id is None:
        raise HTTPException(status_code=400, detail="establishment_id is required")
    documents = db.query(Document).filter(Document.establishment_id == establishment_id).all()
    return {"documents": [document_to_response(doc) for doc in documents]}

@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: int, db: Session = Depends(get_db)):
    """Получить конкретный документ"""
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_to_response(document)

@app.post("/api/documents/{doc_id}/verify")
async def verify_document(doc_id: int, status: DocumentStatus = Form(...), db: Session = Depends(get_db)):
    """Верификация документа (ручная или через API)"""
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.status = status.value
    db.commit()
    db.refresh(document)
    
    return document_to_response(document)

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: int, db: Session = Depends(get_db)):
    """Удалить документ"""
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Удаляем файл
    if document.file_path and os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Удаляем из БД
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@app.get("/api/documents/stats")
async def get_statistics(establishment_id: int = None, db: Session = Depends(get_db)):
    """Статистика по документам для заведения"""
    if establishment_id is None:
        raise HTTPException(status_code=400, detail="establishment_id is required")
    documents = db.query(Document).filter(Document.establishment_id == establishment_id).all()
    total = len(documents)
    pending = sum(1 for doc in documents if doc.status == "pending")
    verified = sum(1 for doc in documents if doc.status == "verified")
    rejected = sum(1 for doc in documents if doc.status == "rejected")
    
    return {
        "total": total,
        "pending": pending,
        "verified": verified,
        "rejected": rejected
    }

# ============ REGISTRATION ENDPOINTS ============

@app.post("/api/establishments", response_model=EstablishmentResponse)
async def create_establishment(establishment: EstablishmentCreate, db: Session = Depends(get_db)):
    """Создание нового заведения (регистрация пользователя)"""
    try:
        print("=" * 50)
        print("CREATE ESTABLISHMENT REQUEST:")
        print(f"Data received (type: {type(establishment)}): {establishment}")
        if hasattr(establishment, 'dict'):
            print(f"Data as dict: {establishment.dict()}")
        elif hasattr(establishment, 'model_dump'):
            print(f"Data as dict: {establishment.model_dump()}")
        print("=" * 50)
        
        # Проверяем, не существует ли уже пользователь с таким email или username
        existing = db.query(Establishment).filter(
            (Establishment.email == establishment.email) | 
            (Establishment.username == establishment.username)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="User with this email or username already exists")
        
        # Используем model_dump() для Pydantic v2, или dict() для v1
        try:
            establishment_dict = establishment.model_dump()
        except AttributeError:
            establishment_dict = establishment.dict()
        
        print(f"Creating establishment with dict: {establishment_dict}")
        print(f"Dict keys: {list(establishment_dict.keys())}")
        
        # Проверяем, что все необходимые поля присутствуют
        required_fields = ['name', 'username', 'password', 'position', 'phone', 'email', 
                          'business_name', 'business_type', 'address', 'inn', 'ogrn']
        missing_fields = [field for field in required_fields if field not in establishment_dict]
        if missing_fields:
            print(f"ERROR: Missing fields in dict: {missing_fields}")
            raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing_fields)}")
        
        try:
            db_establishment = Establishment(**establishment_dict)
        except Exception as db_error:
            print(f"ERROR creating Establishment object: {str(db_error)}")
            print(f"Error type: {type(db_error)}")
            import traceback
            print(traceback.format_exc())
            raise
        db.add(db_establishment)
        db.commit()
        db.refresh(db_establishment)
        
        print(f"Establishment created successfully with ID: {db_establishment.id}")
        print("=" * 50)
        
        return db_establishment
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("=" * 50)
        print("ERROR IN CREATE ESTABLISHMENT:")
        print(f"Error: {str(e)}")
        print(f"Error type: {type(e)}")
        print(traceback.format_exc())
        print("=" * 50)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/establishments/{establishment_id}", response_model=EstablishmentResponse)
async def get_establishment(establishment_id: int, db: Session = Depends(get_db)):
    """Получить заведение по ID"""
    establishment = db.query(Establishment).filter(Establishment.id == establishment_id).first()
    if not establishment:
        raise HTTPException(status_code=404, detail="Establishment not found")
    return establishment

@app.post("/api/establishments/{establishment_id}/logo")
async def upload_logo(
    establishment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Загрузить логотип компании"""
    # Проверяем существование заведения
    establishment = db.query(Establishment).filter(Establishment.id == establishment_id).first()
    if not establishment:
        raise HTTPException(status_code=404, detail="Establishment not found")
    
    # Проверяем тип файла (только изображения)
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, GIF, WebP)")
    
    # Проверяем размер файла (макс 5MB)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    # Удаляем старый логотип, если есть
    if establishment.logo_path and os.path.exists(establishment.logo_path):
        try:
            os.remove(establishment.logo_path)
        except Exception as e:
            print(f"Error deleting old logo: {e}")
    
    # Сохраняем новый логотип
    file_extension = os.path.splitext(file.filename)[1]
    logo_filename = f"logo_{establishment_id}_{int(datetime.utcnow().timestamp())}{file_extension}"
    logo_path = os.path.join(UPLOAD_DIR, "logos", logo_filename)
    os.makedirs(os.path.dirname(logo_path), exist_ok=True)
    
    try:
        with open(logo_path, "wb") as f:
            f.write(file_content)
        
        # Обновляем путь к логотипу в БД
        establishment.logo_path = logo_path
        db.commit()
        db.refresh(establishment)
        
        return {"logo_path": logo_path, "message": "Logo uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving logo: {str(e)}")

@app.put("/api/establishments/{establishment_id}", response_model=EstablishmentResponse)
async def update_establishment(
    establishment_id: int, 
    update_data: EstablishmentUpdate,
    db: Session = Depends(get_db)
):
    """Обновить данные заведения"""
    try:
        establishment = db.query(Establishment).filter(Establishment.id == establishment_id).first()
        if not establishment:
            raise HTTPException(status_code=404, detail="Establishment not found")
        
        # Обновляем только переданные поля
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(establishment, field, value)
        
        establishment.updated_at = datetime.now()
        db.commit()
        db.refresh(establishment)
        
        return establishment
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("=" * 50)
        print("ERROR IN UPDATE ESTABLISHMENT:")
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        print("=" * 50)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/auth/login")
async def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    """Авторизация пользователя по логину или email и паролю"""
    try:
        print("=" * 50)
        print("LOGIN REQUEST:")
        print(f"Username/Email: {username}")
        print("=" * 50)
        
        # Ищем пользователя по username или email
        establishment = db.query(Establishment).filter(
            or_(
                Establishment.username == username,
                Establishment.email == username
            )
        ).first()
        
        if not establishment:
            print(f"User not found: {username}")
            raise HTTPException(status_code=401, detail="Неверный логин или пароль")
        
        # Проверяем пароль (в продакшене должен быть хеширован)
        if establishment.password != password:
            print(f"Invalid password for user: {username}")
            raise HTTPException(status_code=401, detail="Неверный логин или пароль")
        
        print(f"Login successful for user: {username}, establishment_id: {establishment.id}")
        print("=" * 50)
        
        # Возвращаем данные заведения (без пароля)
        return EstablishmentResponse.model_validate(establishment)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("=" * 50)
        print("ERROR IN LOGIN:")
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        print("=" * 50)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/establishments/{establishment_id}/documents/upload")
async def upload_registration_document(
    establishment_id: int,
    file: UploadFile = File(...),
    document_group: str = Form(...),
    document_type: str = Form(...),
    document_name: str = Form(...),
    required: bool = Form(False),
    db: Session = Depends(get_db)
):
    """Загрузка документа при регистрации"""
    # Проверяем существование заведения
    establishment = db.query(Establishment).filter(Establishment.id == establishment_id).first()
    if not establishment:
        raise HTTPException(status_code=404, detail="Establishment not found")
    
    # Валидация файла
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Сохраняем файл
    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Создаем запись в БД
    db_document = Document(
        establishment_id=establishment_id,
        document_group=document_group,
        document_type=document_type,
        document_name=document_name,
        file_path=file_path,
        file_name=file.filename,
        required=required,
        uploaded=True,
        uploaded_at=datetime.utcnow()
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return document_to_response(db_document)

@app.delete("/api/establishments/{establishment_id}/documents/{document_id}")
async def delete_registration_document(
    establishment_id: int,
    document_id: int,
    db: Session = Depends(get_db)
):
    """Удалить документ при регистрации"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.establishment_id == establishment_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Удаляем файл
    if document.file_path and os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@app.get("/api/establishments/{establishment_id}/documents", response_model=List[DocumentResponse])
async def get_establishment_documents(establishment_id: int, db: Session = Depends(get_db)):
    """Получить все документы заведения"""
    documents = db.query(Document).filter(Document.establishment_id == establishment_id).all()
    return documents

@app.post("/api/establishments/{establishment_id}/submit")
async def submit_establishment(establishment_id: int, db: Session = Depends(get_db)):
    """Отправить заявление на проверку"""
    establishment = db.query(Establishment).filter(Establishment.id == establishment_id).first()
    if not establishment:
        raise HTTPException(status_code=404, detail="Establishment not found")
    
    # Проверяем обязательные документы
    required_docs = db.query(Document).filter(
        Document.establishment_id == establishment_id,
        Document.required == True
    ).all()
    
    uploaded_required = [doc for doc in required_docs if doc.uploaded]
    
    if len(uploaded_required) < len(required_docs):
        raise HTTPException(
            status_code=400,
            detail=f"Not all required documents uploaded. {len(required_docs) - len(uploaded_required)} missing"
        )
    
    establishment.status = "pending"
    db.commit()
    
    return {"message": "Application submitted successfully", "status": "pending"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

