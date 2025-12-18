from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import get_current_user

router = APIRouter(prefix="/authors", tags=["authors"])

@router.get("/", response_model=List[schemas.AuthorResponse])
def read_authors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    authors = crud.get_authors(db, skip=skip, limit=limit)
    return authors

@router.post("/", response_model=schemas.AuthorResponse)
def create_author(
    author: schemas.AuthorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return crud.create_author(db=db, author=author)

@router.get("/{author_id}", response_model=schemas.AuthorResponse)
def read_author(
    author_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_author = crud.get_author(db, author_id=author_id)
    if db_author is None:
        raise HTTPException(
            status_code=404,
            detail="Author not found"
        )
    return db_author

@router.put("/{author_id}", response_model=schemas.AuthorResponse)
def update_author(
    author_id: int,
    author_update: schemas.AuthorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_author = crud.update_author(db, author_id=author_id, author_update=author_update)
    if db_author is None:
        raise HTTPException(
            status_code=404,
            detail="Author not found"
        )
    return db_author

@router.delete("/{author_id}")
def delete_author(
    author_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_author = crud.delete_author(db, author_id=author_id)
    if db_author is None:
        raise HTTPException(
            status_code=404,
            detail="Author not found"
        )
    return {"message": "Author deleted"}