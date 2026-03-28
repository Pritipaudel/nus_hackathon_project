# Testing ICBT API endpoints

import os
import asyncio
import urllib.request
import json
import uuid

from dotenv import load_dotenv
load_dotenv(".env")

from backend.core.database import async_engine
from backend.models.icbt import ICBTProgram
from sqlalchemy.ext.asyncio import AsyncSession

async def create_program():
    async with AsyncSession(async_engine) as session:
        prog = ICBTProgram(title="Depression Treatment", description="A starter program")
        session.add(prog)
        await session.commit()
        await session.refresh(prog)
        return str(prog.id)

def req(path, body=None, token=None, method="POST"):
    req = urllib.request.Request("http://127.0.0.1:8008" + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = None
    if body:
        data = json.dumps(body).encode("utf-8")
    try:
        with urllib.request.urlopen(req, data=data) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} for {path}: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Connection error: {e}")
        return None

async def main():
    try:
        prog_id = await create_program()
        print(f"Inserted dummy program ID: {prog_id}")
    except Exception as e:
        print(f"Failed to create program: {e}")
        return

    print("Signing up user...")
    user = req("/auth/signup", {
        "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
        "first_name": "Test",
        "last_name": "User",
        "password": "Password123!",
        "role": "USER_PATIENT"
    })
    
    if not user:
        return
        
    token = user["tokens"]["access_token"]
    print(f"User signed up successfully. Token: {token[:15]}...")

    print("Enrolling in program...")
    enroll = req("/icbt/enroll", {"program_id": prog_id}, token=token)
    print(f"Enroll response: {enroll}")

    print("Fetching personal enrollments...")
    my_progs = req("/icbt/my-programs", token=token, method="GET")
    print(f"My programs response: {my_progs}")

    print("Completing module 'module_intro_1'...")
    comp = req("/icbt/modules/module_intro_1/complete", token=token)
    print(f"Module complete response: {comp}")

if __name__ == "__main__":
    asyncio.run(main())
