from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

# Auth schemas
class UserCreate(BaseModel):
    name: str
    login: str
    password: str

class UserLogin(BaseModel):
    login: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    is_admin: Optional[bool] = False

# Author schemas
class AuthorBase(BaseModel):
    last_name: str
    first_name: str
    middle_name: Optional[str] = None

class AuthorCreate(AuthorBase):
    pass

class AuthorResponse(AuthorBase):
    author_id: int
    
    class Config:
        from_attributes = True

# Genre schemas
class GenreBase(BaseModel):
    name: str

class GenreCreate(GenreBase):
    pass

class GenreResponse(GenreBase):
    genre_id: int
    
    class Config:
        from_attributes = True

# Publisher schemas
class PublisherBase(BaseModel):
    name: str

class PublisherCreate(PublisherBase):
    pass

class PublisherResponse(PublisherBase):
    publisher_id: int
    
    class Config:
        from_attributes = True

# Book schemas
class BookBase(BaseModel):
    title: str
    published: int
    description: Optional[str] = None
    publisher_id: int

class BookCreate(BookBase):
    author_ids: List[int]
    genre_ids: List[int]

class BookUpdate(BaseModel):
    title: Optional[str] = None
    published: Optional[int] = None
    description: Optional[str] = None
    publisher_id: Optional[int] = None
    author_ids: Optional[List[int]] = None
    genre_ids: Optional[List[int]] = None

class BookResponse(BookBase):
    book_id: int
    added_date: datetime
    authors: List[AuthorResponse]
    genres: List[GenreResponse]
    publisher: PublisherResponse
    
    class Config:
        from_attributes = True

# Book Status schemas
class BookStatusBase(BaseModel):
    name: str

class BookStatusResponse(BookStatusBase):
    status_id: int
    
    class Config:
        from_attributes = True

class AnalyticsBase(BaseModel):
    book_id: int = Field(None, description="ID книги (автоматически из URL)")
    status_id: int
    start_date: Optional[date] = Field(None, description="Дата начала чтения (опционально)")
    end_date: Optional[date] = Field(None, description="Дата окончания чтения (опционально)")
    pages_read: Optional[int] = Field(None, ge=0, description="Количество прочитанных страниц")
    
    class Config:
        # Разрешаем не передавать book_id в запросе
        extra = "allow"

class AnalyticsResponse(AnalyticsBase):
    analytics_id: int
    created_date: datetime
    
    class Config:
        from_attributes = True

class DateRange(BaseModel):
    period_from: date
    period_to: date

class BookCardReportRequest(BaseModel):
    report_type: str = "book_card"
    book_id: int

class CollectionReportRequest(BaseModel):
    report_type: str = "collection_growth"
    period_from: date
    period_to: date

class ReportRequest(BaseModel):
    report_type: str = Field(..., description="Тип отчета: 'book_card' или 'collection_growth'")
    book_id: Optional[int] = Field(None, description="ID книги (для book_card)")
    period_from: Optional[date] = Field(None, description="Дата начала периода (для collection_growth)")
    period_to: Optional[date] = Field(None, description="Дата окончания периода (для collection_growth)")
    
    class Config:
        schema_extra = {
            "example": {
                "report_type": "book_card",
                "book_id": 1
            }
        }

# User schemas
class UserResponse(BaseModel):
    user_id: int
    login: str
    name: str
    is_admin: bool
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None

# Добавить в schemas.py

class BookWithStatusResponse(BookResponse):
    current_status: Optional[BookStatusResponse] = None
    
    class Config:
        from_attributes = True

class BookStatusHistory(BaseModel):
    status_name: str
    changed_date: datetime
    pages_read: Optional[int] = None
    
    class Config:
        from_attributes = True