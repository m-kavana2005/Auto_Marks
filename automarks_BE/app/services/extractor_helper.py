from typing import Optional
import re

def _extract_branch_from_usn(usn: str) -> Optional[str]:
    """
    Extract branch code from USN.
    Format: 1SV22CS001 -> CS
    """
    if not usn:
        return None
    # Standard VTU USN format: Region(1) College(2) Year(2) Branch(2-3) Serial(3)
    # e.g. 1SV22CS001 -> CS
    match = re.match(r'^\d[A-Za-z]{2}\d{2}([A-Za-z]+)\d{3}$', usn.strip())
    if match:
        return match.group(1).upper()
    return None
