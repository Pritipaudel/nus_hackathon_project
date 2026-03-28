from pydantic import BaseModel, Field


class MockChatQuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class MockChatQuestionResponse(BaseModel):
    question: str
    reply: str
    matched: bool
