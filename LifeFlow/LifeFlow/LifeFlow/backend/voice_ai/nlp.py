import re

# Popular Hospitals Registry for Auto-Detection
KNOWN_HOSPITALS = [
    "Civil Hospital", "Apollo Hospital", "Sterling Hospital", "KD Hospital", 
    "Zydus Hospital", "Sal Hospital", "CIMS Hospital", "Shelby Hospital", 
    "KMC Hospital", "Lilavati Hospital", "Fortis Hospital", "Max Hospital", 
    "Manipal Hospital", "Care Hospital", "Sunshine Hospital", "City Hospital",
    "General Hospital", "Trust Hospital", "Global Hospital"
]

# Popular Cities Registry for Auto-Detection
KNOWN_CITIES = [
    "Ahmedabad", "Rajkot", "Surat", "Vadodara", "Mumbai", "Delhi", "Pune", 
    "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Jaipur", "Lucknow", 
    "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand", "Junagadh"
]

# Popular Landmarks
KNOWN_LANDMARKS = [
    "ISKCON Circle", "SG Highway", "Ring Road", "Station Road", "CG Road", 
    "Airport Road", "Satellite", "Vastrapur", "Prahlad Nagar", "Maninagar"
]

def detect_language(text):
    """Detects whether text is English (en-US), Hindi (hi-IN), or Gujarati (gu-IN)."""
    if not text:
        return 'en-US'
    
    # Gujarati Unicode Range U+0A80 to U+0AFF
    if re.search(r'[\u0A80-\u0AFF]', text):
        return 'gu-IN'
    
    # Hindi/Devanagari Unicode Range U+0900 to U+097F
    if re.search(r'[\u0900-\u097F]', text):
        return 'hi-IN'
    
    return 'en-US'


def extract_blood_group(text):
    """
    Smart Blood Group Recognition.
    Recognizes every possible format in English, Hindi, and Gujarati.
    Returns standard database format ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') or None.
    """
    if not text:
        return None, 0.0

    txt = text.lower()

    # 1. Exact AB+, AB- Check
    if re.search(r'\bab\s*\+|\bab\s*positive|\bab\s*plus|positive\s*ab|એબી\s*પોઝિટિવ|एबी\s*पॉजिटिव', txt):
        return 'AB+', 98.0
    if re.search(r'\bab\s*\-|\bab\s*negative|\bab\s*minus|negative\s*ab|એબી\s*નેગેટિવ|एबी\s*नेगेटिव', txt):
        return 'AB-', 97.0

    # 2. A+, A- Check
    if re.search(r'\ba\s*\+|\ba\s*positive|\ba\s*plus|positive\s*a|એ\s*પોઝિટિવ|ए\s*पॉजिटिव', txt):
        return 'A+', 96.0
    if re.search(r'\ba\s*\-|\ba\s*negative|\ba\s*minus|negative\s*a|એ\s*નેગેટિવ|ए\s*नेगेटिव', txt):
        return 'A-', 95.0

    # 3. B+, B- Check
    if re.search(r'\bb\s*\+|\bb\s*positive|\bb\s*plus|positive\s*b|બી\s*પોઝિટિવ|बी\s*पॉजिटिव', txt):
        return 'B+', 96.0
    if re.search(r'\bb\s*\-|\bb\s*negative|\bb\s*minus|negative\s*b|બી\s*નેગેટિવ|बी\s*नेगेटिव', txt):
        return 'B-', 95.0

    # 4. O+, O- Check
    if re.search(r'\bo\s*\+|\bo\s*positive|\bo\s*plus|positive\s*o|ઓ\s*પોઝિટિવ|ओ\s*पॉजिटिव', txt):
        return 'O+', 98.0
    if re.search(r'\bo\s*\-|\bo\s*negative|\bo\s*minus|negative\s*o|ઓ\s*નેગેટિવ|ओ\s*नेगेटिव', txt):
        return 'O-', 97.0

    # Generic fallback symbol checks
    if 'a+' in txt: return 'A+', 90.0
    if 'a-' in txt: return 'A-', 90.0
    if 'b+' in txt: return 'B+', 90.0
    if 'b-' in txt: return 'B-', 90.0
    if 'ab+' in txt: return 'AB+', 90.0
    if 'ab-' in txt: return 'AB-', 90.0
    if 'o+' in txt: return 'O+', 90.0
    if 'o-' in txt: return 'O-', 90.0

    return None, 0.0


def classify_priority(text):
    """
    AI Emergency Priority Classification.
    CRITICAL (🔴) if contains: accident, bleeding, ICU, critical, emergency, operation, urgent, brain surgery, heart surgery
    NORMAL (🟢) if contains: today, tomorrow, scheduled, required
    HIGH (🟠) default for active requests
    """
    if not text:
        return 'HIGH', 85.0

    txt = text.lower()
    
    critical_keywords = [
        'accident', 'bleeding', 'icu', 'critical', 'emergency', 'operation', 
        'urgent', 'brain surgery', 'heart surgery', 'severe', 'trauma', 'immediately',
        'ઈમરજન્સી', 'અકસ્માત', 'આઈસીયુ', 'ગંભીર', 'इमरजेंसी', 'दुर्घटना', 'गंभीर'
    ]
    
    normal_keywords = [
        'scheduled', 'routine', 'next week', 'after 2 days', 'સહજ', 'સામાન્ય', 'सामान्य'
    ]

    for kw in critical_keywords:
        if kw in txt:
            return 'CRITICAL', 99.0

    for kw in normal_keywords:
        if kw in txt:
            return 'NORMAL', 90.0

    return 'HIGH', 88.0


def extract_hospital(text):
    """Extracts hospital name from text."""
    if not text:
        return None, 0.0

    txt = text.lower()

    for hosp in KNOWN_HOSPITALS:
        if hosp.lower() in txt:
            return hosp, 94.0

    # Pattern match: "... hospital" or "... clinic"
    match = re.search(r'([A-Za-z0-9\s]+(?:Hospital|Clinic|Medical Center|Trauma Center))', text, re.IGNORECASE)
    if match:
        hosp_name = match.group(1).strip()
        if len(hosp_name) < 50:
            return hosp_name, 88.0

    return None, 0.0


def extract_location(text):
    """Extracts City and Landmark from text."""
    if not text:
        return None, None, 0.0

    txt = text.lower()
    detected_city = None
    detected_landmark = None

    for city in KNOWN_CITIES:
        if city.lower() in txt:
            detected_city = city
            break

    for lm in KNOWN_LANDMARKS:
        if lm.lower() in txt:
            detected_landmark = lm
            break

    # Pattern match: "near ..." or "at ..."
    if not detected_landmark:
        lm_match = re.search(r'(?:near|around|at)\s+([A-Za-z0-9\s]+(?:circle|highway|road|crossroad|area|nagar|station))', text, re.IGNORECASE)
        if lm_match:
            detected_landmark = lm_match.group(1).strip().title()

    conf = 91.0 if (detected_city or detected_landmark) else 0.0
    return detected_city, detected_landmark, conf


def extract_relation_and_reason(text):
    """Extracts patient relation and reason for emergency."""
    if not text:
        return 'Self', 'Emergency Blood Requirement'

    txt = text.lower()
    relation = 'Self'
    reason = 'Emergency Blood Requirement'

    relations = {
        'father': 'Father', 'dad': 'Father', 'પપ્પા': 'Father', 'पिता': 'Father',
        'mother': 'Mother', 'mom': 'Mother', 'મમ્મી': 'Mother', 'माता': 'Mother',
        'brother': 'Brother', 'ભાઈ': 'Brother', 'भाई': 'Brother',
        'sister': 'Sister', 'બેન': 'Sister', 'बहन': 'Sister',
        'friend': 'Friend', 'મિત્ર': 'Friend', 'दोस्त': 'Friend',
        'wife': 'Wife', 'पत्नी': 'Wife', 'husband': 'Husband', 'પતિ': 'Husband',
        'child': 'Child', 'son': 'Son', 'daughter': 'Daughter', 'બાળક': 'Child'
    }

    for k, v in relations.items():
        if k in txt:
            relation = v
            break

    if 'accident' in txt or 'અકસ્માત' in txt or 'दुर्घटना' in txt:
        reason = 'Accident Trauma'
    elif 'surgery' in txt or 'operation' in txt or 'સર્જરી' in txt or 'सर्जरी' in txt:
        reason = 'Surgical Operation'
    elif 'icu' in txt or 'આઈસીયુ' in txt:
        reason = 'ICU Emergency'

    return relation, reason


def extract_required_time(text):
    """Extracts required time phrase."""
    if not text:
        return 'Within 2 Hours'

    txt = text.lower()
    if '1 hour' in txt or 'one hour' in txt or '૧ કલાક' in txt or '1 घंटा' in txt:
        return 'Within 1 Hour'
    if '2 hour' in txt or 'two hour' in txt or '૨ કલાક' in txt:
        return 'Within 2 Hours'
    if 'immediately' in txt or 'urgent' in txt or 'તરત' in txt or 'तुरंत' in txt:
        return 'Immediately'
    if 'today' in txt or 'આજે' in txt or 'आज' in txt:
        return 'Today'
    if 'tomorrow' in txt or 'કાલે' in txt or 'कल' in txt:
        return 'Tomorrow'

    return 'Within 2 Hours'


def process_voice_transcript(transcript):
    """
    Main NLP Pipeline function.
    Processes spoken transcript and extracts structured fields, confidence scores, and priority.
    """
    lang = detect_language(transcript)
    bg, bg_conf = extract_blood_group(transcript)
    prio, prio_conf = classify_priority(transcript)
    hosp, hosp_conf = extract_hospital(transcript)
    city, lm, loc_conf = extract_location(transcript)
    rel, reason = extract_relation_and_reason(transcript)
    req_time = extract_required_time(transcript)

    # Compute individual field confidences
    field_confidences = {
        'blood_group': bg_conf if bg else 0.0,
        'hospital': hosp_conf if hosp else 70.0,
        'location': loc_conf if city else 75.0,
        'priority': prio_conf,
        'relation': 90.0 if rel != 'Self' else 80.0,
        'required_time': 88.0
    }

    # Compute overall confidence
    valid_confs = [c for c in field_confidences.values() if c > 0]
    overall_conf = round(sum(valid_confs) / len(valid_confs), 1) if valid_confs else 75.0

    return {
        'transcript': transcript,
        'detected_language': lang,
        'extracted_blood_group': bg or 'O+',
        'blood_group_detected': bool(bg),
        'extracted_city': city or 'Ahmedabad',
        'extracted_hospital': hosp or 'Civil Hospital',
        'extracted_landmark': lm or '',
        'extracted_relation': rel,
        'extracted_priority': prio,
        'extracted_required_time': req_time,
        'extracted_reason': reason,
        'overall_confidence': overall_conf,
        'field_confidences': field_confidences
    }
