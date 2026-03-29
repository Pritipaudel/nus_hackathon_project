#!/usr/bin/env bash
set -uo pipefail

BASE="http://localhost:8000"
FRONTEND="http://localhost:3001"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

pass() { echo -e "${GREEN}  PASS${RESET}  $1"; ((PASS++)); }
fail() { echo -e "${RED}  FAIL${RESET}  $1 — $2"; ((FAIL++)); }
section() { echo -e "\n${CYAN}━━━  $1  ━━━${RESET}"; }

expect_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    pass "$label (HTTP $actual)"
  else
    fail "$label" "expected HTTP $expected, got HTTP $actual"
  fi
}

expect_field() {
  local label="$1"
  local field="$2"
  local body="$3"
  if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$field' in d or any('$field' in str(v) for v in d.values())" 2>/dev/null; then
    pass "$label (field '$field' present)"
  else
    fail "$label" "field '$field' missing in response"
  fi
}

# ────────────────────────────────────────────────
section "INFRASTRUCTURE"
# ────────────────────────────────────────────────

status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
expect_status "Backend /health" "200" "$status"

status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND")
expect_status "Frontend reachable" "200" "$status"

# ────────────────────────────────────────────────
section "AUTH — SIGNUP"
# ────────────────────────────────────────────────

TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="Test1234!"

signup_body=$(curl -s -X POST "$BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\",\"anonymous_username\":\"anon_test\",\"role\":\"USER_PATIENT\"}")

signup_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dupe_$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\",\"anonymous_username\":\"anon_test2\",\"role\":\"USER_PATIENT\"}")
expect_status "POST /auth/signup (patient)" "201" "$signup_status"

expect_field "Signup response has 'user'" "user" "$signup_body"
expect_field "Signup response has 'tokens'" "tokens" "$signup_body"

hw_email="hw_$(date +%s)@example.com"
hw_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$hw_email\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Health\",\"last_name\":\"Worker\",\"anonymous_username\":\"hw_anon\",\"role\":\"USER_HEALTH_WORKER\"}")
expect_status "POST /auth/signup (health worker)" "201" "$hw_status"

# ────────────────────────────────────────────────
section "AUTH — LOGIN & TOKEN"
# ────────────────────────────────────────────────

login_resp=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dupe_$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

login_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dupe_$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
expect_status "POST /auth/login" "200" "$login_status"

TOKEN=$(echo "$login_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tokens']['access_token'])" 2>/dev/null || echo "")
if [[ -n "$TOKEN" ]]; then
  pass "JWT token extracted from login response"
else
  fail "JWT token extraction" "could not parse access_token from login response"
fi

bad_login_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dupe_$TEST_EMAIL\",\"password\":\"wrongpassword\"}")
expect_status "POST /auth/login (wrong password → 401)" "401" "$bad_login_status"

# ────────────────────────────────────────────────
section "AUTH — /me"
# ────────────────────────────────────────────────

me_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN")
expect_status "GET /auth/me (authenticated)" "200" "$me_status"

me_body=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $TOKEN")
expect_field "GET /auth/me has 'email'" "email" "$me_body"

unauth_me=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me")
expect_status "GET /auth/me (no token → 401)" "401" "$unauth_me"

# ────────────────────────────────────────────────
section "iCBT PROGRAMMES"
# ────────────────────────────────────────────────

icbt_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/icbt/programs")
expect_status "GET /icbt/programs" "200" "$icbt_status"

icbt_list_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/icbt/list")
expect_status "GET /icbt/list" "200" "$icbt_list_status"

my_icbt_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/icbt/my-programs" \
  -H "Authorization: Bearer $TOKEN")
expect_status "GET /icbt/my-programs (authenticated)" "200" "$my_icbt_status"

PROGRAM_ID=$(curl -s "$BASE/icbt/programs" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(d[0]['id']) if d else print('')
" 2>/dev/null || echo "")

if [[ -n "$PROGRAM_ID" ]]; then
  pass "iCBT programs list is non-empty (first id: ${PROGRAM_ID:0:8}...)"
  enroll_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/icbt/enroll" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"program_id\":\"$PROGRAM_ID\"}")
  if [[ "$enroll_status" == "200" || "$enroll_status" == "409" ]]; then
    pass "POST /icbt/enroll (200 ok or 409 already enrolled)"
  else
    fail "POST /icbt/enroll" "got HTTP $enroll_status"
  fi

  progress_status=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
    "$BASE/icbt/programs/$PROGRAM_ID/progress" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"progress_percent": 25}')
  if [[ "$progress_status" == "200" || "$progress_status" == "404" ]]; then
    pass "PATCH /icbt/programs/{id}/progress (200 or 404 if not enrolled)"
  else
    fail "PATCH /icbt/programs/{id}/progress" "got HTTP $progress_status"
  fi
else
  fail "iCBT programs list" "empty — run seed_icbt_programs.py first"
fi

# ────────────────────────────────────────────────
section "COMMUNITY POSTS"
# ────────────────────────────────────────────────

posts_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/community/posts")
expect_status "GET /community/posts" "200" "$posts_status"

trending_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/community/posts/trending")
expect_status "GET /community/posts/trending" "200" "$trending_status"

groups_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/community/groups")
expect_status "GET /community/groups" "200" "$groups_status"

create_post_resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE/community/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -F "content=Integration test post $(date +%s)" \
  -F "category=GENERAL")
create_post_status=$(echo "$create_post_resp" | tail -1)
expect_status "POST /community/posts (multipart)" "201" "$create_post_status"

POST_ID=$(echo "$create_post_resp" | head -1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('post_id',''))" 2>/dev/null || echo "")

if [[ -n "$POST_ID" ]]; then
  pass "Community post created (id: ${POST_ID:0:8}...)"

  react_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/community/posts/$POST_ID/react" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"reaction_type":"UPVOTE"}')
  expect_status "POST /community/posts/{id}/react" "200" "$react_status"

  flag_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/community/posts/$POST_ID/flag" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"reason":"Integration test flag"}')
  expect_status "POST /community/posts/{id}/flag" "200" "$flag_status"

  get_post_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/community/posts/$POST_ID")
  expect_status "GET /community/posts/{id}" "200" "$get_post_status"

  delete_status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/community/posts/$POST_ID" \
    -H "Authorization: Bearer $TOKEN")
  expect_status "DELETE /community/posts/{id}" "200" "$delete_status"
else
  fail "Community post creation" "could not parse post_id"
fi

posts_by_category=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/community/posts?category=ANXIETY&limit=5")
expect_status "GET /community/posts?category=ANXIETY" "200" "$posts_by_category"

# ────────────────────────────────────────────────
section "HEALTH WORKERS"
# ────────────────────────────────────────────────

hw_list_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health_workers")
expect_status "GET /health_workers" "200" "$hw_list_status"

my_meetings_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/meetings/my" \
  -H "Authorization: Bearer $TOKEN")
expect_status "GET /meetings/my (authenticated)" "200" "$my_meetings_status"

# ────────────────────────────────────────────────
section "TRAINING"
# ────────────────────────────────────────────────

training_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/training/programs")
expect_status "GET /training/programs" "200" "$training_status"

USER_ID=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")

if [[ -n "$USER_ID" ]]; then
  certs_status=$(curl -s -o /dev/null -w "%{http_code}" \
    "$BASE/training/users/$USER_ID/certifications")
  expect_status "GET /training/users/{id}/certifications" "200" "$certs_status"
else
  fail "GET /training/users/{id}/certifications" "could not resolve user id"
fi

TRAINING_ID=$(curl -s "$BASE/training/programs" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(d[0]['id']) if d else print('')
" 2>/dev/null || echo "")

if [[ -n "$TRAINING_ID" ]]; then
  enroll_tr_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/training/enroll" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"program_id\":\"$TRAINING_ID\"}")
  if [[ "$enroll_tr_status" == "201" || "$enroll_tr_status" == "409" ]]; then
    pass "POST /training/enroll (201 or 409 already enrolled)"
  else
    fail "POST /training/enroll" "got HTTP $enroll_tr_status"
  fi
else
  fail "POST /training/enroll" "no training programs found"
fi

# ────────────────────────────────────────────────
section "AUTH GUARD — PROTECTED ROUTES"
# ────────────────────────────────────────────────

no_token_enroll=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/icbt/enroll" \
  -H "Content-Type: application/json" \
  -d '{"program_id":"00000000-0000-0000-0000-000000000000"}')
expect_status "POST /icbt/enroll (no token → 401)" "401" "$no_token_enroll"

no_token_post=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/community/posts" \
  -F "content=test" -F "category=GENERAL")
expect_status "POST /community/posts (no token → 401)" "401" "$no_token_post"

no_token_meetings=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/meetings/my")
expect_status "GET /meetings/my (no token → 401)" "401" "$no_token_meetings"

# ────────────────────────────────────────────────
section "ONBOARDING"
# ────────────────────────────────────────────────

onboard_status=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/auth/onboarding/complete" \
  -H "Authorization: Bearer $TOKEN")
if [[ "$onboard_status" == "200" || "$onboard_status" == "422" ]]; then
  pass "PATCH /auth/onboarding/complete (reachable)"
else
  fail "PATCH /auth/onboarding/complete" "got HTTP $onboard_status"
fi

# ────────────────────────────────────────────────
section "SUMMARY"
# ────────────────────────────────────────────────

TOTAL=$((PASS + FAIL))
echo ""
echo -e "${YELLOW}Results: $PASS/$TOTAL passed${RESET}"
if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}$FAIL test(s) failed${RESET}"
  exit 1
else
  echo -e "${GREEN}All tests passed${RESET}"
fi
