from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import get_current_user

router = APIRouter(prefix="/statuses", tags=["book_statuses"])

@router.get("/", response_model=List[schemas.BookStatusResponse])
def read_statuses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    statuses = crud.get_book_statuses(db)
    return statuses

@router.get("/{status_id}", response_model=schemas.BookStatusResponse)
def read_status(
    status_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_status = crud.get_book_status_by_id(db, status_id=status_id)
    if db_status is None:
        raise HTTPException(
            status_code=404,
            detail="Book status not found"
        )
    return db_status
