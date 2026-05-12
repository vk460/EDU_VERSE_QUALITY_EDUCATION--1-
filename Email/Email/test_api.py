import requests

data = {
    "sender_name": "Test Name",
    "sender_email": "test@test.com",
    "sender_phone": "123",
    "email": "receiver@test.com",
    "prompt": "Test prompt",
    "tone": "Professional"
}

try:
    response = requests.post('http://127.0.0.1:8000/api/generate/', json=data)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.text)
except Exception as e:
    print("Request failed:", e)
