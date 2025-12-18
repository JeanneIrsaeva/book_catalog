from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user
import crud
import schemas

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/user/{user_id}/stats", response_model=dict)
def get_user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Только пользователь или администратор может получить свою статистику
    if current_user.user_id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Получаем все аналитики пользователя
    user_analytics = crud.get_user_analytics(db, user_id)
    
    # Считаем статистику
    planned = 0
    reading = 0
    completed = 0
    total_pages = 0
    
    for analytics in user_analytics:
        status = crud.get_book_status_by_id(db, analytics.status_id)
        if status:
            if status.name == "В планах":
                planned += 1
            elif status.name == "Читаю":
                reading += 1
            elif status.name == "Прочитано":
                completed += 1
            
            if analytics.pages_read:
                total_pages += analytics.pages_read
    
    return {
        "planned": planned,
        "reading": reading,
        "completed": completed,
        "total_pages": total_pages,
        "avg_reading_time": 14,  # Заглушка
    }