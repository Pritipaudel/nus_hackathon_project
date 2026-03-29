"""Exact-match Nepali mock replies for /chat/mock/reply (deterministic demo)."""

from __future__ import annotations

# Keys must match client input exactly after strip() (same punctuation & spacing).
NEPALI_EXACT_REPLIES: dict[str, str] = {
    "नमस्ते दाइ, केही दिनदेखि मलाई टाउको दुख्ने र निद्रा कम हुने समस्या छ।": (
        "तपाईंको लक्षण सुनेँ। दैनिक पानी, आराम र नियमित सुत्ने समय राख्नुहोस्।"
    ),
    "आफ्नै समुदायका मानिससँग कुरा गर्दा मलाई धेरै सहज लाग्छ।": (
        "आफ्नो समुदायसँग जोडिनु राम्रो संकेत हो, तपाईंको प्रगति सकारात्मक छ।"
    ),
    "धेरै धन्यवाद, म अहिले पहिले भन्दा धेरै खुसी छु।": (
        "धन्यवाद। तपाईंले राम्रो प्रयास गर्नुभएको छ, यसरी नै अगाडि बढ्नुहोस्।"
    ),
}

FALLBACK_REPLY = (
    "तपाईंको कुरा सुनेँ। कृपया आफ्ना लक्षण अझ विस्तारमा बताउनुहोस्, म सहयोग गर्छु।"
)


def mock_nepali_reply(question: str) -> tuple[str, bool]:
    q = question.strip()
    if q in NEPALI_EXACT_REPLIES:
        return NEPALI_EXACT_REPLIES[q], True
    return FALLBACK_REPLY, False
