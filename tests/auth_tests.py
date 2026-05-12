import base64
import hashlib
import hmac
import json
import os
import time

import pytest
import requests

BASE_URL = os.getenv("MARKETPLACE_API_BASE_URL", "http://localhost:8080").rstrip("/")
AUTH_URL = f"{BASE_URL}/auth"
TIMEOUT = 10
JWT_SECRET = "very-secret-key-very-secret-key-very-secret-key"


def api_request(method, path="", *, cookies=None, allow_redirects=True):
    # Унифицированный запрос к auth API с понятным падением, если backend недоступен.
    try:
        response = requests.request(
            method,
            f"{AUTH_URL}{path}",
            cookies=cookies,
            allow_redirects=allow_redirects,
            timeout=TIMEOUT,
        )
    except requests.RequestException as exc:
        pytest.fail(
            f"Не удалось обратиться к API по адресу {AUTH_URL}. "
            f"Убедитесь, что backend запущен. Ошибка: {exc}"
        )
    return response


def b64url_encode(data):
    # Кодирует байты в base64url без padding, как это делается в JWT.
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def b64url_decode(data):
    # Обратное преобразование base64url-строки в байты.
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def make_jwt(subject, token_type, expires_in_seconds, *, secret=JWT_SECRET, issued_at=None):
    # Собирает тестовый JWT с той же схемой подписи, что использует backend.
    if issued_at is None:
        issued_at = int(time.time())

    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(subject),
        "type": token_type,
        "iat": issued_at,
        "exp": issued_at + expires_in_seconds,
    }

    encoded_header = b64url_encode(
        json.dumps(header, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    encoded_payload = b64url_encode(
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    unsigned_token = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(secret.encode("utf-8"), unsigned_token.encode("ascii"), hashlib.sha256).digest()
    encoded_signature = b64url_encode(signature)
    return f"{unsigned_token}.{encoded_signature}"


def parse_jwt_payload(token):
    # Достаёт payload из JWT, чтобы проверить subject, type и сроки жизни токена.
    parts = token.split(".")
    assert len(parts) == 3
    return json.loads(b64url_decode(parts[1]))


def assert_spring_error_response(response, expected_path):
    # Проверяет текущее стандартное Spring-ошибочное тело для необработанных 500.
    assert response.status_code == 500, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert payload["status"] == 500
    assert payload["error"] == "Internal Server Error"
    assert payload["path"] == expected_path
    assert "timestamp" in payload


@pytest.mark.positive
def test_refresh_with_valid_refresh_token_returns_200():
    # Проверяем, что refresh с валидной refresh-cookie успешно отрабатывает.
    refresh_token = make_jwt(1, "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": refresh_token})

    assert response.status_code == 200, response.text
    assert response.text == ""


@pytest.mark.positive
def test_refresh_with_valid_refresh_token_sets_access_token_cookie():
    # Убеждаемся, что после refresh backend действительно выставляет access_token.
    refresh_token = make_jwt(1, "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": refresh_token})

    assert response.status_code == 200, response.text
    assert "access_token" in response.cookies
    assert response.cookies["access_token"]


@pytest.mark.positive
def test_refresh_sets_http_only_access_cookie_attributes():
    # Проверяем основные атрибуты security-cookie у нового access_token.
    refresh_token = make_jwt(1, "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": refresh_token})

    set_cookie = response.headers.get("Set-Cookie", "")
    assert "access_token=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Path=/" in set_cookie
    assert "Max-Age=900" in set_cookie


@pytest.mark.positive
def test_refresh_generates_access_token_for_same_subject():
    # Новый access token должен выпускаться для того же пользователя, что и refresh token.
    refresh_token = make_jwt(123, "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": refresh_token})

    assert response.status_code == 200, response.text
    payload = parse_jwt_payload(response.cookies["access_token"])
    assert payload["sub"] == "123"
    assert payload["type"] == "access"
    assert payload["exp"] > payload["iat"]


@pytest.mark.positive
def test_refresh_ignores_extra_cookies_when_refresh_token_is_valid():
    # Лишние cookies не должны мешать refresh, если нужный refresh_token валиден.
    refresh_token = make_jwt(7, "refresh", 7 * 24 * 60 * 60)

    response = api_request(
        "POST",
        "/refresh",
        cookies={
            "refresh_token": refresh_token,
            "access_token": "stale-token",
            "theme": "dark",
        },
    )

    assert response.status_code == 200, response.text
    payload = parse_jwt_payload(response.cookies["access_token"])
    assert payload["sub"] == "7"
    assert payload["type"] == "access"


@pytest.mark.positive
def test_logout_redirects_to_google_oauth_current_security_behavior():
    # Фиксируем текущее поведение: logout не выполняется контроллером, а редиректит в OAuth flow.
    response = api_request("POST", "/logout", allow_redirects=False)

    assert response.status_code == 302, response.text
    assert response.headers["Location"] == f"{BASE_URL}/oauth2/authorization/google"


@pytest.mark.positive
def test_logout_sets_jsessionid_cookie_current_security_behavior():
    # При текущем редиректе security-слой создаёт JSESSIONID, это тоже фиксируем тестом.
    response = api_request("POST", "/logout", allow_redirects=False)

    assert response.status_code == 302, response.text
    set_cookie = response.headers.get("Set-Cookie", "")
    assert "JSESSIONID=" in set_cookie
    assert "HttpOnly" in set_cookie


@pytest.mark.negative
def test_whoami_without_access_token_returns_current_api_behavior():
    # Без access_token whoami сейчас падает с необработанной 500, тест фиксирует это поведение.
    response = api_request("GET", "/whoami")

    assert_spring_error_response(response, "/auth/whoami")


@pytest.mark.negative
def test_whoami_with_expired_access_token_returns_401():
    # Истёкший access token должен отбрасываться отдельным обработчиком с 401.
    expired_token = make_jwt(1, "access", -60)

    response = api_request("GET", "/whoami", cookies={"access_token": expired_token})

    assert response.status_code == 401, response.text
    assert response.text == "ACCESS_TOKEN_EXPIRED"


@pytest.mark.negative
def test_whoami_with_invalid_signature_returns_current_api_behavior():
    # Токен с неправильной подписью сейчас не обрабатывается красиво и приводит к 500.
    invalid_token = make_jwt(
        1,
        "access",
        15 * 60,
        secret="another-secret-key-another-secret-key-another-secret-key",
    )

    response = api_request("GET", "/whoami", cookies={"access_token": invalid_token})

    assert_spring_error_response(response, "/auth/whoami")


@pytest.mark.negative
def test_whoami_with_malformed_access_token_returns_current_api_behavior():
    # Невалидный формат JWT у whoami тоже приводит к текущей 500-ошибке.
    response = api_request("GET", "/whoami", cookies={"access_token": "not-a-jwt"})

    assert_spring_error_response(response, "/auth/whoami")


@pytest.mark.negative
def test_whoami_with_nonexistent_user_returns_current_api_behavior():
    # Даже с валидным токеном запрос падает, если пользователя с таким id нет в базе.
    access_token = make_jwt(999999, "access", 15 * 60)

    response = api_request("GET", "/whoami", cookies={"access_token": access_token})

    assert_spring_error_response(response, "/auth/whoami")


@pytest.mark.negative
def test_refresh_without_refresh_token_returns_current_api_behavior():
    # Отсутствие refresh_token сейчас даёт необработанную 500, фиксируем это явно.
    response = api_request("POST", "/refresh")

    assert_spring_error_response(response, "/auth/refresh")


@pytest.mark.negative
def test_refresh_with_access_token_instead_of_refresh_token_returns_current_api_behavior():
    # Если вместо refresh token передать access token, backend сейчас отвечает 500.
    wrong_type_token = make_jwt(1, "access", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": wrong_type_token})

    assert_spring_error_response(response, "/auth/refresh")


@pytest.mark.negative
def test_refresh_with_expired_refresh_token_returns_401():
    # Истёкший refresh token должен отклоняться с 401 и текстом ACCESS_TOKEN_EXPIRED.
    expired_token = make_jwt(1, "refresh", -60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": expired_token})

    assert response.status_code == 401, response.text
    assert response.text == "ACCESS_TOKEN_EXPIRED"


@pytest.mark.negative
def test_refresh_with_invalid_signature_returns_current_api_behavior():
    # Неверная подпись refresh token сейчас не маппится в 4xx и приводит к 500.
    invalid_token = make_jwt(
        1,
        "refresh",
        7 * 24 * 60 * 60,
        secret="another-secret-key-another-secret-key-another-secret-key",
    )

    response = api_request("POST", "/refresh", cookies={"refresh_token": invalid_token})

    assert_spring_error_response(response, "/auth/refresh")


@pytest.mark.negative
def test_refresh_with_malformed_token_returns_current_api_behavior():
    # Сломанный формат refresh token тоже воспроизводит текущую 500-ошибку.
    response = api_request("POST", "/refresh", cookies={"refresh_token": "not-a-jwt"})

    assert_spring_error_response(response, "/auth/refresh")


@pytest.mark.negative
def test_refresh_with_non_numeric_subject_returns_current_api_behavior():
    # Если subject нельзя преобразовать в Integer, backend сейчас падает с 500.
    invalid_subject_token = make_jwt("abc", "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": invalid_subject_token})

    assert_spring_error_response(response, "/auth/refresh")
