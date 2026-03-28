

# 🌐 Mental Health Platform API (v1)

**Base URL:** `/api/v1`
**Auth:** `Authorization: Bearer <JWT>`

---

# 🔐 Auth

## POST `/auth/register`

Creates a new user.

**Request**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response**

```json
{
  "user_id": "uuid",
  "access_token": "string"
}
```

---

## POST `/auth/login`

Login user.

**Request**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response**

```json
{
  "access_token": "string"
}
```

---

## GET `/auth/me`

Get current user.

**Response**

```json
{
  "user_id": "uuid",
  "email": "string",
  "role": "string",
  "is_verified": true
}
```

---

# 👤 Users

## PATCH `/users/profile`

Update user profile (used for anonymous username).

**Request**

```json
{
  "username": "string",
  "age": 25,
  "gender": "string",
  "location": "string"
}
```

**Response**

```json
{
  "status": "updated"
}
```

---

## POST `/users/onboarding`

Submit onboarding responses.
add commuhity based questions 
**Request**

```json
{
  "responses": [
    {
      "question_key": "mood_level",
      "answer": "low"
    }
  ]
}
```

**Response**

```json
{
  "status": "saved"
}
```

---

# 🗂️ Media (MinIO आधारित)

## POST `/media/upload-url`

Get pre-signed URL for upload.

**Request**

```json
{
  "file_name": "image.png",
  "content_type": "image/png"
}
```

**Response**

```json
{
  "upload_url": "string",
  "file_url": "string"
}
```

---

# 🧠 ICBT

## GET `/icbt/programs`

List all ICBT programs.

**Response**
if it can be used to view link preview cards that will be best.
```json
[
  {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "difficulty_level": "string",
    "duration_days": 30
    "url":"url"
  }
]
```

---

## POST `/icbt/enroll`

Enroll in a program.

**Request**

```json
{
  "program_id": "uuid"
}
```

**Response**

```json
{
  "enrollment_id": "uuid",
  "status": "ACTIVE"
}
```

---

## GET `/icbt/my-programs`

Get user enrolled programs.

**Response**

```json
[
  {
    "program_id": "uuid",
    "status": "ACTIVE",
    "progress_percent": 40
  }
]
```

---

## POST `/icbt/modules/{module_id}/complete`

Mark module as completed.

**Response**

```json
{
  "status": "completed"
}
```

---

# 🧑‍🤝‍🧑 Community

## POST `/community/posts`

Create a post (supports media).

**Request**

```json
{
  "content": "string",
  "category": "ANXIETY",
  "media_urls": [
    "https://minio-url/file.png"
  ]
}
```

**Response**

```json
{
  "post_id": "uuid"
}
```

---

## GET `/community/posts`

List posts.

**Query Params:** `category`, `page`, `limit`

**Response**

```json
[
  {
    "id": "uuid",
    "username": "anonymous123",
    "content": "string",
    "media_urls": [
      "string"
    ],
    "category": "ANXIETY",
    "is_verified": false,
    "created_at": "datetime"
  }
]
```

---

## GET `/community/posts/trending`

Trending posts.

**Response**

```json
[
  {
    "id": "uuid",
    "content": "string",
    "trend_score": 87
  }
]
```

---

## POST `/community/posts/{post_id}/react`

React to a post.

**Request**

```json
{
  "reaction_type": "UPVOTE"
}
```

**Response**

```json
{
  "status": "added"
}
```

---

## POST `/community/posts/{post_id}/flag`

Flag inappropriate content.

**Request**

```json
{
  "reason": "abuse"
}
```

**Response**

```json
{
  "status": "flagged"
}
```

---

# 🧑‍⚕️ Health Workers

## GET `/workers`

List community health workers.

**Response**

```json
[
  {
    "id": "uuid",
    "username": "worker_1",
    "organization": "NGO Name",
    "is_verified": true
  }
]
```

---

# 📅 Meetings

## POST `/meetings`

Create meeting with health worker.

**Request**

```json
{
  "health_worker_id": "uuid",
  "scheduled_at": "2026-03-30T10:00:00Z"
}
```

**Response**

```json
{
  "meeting_id": "uuid",
  "meeting_link": "string"
}
```

---

## GET `/meetings/my`

Get user meetings.

**Response**

```json
[
  {
    "id": "uuid",
    "scheduled_at": "datetime",
    "status": "SCHEDULED"
  }
]
```

---

# 🎓 Training

## GET `/training/programs`

List training programs.

**Response**

```json
[
  {
    "id": "uuid",
    "title": "Mental Health Awareness",
    "organization": "WHO",
    "is_verified": true
  }
]
```

---

## POST `/training/enroll`

Enroll in training.

**Request**

```json
{
  "program_id": "uuid"
}
```

**Response**

```json
{
  "status": "enrolled"
}
```

---

## GET `/training/certifications`

Get certifications.

**Response**

```json
[
  {
    "program_title": "Mental Health Awareness",
    "issued_at": "datetime",
    "verified": true
  }
]
```

---

# 📊 Insights

## GET `/insights/trending-issues`

Get trending community issues.

**Response**

```json
[
  {
    "category": "DOMESTIC_VIOLENCE",
    "location": "Kathmandu",
    "report_count": 120
  }
]
```

---

# ✅ Notes (Important Design Decisions)

* Anonymous identity handled via `username`
* Media upload via **pre-signed MinIO URLs**
* Verified users = trained / certified users
* Community safety via:

  * Flagging
  * Moderation (health workers)
* Fully stateless (JWT-based)


