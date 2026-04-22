import pytest


def pytest_collection_modifyitems(items):
    for item in items:
        if item.get_closest_marker("positive"):
            item._nodeid = f"{item.nodeid} [POSITIVE]"
        elif item.get_closest_marker("negative"):
            item._nodeid = f"{item.nodeid} [NEGATIVE]"
