import urllib.request
import json

BASE_URL = "http://localhost:8000/api/v1"

def request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def test_admin_flow():
    print("--- Testing Administration Flow ---")
    
    # 1. Login as Admin
    print("1. Logging in as admin...")
    status, login_res = request("/admin/login", method="POST", data={
        "username": "Admin",
        "password": "Admin"
    })
    if status != 200:
        print(f"FAILED: Login failed {login_res}")
        return
    token = login_res["access_token"]
    admin_user = login_res["user"]
    print(f"SUCCESS: Logged in as {admin_user['full_name']}")

    # 2. Register New User
    print("\n2. Registering new VGM Guard...")
    new_user_data = {
        "username": "test_guard",
        "full_name": "Test Guard User",
        "employee_id": "VGM-TEST-001",
        "role": "VGM_GUARD",
        "password": "password123"
    }
    status, new_user = request("/admin/users", method="POST", data=new_user_data, token=token)
    if status != 200:
        print(f"FAILED: Registration failed {new_user}")
        return
    print(f"SUCCESS: Registered {new_user['full_name']} with ID {new_user['id']}")

    # 3. Check Audit Logs
    print("\n3. Checking Audit Logs...")
    status, logs = request("/admin/audit", token=token)
    if any(log['action'] == 'CREATE_USER' and log['target_id'] == new_user['id'] for log in logs):
        print("SUCCESS: Audit log found for user creation")
    else:
        print("FAILED: Audit log not found")

    # 4. Test New User Login (First Time)
    print("\n4. Testing new user login...")
    status, test_login_res = request("/admin/login", method="POST", data={
        "username": "test_guard",
        "password": "password123"
    })
    if status != 200:
        print(f"FAILED: Test user login failed {test_login_res}")
        return
    test_user = test_login_res["user"]
    if test_user['is_first_login']:
        print("SUCCESS: New user flagged for first-time password change")
    else:
        print("FAILED: New user not flagged for first-time login")

if __name__ == "__main__":
    try:
        # Note: Backend must be running for this to work
        print("Checking if backend is up...")
        test_admin_flow()
    except Exception as e:
        print(f"ERROR: {e}")
