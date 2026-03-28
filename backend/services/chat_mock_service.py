from backend.models.user import User


MOCK_PATIENT_TO_WORKER_RESPONSES: dict[str, str] = {
    "नमस्ते दाइ, केही दिनदेखि मलाई टाउको दुख्ने र निद्रा कम हुने समस्या छ।": "तपाईंको लक्षण सुनेँ। दैनिक पानी, आराम र नियमित सुत्ने समय राख्नुहोस्।",
    "आफ्नै समुदायका मानिससँग कुरा गर्दा मलाई धेरै सहज लाग्छ।": "आफ्नो समुदायसँग जोडिनु राम्रो संकेत हो, तपाईंको प्रगति सकारात्मक छ।",
    "धेरै धन्यवाद, म अहिले पहिले भन्दा धेरै खुसी छु।": "धन्यवाद। तपाईंले राम्रो प्रयास गर्नुभएको छ, यसरी नै अगाडि बढ्नुहोस्।",
}

DEFAULT_MOCK_REPLY = "तपाईंको कुरा सुनेँ। कृपया आफ्ना लक्षण अझ विस्तारमा बताउनुहोस्, म सहयोग गर्छु।"


def get_single_sided_mock_reply(question: str, current_user: User) -> tuple[str, bool]:
    normalized = question.strip()

    # Keep behavior deterministic: exact string checks against predefined prompts.
    if normalized in MOCK_PATIENT_TO_WORKER_RESPONSES:
        return MOCK_PATIENT_TO_WORKER_RESPONSES[normalized], True

    return DEFAULT_MOCK_REPLY, False
