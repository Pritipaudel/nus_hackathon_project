# Chat Mock API Handoff (Frontend)

This document describes the single-sided mock chat API that returns predefined Nepali responses for exact patient question strings.

## Purpose

Use this endpoint when frontend needs a deterministic mock response flow before full AI/chatbot integration.

- User sends a `question` string.
- Backend checks exact string match.
- If matched, backend returns mapped Nepali response.
- If not matched, backend returns a default fallback Nepali response.

## Endpoint

- Method: `POST`
- URL: `/chat/mock/reply`
- Auth: Required (`Authorization: Bearer <access_token>`)
- Content-Type: `application/json`

## Request Body

```json
{
  "question": "string"
}
```

Rules:
- `question` is required.
- Minimum length: 1
- Maximum length: 2000

## Response Body

```json
{
  "question": "string",
  "reply": "string",
  "matched": true
}
```

Fields:
- `question`: Echo of submitted question.
- `reply`: Mock Nepali response from mapping (or fallback message).
- `matched`: `true` if exact match, else `false`.

## Exact-Match Questions and Replies

These must match exactly (same punctuation and spacing after trim):

1. Question:

```text
नमस्ते दाइ, केही दिनदेखि मलाई टाउको दुख्ने र निद्रा कम हुने समस्या छ।
```

Reply:

```text
तपाईंको लक्षण सुनेँ। दैनिक पानी, आराम र नियमित सुत्ने समय राख्नुहोस्।
```

2. Question:

```text
आफ्नै समुदायका मानिससँग कुरा गर्दा मलाई धेरै सहज लाग्छ।
```

Reply:

```text
आफ्नो समुदायसँग जोडिनु राम्रो संकेत हो, तपाईंको प्रगति सकारात्मक छ।
```

3. Question:

```text
धेरै धन्यवाद, म अहिले पहिले भन्दा धेरै खुसी छु।
```

Reply:

```text
धन्यवाद। तपाईंले राम्रो प्रयास गर्नुभएको छ, यसरी नै अगाडि बढ्नुहोस्।
```

Fallback reply when no exact match:

```text
तपाईंको कुरा सुनेँ। कृपया आफ्ना लक्षण अझ विस्तारमा बताउनुहोस्, म सहयोग गर्छु।
```

## Frontend Integration Example

```ts
type MockChatReply = {
  question: string;
  reply: string;
  matched: boolean;
};

export async function fetchMockReply(
  baseUrl: string,
  token: string,
  question: string,
): Promise<MockChatReply> {
  const res = await fetch(`${baseUrl}/chat/mock/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    throw new Error(`Mock reply request failed: ${res.status}`);
  }

  return (await res.json()) as MockChatReply;
}
```

## Suggested UI Behavior

- If `matched === true`: render reply as predefined mock answer.
- If `matched === false`: render fallback message and optionally show hint like "Try supported sample questions".
- Keep chat bubbles UTF-8 safe (Nepali script).

## Error Handling

- `401 Unauthorized`: missing/invalid token.
- `422 Unprocessable Entity`: invalid payload (for example empty `question`).

## Quick Test with curl

```bash
curl -X POST "http://localhost:8000/chat/mock/reply" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"question":"नमस्ते दाइ, केही दिनदेखि मलाई टाउको दुख्ने र निद्रा कम हुने समस्या छ।"}'
```
