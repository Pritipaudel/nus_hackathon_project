from fastapi import APIRouter, Depends, HTTPException, status

from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.schema.chat_mock import MockChatRequest, MockChatResponse
from backend.services.mock_chat_service import mock_nepali_reply

chat_mock_router = APIRouter(prefix="/chat", tags=["chat"])


@chat_mock_router.post(
    "/mock/reply",
    response_model=MockChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Single-sided mock chat reply",
    description=(
        "Accepts a patient question and returns a predefined Nepali response "
        "when the input exactly matches supported mock strings."
    ),
)
def post_mock_reply(
    body: MockChatRequest,
    _user: User = Depends(get_current_user),
) -> MockChatResponse:
    q = body.question.strip()
    if not q:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="question is required",
        )
    reply, matched = mock_nepali_reply(q)
    return MockChatResponse(question=q, reply=reply, matched=matched)
