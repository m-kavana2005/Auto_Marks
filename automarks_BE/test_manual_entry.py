import requests
import sys

BASE_URL = "http://localhost:8001"

def test_manual_entry():
    print("Testing Manual Entry Endpoints...")

    usn = "1XY24CS001"
    
    # 1. Create Student
    print(f"\n1. Creating Student {usn}...")
    try:
        data = {
            "usn": usn,
            "student_name": "Manual Entry Test Student",
            "batch": "2024-2028",
            "branch": "CS"
        }
        resp = requests.post(f"{BASE_URL}/student", json=data)
        if resp.status_code == 400 and "already exists" in resp.text:
             print("Student already exists.")
        else:
             resp.raise_for_status()
             print(f"Student created: {resp.json()}")
    except Exception as e:
        print(f"Error creating student: {e}")

    # 2. Add Semester Result
    print(f"\n2. Adding Semester 1 Result...")
    try:
        sem_data = {
            "semester_number": 1,
            "exam_month": "Jan",
            "exam_year": 2025,
            "subjects": [
                {
                    "subject_code": "24MAT11",
                    "subject_name": "Engineering Maths 1",
                    "internal_marks": 40,
                    "external_marks": 80,
                    "total_marks": 120,
                    "result_status": "P",
                    "credits": 4
                },
                {
                    "subject_code": "24PHY12",
                    "subject_name": "Engineering Physics",
                    "internal_marks": 35,
                    "external_marks": 70,
                    "total_marks": 105,
                    "result_status": "P",
                    "credits": 4
                }
            ]
        }
        resp = requests.post(f"{BASE_URL}/student/{usn}/semester", json=sem_data)
        resp.raise_for_status()
        print(f"Semester result added: {resp.json()}")
    except Exception as e:
        print(f"Error adding semester: {e}")
        # print(resp.text)

    # 3. Update Subject Result
    print(f"\n3. Updating Marks for 24PHY12...")
    try:
        update_data = {
            "internal_marks": 45, # increased
            "total_marks": 115    # increased
        }
        # Assuming semester=1 is required
        url = f"{BASE_URL}/student/{usn}/subject/24PHY12?semester=1"
        resp = requests.put(url, json=update_data)
        resp.raise_for_status()
        print(f"Result updated: {resp.json()}")
        
        # Verify update
        res = resp.json()
        if res.get("internal_marks") == 45:
            print("Verification Successful: Internal marks updated to 45.")
        else:
            print("Verification Failed.")

    except Exception as e:
        print(f"Error updating result: {e}")
        # print(resp.text)


    # 4. Metadata Discovery
    print(f"\n4. Testing Metadata Discovery...")
    try:
        batch = "2024-2028"
        # Semesters
        resp = requests.get(f"{BASE_URL}/batches/{batch}/semesters")
        resp.raise_for_status()
        sems = resp.json()
        print(f"Semesters for batch {batch}: {sems}")
        if 1 in sems:
            print("Verified: Semester 1 found.")

        # Subjects
        resp = requests.get(f"{BASE_URL}/batch/{batch}/semester/1/subjects")
        resp.raise_for_status()
        subs = resp.json()
        print(f"Subjects for batch {batch}, sem 1: {len(subs)} found.")
        codes = [s['subject_code'] for s in subs]
        if "24MAT11" in codes:
            print("Verified: 24MAT11 found.")

    except Exception as e:
        print(f"Error in metadata discovery: {e}")

if __name__ == "__main__":
    test_manual_entry()
