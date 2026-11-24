import requests
import subprocess
import sys
import time

proc = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], cwd='C:\\Users\\mohit\\ExpenseFlowAI\\backend')
time.sleep(5)

try:
    # Get fresh token
    auth_resp = requests.post('http://127.0.0.1:8000/api/auth/login', data={'username': 'mohit.tade', 'password': 'mohit123'})
    token = auth_resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test reports endpoint
    print('=== Testing Reports Endpoint ===')
    reports_resp = requests.get('http://127.0.0.1:8000/api/reports', headers=headers)
    print('Reports Status:', reports_resp.status_code)
    if reports_resp.status_code == 200:
        data = reports_resp.json()
        print('Total reports:', data['total'])
        for r in data['reports'][:3]:
            print('  - {}: {}, {}'.format(r["run_id"], r["status"], r["total_amount"]))
    else:
        print('Error:', reports_resp.json())
    
except Exception as e:
    print('Error:', e)
finally:
    proc.terminate()