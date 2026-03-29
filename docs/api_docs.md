

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

Frontend integration notes:

- Date fields are ISO-8601 datetime strings in UTC.
- `status` is either `ACTIVE` or `COMPLETED`.
- For protected ICBT APIs, send `Authorization: Bearer <access_token>`.
- `community_metadata` can be an empty array when a program has no mapped communities yet.

## GET `/icbt/list`

List ICBT programs with optional community filter and aggregated community stats.

Auth: Not required.

**Query Params (optional)**

- `community_id=uuid`

**Response**

```json
[
  {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "difficulty_level": "string",
    "duration_days": 30,
    "url": "url",
    "community_metadata": [
      {
        "community_id": "uuid",
        "community_name": "string",
        "community_group_type": "RELIGION",
        "total_users_using": 12,
        "total_users_completed": 8,
        "total_users_in_progress": 4
      }
    ]
  }
]
```

Possible errors:

- `404` when `community_id` does not exist.

---

## GET `/icbt/programs`

Backward-compatible alias of `/icbt/list`.

Auth: Not required.

---

## POST `/icbt/enroll`

Enroll current user into an ICBT program.

Auth: Required.

Notes:

- `community_id` is optional.
- If provided, it must be already mapped to that program.

**Request**

```json
{
  "program_id": "uuid",
  "community_id": "uuid (optional)"
}
```

**Response**

```json
{
  "enrollment_id": "uuid",
  "status": "ACTIVE",
  "program_id": "uuid",
  "progress_percent": 0,
  "community_id": "uuid|null"
}
```

Possible errors:

- `404` when program/community/user is not found.
- `409` when user is already enrolled in the program.
- `400` when community is not mapped to the given program.

---

## PUT `/icbt/programs/{program_id}/communities`

Assign focused communities to an ICBT program (supports multiple communities).

Auth: Required.

Notes:

- This endpoint replaces existing community mappings for the program.
- Use this before allowing community-specific enrollments.

**Request**

```json
{
  "community_ids": ["uuid", "uuid"]
}
```

**Response**

```json
{
  "program_id": "uuid",
  "community_ids": ["uuid", "uuid"]
}
```

Possible errors:

- `404` when program or any community is not found.

---

## GET `/icbt/my-programs`

Get current user enrolled programs and individual progress.

Auth: Required.

**Response**

```json
[
  {
    "enrollment_id": "uuid",
    "program_id": "uuid",
    "title": "string",
    "description": "string|null",
    "difficulty_level": "string|null",
    "duration_days": 30,
    "url": "string|null",
    "status": "ACTIVE",
    "progress_percent": 40,
    "community_id": "uuid|null",
    "community_name": "string|null",
    "started_at": "datetime",
    "last_activity_at": "datetime",
    "completed_at": "datetime|null"
  }
]
```

Possible errors:

- `401` when token is missing/invalid.

---

## PATCH `/icbt/programs/{program_id}/progress`

Update user progress in a specific ICBT program (0-100).

Auth: Required.

Notes:

- `progress_percent = 100` marks program `COMPLETED`.
- Any value `< 100` keeps/sets status as `ACTIVE`.

**Request**

```json
{
  "progress_percent": 75
}
```

**Response**

```json
{
  "enrollment_id": "uuid",
  "program_id": "uuid",
  "status": "ACTIVE|COMPLETED",
  "progress_percent": 75,
  "completed_at": "datetime|null"
}
```

Possible errors:

- `404` when user has no enrollment for that program.
- `422` when `progress_percent` is outside `0..100`.

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

# 🎭 Module: Anonymous Problems

---

## 1. Create Problem

**POST** `problem/create`


### Request Body

```json
{
  "title": "Relatives toxic behaviour",
  "description": "Constant pressure about marriage and career comparisons.",
  "category": "Family Trauma",
  "severity_level": 3,
  "community_group_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

- `description`, `severity_level`, and `community_group_id` are **optional**.

### Response: `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Relatives toxic behaviour",
  "description": "Constant pressure about marriage...",
  "category": "Family Trauma",
  "severity_level": 3,
  "upvote_count": 1,
  "has_upvoted": true,
  "created_at": "2026-03-29T10:00:00Z"
}
```

---

## 2. List Problems (With Trending)

**GET** `problem/list-with-count`


### Response: `200 OK`

```json
[
  {
    "category": "Trending",
    "total_upvotes": 1250,
    "problems": [
      {
        "id": "uuid-1",
        "title": "Bus bad touch with girls",
        "description": "I've noticed a lot of harassment...",
        "upvote_count": 450,
        "has_upvoted": false,
        "category_origin": "Harassment"
      }
    ]
  },
  {
    "category": "Harassment",
    "total_upvotes": 540,
    "problems": [
      {
        "id": "uuid-1",
        "title": "Bus bad touch with girls",
        "description": "I've noticed a lot of harassment...",
        "category": "Harassment",
        "severity_level": 4,
        "upvote_count": 300,
        "created_at": "2026-03-29T10:00:00Z",
        "has_upvoted": false
      }
    ]
  }
]
```


---

## 3. Toggle Upvote

**POST** `problem/upvote/{id}`

An anonymous toggle to safely upvote or remove an upvote for a specific problem. If the user has already upvoted, calling this again will "unlike" it.

### URL Parameters

- `id`: The UUID of the problem to upvote.

### Response: `200 OK`

```json
{
  "status": "upvoted",
  "upvote_count": 301
}
```

- `status` can be either `"upvoted"` or `"removed"`.

---

---

# ✅ Notes (Important Design Decisions)

* Anonymous identity handled via `username`
* Media upload via **pre-signed MinIO URLs**
* Verified users = trained / certified users
* Community safety via:

  * Flagging
  * Moderation (health workers)
* Fully stateless (JWT-based)


