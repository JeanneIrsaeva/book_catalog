from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import get_current_user

router = APIRouter(prefix="/publishers", tags=["publishers"])

@router.get("/", response_model=List[schemas.PublisherResponse])
def read_publishers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    publishers = crud.get_publishers(db, skip=skip, limit=limit)
    return publishers

@router.post("/", response_model=schemas.PublisherResponse)
def create_publisher(
    publisher: schemas.PublisherCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return crud.create_publisher(db=db, publisher=publisher)

@router.get("/{publisher_id}", response_model=schemas.PublisherResponse)
def read_publisher(
    publisher_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_publisher = crud.get_publisher(db, publisher_id=publisher_id)
    if db_publisher is None:
        raise HTTPException(
            status_code=404,
            detail="Publisher not found"
        )
    return db_publisher

@router.put("/{publisher_id}", response_model=schemas.PublisherResponse)
def update_publisher(
    publisher_id: int,
    publisher_update: schemas.PublisherCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_publisher = crud.update_publisher(db, publisher_id=publisher_id, publisher_update=publisher_update)
    if db_publisher is None:
        raise HTTPException(
            status_code=404,
            detail="Publisher not found"
        )
    return db_publisher

@router.delete("/{publisher_id}")
def delete_publisher(
    publisher_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_publisher = crud.delete_publisher(db, publisher_id=publisher_id)
    if db_publisher is None:
        raise HTTPException(
            status_code=404,
            detail="Publisher not found"
        )
    return {"message": "Publisher deleted"}