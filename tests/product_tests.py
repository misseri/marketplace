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


def get_category_children(category_id):
    response = requests.get(
        f"{BASE_URL}/categories/{category_id}",
        params={"page": 0, "size": 100},
        timeout=TIMEOUT,
    )
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)
    return payload["content"]


def get_category_branch_ids(category_id):
    branch_ids = {category_id}
    queue = [category_id]

    while queue:
        current_id = queue.pop(0)
        children = get_category_children(current_id)

        for child in children:
            child_id = child["id"]
            if child_id not in branch_ids:
                branch_ids.add(child_id)
                queue.append(child_id)

    return branch_ids


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


# Проверяет общий контракт ответа списка товаров.
# Ожидаем, что endpoint возвращает стандартную Spring Page-структуру с контентом и метаданными пагинации.
@pytest.mark.positive
def test_get_products_returns_spring_page_schema():
    page = get_page()

    for field in ("content", "pageable", "totalElements", "totalPages", "size", "number"):
        assert field in page


# Проверяет согласованность данных между списком товаров и детальной карточкой.
# Если товар найден в каталоге, его ключевые поля должны совпадать и в ответе /products/{id}.
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


# Проверяет, что детальная карточка товара содержит полный ожидаемый набор полей.
# Такой тест полезен как защита от случайного изменения API-контракта.
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


# Проверяет фильтрацию товаров по categoryId.
# Дополнительно убеждаемся, что товары попадают в допустимую ветку категорий, а не возвращаются случайно.
@pytest.mark.positive
def test_get_products_filter_by_category_id():
    product = get_any_product()
    category_branch_ids = get_category_branch_ids(product["categoryId"])

    products = get_products({"categoryId": product["categoryId"]})
    assert products
    assert any(item["categoryId"] == product["categoryId"] for item in products)
    assert all(item["categoryId"] in category_branch_ids for item in products)


# Проверяет фильтрацию товаров по sellerId.
# В результате должны остаться только товары выбранного продавца.
@pytest.mark.positive
def test_get_products_filter_by_seller_id():
    product = get_any_product()

    products = get_products({"sellerId": product["sellerId"]})
    assert products
    assert all(item["sellerId"] == product["sellerId"] for item in products)


# Проверяет фильтрацию по минимальной цене.
# Каждый товар в выдаче должен иметь цену не ниже переданного minPrice.
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


# Проверяет фильтрацию по максимальной цене.
# Каждый товар в выдаче должен иметь цену не выше переданного maxPrice.
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


# Проверяет фильтрацию по диапазону цен.
# Это полезно как проверка совместной работы minPrice и maxPrice в одном запросе.
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


# Проверяет фильтр наличия для товаров, которые есть на складе.
# В выдаче должны остаться только позиции с положительным остатком.
@pytest.mark.positive
def test_get_products_filter_in_stock_true():
    products = get_products({"inStock": "true"})
    assert all(item["stockQuantity"] > 0 for item in products)


# Проверяет фильтр наличия для товаров, которых нет на складе.
# В выдаче должны остаться только позиции с нулевым или отрицательным остатком.
@pytest.mark.positive
def test_get_products_filter_in_stock_false():
    products = get_products({"inStock": "false"})
    assert all(item["stockQuantity"] <= 0 for item in products)


# Проверяет текстовый поиск товаров по параметру query.
# В текущем контракте совпадение ожидается по имени товара или его описанию.
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


# Проверяет поддержку параметра size в пагинации.
# Backend должен ограничивать размер страницы значением, переданным в запросе.
@pytest.mark.positive
def test_get_products_supports_pagination_size_parameter():
    page = get_page({"size": 2})

    assert page["size"] == 2
    assert len(page["content"]) <= 2


# Проверяет поддержку параметра page в пагинации.
# Разные номера страниц должны отражаться в поле number ответа.
@pytest.mark.positive
def test_get_products_supports_page_parameter():
    first_page = get_page({"size": 1, "page": 0})
    second_page = get_page({"size": 1, "page": 1})

    assert first_page["number"] == 0
    assert second_page["number"] == 1


# Проверяет работу нескольких фильтров одновременно.
# Этот сценарий показывает, что categoryId, sellerId и inStock корректно сочетаются между собой.
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


# Фиксирует текущее поведение API при некорректном булевом значении фильтра.
# Такой тест нужен не как идеальный контракт, а как защита от незаметного изменения фактического поведения.
@pytest.mark.negative
def test_get_products_invalid_boolean_returns_current_api_behavior():
    response = api_get(params={"inStock": "yes"})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


# Проверяет реакцию API на некорректный формат minPrice.
# В этом случае ожидаем ошибку валидации запроса.
@pytest.mark.negative
def test_get_products_invalid_price_format_returns_current_api_behavior():
    response = api_get(params={"minPrice": "cheap"})
    assert response.status_code == 400, response.text


# Проверяет реакцию API на некорректный формат maxPrice.
# Этот тест отделяет ошибку формата параметра от бизнес-логики фильтрации.
@pytest.mark.negative
def test_get_products_invalid_max_price_format_returns_current_api_behavior():
    response = api_get(params={"maxPrice": "cheap"})
    assert response.status_code == 400, response.text


# Проверяет реакцию API на некорректный формат categoryId.
# Тест полезен как контроль типизации входных параметров.
@pytest.mark.negative
def test_get_products_invalid_category_id_format_returns_current_api_behavior():
    response = api_get(params={"categoryId": "abc"})
    assert response.status_code == 400, response.text


# Проверяет реакцию API на некорректный формат sellerId.
# Здесь backend должен отвергать строковое значение вместо числа.
@pytest.mark.negative
def test_get_products_invalid_seller_id_format_returns_current_api_behavior():
    response = api_get(params={"sellerId": "abc"})
    assert response.status_code == 400, response.text


# Фиксирует текущее поведение API при отрицательном categoryId.
# Это позволяет явно документировать, как backend обрабатывает такую границу значений сейчас.
@pytest.mark.negative
def test_get_products_negative_category_id_returns_current_api_behavior():
    response = api_get(params={"categoryId": -1})
    assert response.status_code == 404, response.text


# Фиксирует текущее поведение API при отрицательном minPrice.
# Такой тест помогает отследить изменения в обработке спорных, но синтаксически допустимых значений.
@pytest.mark.negative
def test_get_products_negative_min_price_returns_current_api_behavior():
    response = api_get(params={"minPrice": -1})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


# Фиксирует текущее поведение API при отрицательном page.
# Это важно для контроля поведения пагинации на невалидных границах.
@pytest.mark.negative
def test_get_products_negative_page_returns_current_api_behavior():
    response = api_get(params={"page": -1})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


# Фиксирует текущее поведение API при size равном нулю.
# Тест документирует, как backend сейчас интерпретирует такую пагинацию.
@pytest.mark.negative
def test_get_products_zero_size_returns_current_api_behavior():
    response = api_get(params={"size": 0})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


# Фиксирует текущее поведение API при отрицательном size.
# Это отдельный кейс по сравнению с нулевым размером страницы.
@pytest.mark.negative
def test_get_products_negative_size_returns_current_api_behavior():
    response = api_get(params={"size": -1})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


# Фиксирует текущее поведение API при пустом query.
# Такой сценарий полезен как защита от тихих изменений в логике поиска.
@pytest.mark.negative
def test_get_products_empty_query_returns_current_api_behavior():
    response = api_get(params={"query": ""})
    assert response.status_code == 200, response.text

    payload = response.json()
    assert isinstance(payload, dict)
    assert "content" in payload
    assert isinstance(payload["content"], list)


# Проверяет реакцию API на строковый идентификатор товара.
# Ожидаем ошибку валидации параметра пути.
@pytest.mark.negative
def test_get_product_by_id_invalid_string_returns_current_api_behavior():
    response = api_get("/abc")
    assert response.status_code == 400, response.text


# Фиксирует текущее поведение API при id товара равном нулю.
# Это отдельная граничная проверка для path-параметра.
@pytest.mark.negative
def test_get_product_by_id_zero_returns_current_api_behavior():
    response = api_get("/0")
    assert response.status_code == 404, response.text


# Фиксирует текущее поведение API при отрицательном id товара.
# Тест помогает отслеживать изменения в обработке невалидных идентификаторов.
@pytest.mark.negative
def test_get_product_by_id_negative_returns_current_api_behavior():
    response = api_get("/-1")
    assert response.status_code == 404, response.text


# Проверяет сценарий запроса несуществующего товара.
# В этом случае backend не должен отдавать успешный ответ с фиктивными данными.
@pytest.mark.negative
def test_get_product_by_id_nonexistent_returns_current_api_behavior():
    response = api_get("/999999999")
    assert response.status_code == 404, response.text
