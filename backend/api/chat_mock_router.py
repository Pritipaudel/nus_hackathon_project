from fastapi import APIRouter, Depends, status

from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.schema.chat_mock import MockChatQuestionRequest, MockChatQuestionResponse
from backend.services.chat_mock_service import get_single_sided_mock_reply

chat_mock_router = APIRouter(tags=["chat-mock"])


@chat_mock_router.post(
    "/chat/mock/reply",
    response_model=MockChatQuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Single-sided mock chat reply",
    description=(
        "Accepts a patient question and returns a predefined Nepali response "
        "when the input exactly matches supported mock strings."
    ),
)
def get_mock_chat_reply(
    body: MockChatQuestionRequest,
    current_user: User = Depends(get_current_user),
):
    reply, matched = get_single_sided_mock_reply(
        question=body.question,
        current_user=current_user,
    )
    return MockChatQuestionResponse(
        question=body.question,
        reply=reply,
        matched=matched,
    )
