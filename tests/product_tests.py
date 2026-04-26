import os
import re

import pytest
import requests

BASE_URL = os.getenv("MARKETPLACE_API_BASE_URL", "http://localhost:8080").rstrip("/")
PRODUCTS_URL = f"{BASE_URL}/products"
TIMEOUT = 10


def api_get(path="", params=None):
    try:
        response = requests.get(f"{PRODUCTS_URL}{path}", params=params, timeout=TIMEOUT)
    except requests.RequestException as exc:
        pytest.fail(
            f"Не удалось обратиться к API по адресу {PRODUCTS_URL}. "
            f"Убедитесь, что backend запущен. Ошибка: {exc}"
        )
    return response


def get_page(params=None):
    response = api_get(params=params)
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)
    return payload


def get_products(params=None):
    return get_page(params)["content"]


def get_any_product():
    products = get_products({"size": 50})
    if not products:
        pytest.skip("В базе нет активных товаров для проверки")
    return products[0]


def find_product(predicate, reason):
    products = get_products({"size": 100})
    for product in products:
        if predicate(product):
            return product
    pytest.skip(reason)


@pytest.mark.positive
def test_get_products_returns_spring_page_schema():
    page = get_page()

    for field in ("content", "pageable", "totalElements", "totalPages", "size", "number"):
        assert field in page


@pytest.mark.positive
def test_get_product_by_id_returns_same_product_as_list_item():
    product = get_any_product()

    response = api_get(f"/{product['id']}")
    assert response.status_code == 200, response.text

    details = response.json()
    assert details["id"] == product["id"]
    assert details["name"] == product["name"]
    assert details["categoryId"] == product["categoryId"]
    assert details["sellerId"] == product["sellerId"]


@pytest.mark.positive
def test_get_product_by_id_returns_full_details_schema():
    product = get_any_product()

    response = api_get(f"/{product['id']}")
    assert response.status_code == 200, response.text

    details = response.json()
    for field in (
        "id",
        "name",
        "description",
        "active",
        "categoryId",
        "categoryName",
        "sellerId",
        "sellerName",
        "sellerRating",
        "currentPrice",
        "stockQuantity",
        "averageRating",
        "reviewCount",
        "characteristics",
    ):
        assert field in details

    assert isinstance(details["characteristics"], list)


@pytest.mark.positive
def test_get_products_filter_by_category_id():
    product = get_any_product()

    products = get_products({"categoryId": product["categoryId"]})
    assert products
    assert all(item["categoryId"] == product["categoryId"] for item in products)


@pytest.mark.positive
def test_get_products_filter_by_seller_id():
    product = get_any_product()

    products = get_products({"sellerId": product["sellerId"]})
    assert products
    assert all(item["sellerId"] == product["sellerId"] for item in products)


@pytest.mark.positive
def test_get_products_filter_by_min_price():
    product = find_product(
        lambda item: item["currentPrice"] is not None,
        "Нет товаров с currentPrice для проверки minPrice",
    )

    min_price = product["currentPrice"]
    products = get_products({"minPrice": min_price})
    assert products
    assert all(item["currentPrice"] is not None and item["currentPrice"] >= min_price for item in products)


@pytest.mark.positive
def test_get_products_filter_by_max_price():
    product = find_product(
        lambda item: item["currentPrice"] is not None,
        "Нет товаров с currentPrice для проверки maxPrice",
    )

    max_price = product["currentPrice"]
    products = get_products({"maxPrice": max_price})
    assert products
    assert all(item["currentPrice"] is not None and item["currentPrice"] <= max_price for item in products)


@pytest.mark.positive
def test_get_products_filter_by_price_range():
    products = get_products({"size": 100})
    prices = sorted(item["currentPrice"] for item in products if item["currentPrice"] is not None)
    if len(prices) < 2:
        pytest.skip("Недостаточно товаров с ценой для проверки диапазона")

    min_price = prices[0]
    max_price = prices[-1]
    filtered = get_products({"minPrice": min_price, "maxPrice": max_price})

    assert filtered
    assert all(
        item["currentPrice"] is not None and min_price <= item["currentPrice"] <= max_price
        for item in filtered
    )


@pytest.mark.positive
def test_get_products_filter_in_stock_true():
    products = get_products({"inStock": "true"})
    assert all(item["stockQuantity"] > 0 for item in products)


@pytest.mark.positive
def test_get_products_filter_in_stock_false():
    products = get_products({"inStock": "false"})
    assert all(item["stockQuantity"] <= 0 for item in products)


@pytest.mark.positive
def test_get_products_filter_by_query_matches_name_or_description():
    product = find_product(
        lambda item: item["name"] or item["description"],
        "Нет товаров с name или description для проверки query",
    )

    source_text = f"{product.get('name') or ''} {product.get('description') or ''}".strip()
    match = re.search(r"[A-Za-zА-Яа-я0-9]{3,}", source_text)
    if not match:
        pytest.skip("Не удалось подобрать поисковую строку из данных товара")

    query = match.group(0)
    products = get_products({"query": query})
    assert products
    assert all(
        query.lower() in ((item.get("name") or "") + " " + (item.get("description") or "")).lower()
        for item in products
    )


@pytest.mark.positive
def test_get_products_supports_pagination_size_parameter():
    page = get_page({"size": 2})

    assert page["size"] == 2
    assert len(page["content"]) <= 2


@pytest.mark.positive
def test_get_products_supports_page_parameter():
    first_page = get_page({"size": 1, "page": 0})
    second_page = get_page({"size": 1, "page": 1})

    assert first_page["number"] == 0
    assert second_page["number"] == 1


@pytest.mark.positive
def test_get_products_combined_filters_category_seller_and_stock():
    product = find_product(
        lambda item: item["stockQuantity"] > 0,
        "Нет товаров в наличии для проверки комбинированных фильтров",
    )

    products = get_products(
        {
            "categoryId": product["categoryId"],
            "sellerId": product["sellerId"],
            "inStock": "true",
        }
    )

    assert products
    assert all(
        item["categoryId"] == product["categoryId"]
        and item["sellerId"] == product["sellerId"]
        and item["stockQuantity"] > 0
        for item in products
    )


@pytest.mark.negative
def test_get_products_invalid_boolean_returns_current_api_behavior():
    response = api_get(params={"inStock": "yes"})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


@pytest.mark.negative
def test_get_products_invalid_price_format_returns_current_api_behavior():
    response = api_get(params={"minPrice": "cheap"})
    assert response.status_code == 400, response.text


@pytest.mark.negative
def test_get_products_invalid_max_price_format_returns_current_api_behavior():
    response = api_get(params={"maxPrice": "cheap"})
    assert response.status_code == 400, response.text


@pytest.mark.negative
def test_get_products_invalid_category_id_format_returns_current_api_behavior():
    response = api_get(params={"categoryId": "abc"})
    assert response.status_code == 400, response.text


@pytest.mark.negative
def test_get_products_invalid_seller_id_format_returns_current_api_behavior():
    response = api_get(params={"sellerId": "abc"})
    assert response.status_code == 400, response.text


@pytest.mark.negative
def test_get_products_negative_category_id_returns_current_api_behavior():
    response = api_get(params={"categoryId": -1})
    assert response.status_code == 404, response.text


@pytest.mark.negative
def test_get_products_negative_min_price_returns_current_api_behavior():
    response = api_get(params={"minPrice": -1})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


@pytest.mark.negative
def test_get_products_negative_page_returns_current_api_behavior():
    response = api_get(params={"page": -1})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


@pytest.mark.negative
def test_get_products_zero_size_returns_current_api_behavior():
    response = api_get(params={"size": 0})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


@pytest.mark.negative
def test_get_products_negative_size_returns_current_api_behavior():
    response = api_get(params={"size": -1})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


@pytest.mark.negative
def test_get_products_empty_query_returns_current_api_behavior():
    response = api_get(params={"query": ""})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


@pytest.mark.negative
def test_get_product_by_id_invalid_string_returns_current_api_behavior():
    response = api_get("/abc")
    assert response.status_code == 400, response.text


@pytest.mark.negative
def test_get_product_by_id_zero_returns_current_api_behavior():
    response = api_get("/0")
    assert response.status_code == 404, response.text


@pytest.mark.negative
def test_get_product_by_id_negative_returns_current_api_behavior():
    response = api_get("/-1")
    assert response.status_code == 404, response.text


@pytest.mark.negative
def test_get_product_by_id_nonexistent_returns_current_api_behavior():
    response = api_get("/999999999")
    assert response.status_code == 404, response.text
