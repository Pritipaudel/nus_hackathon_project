import uuid
from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.dialects.postgresql import UUID

from backend.core.database import Base

class ICBTProgram(Base):
    __tablename__ = "icbt_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty_level = Column(String(50), nullable=True)
    duration_days = Column(Integer, nullable=True)
    url = Column(String(500), nullable=True)
