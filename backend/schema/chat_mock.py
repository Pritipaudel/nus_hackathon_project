from pydantic import BaseModel, Field


class MockChatRequest(BaseModel):
    question: str = Field(..., max_length=2000)


class MockChatResponse(BaseModel):
    question: str
    reply: str
    matched: bool
