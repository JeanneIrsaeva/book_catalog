import os
from pathlib import Path
from datetime import date, datetime
from typing import List, Dict, Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import platform

class PDFGenerator:
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Регистрируем русские шрифты
        self.register_fonts()
        
        self.styles = getSampleStyleSheet()
        
        # Создаем стили с русскими шрифтами
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontName='DejaVuSans-Bold',  # Используем зарегистрированный шрифт
            fontSize=16,
            spaceAfter=12,
            alignment=1  # center
        )
        
        self.subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontName='DejaVuSans-Bold',
            fontSize=12,
            spaceAfter=8
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontName='DejaVuSans',
            fontSize=10
        )
        
        self.footer_style = ParagraphStyle(
            'Footer',
            parent=self.normal_style,
            fontSize=8,
            textColor=colors.grey
        )
    
    def register_fonts(self):
        """Регистрируем шрифты с поддержкой кириллицы"""
        try:
            # Пытаемся найти DejaVu Sans (хорошая поддержка Unicode)
            font_paths = []
            
            # Проверяем операционную систему
            system = platform.system()
            
            if system == "Windows":
                font_paths = [
                    "C:/Windows/Fonts/dejavusans.ttf",
                    "C:/Windows/Fonts/arial.ttf",
                    "C:/Windows/Fonts/times.ttf",
                ]
            elif system == "Linux":
                font_paths = [
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                ]
            elif system == "Darwin":  # macOS
                font_paths = [
                    "/Library/Fonts/Arial.ttf",
                    "/System/Library/Fonts/Supplemental/Arial.ttf",
                ]
            
            # Регистрируем обычный и жирный шрифты
            regular_found = False
            bold_found = False
            
            for font_path in font_paths:
                path = Path(font_path)
                if path.exists():
                    try:
                        if "dejavu" in font_path.lower() or "liberation" in font_path.lower():
                            # Для DejaVu/Liberation
                            if "bold" in font_path.lower():
                                pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', str(path)))
                                bold_found = True
                                print(f"Зарегистрирован жирный шрифт: {path}")
                            else:
                                pdfmetrics.registerFont(TTFont('DejaVuSans', str(path)))
                                regular_found = True
                                print(f"Зарегистрирован обычный шрифт: {path}")
                        elif "arial" in font_path.lower():
                            # Для Arial
                            pdfmetrics.registerFont(TTFont('DejaVuSans', str(path)))
                            pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', str(path)))
                            regular_found = bold_found = True
                            print(f"Зарегистрирован Arial: {path}")
                            break
                    except Exception as e:
                        print(f"Ошибка загрузки шрифта {path}: {e}")
                        continue
            
            # Если не нашли нужные шрифты, используем стандартные (но могут быть квадратики)
            if not regular_found or not bold_found:
                print("Предупреждение: Не найдены русские шрифты. Могут появиться квадратики.")
                # Используем стандартные шрифты как fallback
                pdfmetrics.registerFont(TTFont('DejaVuSans', 'Helvetica'))
                pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', 'Helvetica-Bold'))
                
        except Exception as e:
            print(f"Критическая ошибка загрузки шрифтов: {e}")
            # Аварийный fallback
            pdfmetrics.registerFont(TTFont('DejaVuSans', 'Helvetica'))
            pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', 'Helvetica-Bold'))
    
    def safe_text(self, text: str) -> str:
        """Безопасное преобразование текста"""
        if text is None:
            return ""
        # Убираем проблемные символы и обеспечиваем правильную кодировку
        return str(text).encode('utf-8', 'ignore').decode('utf-8')
    
    def generate_book_card(self, book_data: Dict[str, Any]) -> str:
        """Генерация отчета по карточке книги"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"book_card_{book_data['book_id']}_{timestamp}.pdf"
        filepath = self.output_dir / filename
        
        doc = SimpleDocTemplate(str(filepath), pagesize=A4)
        story = []
        
        # Заголовок
        story.append(Paragraph(self.safe_text("Карточка книги"), self.title_style))
        story.append(Spacer(1, 20))
        
        # Информация о книге
        data = [
            ["Название книги:", self.safe_text(book_data['title'])],
            ["Автор(ы):", self.safe_text(", ".join(book_data['authors']))],
            ["Год издания:", self.safe_text(str(book_data['published']))],
            ["Издательство:", self.safe_text(book_data['publisher'])],
            ["Жанр(ы):", self.safe_text(", ".join(book_data['genres']))],
            ["Дата добавления:", self.safe_text(book_data['added_date'].strftime("%d.%m.%Y %H:%M"))],
        ]
        
        if 'current_status' in book_data:
            data.append(["Текущий статус:", self.safe_text(book_data['current_status'])])
        
        table = Table(data, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 12))
        
        # Описание книги
        if book_data.get('description'):
            story.append(Paragraph(self.safe_text("Описание:"), self.subtitle_style))
            story.append(Spacer(1, 4))
            story.append(Paragraph(self.safe_text(book_data['description']), self.normal_style))
        
        # Дата генерации отчета
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            self.safe_text(f"Отчет сгенерирован: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}"),
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
        story.append(Paragraph(
            self.safe_text("Отчет по пополнению книжной коллекции"), 
            self.title_style
        ))
        story.append(Spacer(1, 10))
        
        # Период - ИСПРАВЛЕНО: используем переданные даты без изменений
        story.append(Paragraph(
            self.safe_text(f"Период: с {start_date.strftime('%d.%m.%Y')} по {end_date.strftime('%d.%m.%Y')}"),
            self.subtitle_style
        ))
        story.append(Spacer(1, 20))
        
        # Таблица с книгами
        if books:
            # Заголовки таблицы
            headers = ["№", "Название книги", "Автор", "Год издания", "Жанр", "Дата добавления"]
            table_data = [[self.safe_text(h) for h in headers]]
            
            for i, book in enumerate(books, 1):
                table_data.append([
                    str(i),
                    self.safe_text(book['title']),
                    self.safe_text(", ".join(book['authors'])),
                    self.safe_text(str(book['published'])),
                    self.safe_text(", ".join(book['genres'])),
                    self.safe_text(book['added_date'].strftime("%d.%m.%Y"))
                ])
            
            table = Table(table_data, colWidths=[0.5*inch, 2*inch, 1.5*inch, 1*inch, 1.5*inch, 1.5*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A90E2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'DejaVuSans-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F5F5F5')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
                ('ALIGN', (0, 1), (0, -1), 'CENTER'),
                ('ALIGN', (3, 1), (3, -1), 'CENTER'),
                ('FONTNAME', (0, 1), (-1, -1), 'DejaVuSans'),
            ]))
            
            story.append(table)
            story.append(Spacer(1, 20))
            
            # Итоги
            story.append(Paragraph(
                self.safe_text(f"Всего добавлено книг: {len(books)}"),
                self.subtitle_style
            ))
        else:
            story.append(Paragraph(
                self.safe_text("За указанный период книги не добавлялись."), 
                self.normal_style
            ))
        
        # Дата генерации отчета
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            self.safe_text(f"Отчет сгенерирован: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}"),
            self.footer_style
        ))
        
        doc.build(story)
        return str(filepath)
