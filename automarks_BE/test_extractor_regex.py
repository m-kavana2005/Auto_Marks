
import re

def test_regex():
    content_samples = [
        """
        USN: 1SV23AD024
        Student Name: Kavana
        Semester: 3
        """,
        """
        University Seat Number: 1SV23AD025
        Name: Another Student
        Semester: 3
        """,
        """
        USN : 1SV23AD026
        Student Name : Third Student
        Branch: CS
        """
    ]

    print("Testing Regex Extraction...")
    
    for i, content in enumerate(content_samples):
        print(f"\n--- Sample {i+1} ---")
        
        # USN
        usn_match = re.search(r'(?:University Seat Number|USN)\s*[:.-]?\s*([1-9][A-Z]{2}\d{2}[A-Z]{2}\d{3})', content, re.IGNORECASE)
        if not usn_match:
             usn_match = re.search(r'(?:University Seat Number|USN)\s*[:.-]?\s*([A-Z0-9]{10})', content, re.IGNORECASE)
        
        print(f"USN: {usn_match.group(1) if usn_match else 'Not Found'}")

        # Name
        name_match = re.search(r'(?:Student Name|Name)\s*[:.-]?\s*([A-Z\s.]+?)(?:\n|Semester|Branch|USN|Credit)', content, re.IGNORECASE)
        print(f"Name: {name_match.group(1).strip() if name_match else 'Not Found'}")

if __name__ == "__main__":
    test_regex()
