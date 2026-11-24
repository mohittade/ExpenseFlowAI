import requests
import subprocess
import sys
import time

proc = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], 
                       cwd=r'C:\Users\mohit\ExpenseFlowAI\backend',
                       stdout=subprocess.PIPE,
                       stderr=subprocess.PIPE)

time.sleep(5)

try:
    # Get fresh token
    auth_resp = requests.post('http://127.0.0.1:8000/api/auth/login', data={'username': 'mohit.tade', 'password': 'mohit123'})
    print('Auth status:', auth_resp.status_code)
    token = auth_resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Generate a new report
    print('=== Generating Report ===')
    gen_resp = requests.post('http://127.0.0.1:8000/api/generate-report', 
        json={'user_request': 'Generate my travel expense report for July 2025', 'employee_id': 1, 'employee_name': 'Mohit Tade'},
        headers=headers)
    print('Generate Status:', gen_resp.status_code)
    if gen_resp.status_code == 200:
        gen_data = gen_resp.json()
        run_id = gen_data['run_id']
        print('Run ID:', run_id)
        print('Expenses:', len(gen_data.get('expenses', [])))
        print('PDF Path:', gen_data.get('pdf_path'))
        print('Approved:', gen_data.get('approved'))
        
        # Check reports endpoint
        time.sleep(2)
        print('\n=== Checking Reports Endpoint ===')
        reports_resp = requests.get('http://127.0.0.1:8000/api/reports', headers=headers)
        print('Reports Status:', reports_resp.status_code)
        if reports_resp.status_code == 200:
            data = reports_resp.json()
            print('Total reports:', data['total'])
            for r in data['reports']:
                print('  - {}: {}, {}, violations={}, missing={}'.format(r["run_id"], r["status"], r["total_amount"], r["violations_count"], r["missing_data_count"]))
        else:
            print('Error:', reports_resp.json())
    else:
        print('Generate Error:', gen_resp.json())
    
except Exception as e:
    print('Error:', e)
    import traceback
    traceback.print_exc()
finally:
    proc = subprocess.Popen(['taskkill', '/F', '/IM', 'uvicorn.exe'])
    proc.wait()