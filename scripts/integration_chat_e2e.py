import json
import sys
import time
import uuid

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from backend.main import app


def _assert_status(response, expected: int, label: str) -> None:
    if response.status_code != expected:
        raise AssertionError(
            f"{label} failed: expected {expected}, got {response.status_code}, body={response.text}"
        )


def _signup(client: TestClient, email: str, role: str, anonymous_username: str) -> dict:
    response = client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": "Pass@12345",
            "first_name": "Test",
            "last_name": "User",
            "anonymous_username": anonymous_username,
            "role": role,
        },
    )
    _assert_status(response, 201, f"signup {email}")
    return response.json()


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _apply_migrations() -> None:
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")


def main() -> int:
    print("[0/7] Applying migrations")
    _apply_migrations()

    run_id = uuid.uuid4().hex[:8]

    patient_email = f"patient_{run_id}@example.com"
    worker_email = f"worker_{run_id}@example.com"

    with TestClient(app) as client:
        print("[1/7] Creating patient and health worker users")
        patient_auth = _signup(
            client=client,
            email=patient_email,
            role="USER_PATIENT",
            anonymous_username=f"anon-{run_id}",
        )
        worker_auth = _signup(
            client=client,
            email=worker_email,
            role="USER_HEALTH_WORKER",
            anonymous_username=f"worker-alias-{run_id}",
        )

        patient_token = patient_auth["tokens"]["access_token"]
        worker_token = worker_auth["tokens"]["access_token"]

        print("[2/7] Creating community group for worker onboarding")
        group_response = client.post(
            "/community/groups",
            headers=_auth_header(patient_token),
            json={
                "name": f"Nepali Support Group {run_id}",
                "group_type": "CUSTOM",
                "value": f"nepali-{run_id}",
                "description": "Integration test group",
            },
        )
        _assert_status(group_response, 201, "create community group")
        group_id = group_response.json()["id"]

        print("[3/7] Onboarding health worker profile")
        onboard_response = client.post(
            "/auth/onboard-health-workers",
            headers=_auth_header(worker_token),
            json={
                "username": f"health-worker-{run_id}",
                "organization": "NUS Care",
                "community_id": group_id,
            },
        )
        _assert_status(onboard_response, 200, "onboard health worker")
        onboard_data = onboard_response.json()
        worker_id = onboard_data["health_worker"]["id"]
        worker_token = onboard_data["tokens"]["access_token"]

        print("[4/7] Creating anonymous chat session")
        session_response = client.post(
            "/chat/sessions",
            headers=_auth_header(patient_token),
            json={"health_worker_id": worker_id},
        )
        _assert_status(session_response, 201, "create chat session")
        session_id = session_response.json()["session_id"]

        ws_path_patient = f"/chat/ws/{session_id}?token={patient_token}"
        ws_path_worker = f"/chat/ws/{session_id}?token={worker_token}"

        print("[5/7] Opening websocket connections")
        with client.websocket_connect(ws_path_patient) as ws_patient:
            with client.websocket_connect(ws_path_worker) as ws_worker:
                patient_messages = [
                    "नमस्ते दाइ, केही दिनदेखि मलाई टाउको दुख्ने र निद्रा कम हुने समस्या छ।",
                    "आफ्नै समुदायका मानिससँग कुरा गर्दा मलाई धेरै सहज लाग्छ।",
                    "धेरै धन्यवाद, म अहिले पहिले भन्दा धेरै खुसी छु।",
                ]
                worker_replies = [
                    "तपाईंको लक्षण सुनेँ। दैनिक पानी, आराम र नियमित सुत्ने समय राख्नुहोस्।",
                    "आफ्नो समुदायसँग जोडिनु राम्रो संकेत हो, तपाईंको प्रगति सकारात्मक छ।",
                    "धन्यवाद। तपाईंले राम्रो प्रयास गर्नुभएको छ, यसरी नै अगाडि बढ्नुहोस्।",
                ]

                print(
                    "[6/7] Running Nepali patient-health worker chat with short delays"
                )
                for patient_line, worker_line in zip(patient_messages, worker_replies):
                    ws_patient.send_text(json.dumps({"content": patient_line}))

                    event_for_patient = ws_patient.receive_json()
                    event_for_worker = ws_worker.receive_json()

                    assert event_for_patient["content"] == patient_line
                    assert event_for_worker["content"] == patient_line
                    assert event_for_worker["sender_display_name"].startswith("anon-")

                    time.sleep(0.7)
                    ws_worker.send_text(json.dumps({"content": worker_line}))

                    response_for_patient = ws_patient.receive_json()
                    response_for_worker = ws_worker.receive_json()

                    assert response_for_patient["content"] == worker_line
                    assert response_for_worker["content"] == worker_line

        print("[7/7] Validating persisted conversation history")
        history_response = client.get(
            f"/chat/sessions/{session_id}/messages",
            headers=_auth_header(patient_token),
            params={"limit": 20},
        )
        _assert_status(history_response, 200, "get chat history")

        history = history_response.json()
        if len(history) < 6:
            raise AssertionError(f"Expected at least 6 messages, found {len(history)}")

        all_text = "\n".join(message["content"] for message in history)
        required_checks = ["निद्रा", "समुदाय", "धन्यवाद", "खुसी"]
        for word in required_checks:
            if word not in all_text:
                raise AssertionError(
                    f"Missing expected Nepali keyword in chat history: {word}"
                )

    print("SUCCESS: Chat integration test passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FAIL: {exc}")
        raise
