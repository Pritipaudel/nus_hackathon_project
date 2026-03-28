import asyncio
from datetime import datetime

from tests.test_chat_mock_nepali import MockAnonymousChatServer


def _stamp() -> str:
    return datetime.now().strftime("%H:%M:%S")


async def run_demo() -> None:
    server = MockAnonymousChatServer(worker_delay_seconds=1.0)

    patient_lines = [
        "नमस्ते दिदी, केही समयदेखि तनाव धेरै छ र निद्रा बिग्रिएको छ।",
        "आफ्नै समुदायका मान्छेसँग कुरा गर्दा आत्मविश्वास बढेको जस्तो लाग्छ।",
        "धेरै धन्यवाद, आजको कुरा पछि म अलि खुसी छु।",
    ]

    print("Mock Anonymous Chat Demo (Nepali)")
    print("-" * 42)

    for line in patient_lines:
        print(f"[{_stamp()}] PATIENT: {line}")
        reply = await server.handle_patient_message(line)
        print(f"[{_stamp()}] HEALTH_WORKER: {reply.text}")


if __name__ == "__main__":
    asyncio.run(run_demo())
