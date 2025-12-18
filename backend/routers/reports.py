import os
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import get_current_user
from pdf_generator import PDFGenerator

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/generate")
def generate_report(
    report_request: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    pdf_gen = PDFGenerator()
    
    if report_request.report_type == "book_card" and report_request.book_id:
        # Проверяем, что книга принадлежит пользователю
        book = crud.get_user_book_by_id(db, current_user.user_id, report_request.book_id)
        if not book:
            raise HTTPException(
                status_code=404,
                detail="Book not found in your collection"
            )
        
        # Получаем текущий статус книги
        current_status = crud.get_current_book_status(db, current_user.user_id, book.book_id)
        
        book_data = {
            "book_id": book.book_id,
            "title": book.title,
            "authors": [f"{a.last_name} {a.first_name}" for a in book.authors],
            "published": book.published,
            "publisher": book.publisher.name,
            "genres": [g.name for g in book.genres],
            "added_date": book.added_date,
            "description": book.description,
            "current_status": current_status.name if current_status else "Не указан"
        }
        
        pdf_path = pdf_gen.generate_book_card(book_data)
        
        crud.create_report_record(
            db=db,
            user_id=current_user.user_id,
            report_type="book_card",
            period_from=None,
            period_to=None,
            file_path=pdf_path
        )
        
        return FileResponse(
            path=pdf_path,
            media_type='application/pdf',
            filename=os.path.basename(pdf_path)
        )
    
    elif report_request.report_type == "collection_growth":
        if not report_request.period_from or not report_request.period_to:
            raise HTTPException(
                status_code=400,
                detail="For collection growth report, period is required"
            )
        
        # Исправлено: преобразуем строки в даты
        period_from = report_request.period_from
        period_to = report_request.period_to
        
        if isinstance(period_from, str):
            period_from = datetime.strptime(period_from, "%Y-%m-%d").date()
        if isinstance(period_to, str):
            period_to = datetime.strptime(period_to, "%Y-%m-%d").date()
        
        # Получаем книги за период
        books = crud.get_books_added_in_period_by_user(
            db=db,
            user_id=current_user.user_id,
            start_date=period_from,
            end_date=period_to
        )
        
        books_data = []
        for book in books:
            books_data.append({
                "title": book.title,
                "authors": [f"{a.last_name} {a.first_name}" for a in book.authors],
                "published": book.published,
                "genres": [g.name for g in book.genres],
                "added_date": book.added_date
            })
        
        pdf_path = pdf_gen.generate_collection_report(
            books=books_data,
            start_date=period_from,
            end_date=period_to
        )
        
        crud.create_report_record(
            db=db,
            user_id=current_user.user_id,
            report_type="collection_growth",
            period_from=period_from,
            period_to=period_to,
            file_path=pdf_path
        )
        
        return FileResponse(
            path=pdf_path,
            media_type='application/pdf',
            filename=os.path.basename(pdf_path)
        )
    
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report type"
        )
