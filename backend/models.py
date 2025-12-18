from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Date, TIMESTAMP, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

genre_book = Table(
    'genre_book',                  
    Base.metadata,                   
    Column('genre_id', Integer, ForeignKey('genre.genre_id'), primary_key=True),
    Column('book_id', Integer, ForeignKey('book.book_id'), primary_key=True)
)

author_book = Table(
    'author_book',                    
    Base.metadata,                   
    Column('author_id', Integer, ForeignKey('author.author_id'), primary_key=True),
    Column('book_id', Integer, ForeignKey('book.book_id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True)
    login = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255))
    is_admin = Column(Boolean, default=False)

    reviews = relationship("Review", back_populates="user")
    analytics = relationship("Analytics", back_populates="user")
    reports = relationship("Report", back_populates="user")

class Author(Base):
    __tablename__ = "author"
    author_id = Column(Integer, primary_key=True)
    last_name = Column(String(255))
    first_name = Column(String(255))
    middle_name = Column(String(255))

    books = relationship("Book", secondary=author_book, back_populates="authors")

class Publisher(Base):
    __tablename__ = "publisher"
    publisher_id = Column(Integer, primary_key=True)
    name = Column(String(255))

    books = relationship("Book", back_populates="publisher")

class Genre(Base):
    __tablename__ = "genre"
    genre_id = Column(Integer, primary_key=True)
    name = Column(String(255))

    books = relationship("Book", secondary=genre_book, back_populates="genres")

class BookStatus(Base):
    __tablename__ = "book_status"
    status_id = Column(Integer, primary_key=True)
    name = Column(String(255))

    analytics = relationship("Analytics", back_populates="status")

class Book(Base):
    __tablename__ = "book"
    book_id = Column(Integer, primary_key=True)
    publisher_id = Column(Integer, ForeignKey("publisher.publisher_id"))
    title = Column(String(255))
    published = Column(Integer)
    description = Column(Text)
    added_date = Column(TIMESTAMP)

    publisher = relationship("Publisher", back_populates="books")
    authors = relationship("Author", secondary=author_book, back_populates="books")
    genres = relationship("Genre", secondary=genre_book, back_populates="books")
    reviews = relationship("Review", back_populates="book")
    analytics = relationship("Analytics", back_populates="book")

class Review(Base):
    __tablename__ = "review"
    review_id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey("book.book_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    review_text = Column(Text)
    rating = Column(Integer)

    book = relationship("Book", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class Analytics(Base):
    __tablename__ = "analytics"
    analytics_id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey("book.book_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    status_id = Column(Integer, ForeignKey("book_status.status_id"))
    start_date = Column(Date)
    end_date = Column(Date)
    pages_read = Column(Integer)
    created_date = Column(TIMESTAMP, server_default=func.now())

    book = relationship("Book", back_populates="analytics")
    user = relationship("User", back_populates="analytics")
    status = relationship("BookStatus", back_populates="analytics")

class Report(Base):
    __tablename__ = "report"
    report_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    report_type = Column(String(255))
    period_from = Column(Date)
    period_to = Column(Date)
    generated_at = Column(TIMESTAMP, server_default=func.now())
    file_path = Column(String(255))

    user = relationship("User", back_populates="reports")