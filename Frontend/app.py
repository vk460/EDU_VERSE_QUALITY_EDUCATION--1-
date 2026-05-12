from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "EduVerse Backend is active", "agents": 7}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)
