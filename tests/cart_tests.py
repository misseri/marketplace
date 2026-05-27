import os

import pytest
import requests

BASE_URL = os.getenv("MARKETPLACE_API_BASE_URL", "http://localhost:8080").rstrip("/")
CART_URL = f"{BASE_URL}/cart"
PRODUCTS_URL = f"{BASE_URL}/products"
TIMEOUT = 10


def cart_request(method, path="", json_body=None, cookies=None):
    try:
        response = requests.request(
            method=method,
            url=f"{CART_URL}{path}",
            json=json_body,
            cookies=cookies,
            timeout=TIMEOUT,
            allow_redirects=False,
        )
    except requests.RequestException as exc:
        pytest.fail(
            f"Не удалось обратиться к API по адресу {CART_URL}. "
            f"Убедитесь, что backend запущен. Ошибка: {exc}"
        )
    return response


def get_products(params=None):
    try:
        response = requests.get(
            PRODUCTS_URL,
            params=params,
            timeout=TIMEOUT,
            allow_redirects=False,
        )
    except requests.RequestException as exc:
        pytest.fail(
            f"Не удалось обратиться к API по адресу {PRODUCTS_URL}. "
            f"Убедитесь, что backend запущен. Ошибка: {exc}"
        )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)
    return payload["content"]


def assert_auth_required(response):
    # Если запущен не backend marketplace, пропускаем тест вместо ложного падения.
    if response.status_code in (404, 405, 501):
        pytest.skip(
            "Эндпоинт /cart недоступен в текущем окружении. "
            "Проверьте, что запущен backend marketplace."
        )

    # Для защищенных эндпоинтов ожидаем отказ в доступе.
    assert response.status_code in (401, 403), response.text


def assert_cart_schema(response_payload):
    assert isinstance(response_payload, dict)
    assert "items" in response_payload
    assert "total" in response_payload
    assert isinstance(response_payload["items"], list)


def get_test_cookies_or_skip():
    access_token = os.getenv("MARKETPLACE_TEST_ACCESS_TOKEN")
    if not access_token:
        pytest.skip(
            "Для positive/валидационных cart-тестов нужен MARKETPLACE_TEST_ACCESS_TOKEN "
            "с валидным access_token."
        )
    return {"access_token": access_token}


def clear_cart_for_user(cookies):
    response = cart_request("DELETE", cookies=cookies)
    # Если корзина уже пустая, сервер все равно возвращает 204.
    assert response.status_code == 204, response.text


def get_in_stock_product_or_skip(min_stock=1):
    products = get_products({"size": 100})
    for product in products:
        stock_quantity = product.get("stockQuantity")
        if isinstance(stock_quantity, int) and stock_quantity >= min_stock:
            return product
    pytest.skip(f"Нет товара с остатком >= {min_stock} для cart-тестов")


@pytest.mark.negative
def test_get_cart_without_auth_returns_401():
    """Проверяет, что просмотр корзины без авторизации запрещен."""
    response = cart_request("GET")
    assert_auth_required(response)


@pytest.mark.negative
def test_add_item_without_auth_returns_401():
    """Проверяет, что добавление товара без авторизации запрещено."""
    response = cart_request("POST", "/items", {"productId": 1, "quantity": 1})
    assert_auth_required(response)


@pytest.mark.negative
def test_update_item_without_auth_returns_401():
    """Проверяет, что изменение количества без авторизации запрещено."""
    response = cart_request("PUT", "/items/1", {"quantity": 2})
    assert_auth_required(response)


@pytest.mark.negative
def test_remove_item_without_auth_returns_401():
    """Проверяет, что удаление позиции без авторизации запрещено."""
    response = cart_request("DELETE", "/items/1")
    assert_auth_required(response)


@pytest.mark.negative
def test_clear_cart_without_auth_returns_401():
    """Проверяет, что очистка корзины без авторизации запрещена."""
    response = cart_request("DELETE")
    assert_auth_required(response)


@pytest.mark.positive
def test_get_cart_returns_expected_schema_for_authorized_user():
    """Проверяет схему ответа корзины для авторизованного пользователя."""
    cookies = get_test_cookies_or_skip()
    response = cart_request("GET", cookies=cookies)
    assert response.status_code == 200, response.text
    assert_cart_schema(response.json())


@pytest.mark.positive
def test_add_item_creates_cart_line_for_authorized_user():
    """Проверяет, что добавление товара создает строку в корзине."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=1)

    response = cart_request("POST", "/items", {"productId": product["id"], "quantity": 1}, cookies)
    assert response.status_code == 200, response.text

    payload = response.json()
    assert_cart_schema(payload)
    assert any(item["productId"] == product["id"] and item["quantity"] == 1 for item in payload["items"])


@pytest.mark.positive
def test_add_same_item_twice_increments_quantity():
    """Проверяет суммирование количества при повторном добавлении товара."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=3)

    first = cart_request("POST", "/items", {"productId": product["id"], "quantity": 1}, cookies)
    assert first.status_code == 200, first.text

    second = cart_request("POST", "/items", {"productId": product["id"], "quantity": 2}, cookies)
    assert second.status_code == 200, second.text
    payload = second.json()

    line = next((item for item in payload["items"] if item["productId"] == product["id"]), None)
    assert line is not None
    assert line["quantity"] == 3


@pytest.mark.positive
def test_update_quantity_changes_existing_cart_line():
    """Проверяет изменение количества существующей позиции в корзине."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=3)

    seed = cart_request("POST", "/items", {"productId": product["id"], "quantity": 1}, cookies)
    assert seed.status_code == 200, seed.text

    response = cart_request("PUT", f"/items/{product['id']}", {"quantity": 3}, cookies)
    assert response.status_code == 200, response.text
    payload = response.json()

    line = next((item for item in payload["items"] if item["productId"] == product["id"]), None)
    assert line is not None
    assert line["quantity"] == 3


@pytest.mark.positive
def test_update_quantity_to_zero_removes_item():
    """Проверяет удаление позиции при обновлении количества до нуля."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=1)

    seed = cart_request("POST", "/items", {"productId": product["id"], "quantity": 1}, cookies)
    assert seed.status_code == 200, seed.text

    response = cart_request("PUT", f"/items/{product['id']}", {"quantity": 0}, cookies)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert all(item["productId"] != product["id"] for item in payload["items"])


@pytest.mark.positive
def test_remove_item_endpoint_returns_204_and_item_disappears():
    """Проверяет, что DELETE /cart/items/{id} удаляет позицию и возвращает 204."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=1)

    seed = cart_request("POST", "/items", {"productId": product["id"], "quantity": 1}, cookies)
    assert seed.status_code == 200, seed.text

    remove_response = cart_request("DELETE", f"/items/{product['id']}", cookies=cookies)
    assert remove_response.status_code == 204, remove_response.text

    cart_response = cart_request("GET", cookies=cookies)
    assert cart_response.status_code == 200, cart_response.text
    payload = cart_response.json()
    assert all(item["productId"] != product["id"] for item in payload["items"])


@pytest.mark.positive
def test_clear_cart_endpoint_removes_all_items():
    """Проверяет полную очистку корзины через DELETE /cart."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=1)

    seed = cart_request("POST", "/items", {"productId": product["id"], "quantity": 1}, cookies)
    assert seed.status_code == 200, seed.text

    clear_response = cart_request("DELETE", cookies=cookies)
    assert clear_response.status_code == 204, clear_response.text

    cart_response = cart_request("GET", cookies=cookies)
    assert cart_response.status_code == 200, cart_response.text
    payload = cart_response.json()
    assert payload["items"] == []


@pytest.mark.positive
def test_cart_total_equals_sum_of_line_totals():
    """Проверяет, что total равен сумме lineTotal по всем позициям."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=2)

    response = cart_request("POST", "/items", {"productId": product["id"], "quantity": 2}, cookies)
    assert response.status_code == 200, response.text
    payload = response.json()

    line_total_sum = sum(float(item["lineTotal"]) for item in payload["items"])
    total = float(payload["total"])
    assert abs(total - line_total_sum) < 0.0001


@pytest.mark.positive
def test_get_cart_items_have_required_fields():
    """Проверяет обязательные поля у элементов корзины."""
    cookies = get_test_cookies_or_skip()
    response = cart_request("GET", cookies=cookies)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert_cart_schema(payload)

    for item in payload["items"]:
        for field in ("productId", "productName", "quantity", "price", "lineTotal", "stockQuantity"):
            assert field in item


@pytest.mark.negative
def test_add_item_without_product_id_returns_400():
    """Проверяет валидацию обязательного поля productId."""
    cookies = get_test_cookies_or_skip()
    response = cart_request("POST", "/items", {"quantity": 1}, cookies)
    assert response.status_code == 400, response.text


@pytest.mark.negative
def test_add_item_with_non_positive_quantity_returns_400():
    """Проверяет валидацию quantity <= 0 при добавлении."""
    cookies = get_test_cookies_or_skip()
    product = get_in_stock_product_or_skip(min_stock=1)

    response = cart_request("POST", "/items", {"productId": product["id"], "quantity": 0}, cookies)
    assert response.status_code == 400, response.text


@pytest.mark.negative
def test_add_item_with_non_existing_product_returns_404():
    """Проверяет ответ 404 для несуществующего товара при добавлении."""
    cookies = get_test_cookies_or_skip()
    response = cart_request("POST", "/items", {"productId": 999999999, "quantity": 1}, cookies)
    assert response.status_code == 404, response.text


@pytest.mark.negative
def test_add_item_with_quantity_more_than_stock_returns_400():
    """Проверяет ограничение по остатку при добавлении в корзину."""
    cookies = get_test_cookies_or_skip()
    product = get_in_stock_product_or_skip(min_stock=1)

    response = cart_request(
        "POST",
        "/items",
        {"productId": product["id"], "quantity": product["stockQuantity"] + 1},
        cookies,
    )
    assert response.status_code == 400, response.text


@pytest.mark.negative
def test_update_quantity_for_product_not_in_cart_returns_404():
    """Проверяет ответ 404 при обновлении количества для отсутствующей позиции."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=1)

    response = cart_request("PUT", f"/items/{product['id']}", {"quantity": 1}, cookies)
    assert response.status_code == 404, response.text


@pytest.mark.negative
def test_update_quantity_with_null_quantity_returns_400():
    """Проверяет валидацию null quantity при обновлении."""
    cookies = get_test_cookies_or_skip()
    clear_cart_for_user(cookies)
    product = get_in_stock_product_or_skip(min_stock=1)

    seed = cart_request("POST", "/items", {"productId": product["id"], "quantity": 1}, cookies)
    assert seed.status_code == 200, seed.text

    response = cart_request("PUT", f"/items/{product['id']}", {"quantity": None}, cookies)
    assert response.status_code == 400, response.text
