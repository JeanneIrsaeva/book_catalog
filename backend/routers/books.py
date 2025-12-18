from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import get_current_user
import models  

router = APIRouter(prefix="/books", tags=["books"])

@router.get("/", response_model=List[schemas.BookResponse])
def read_books(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Поиск по названию книги"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Пользователь видит только свои книги
    books = crud.get_user_books(db, current_user.user_id, skip=skip, limit=limit, search=search)
    return books

@router.post("/", response_model=schemas.BookResponse)
def create_book(
    book: schemas.BookCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    publisher = crud.get_publisher(db, publisher_id=book.publisher_id)
    if not publisher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Издательство не найдено"
        )
    
    for author_id in book.author_ids:
        author = crud.get_author(db, author_id=author_id)
        if not author:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Автор с ID {author_id} не найден"
            )
    
    for genre_id in book.genre_ids:
        genre = crud.get_genre(db, genre_id=genre_id)
        if not genre:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Жанр с ID {genre_id} не найден"
            )
    
    # Создаем книгу
    db_book = crud.create_book(db=db, book=book)
    
    # Создаем запись в аналитике для пользователя (статус "В планах")
    status_in_plans = crud.get_book_status_by_name(db, "В планах")
    if status_in_plans:
        crud.create_analytics(
            db=db,
            analytics=schemas.AnalyticsBase(
                book_id=db_book.book_id,
                status_id=status_in_plans.status_id
            ),
            user_id=current_user.user_id
        )
    
    return db_book

@router.get("/{book_id}", response_model=schemas.BookResponse)
def read_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_book = crud.get_user_book_by_id(db, current_user.user_id, book_id)
    if db_book is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    return db_book

@router.put("/{book_id}", response_model=schemas.BookResponse)
def update_book(
    book_id: int,
    book_update: schemas.BookUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Проверяем, что книга принадлежит пользователю
    db_book = crud.get_user_book_by_id(db, current_user.user_id, book_id)
    if db_book is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    
    db_book = crud.update_book(db, book_id=book_id, book_update=book_update)
    if db_book is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    return db_book

@router.delete("/{book_id}")
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Удаляем книгу только для текущего пользователя
    success = crud.delete_user_book(db, current_user.user_id, book_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    return {"message": "Книга удалена из вашей коллекции"}

@router.get("/{book_id}/status", response_model=schemas.BookStatusResponse)
def get_book_status(
    book_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Получить текущий статус книги для пользователя"""
    status_obj = crud.get_current_book_status(db, current_user.user_id, book_id)
    if status_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Статус не найден"
        )
    return status_obj

@router.post("/{book_id}/status/", response_model=schemas.AnalyticsResponse)
def update_book_status(
    book_id: int,
    status_update: schemas.AnalyticsBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    print(f"=== ОБНОВЛЕНИЕ СТАТУСА КНИГИ ===")
    print(f"Пользователь: {current_user.user_id}")
    print(f"ID книги: {book_id}")
    print(f"Полученные данные: {status_update.dict()}")
    
    # Проверяем, что книга принадлежит пользователю
    book = crud.get_user_book_by_id(db, current_user.user_id, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена в вашей коллекции"
        )
    
    # Проверяем статус
    status_obj = crud.get_book_status_by_id(db, status_update.status_id)
    if not status_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Статус не найден"
        )
    
    # Создаем запись аналитики - явно указываем book_id
    analytics = crud.create_analytics(
        db=db,
        analytics=status_update,
        user_id=current_user.user_id,
        book_id=book_id  # Добавляем book_id
    )
    
    return analytics

@router.get("/{book_id}/statuses", response_model=List[schemas.AnalyticsResponse])
def get_book_status_history(
    book_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Получить историю статусов книги для пользователя"""
    # Проверяем, что книга принадлежит пользователю
    book = crud.get_user_book_by_id(db, current_user.user_id, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    
    analytics = db.query(models.Analytics).filter(
        models.Analytics.user_id == current_user.user_id,
        models.Analytics.book_id == book_id
    ).order_by(models.Analytics.created_date.desc()).all()
    
    return analytics