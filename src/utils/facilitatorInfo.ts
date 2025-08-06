interface FacilitatorInfo {
  facilitator_name: string;
  facilitator_email: string;
}

export function parseFacilitatorData(facilitatorData: unknown): FacilitatorInfo {
  const defaultInfo: FacilitatorInfo = {
    facilitator_name: 'Unknown',
    facilitator_email: '',
  };

  if (!facilitatorData) {
    return defaultInfo;
  }
  
  if (Array.isArray(facilitatorData)) {
    if (facilitatorData.length === 0) {
      return defaultInfo;
    }
    
    const facilitator = facilitatorData[0];
    return {
      facilitator_name: facilitator?.name || 'Unknown',
      facilitator_email: facilitator?.email || '',
    };
  }
  
  // Handle object format (legacy/fallback) - Currently always used
  if (typeof facilitatorData === 'object' && facilitatorData !== null) {
    const facilitator = facilitatorData as { name?: string; email?: string };
    return {
      facilitator_name: facilitator.name || 'Unknown',
      facilitator_email: facilitator.email || '',
    };
  }
  
  // If somehow it's a string (edge case)
  if (typeof facilitatorData === 'string') {
    return {
      facilitator_name: facilitatorData,
      facilitator_email: '',
    };
  }
  
  return defaultInfo;
}