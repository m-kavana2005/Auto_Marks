import requests
import json

try:
    with open('output.txt', 'w', encoding='utf-8') as f:
        res = requests.get('http://localhost:8000/batches')
        f.write(f'GET /batches fallback: {res.status_code}\n')
        
        # Check what endpoints exist
        res = requests.get('http://localhost:8000/openapi.json')
        openapi = res.json()
        batch_endpoint = None
        for path in openapi['paths']:
            if 'batches' in path and '{batch}' not in path:
                batch_endpoint = path
                
        f.write(f'Found batch endpoint: {batch_endpoint}\n')
        
        if batch_endpoint:
            res = requests.get(f'http://localhost:8000{batch_endpoint}')
            batches = res.json()
            f.write(f'Batches: {batches}\n')
            for batch in batches:
                sem_res = requests.get(f'http://localhost:8000/batches/{batch}/semesters')
                sems = sem_res.json()
                if sems:
                    sem = sems[-1]
                    sgpa_res = requests.get(f'http://localhost:8000/batches/{batch}/semester/{sem}/sgpa')
                    data = sgpa_res.json()
                    if data.get('students'):
                        for student in data['students'][:10]:
                            usn = student['usn']
                            ind_res = requests.get(f'http://localhost:8000/students/{usn}/sgpa?semester={sem}')
                            ind_data = ind_res.json()
                            ind_sgpa = ind_data['sgpa']
                            ind_credits = ind_data['total_credits_passed']
                            
                            match = 'MATCH' if float(student['sgpa']) == float(ind_sgpa) else 'MISMATCH'
                            f.write(f"USN: {usn} | Batch SGPA: {student['sgpa']} | Indiv SGPA: {ind_sgpa} | Credits: {ind_credits} -> {match}\n")
                    break
except Exception as e:
    import traceback
    with open('output.txt', 'w', encoding='utf-8') as f:
        traceback.print_exc(file=f)
