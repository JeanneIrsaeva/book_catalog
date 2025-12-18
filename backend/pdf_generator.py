from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import date, datetime
from typing import List, Dict, Any
import os
from pathlib import Path

class PDFGenerator:
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Регистрируем русские шрифты
        try:
            # Попробуем найти стандартные шрифты
            font_paths = [
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/times.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
            ]
            
            for font_path in font_paths:
                if Path(font_path).exists():
                    pdfmetrics.registerFont(TTFont('Arial', font_path))
                    pdfmetrics.registerFont(TTFont('Arial-Bold', font_path))
                    break
            
            # Если не нашли, создаем fallback
            if 'Arial' not in pdfmetrics.getRegisteredFontNames():
                # Используем стандартные шрифты с поддержкой Unicode
                pdfmetrics.registerFont(TTFont('Arial', 'Helvetica'))
                pdfmetrics.registerFont(TTFont('Arial-Bold', 'Helvetica-Bold'))
                
        except Exception as e:
            print(f"Ошибка загрузки шрифтов: {e}")
            pdfmetrics.registerFont(TTFont('Arial', 'Helvetica'))
        
        self.styles = getSampleStyleSheet()
        
        # Создаем стили с русскими шрифтами
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontName='Arial-Bold',
            fontSize=16,
            spaceAfter=12,
            alignment=1  # center
        )
        
        self.subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontName='Arial-Bold',
            fontSize=12,
            spaceAfter=8
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontName='Arial',
            fontSize=10
        )
        
        self.footer_style = ParagraphStyle(
            'Footer',
            parent=self.normal_style,
            fontSize=8,
            textColor=colors.grey
        )

    def generate_book_card(self, book_data: Dict[str, Any]) -> str:
        """Генерация отчета по карточке книги"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"book_card_{book_data['book_id']}_{timestamp}.pdf"
        filepath = self.output_dir / filename
        
        doc = SimpleDocTemplate(str(filepath), pagesize=A4)
        story = []
        
        # Заголовок
        story.append(Paragraph("Карточка книги", self.title_style))
        story.append(Spacer(1, 20))
        
        # Информация о книге
        data = [
            ["Название книги:", book_data['title']],
            ["Автор(ы):", ", ".join(book_data['authors'])],
            ["Год издания:", str(book_data['published'])],
            ["Издательство:", book_data['publisher']],
            ["Жанр(ы):", ", ".join(book_data['genres'])],
            ["Дата добавления:", book_data['added_date'].strftime("%d.%m.%Y %H:%M")],
        ]
        
        table = Table(data, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Arial'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 12))
        
        # Описание книги
        if book_data.get('description'):
            story.append(Paragraph("Описание:", self.subtitle_style))
            story.append(Spacer(1, 4))
            story.append(Paragraph(book_data['description'], self.normal_style))
        
        # Дата генерации отчета
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            f"Отчет сгенерирован: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}",
            self.footer_style
        ))
        
        doc.build(story)
        return str(filepath)

    def generate_collection_report(self, books: List[Dict[str, Any]],
                                  start_date: date, end_date: date) -> str:
        """Генерация отчета по пополнению коллекции"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"collection_report_{start_date}_{end_date}_{timestamp}.pdf"
        filepath = self.output_dir / filename
        
        doc = SimpleDocTemplate(str(filepath), pagesize=A4)
        story = []
        
        # Заголовок
        story.append(Paragraph("Отчет по пополнению книжной коллекции", self.title_style))
        story.append(Spacer(1, 10))
        
        # Период
        story.append(Paragraph(
            f"Период: с {start_date.strftime('%d.%m.%Y')} по {end_date.strftime('%d.%m.%Y')}",
            self.subtitle_style
        ))
        story.append(Spacer(1, 20))
        
        # Таблица с книгами
        if books:
            table_data = [["№", "Название книги", "Автор", "Год издания", "Жанр", "Дата добавления"]]
            
            for i, book in enumerate(books, 1):
                table_data.append([
                    str(i),
                    book['title'],
                    ", ".join(book['authors']),
                    str(book['published']),
                    ", ".join(book['genres']),
                    book['added_date'].strftime("%d.%m.%Y")
                ])
            
            table = Table(table_data, colWidths=[0.5*inch, 2*inch, 1.5*inch, 1*inch, 1.5*inch, 1.5*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Arial-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ALIGN', (0, 1), (0, -1), 'CENTER'),
                ('ALIGN', (3, 1), (3, -1), 'CENTER'),
            ]))
            
            story.append(table)
            story.append(Spacer(1, 20))
            
            # Итоги
            story.append(Paragraph(
                f"Всего добавлено книг: {len(books)}",
                self.subtitle_style
            ))
        else:
            story.append(Paragraph("За указанный период книги не добавлялись.", self.normal_style))
        
        # Дата генерации отчета
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            f"Отчет сгенерирован: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}",
            self.footer_style
        ))
        
        doc.build(story)
        return str(filepath)