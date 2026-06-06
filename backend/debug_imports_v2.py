import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.resolve()))

def test_import(module_name):
    print(f"DEBUG: Attempting to import {module_name}...", flush=True)
    try:
        __import__(module_name)
        print(f"DEBUG: Successfully imported {module_name}", flush=True)
    except RecursionError:
        print(f"DEBUG: !!! RecursionError in {module_name} !!!", flush=True)
        # We don't print full traceback here to avoid overwhelming output, 
        # but we know NOW which one it is.
        raise
    except Exception as e:
        print(f"DEBUG: Error in {module_name}: {e}", flush=True)

modules_to_test = [
    "app.core.config",
    "app.core.logging",
    "app.models.user",
    "app.models.audit",
    "app.models.document",
    "app.models.maintenance",
    "app.models.warehouse",
    "app.models.production",
    "app.repositories.base",
    "app.repositories.user_repository",
    "app.api.routes.admin",
    "app.api.routes.warehouse",
    "app.api.routes.production",
    "app.main"
]

for mod in modules_to_test:
    try:
        test_import(mod)
    except RecursionError:
        print("\nStopping after first RecursionError.")
        import traceback
        traceback.print_exc()
        break
