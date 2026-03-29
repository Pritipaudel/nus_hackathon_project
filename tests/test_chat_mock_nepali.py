import asyncio
import time
import unittest
from dataclasses import dataclass


@dataclass
class ChatEvent:
    sender: str
    text: str
    ts: float


class MockAnonymousChatServer:
    """Simple mock server for Nepali patient-health worker chat behavior."""

    def __init__(self, worker_delay_seconds: float = 0.9):
        self.worker_delay_seconds = worker_delay_seconds
        self.events: list[ChatEvent] = []

    async def handle_patient_message(self, text: str) -> ChatEvent:
        patient_event = ChatEvent(sender="PATIENT", text=text, ts=time.monotonic())
        self.events.append(patient_event)

        worker_reply = await self._health_worker_reply(text)
        worker_event = ChatEvent(
            sender="HEALTH_WORKER",
            text=worker_reply,
            ts=time.monotonic(),
        )
        self.events.append(worker_event)
        return worker_event

    async def _health_worker_reply(self, patient_text: str) -> str:
        await asyncio.sleep(self.worker_delay_seconds)

        if "टाउको" in patient_text or "निद्रा" in patient_text:
            return (
                "तपाईंले राम्रोसँग साझा गर्नुभयो। तपाईंलाई टाउको भारी हुने र "
                "निद्रा कम हुने समस्या देखिन्छ। दैनिक पानी, हल्का व्यायाम र "
                "नियमित सुत्ने समय राख्नुहोस्।"
            )

        if "गाउँ" in patient_text or "समुदाय" in patient_text:
            return (
                "आफ्नै समुदायका मानिसहरूसँग कुरा गर्दा सजिलो महसुस हुनु "
                "स्वाभाविक हो। तपाईं खुला हुन थाल्नुभएको छ, यो राम्रो प्रगति हो।"
            )

        if "धन्यवाद" in patient_text:
            return "धन्यवाद। तपाईंको प्रयास उत्कृष्ट छ, हामी सधैं तपाईंको साथमा छौं।"

        return "तपाईंको कुरा ध्यानपूर्वक सुनेँ। तपाईं सुरक्षित हुनुहुन्छ, विस्तारै सुधार हुन्छ।"


class TestAnonymousChatMockNepali(unittest.IsolatedAsyncioTestCase):
    async def test_patient_and_worker_mock_conversation_in_nepali(self):
        server = MockAnonymousChatServer(worker_delay_seconds=0.8)

        patient_lines = [
            "नमस्ते दाइ, केही दिनदेखि मलाई टाउको भारी हुन्छ र निद्रा पनि राम्रो छैन।",
            "आफ्नै गाउँ र समुदायका मानिससँग कुरा गर्दा मलाई धेरै सहज लाग्छ।",
            "धन्यवाद, आज खुलेर कुरा गर्न पाएँ र मन हल्का भयो।",
        ]

        worker_events: list[ChatEvent] = []
        for line in patient_lines:
            worker_events.append(await server.handle_patient_message(line))

        self.assertEqual(len(server.events), 6)

        # Validate alternating PATIENT -> HEALTH_WORKER event order.
        expected_sender_order = [
            "PATIENT",
            "HEALTH_WORKER",
            "PATIENT",
            "HEALTH_WORKER",
            "PATIENT",
            "HEALTH_WORKER",
        ]
        self.assertEqual(
            [event.sender for event in server.events], expected_sender_order
        )

        # Validate short delayed response from worker for each patient message.
        for i in range(0, len(server.events), 2):
            patient_event = server.events[i]
            worker_event = server.events[i + 1]
            self.assertGreaterEqual(worker_event.ts - patient_event.ts, 0.75)

        # Validate worker feedback content on symptoms and emotional state.
        self.assertIn("निद्रा", worker_events[0].text)
        self.assertIn("समुदाय", worker_events[1].text)

        # Validate gratitude / encouragement exchange.
        self.assertIn("धन्यवाद", patient_lines[2])
        self.assertIn("धन्यवाद", worker_events[2].text)


if __name__ == "__main__":
    unittest.main()
