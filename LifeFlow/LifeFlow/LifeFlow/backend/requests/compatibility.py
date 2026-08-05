"""
Blood Compatibility Module
Provides medical cross-matching rules for blood donation compatibility between donors and receivers.
"""

# Map of which donor blood groups can donate to a given receiver blood group
RECEIVER_TO_COMPATIBLE_DONORS = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
}

# Map of which receiver blood groups can accept blood from a given donor blood group
DONOR_TO_COMPATIBLE_RECEIVERS = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
}

def get_compatible_donors_for_receiver(receiver_blood_group):
    """
    Returns list of donor blood groups compatible with the receiver's blood group.
    """
    group = (receiver_blood_group or '').strip().upper()
    return RECEIVER_TO_COMPATIBLE_DONORS.get(group, [group] if group else [])

def get_compatible_receivers_for_donor(donor_blood_group):
    """
    Returns list of receiver blood groups compatible with the donor's blood group.
    """
    group = (donor_blood_group or '').strip().upper()
    return DONOR_TO_COMPATIBLE_RECEIVERS.get(group, [group] if group else [])
