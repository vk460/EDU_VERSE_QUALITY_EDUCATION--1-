import requests
import json

data = {
    "receiver": "test@test.com",
    "subject": "Test Subjects",
    "body": "Test Body"
}

try:
    response = requests.post('http://127.0.0.1:8000/api/send/', data=data)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.text)
except Exception as e:
    print("Request failed:", e)
