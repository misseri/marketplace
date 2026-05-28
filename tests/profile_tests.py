import base64
import hashlib
import hmac
import json
import os
import time

import pytest
import requests

BASE_URL = os.getenv("MARKETPLACE_API_BASE_URL", "http://localhost:8080").rstrip("/")
PROFILE_URL = f"{BASE_URL}/profile"
AUTH_URL = f"{BASE_URL}/auth"
TIMEOUT = 10
JWT_SECRET = "very-secret-key-very-secret-key-very-secret-key"


def api_request(method, path="", *, cookies=None, json_body=None):
    # Все profile-тесты ходят через один helper, чтобы одинаково обрабатывать
    # сетевые ошибки и сразу отделять падение backend от падения конкретной проверки.
    try:
        response = requests.request(
            method,
            f"{PROFILE_URL}{path}",
            cookies=cookies,
            json=json_body,
            timeout=TIMEOUT,
        )
    except requests.RequestException as exc:
        pytest.fail(
            f"Не удалось обратиться к API по адресу {PROFILE_URL}. "
            f"Убедитесь, что backend запущен. Ошибка: {exc}"
        )
    return response


def auth_request(method, path="", *, cookies=None):
    try:
        response = requests.request(
            method,
            f"{AUTH_URL}{path}",
            cookies=cookies,
            timeout=TIMEOUT,
        )
    except requests.RequestException as exc:
        pytest.fail(
            f"Не удалось обратиться к API по адресу {AUTH_URL}. "
            f"Убедитесь, что backend запущен. Ошибка: {exc}"
        )
    return response


def b64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make_jwt(subject, token_type, expires_in_seconds, *, secret=JWT_SECRET, issued_at=None):
    # Профиль опирается на тот же access_token, что и auth.
    # Поэтому генерируем JWT тем же способом, чтобы безопасно тестировать
    # profile/me без реального браузерного OAuth-логина.
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


def access_cookies(user_id, *, secret=JWT_SECRET):
    return {"access_token": make_jwt(user_id, "access", 15 * 60, secret=secret)}


def find_existing_user_id():
    # В тестовой среде нет отдельного API для создания локального пользователя,
    # поэтому находим любого уже существующего пользователя через /auth/whoami,
    # перебирая небольшое окно id, как и product-тесты динамически подбирают данные.
    for user_id in range(1, 101):
        response = auth_request("GET", "/whoami", cookies=access_cookies(user_id))
        if response.status_code == 200:
            payload = response.json()
            if isinstance(payload, dict) and payload.get("id") == user_id:
                return user_id
    pytest.skip("Не удалось найти существующего пользователя для profile-тестов")


@pytest.fixture
def existing_user_profile():
    user_id = find_existing_user_id()
    response = api_request("GET", "/me", cookies=access_cookies(user_id))
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    yield user_id, payload


# Проверяет базовую схему ответа профиля текущего пользователя.
# Это контрактный тест на наличие всех ключевых полей, которые ожидает frontend.
@pytest.mark.positive
def test_get_my_profile_returns_expected_schema(existing_user_profile):
    user_id, _ = existing_user_profile

    response = api_request("GET", "/me", cookies=access_cookies(user_id))

    assert response.status_code == 200, response.text
    profile = response.json()
    for field in ("id", "lastName", "firstName", "middleName", "login", "email"):
        assert field in profile


# Проверяет, что backend возвращает непустой login в данных профиля.
# Такой тест защищает от регрессий, при которых профиль становится формально успешным, но неполным.
@pytest.mark.positive
def test_get_my_profile_returns_non_empty_login(existing_user_profile):
    user_id, _ = existing_user_profile

    response = api_request("GET", "/me", cookies=access_cookies(user_id))

    assert response.status_code == 200, response.text
    profile = response.json()
    assert isinstance(profile["login"], str)
    assert profile["login"].strip() != ""


# Фиксирует текущее фактическое поведение profile API.
# Сейчас поле email возвращается тем же значением, что и login, и тест явно это документирует.
@pytest.mark.positive
def test_get_my_profile_returns_email_equal_to_login_current_behavior(existing_user_profile):
    user_id, _ = existing_user_profile

    response = api_request("GET", "/me", cookies=access_cookies(user_id))

    assert response.status_code == 200, response.text
    profile = response.json()
    assert profile["email"] == profile["login"]


# Проверяет сценарий обновления профиля и последующего восстановления исходных значений.
# Это позволяет безопасно тестировать PUT /profile/me на живой базе без постоянной порчи пользовательских данных.
@pytest.mark.positive
def test_update_my_profile_persists_fields_and_allows_restore(existing_user_profile):
    user_id, original = existing_user_profile

    original_payload = {
        "lastName": original.get("lastName"),
        "firstName": original.get("firstName"),
        "middleName": original.get("middleName"),
    }
    updated_payload = {
        "lastName": "Тестов",
        "firstName": "Профиль",
        "middleName": "Авто",
    }

    try:
        update_response = api_request(
            "PUT",
            "/me",
            cookies=access_cookies(user_id),
            json_body=updated_payload,
        )
        assert update_response.status_code == 200, update_response.text

        updated = update_response.json()
        assert updated["lastName"] == updated_payload["lastName"]
        assert updated["firstName"] == updated_payload["firstName"]
        assert updated["middleName"] == updated_payload["middleName"]

        read_response = api_request("GET", "/me", cookies=access_cookies(user_id))
        assert read_response.status_code == 200, read_response.text
        reread = read_response.json()
        assert reread["lastName"] == updated_payload["lastName"]
        assert reread["firstName"] == updated_payload["firstName"]
        assert reread["middleName"] == updated_payload["middleName"]
    finally:
        restore_response = api_request(
            "PUT",
            "/me",
            cookies=access_cookies(user_id),
            json_body=original_payload,
        )
        assert restore_response.status_code == 200, restore_response.text


# Проверяет, что профиль можно сохранить с пустым middleName.
# Это отдельный позитивный кейс на nullable-поле в пользовательских данных.
@pytest.mark.positive
def test_update_my_profile_with_null_middle_name_returns_200(existing_user_profile):
    user_id, original = existing_user_profile

    original_payload = {
        "lastName": original.get("lastName"),
        "firstName": original.get("firstName"),
        "middleName": original.get("middleName"),
    }
    updated_payload = {
        "lastName": original.get("lastName") or "",
        "firstName": original.get("firstName") or "",
        "middleName": None,
    }

    try:
        response = api_request(
            "PUT",
            "/me",
            cookies=access_cookies(user_id),
            json_body=updated_payload,
        )

        assert response.status_code == 200, response.text
        profile = response.json()
        assert profile["middleName"] is None
    finally:
        restore_response = api_request(
            "PUT",
            "/me",
            cookies=access_cookies(user_id),
            json_body=original_payload,
        )
        assert restore_response.status_code == 200, restore_response.text


# Проверяет негативный сценарий вызова /profile/me без access token.
# Тест нужен как фиксация текущего контракта авторизации для profile endpoint.
@pytest.mark.negative
def test_get_my_profile_without_access_token_returns_current_api_behavior():
    response = api_request("GET", "/me")
    assert response.status_code == 401, response.text


# Проверяет реакцию /profile/me на токен с неверной подписью.
# Это отдельный негативный кейс, который не должен смешиваться с отсутствием токена или несуществующим пользователем.
@pytest.mark.negative
def test_get_my_profile_with_invalid_signature_returns_current_api_behavior():
    response = api_request(
        "GET",
        "/me",
        cookies=access_cookies(
            1,
            secret="another-secret-key-another-secret-key-another-secret-key",
        ),
    )
    assert response.status_code == 401, response.text


# Проверяет поведение /profile/me для валидного токена, указывающего на отсутствующего пользователя.
# Такой тест полезен для контроля связки между JWT и поиском пользователя в базе.
@pytest.mark.negative
def test_get_my_profile_with_nonexistent_user_returns_current_api_behavior():
    response = api_request("GET", "/me", cookies=access_cookies(999999999))
    assert response.status_code == 401, response.text


# Проверяет поведение обновления профиля для несуществующего пользователя.
# Это позволяет отдельно контролировать негативный сценарий PUT /profile/me.
@pytest.mark.negative
def test_update_my_profile_with_nonexistent_user_returns_current_api_behavior():
    response = api_request(
        "PUT",
        "/me",
        cookies=access_cookies(999999999),
        json_body={"lastName": "A", "firstName": "B", "middleName": "C"},
    )
    assert response.status_code == 401, response.text


# Проверяет безопасный негативный сценарий удаления профиля для несуществующего пользователя.
# Такой тест важен, потому что мы не хотим удалять реального пользователя в автотесте, но хотим покрыть DELETE.
@pytest.mark.negative
def test_delete_my_profile_with_nonexistent_user_returns_current_api_behavior():
    # DELETE проверяем только на безопасном негативном сценарии,
    # чтобы автотест не удалял реального пользователя из рабочей базы.
    response = api_request("DELETE", "/me", cookies=access_cookies(999999999))
    assert response.status_code == 401, response.text
