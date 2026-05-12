import urllib.request
import urllib.parse
import json

data = {
    'receiver': 'test@example.com',
    'subject': 'Test',
    'body': 'Test body'
}
data_encoded = urllib.parse.urlencode(data).encode('utf-8')

req = urllib.request.Request('http://localhost:8000/api/send/', data=data_encoded, method='POST')
try:
    response = urllib.request.urlopen(req)
    print("Status:", response.status)
    print("Body:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print("Body:", e.read().decode('utf-8'))
