from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import get_current_user

router = APIRouter(prefix="/genres", tags=["genres"])

@router.get("/", response_model=List[schemas.GenreResponse])
def read_genres(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    genres = crud.get_genres(db, skip=skip, limit=limit)
    return genres

@router.post("/", response_model=schemas.GenreResponse)
def create_genre(
    genre: schemas.GenreCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return crud.create_genre(db=db, genre=genre)

@router.get("/{genre_id}", response_model=schemas.GenreResponse)
def read_genre(
    genre_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_genre = crud.get_genre(db, genre_id=genre_id)
    if db_genre is None:
        raise HTTPException(
            status_code=404,
            detail="Genre not found"
        )
    return db_genre

@router.put("/{genre_id}", response_model=schemas.GenreResponse)
def update_genre(
    genre_id: int,
    genre_update: schemas.GenreCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_genre = crud.update_genre(db, genre_id=genre_id, genre_update=genre_update)
    if db_genre is None:
        raise HTTPException(
            status_code=404,
            detail="Genre not found"
        )
    return db_genre

@router.delete("/{genre_id}")
def delete_genre(
    genre_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_genre = crud.delete_genre(db, genre_id=genre_id)
    if db_genre is None:
        raise HTTPException(
            status_code=404,
            detail="Genre not found"
        )
    return {"message": "Genre deleted"}