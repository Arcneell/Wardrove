from dataclasses import dataclass


@dataclass
class Observation:
    latitude: float
    longitude: float
    rssi: int


def trilaterate(observations: list[Observation]) -> tuple[float, float]:
    """Weighted centroid with stronger signals getting more weight.

    RSSI is negative (typically -30 dBm strong, -100 dBm weak). We normalize
    to a positive score (100 + rssi) so -30 → 70 and -100 → 0, then square it
    so close observations dominate the fix.
    """
    total_weight = 0.0
    weighted_lat = 0.0
    weighted_lon = 0.0

    for obs in observations:
        if obs.latitude and obs.longitude and obs.rssi:
            score = max(0, 100 + obs.rssi)
            weight = score * score
            if weight == 0:
                continue
            weighted_lat += obs.latitude * weight
            weighted_lon += obs.longitude * weight
            total_weight += weight

    if total_weight == 0:
        # Fallback to first observation
        for obs in observations:
            if obs.latitude and obs.longitude:
                return obs.latitude, obs.longitude
        return 0.0, 0.0

    return weighted_lat / total_weight, weighted_lon / total_weight
