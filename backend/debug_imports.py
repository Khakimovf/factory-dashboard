import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.resolve()))

print("Starting import test...")
try:
    print("Importing app.models.user...")
    from app.models import user
    print("Importing app.models.maintenance...")
    from app.models import maintenance
    print("Importing app.models.warehouse...")
    from app.models import warehouse
    print("Importing app.models.production...")
    from app.models import production
    print("Importing app.api.routes.warehouse...")
    from app.api.routes import warehouse as warehouse_route
    print("Importing app.api.routes.production...")
    from app.api.routes import production as production_route
    print("Importing app.main...")
    import app.main
    print("All imports successful!")
except RecursionError:
    print("\n!!! RecursionError detected during imports !!!")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"\nAn error occurred: {e}")
    import traceback
    traceback.print_exc()
