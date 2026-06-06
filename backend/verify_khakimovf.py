import bcrypt

password = "khakimovf".encode('utf-8')
hashed = "$2b$12$KJxczqCly9m5VHcpHkR.6OvEbMN1xS9VInlBRGDnOsmxRHIUYfJIK".encode('utf-8')

if bcrypt.checkpw(password, hashed):
    print("Match!")
else:
    print("No match!")
