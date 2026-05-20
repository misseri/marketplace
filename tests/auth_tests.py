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
    # Все auth-тесты ходят через один хелпер.
    # Это нужно, чтобы одинаково обрабатывать сетевые ошибки и сразу видеть,
    # что проблема в недоступном backend, а не в конкретной проверке.
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
    # JWT кодируется в base64url без "=" на конце, поэтому собираем токены так же,
    # как это делает backend.
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def b64url_decode(data):
    # Обратная операция нужна только для чтения payload из токена,
    # который backend вернул после refresh.
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def make_jwt(subject, token_type, expires_in_seconds, *, secret=JWT_SECRET, issued_at=None):
    # Тесты не завязаны на реальный OAuth-логин.
    # Мы вручную собираем JWT с тем же secret и теми же claims, что использует backend,
    # чтобы независимо проверять /auth/whoami и /auth/refresh на валидных,
    # просроченных, битых и подменённых токенах.
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
    # Нужен только для позитивных сценариев refresh:
    # проверяем, что backend вернул access token для того же пользователя
    # и с правильным типом токена.
    parts = token.split(".")
    assert len(parts) == 3
    return json.loads(b64url_decode(parts[1]))


def assert_spring_error_response(response, expected_path):
    # Часть негативных кейсов в текущей реализации backend не превращается в 4xx,
    # а падает как обычная Spring 500.
    # Эти тесты специально фиксируют текущее наблюдаемое поведение,
    # а сохранение факта "как API работает сейчас".
    assert response.status_code == 500, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert payload["status"] == 500
    assert payload["error"] == "Internal Server Error"
    assert payload["path"] == expected_path
    assert "timestamp" in payload


@pytest.mark.positive
def test_refresh_with_valid_refresh_token_returns_200():
    # Базовый happy path для /auth/refresh:
    # если refresh_token валиден, endpoint должен успешно отработать и вернуть 200.
    refresh_token = make_jwt(1, "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": refresh_token})

    assert response.status_code == 200, response.text
    assert response.text == ""


@pytest.mark.positive
def test_refresh_with_valid_refresh_token_sets_access_token_cookie():
    # Важный эффект refresh не только статус 200, но и выпуск нового access_token.
    # Этот тест нужен, чтобы не пропустить регрессию, когда ответ успешный,
    # а cookie с access token больше не выставляется.
    refresh_token = make_jwt(1, "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": refresh_token})

    assert response.status_code == 200, response.text
    assert "access_token" in response.cookies
    assert response.cookies["access_token"]


@pytest.mark.positive
def test_refresh_sets_http_only_access_cookie_attributes():
    # Здесь проверяем уже не сам факт выдачи токена, а его cookie-настройки.
    # Это защита от тихих изменений security-конфига: HttpOnly, Path и Max-Age
    # должны остаться на месте.
    refresh_token = make_jwt(1, "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": refresh_token})

    set_cookie = response.headers.get("Set-Cookie", "")
    assert "access_token=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Path=/" in set_cookie
    assert "Max-Age=900" in set_cookie


@pytest.mark.positive
def test_refresh_generates_access_token_for_same_subject():
    # Проверяем смысл refresh-операции:
    # backend должен выпустить access token для того же пользователя,
    # который был записан в refresh token, а type обязан стать "access".
    refresh_token = make_jwt(123, "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": refresh_token})

    assert response.status_code == 200, response.text
    payload = parse_jwt_payload(response.cookies["access_token"])
    assert payload["sub"] == "123"
    assert payload["type"] == "access"
    assert payload["exp"] > payload["iat"]


@pytest.mark.positive
def test_refresh_ignores_extra_cookies_when_refresh_token_is_valid():
    # Реальный браузер отправляет не только auth-cookie.
    # Этот тест показывает, что backend ориентируется именно на refresh_token
    # и не ломается из-за лишних cookies в запросе.
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
    # Это не "правильный logout" в абстрактном смысле, а фиксация текущего поведения.
    # Сейчас POST /auth/logout не отрабатывает как очистка auth-cookie,
    # а уходит в редирект на Google OAuth из-за security-конфигурации.
    response = api_request("POST", "/logout", allow_redirects=False)

    assert response.status_code == 302, response.text
    assert response.headers["Location"] == f"{BASE_URL}/oauth2/authorization/google"


@pytest.mark.positive
def test_logout_sets_jsessionid_cookie_current_security_behavior():
    # Этот тест дополняет предыдущий:
    # при текущем редиректе security-слой создаёт JSESSIONID,
    # часть фактического контракта.
    response = api_request("POST", "/logout", allow_redirects=False)

    assert response.status_code == 302, response.text
    set_cookie = response.headers.get("Set-Cookie", "")
    assert "JSESSIONID=" in set_cookie
    assert "HttpOnly" in set_cookie


@pytest.mark.negative
def test_whoami_without_access_token_returns_current_api_behavior():
    # Этот тест нужен как документирование текущего дефекта:
    # без access_token endpoint /auth/whoami сейчас не отдаёт 401/403,
    # а падает с необработанной 500.
    response = api_request("GET", "/whoami")

    assert_spring_error_response(response, "/auth/whoami")


@pytest.mark.negative
def test_whoami_with_expired_access_token_returns_401():
    # Здесь уже другой путь обработки:
    # просроченный access token ловится отдельным exception-handler'ом
    # и возвращает стабильный 401 с текстом ACCESS_TOKEN_EXPIRED.
    expired_token = make_jwt(1, "access", -60)

    response = api_request("GET", "/whoami", cookies={"access_token": expired_token})

    assert response.status_code == 401, response.text
    assert response.text == "ACCESS_TOKEN_EXPIRED"


@pytest.mark.negative
def test_whoami_with_invalid_signature_returns_current_api_behavior():
    # Здесь токен похож на валидный по структуре, но подписан чужим secret.
    # Тест отделяет кейс "битая подпись" от кейса "битый формат".
    # В текущей реализации backend это заканчивается обычной 500.
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
    # Здесь проверяем отдельный класс ошибки:
    # token не просто "не тот", а вообще не является корректным JWT.
    # Сейчас backend отвечает тем же 500, но смысл кейса другой.
    response = api_request("GET", "/whoami", cookies={"access_token": "not-a-jwt"})

    assert_spring_error_response(response, "/auth/whoami")


@pytest.mark.negative
def test_whoami_with_nonexistent_user_returns_current_api_behavior():
    # В этом сценарии сам токен валиден, но user id из subject не существует в базе.
    # Тест полезен тем, что отделяет проблемы валидации JWT от проблем поиска пользователя.
    access_token = make_jwt(999999, "access", 15 * 60)

    response = api_request("GET", "/whoami", cookies={"access_token": access_token})

    assert_spring_error_response(response, "/auth/whoami")


@pytest.mark.negative
def test_refresh_without_refresh_token_returns_current_api_behavior():
    # Базовый негативный сценарий для /auth/refresh:
    # если refresh_token отсутствует, backend сейчас не возвращает аккуратную 4xx-ошибку,
    # а падает с 500. Тест фиксирует это текущее состояние.
    response = api_request("POST", "/refresh")

    assert_spring_error_response(response, "/auth/refresh")


@pytest.mark.negative
def test_refresh_with_access_token_instead_of_refresh_token_returns_current_api_behavior():
    # Здесь cookie есть, но лежит токен неправильного типа.
    # Тест показывает, что backend различает access/refresh по claim type,
    # и на текущем коде такой случай приводит к 500.
    wrong_type_token = make_jwt(1, "access", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": wrong_type_token})

    assert_spring_error_response(response, "/auth/refresh")


@pytest.mark.negative
def test_refresh_with_expired_refresh_token_returns_401():
    # Просроченный refresh token идёт по отдельной ветке обработки:
    # здесь мы уже ожидаем не 500, а 401 от AuthExceptionHandler.
    expired_token = make_jwt(1, "refresh", -60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": expired_token})

    assert response.status_code == 401, response.text
    assert response.text == "ACCESS_TOKEN_EXPIRED"


@pytest.mark.negative
def test_refresh_with_invalid_signature_returns_current_api_behavior():
    # Отдельно фиксируем кейс подменённой подписи:
    # claims выглядят нормально, но token подписан другим secret.
    # Сейчас backend не превращает этот случай в 4xx и отдаёт 500.
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
    # Этот кейс нужен отдельно от invalid_signature:
    # здесь token вообще сломан по формату, а не просто подписан чужим ключом.
    response = api_request("POST", "/refresh", cookies={"refresh_token": "not-a-jwt"})

    assert_spring_error_response(response, "/auth/refresh")


@pytest.mark.negative
def test_refresh_with_non_numeric_subject_returns_current_api_behavior():
    # Backend ожидает, что subject можно преобразовать в Integer user id.
    # Если в sub приходит строка вроде "abc", запрос сейчас падает с 500.
    invalid_subject_token = make_jwt("abc", "refresh", 7 * 24 * 60 * 60)

    response = api_request("POST", "/refresh", cookies={"refresh_token": invalid_subject_token})

    assert_spring_error_response(response, "/auth/refresh")
