from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import models
import schemas
from auth import get_password_hash

# User CRUD
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_by_login(db: Session, login: str):
    return db.query(models.User).filter(models.User.login == login).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate, is_admin: bool = False):
    db_user = models.User(
        login=user.login,
        password_hash=get_password_hash(user.password),
        name=user.name,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    for key, value in update_data.items():
        if key != "password_hash":
            setattr(db_user, key, value)
        else:
            setattr(db_user, "password_hash", value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

# Author CRUD
def get_author(db: Session, author_id: int):
    return db.query(models.Author).filter(models.Author.author_id == author_id).first()

def get_authors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Author).offset(skip).limit(limit).all()

def create_author(db: Session, author: schemas.AuthorCreate):
    db_author = models.Author(**author.dict())
    db.add(db_author)
    db.commit()
    db.refresh(db_author)
    return db_author

def update_author(db: Session, author_id: int, author_update: schemas.AuthorCreate):
    db_author = db.query(models.Author).filter(models.Author.author_id == author_id).first()
    if not db_author:
        return None
    
    for key, value in author_update.dict().items():
        setattr(db_author, key, value)
    
    db.commit()
    db.refresh(db_author)
    return db_author

def delete_author(db: Session, author_id: int):
    db_author = db.query(models.Author).filter(models.Author.author_id == author_id).first()
    if db_author:
        db.delete(db_author)
        db.commit()
    return db_author

# Genre CRUD
def get_genre(db: Session, genre_id: int):
    return db.query(models.Genre).filter(models.Genre.genre_id == genre_id).first()

def get_genres(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Genre).offset(skip).limit(limit).all()

def create_genre(db: Session, genre: schemas.GenreCreate):
    db_genre = models.Genre(**genre.dict())
    db.add(db_genre)
    db.commit()
    db.refresh(db_genre)
    return db_genre

def update_genre(db: Session, genre_id: int, genre_update: schemas.GenreCreate):
    db_genre = db.query(models.Genre).filter(models.Genre.genre_id == genre_id).first()
    if not db_genre:
        return None
    
    for key, value in genre_update.dict().items():
        setattr(db_genre, key, value)
    
    db.commit()
    db.refresh(db_genre)
    return db_genre

def delete_genre(db: Session, genre_id: int):
    db_genre = db.query(models.Genre).filter(models.Genre.genre_id == genre_id).first()
    if db_genre:
        db.delete(db_genre)
        db.commit()
    return db_genre

# Publisher CRUD
def get_publisher(db: Session, publisher_id: int):
    return db.query(models.Publisher).filter(models.Publisher.publisher_id == publisher_id).first()

def get_publishers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Publisher).offset(skip).limit(limit).all()

def create_publisher(db: Session, publisher: schemas.PublisherCreate):
    db_publisher = models.Publisher(**publisher.dict())
    db.add(db_publisher)
    db.commit()
    db.refresh(db_publisher)
    return db_publisher

def update_publisher(db: Session, publisher_id: int, publisher_update: schemas.PublisherCreate):
    db_publisher = db.query(models.Publisher).filter(models.Publisher.publisher_id == publisher_id).first()
    if not db_publisher:
        return None
    
    for key, value in publisher_update.dict().items():
        setattr(db_publisher, key, value)
    
    db.commit()
    db.refresh(db_publisher)
    return db_publisher

def delete_publisher(db: Session, publisher_id: int):
    db_publisher = db.query(models.Publisher).filter(models.Publisher.publisher_id == publisher_id).first()
    if db_publisher:
        db.delete(db_publisher)
        db.commit()
    return db_publisher

# Book CRUD
def get_book(db: Session, book_id: int):
    return db.query(models.Book).filter(models.Book.book_id == book_id).first()

def get_books(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = db.query(models.Book)
    if search:
        query = query.filter(models.Book.title.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

def create_book(db: Session, book: schemas.BookCreate):
    db_book = models.Book(
        title=book.title,
        published=book.published,
        description=book.description,
        publisher_id=book.publisher_id,
        added_date=datetime.now()
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    
    authors = db.query(models.Author).filter(models.Author.author_id.in_(book.author_ids)).all()
    db_book.authors.extend(authors)
    
    genres = db.query(models.Genre).filter(models.Genre.genre_id.in_(book.genre_ids)).all()
    db_book.genres.extend(genres)
    
    db.commit()
    db.refresh(db_book)
    return db_book

def update_book(db: Session, book_id: int, book_update: schemas.BookUpdate):
    db_book = db.query(models.Book).filter(models.Book.book_id == book_id).first()
    if not db_book:
        return None
    
    update_data = book_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        if key not in ['author_ids', 'genre_ids']:
            setattr(db_book, key, value)
    
    if 'author_ids' in update_data:
        authors = db.query(models.Author).filter(models.Author.author_id.in_(update_data['author_ids'])).all()
        db_book.authors = authors
    
    if 'genre_ids' in update_data:
        genres = db.query(models.Genre).filter(models.Genre.genre_id.in_(update_data['genre_ids'])).all()
        db_book.genres = genres
    
    db.commit()
    db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_id: int):
    db_book = db.query(models.Book).filter(models.Book.book_id == book_id).first()
    if db_book:
        db.delete(db_book)
        db.commit()
    return db_book

# Book Status CRUD
def get_book_statuses(db: Session):
    return db.query(models.BookStatus).all()

def get_book_status_by_name(db: Session, status_name: str):
    return db.query(models.BookStatus).filter(models.BookStatus.name == status_name).first()

def get_book_status_by_id(db: Session, status_id: int):
    return db.query(models.BookStatus).filter(models.BookStatus.status_id == status_id).first()

def create_analytics(db: Session, analytics: schemas.AnalyticsBase, user_id: int, book_id: int = None):
    """
    Создание записи аналитики
    book_id: если не указан, берется из analytics.book_id
    """
    # Используем переданный book_id или берем из analytics
    final_book_id = book_id if book_id is not None else analytics.book_id
    
    db_analytics = models.Analytics(
        book_id=final_book_id,
        status_id=analytics.status_id,
        start_date=analytics.start_date,
        end_date=analytics.end_date,
        pages_read=analytics.pages_read,
        user_id=user_id
    )
    
    db.add(db_analytics)
    db.commit()
    db.refresh(db_analytics)
    return db_analytics

def get_user_analytics(db: Session, user_id: int):
    return db.query(models.Analytics).filter(models.Analytics.user_id == user_id).all()

def get_analytics_by_status(db: Session, user_id: int, status_id: int):
    return db.query(models.Analytics).filter(
        models.Analytics.user_id == user_id,
        models.Analytics.status_id == status_id
    ).all()

# Reports CRUD
def get_books_added_in_period(db: Session, start_date: date, end_date: date):
    return db.query(models.Book).filter(
        models.Book.added_date.between(start_date, end_date)
    ).all()

def create_report_record(db: Session, user_id: int, report_type: str,
                         period_from: Optional[date], period_to: Optional[date],
                         file_path: str):
    db_report = models.Report(
        user_id=user_id,
        report_type=report_type,
        period_from=period_from,
        period_to=period_to,
        file_path=file_path
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

# Добавить в существующий файл crud.py следующие функции:

def get_user_books(db: Session, user_id: int, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    """Получение книг пользователя через аналитику"""
    query = db.query(models.Book).join(models.Analytics).filter(
        models.Analytics.user_id == user_id
    ).distinct()
    
    if search:
        query = query.filter(models.Book.title.ilike(f"%{search}%"))
    
    return query.offset(skip).limit(limit).all()

def get_user_book_by_id(db: Session, user_id: int, book_id: int):
    """Получение конкретной книги пользователя"""
    return db.query(models.Book).join(models.Analytics).filter(
        models.Book.book_id == book_id,
        models.Analytics.user_id == user_id
    ).first()

def get_current_book_status(db: Session, user_id: int, book_id: int):
    """Получение текущего статуса книги для пользователя"""
    analytics = db.query(models.Analytics).filter(
        models.Analytics.user_id == user_id,
        models.Analytics.book_id == book_id
    ).order_by(models.Analytics.created_date.desc()).first()
    
    if analytics:
        return db.query(models.BookStatus).filter(
            models.BookStatus.status_id == analytics.status_id
        ).first()
    return None

def get_books_added_in_period_by_user(db: Session, user_id: int, start_date: date, end_date: date):
    """Получение книг, добавленных пользователем за период"""
    try:
        # Получаем книги пользователя из аналитики
        # Находим первую запись аналитики для каждой книги (когда книга была добавлена)
        from sqlalchemy import func
        
        # Подзапрос для получения минимальной даты создания аналитики для каждой книги пользователя
        subquery = db.query(
            models.Analytics.book_id,
            func.min(models.Analytics.created_date).label('min_created_date')
        ).filter(
            models.Analytics.user_id == user_id
        ).group_by(models.Analytics.book_id).subquery()
        
        # Получаем книги, где минимальная дата создания аналитики попадает в период
        books = db.query(models.Book).join(
            subquery,
            models.Book.book_id == subquery.c.book_id
        ).filter(
            subquery.c.min_created_date.between(start_date, end_date)
        ).all()
        
        return books
        
    except Exception as e:
        print(f"Ошибка при получении книг за период: {e}")
        import traceback
        traceback.print_exc()
        return []

def delete_user_book(db: Session, user_id: int, book_id: int):
    """Удаление книги пользователя (удаляет только аналитику)"""
    # Удаляем аналитику пользователя для этой книги
    db.query(models.Analytics).filter(
        models.Analytics.user_id == user_id,
        models.Analytics.book_id == book_id
    ).delete()
    
    db.commit()
    return True