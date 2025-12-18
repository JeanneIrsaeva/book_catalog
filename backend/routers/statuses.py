from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import get_current_admin_user, get_current_user  # Изменено: добавлен get_current_admin_user

router = APIRouter(prefix="/statuses", tags=["book_statuses"])

@router.get("/", response_model=List[schemas.BookStatusResponse])
def read_statuses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Все пользователи могут видеть статусы
):
    statuses = crud.get_book_statuses(db)
    return statuses

@router.get("/{status_id}", response_model=schemas.BookStatusResponse)
def read_status(
    status_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Все пользователи могут видеть конкретный статус
):
    db_status = crud.get_book_status_by_id(db, status_id=status_id)
    if db_status is None:
        raise HTTPException(
            status_code=404,
            detail="Book status not found"
        )
    return db_status

# Добавить новые эндпоинты для создания, обновления и удаления статусов

@router.post("/", response_model=schemas.BookStatusResponse)
def create_status(
    status: schemas.BookStatusBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Только администратор
):
    # Проверяем, существует ли статус с таким названием
    existing_status = db.query(models.BookStatus).filter(
        models.BookStatus.name == status.name
    ).first()
    
    if existing_status:
        raise HTTPException(
            status_code=400,
            detail="Status with this name already exists"
        )
    
    return crud.create_book_status(db=db, status=status)

@router.put("/{status_id}", response_model=schemas.BookStatusResponse)
def update_status(
    status_id: int,
    status_update: schemas.BookStatusBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Только администратор
):
    # Проверяем существование статуса
    db_status = crud.get_book_status_by_id(db, status_id=status_id)
    if db_status is None:
        raise HTTPException(
            status_code=404,
            detail="Book status not found"
        )
    
    # Проверяем уникальность названия (кроме текущего статуса)
    if status_update.name != db_status.name:
        existing_status = db.query(models.BookStatus).filter(
            models.BookStatus.name == status_update.name,
            models.BookStatus.status_id != status_id
        ).first()
        
        if existing_status:
            raise HTTPException(
                status_code=400,
                detail="Status with this name already exists"
            )
    
    return crud.update_book_status(db, status_id=status_id, status_update=status_update)

@router.delete("/{status_id}")
def delete_status(
    status_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Только администратор
):
    # Проверяем существование статуса
    db_status = crud.get_book_status_by_id(db, status_id=status_id)
    if db_status is None:
        raise HTTPException(
            status_code=404,
            detail="Book status not found"
        )
    
    # Проверяем, используется ли статус в аналитике
    from models import Analytics
    analytics_count = db.query(Analytics).filter(
        Analytics.status_id == status_id
    ).count()
    
    if analytics_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete status. It is used in {analytics_count} analytics records"
        )
    
    # Проверяем предустановленные статусы (нельзя удалить)
    if db_status.name in ["В планах", "Читаю", "Прочитано"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete default status"
        )
    
    db_status = crud.delete_book_status(db, status_id=status_id)
    
    return {"message": "Book status deleted"}