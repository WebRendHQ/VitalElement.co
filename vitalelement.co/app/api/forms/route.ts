import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Interface for the form submission data
interface FormSubmission {
  formData: Record<string, any>;
  timeSpent: number; // in milliseconds
  viewedSections: string[];
}

// Interface for location data
interface LocationData {
  ip: string;
  city?: string;
  region?: string;
  region_code?: string;
  country_name?: string;
  country_code?: string;
  continent_code?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  utc_offset?: string;
  country_calling_code?: string;
  currency?: string;
  languages?: string;
  asn?: string;
  org?: string;
  [key: string]: any; // For any additional fields
}

// Get detailed location information from IP address
async function getDetailedLocationFromIp(ip: string): Promise<LocationData> {
  try {
    // Fall back to ipinfo.io if ipapi.co doesn't work
    // ipapi.co has rate limits that could be hit
    const apiUrls = [
      `https://ipapi.co/${ip}/json/`,
      `https://ipinfo.io/${ip}/json?token=process.env.IPINFO_TOKEN`
    ];
    
    let locationData = null;
    let error = null;
    
    // Try each API in order until one works
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          locationData = await response.json();
          break;
        }
      } catch (err) {
        error = err;
        // Continue to next API if this one fails
      }
    }
    
    if (!locationData) {
      throw error || new Error('All location API requests failed');
    }
    
    // Standardize location data format
    // Some APIs use different field names
    return {
      ip,
      city: locationData.city,
      region: locationData.region || locationData.region_name,
      region_code: locationData.region_code,
      country_name: locationData.country_name || locationData.country,
      country_code: locationData.country_code || locationData.country,
      continent_code: locationData.continent_code,
      postal: locationData.postal || locationData.zip,
      latitude: typeof locationData.latitude === 'string' ? parseFloat(locationData.latitude) : locationData.latitude,
      longitude: typeof locationData.longitude === 'string' ? parseFloat(locationData.longitude) : locationData.longitude,
      timezone: locationData.timezone,
      utc_offset: locationData.utc_offset,
      country_calling_code: locationData.country_calling_code,
      currency: locationData.currency,
      languages: locationData.languages,
      asn: locationData.asn,
      org: locationData.org,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return { 
      ip,
      error: 'Location data unavailable' 
    };
  }
}

// Process user type based on form responses
function determineUserType(formData: Record<string, any>): string {
  // User categorization based on wellness preferences
  if (!formData.previousWellness || !formData.importantFactors) {
    return 'new_user';
  }

  const wellnessPreferences = formData.previousWellness || [];
  const importantFactors = formData.importantFactors || [];
  
  // Determine user type based on their previous experience and preferences
  if (wellnessPreferences.length > 3) {
    return 'wellness_enthusiast';
  } else if (wellnessPreferences.includes('Red light therapy') || 
             wellnessPreferences.includes('Blue light therapy') ||
             wellnessPreferences.includes('Immersive music therapy')) {
    return 'tech_forward';
  } else if (importantFactors.includes('Premium entertainment experience (IMAX-quality immersion)') ||
             importantFactors.includes('Smart workspace integration (be productive while getting healthy)')) {
    return 'experience_seeker';
  } else if (importantFactors.includes('Results guarantee')) {
    return 'results_focused';
  } else if (importantFactors.includes('Pay-as-you-go pricing (only pay for what you use)')) {
    return 'value_conscious';
  }
  
  return 'general_wellness';
}

// Get referring source information from request headers
function getReferringSource(request: NextRequest): Record<string, string> {
  return {
    referrer: request.headers.get('referer') || 'Direct',
    userAgent: request.headers.get('user-agent') || 'Unknown',
    // Capture UTM parameters from query if present
    // This would require accessing the URL, which isn't directly available
    // Consider passing these as part of the form data if needed
  };
}

// Update analytics tracking with the new form submission data
async function updateAnalytics(formSubmission: any, locationData: LocationData): Promise<void> {
  try {
    const analyticsRef = db.collection('form_analytics');
    const batch = db.batch();
    const timestamp = FieldValue.serverTimestamp();
    const formData = formSubmission.formData;
    
    // Total submissions counter
    const totalsRef = analyticsRef.doc('totals');
    batch.set(totalsRef, {
      submissions_count: FieldValue.increment(1),
      last_updated: timestamp
    }, { merge: true });
    
    // Update user types distribution
    const userType = determineUserType(formData);
    const userTypesRef = analyticsRef.doc('user_types');
    batch.set(userTypesRef, {
      [userType]: FieldValue.increment(1),
      total: FieldValue.increment(1),
      last_updated: timestamp
    }, { merge: true });
    
    // Wellness experiences tracking
    if (formData.previousWellness && Array.isArray(formData.previousWellness)) {
      const wellnessExpRef = analyticsRef.doc('wellness_experiences');
      
      // Define all possible options to ensure consistent data structure
      const allWellnessOptions = [
        'Relaxation space',
        'Sauna',
        'Red light therapy',
        'Immersive music therapy',
        'HIIT Workouts',
        'Vibroacoustic therapy'
      ];
      
      // Track selected experiences
      formData.previousWellness.forEach((exp: string) => {
        batch.set(wellnessExpRef, {
          [`selected.${exp.replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`]: FieldValue.increment(1),
          total_responses: FieldValue.increment(1),
          last_updated: timestamp
        }, { merge: true });
      });
      
      // Track unselected experiences
      allWellnessOptions
        .filter(opt => !formData.previousWellness.includes(opt))
        .forEach(exp => {
          batch.set(wellnessExpRef, {
            [`not_selected.${exp.replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`]: FieldValue.increment(1),
            last_updated: timestamp
          }, { merge: true });
        });
    }
    
    // Obstacles tracking
    if (formData.reasonsNotJoining && Array.isArray(formData.reasonsNotJoining)) {
      const obstaclesRef = analyticsRef.doc('obstacles');
      
      // Define all possible options
      const allObstacleOptions = [
        'Too expensive',
        'Confusing pricing structure',
        'Poor value for money',
        'Inconvenient location',
        'Didn\'t see results quickly enough',
        'Lost motivation/interest',
        'Work schedule conflicts',
        'Family responsibilities',
        'Life just got too busy'
      ];
      
      // Track selected obstacles
      formData.reasonsNotJoining.forEach((obstacle: string) => {
        batch.set(obstaclesRef, {
          [`selected.${obstacle.replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`]: FieldValue.increment(1),
          total_responses: FieldValue.increment(1),
          last_updated: timestamp
        }, { merge: true });
      });
      
      // Track unselected obstacles
      allObstacleOptions
        .filter(opt => !formData.reasonsNotJoining.includes(opt))
        .forEach(obstacle => {
          batch.set(obstaclesRef, {
            [`not_selected.${obstacle.replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`]: FieldValue.increment(1),
            last_updated: timestamp
          }, { merge: true });
        });
    }
    
    // Important factors tracking
    if (formData.importantFactors && Array.isArray(formData.importantFactors)) {
      const factorsRef = analyticsRef.doc('important_factors');
      
      // Define all possible options
      const allFactorOptions = [
        'Pay-as-you-go pricing (only pay for what you use)',
        'Smart workspace integration (be productive while getting healthy)',
        'Premium entertainment experience (IMAX-quality immersion)',
        'Ultimate convenience (access from 6am-11pm daily)',
        'Vibrant community of like-minded members',
        'Results guarantee',
        'Pristine, luxury environment',
        'Personalized care and attention'
      ];
      
      // Track selected factors
      formData.importantFactors.forEach((factor: string) => {
        batch.set(factorsRef, {
          [`selected.${factor.replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`]: FieldValue.increment(1),
          total_responses: FieldValue.increment(1),
          last_updated: timestamp
        }, { merge: true });
      });
      
      // Track unselected factors
      allFactorOptions
        .filter(opt => !formData.importantFactors.includes(opt))
        .forEach(factor => {
          batch.set(factorsRef, {
            [`not_selected.${factor.replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`]: FieldValue.increment(1),
            last_updated: timestamp
          }, { merge: true });
        });
    }
    
    // Preferred therapies tracking
    if (formData.preferredTherapies && Array.isArray(formData.preferredTherapies)) {
      const therapiesRef = analyticsRef.doc('preferred_therapies');
      
      // Define all possible options
      const allTherapyOptions = [
        'Luxury relaxation pods',
        'Advanced infrared sauna therapy',
        'Rejuvenating red light therapy',
        'Immersive 4D music experience',
        'Mood-enhancing blue light therapy',
        'AI-guided HIIT workouts'
      ];
      
      // Track selected therapies
      formData.preferredTherapies.forEach((therapy: string) => {
        batch.set(therapiesRef, {
          [`selected.${therapy.replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`]: FieldValue.increment(1),
          total_responses: FieldValue.increment(1),
          last_updated: timestamp
        }, { merge: true });
      });
      
      // Track unselected therapies
      allTherapyOptions
        .filter(opt => !formData.preferredTherapies.includes(opt))
        .forEach(therapy => {
          batch.set(therapiesRef, {
            [`not_selected.${therapy.replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`]: FieldValue.increment(1),
            last_updated: timestamp
          }, { merge: true });
        });
    }
    
    // Location analytics
    if (locationData && locationData.country_code) {
      const locationAnalyticsRef = analyticsRef.doc('locations');
      const country = locationData.country_code.toLowerCase();
      const region = locationData.region_code ? locationData.region_code.toLowerCase() : 'unknown';
      const city = locationData.city ? locationData.city.toLowerCase().replace(/\s+/g, '_') : 'unknown';
      
      batch.set(locationAnalyticsRef, {
        [`countries.${country}`]: FieldValue.increment(1),
        [`regions.${country}.${region}`]: FieldValue.increment(1),
        [`cities.${country}.${region}.${city}`]: FieldValue.increment(1),
        total_responses: FieldValue.increment(1),
        last_updated: timestamp
      }, { merge: true });
    }
    
    // Track preferred locations mentioned by users
    if (formData.preferredLocation) {
      const locationRequestRef = analyticsRef.doc('location_requests');
      batch.set(locationRequestRef, {
        [`raw_inputs.${Date.now().toString()}`]: formData.preferredLocation,
        total_responses: FieldValue.increment(1),
        last_updated: timestamp
      }, { merge: true });
    }
    
    // Track time spent
    if (formSubmission.timeSpent) {
      const timeSpentRef = analyticsRef.doc('time_spent');
      const minutes = Math.floor(formSubmission.timeSpent / 60000);
      const timeCategory = minutes < 2 ? 'under_2_min' :
                          minutes < 5 ? '2_to_5_min' :
                          minutes < 10 ? '5_to_10_min' : 'over_10_min';
      
      batch.set(timeSpentRef, {
        [timeCategory]: FieldValue.increment(1),
        total_responses: FieldValue.increment(1),
        total_time_ms: FieldValue.increment(formSubmission.timeSpent),
        last_updated: timestamp
      }, { merge: true });
    }
    
    // Execute all the batch operations
    await batch.commit();
    
    // Calculate and store percentages in a separate document
    await calculateAndStorePercentages();
    
  } catch (error) {
    console.error('Error updating analytics:', error);
    // Don't throw here - we don't want to fail form submission if analytics fails
  }
}

// Calculate and store percentages for all analytics categories
async function calculateAndStorePercentages(): Promise<void> {
  try {
    const analyticsRef = db.collection('form_analytics');
    const percentagesRef = db.collection('form_analytics_percentages');
    const summaryRef = db.collection('form_analytics_summary');
    const batch = db.batch();
    const timestamp = FieldValue.serverTimestamp();
    
    // Get total form submissions count
    const totalsDoc = await analyticsRef.doc('totals').get();
    const totalSubmissions = totalsDoc.exists ? (totalsDoc.data()?.submissions_count || 0) : 0;
    
    // Create a summary object for overall statistics with proper typing
    interface SummaryData {
      total_submissions: number;
      last_updated: FieldValue;
      user_types?: {
        top_type: string;
        top_type_percentage: number;
      };
      wellness_experiences?: {
        top_experience: string;
        top_experience_percentage: number;
      };
      obstacles?: {
        top_obstacle: string;
        top_obstacle_percentage: number;
      };
      important_factors?: {
        top_factor: string;
        top_factor_percentage: number;
      };
      preferred_therapies?: {
        top_therapy: string;
        top_therapy_percentage: number;
      };
      locations?: {
        top_country: string;
        top_country_percentage: number;
        top_region: string;
        top_region_percentage: number;
      };
      platforms?: {
        top_browser?: string;
        top_browser_percentage?: number;
        top_device?: string;
        top_device_percentage?: number;
      };
      time_spent?: {
        average_minutes: number;
        most_common_duration: string;
      };
    }
    
    const summary: SummaryData = {
      total_submissions: totalSubmissions,
      last_updated: timestamp
    };
    
    // Process user types
    const userTypesDoc = await analyticsRef.doc('user_types').get();
    if (userTypesDoc.exists) {
      const userData = userTypesDoc.data() || {};
      const total = userData.total || 0;
      
      if (total > 0) {
        const percentages: Record<string, number> = {};
        const counts: Record<string, number> = {};
        
        Object.keys(userData).forEach(key => {
          if (key !== 'total' && key !== 'last_updated') {
            percentages[key] = parseFloat(((userData[key] / total) * 100).toFixed(1));
            counts[key] = userData[key];
          }
        });
        
        // Store user type percentages
        batch.set(percentagesRef.doc('user_types'), {
          percentages,
          counts,
          total_responses: total,
          percent_of_all_submissions: parseFloat(((total / totalSubmissions) * 100).toFixed(1)),
          last_updated: timestamp
        });
        
        // Add to summary
        summary['user_types'] = {
          top_type: Object.entries(percentages)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown',
          top_type_percentage: Math.max(...Object.values(percentages), 0)
        };
      }
    }
    
    // Process wellness experiences with comparison of selected vs. not selected
    const wellnessDoc = await analyticsRef.doc('wellness_experiences').get();
    if (wellnessDoc.exists) {
      const wellnessData = wellnessDoc.data() || {};
      const total = wellnessData.total_responses || 0;
      
      if (total > 0) {
        const selectedPercentages: Record<string, number> = {};
        const notSelectedPercentages: Record<string, number> = {};
        const selectedCounts: Record<string, number> = {};
        const notSelectedCounts: Record<string, number> = {};
        const comparisonData: Record<string, {selected: number, not_selected: number, ratio: number}> = {};
        
        // Calculate selected percentages
        if (wellnessData.selected) {
          Object.keys(wellnessData.selected).forEach(key => {
            const count = wellnessData.selected[key] || 0;
            selectedPercentages[key] = parseFloat(((count / total) * 100).toFixed(1));
            selectedCounts[key] = count;
          });
        }
        
        // Calculate not selected percentages
        if (wellnessData.not_selected) {
          Object.keys(wellnessData.not_selected).forEach(key => {
            const count = wellnessData.not_selected[key] || 0;
            notSelectedPercentages[key] = parseFloat(((count / total) * 100).toFixed(1));
            notSelectedCounts[key] = count;
          });
        }
        
        // Create comparison data (selected vs not selected)
        const allKeys = new Set([
          ...Object.keys(selectedPercentages),
          ...Object.keys(notSelectedPercentages)
        ]);
        
        allKeys.forEach(key => {
          const selected = selectedCounts[key] || 0;
          const notSelected = notSelectedCounts[key] || 0;
          comparisonData[key] = {
            selected: selectedPercentages[key] || 0,
            not_selected: notSelectedPercentages[key] || 0,
            ratio: notSelected === 0 ? selected : parseFloat((selected / notSelected).toFixed(2))
          };
        });
        
        // Store wellness experience percentages
        batch.set(percentagesRef.doc('wellness_experiences'), {
          selected_percentages: selectedPercentages,
          not_selected_percentages: notSelectedPercentages,
          selected_counts: selectedCounts,
          not_selected_counts: notSelectedCounts,
          comparison: comparisonData,
          total_responses: total,
          percent_of_all_submissions: parseFloat(((total / totalSubmissions) * 100).toFixed(1)),
          last_updated: timestamp
        });
        
        // Add to summary - most popular wellness experience
        if (Object.keys(selectedPercentages).length > 0) {
          const topExperience = Object.entries(selectedPercentages)
            .sort(([, a], [, b]) => b - a)[0];
          
          summary['wellness_experiences'] = {
            top_experience: topExperience?.[0] || 'unknown',
            top_experience_percentage: topExperience?.[1] || 0
          };
        }
      }
    }
    
    // Process obstacles with comparison of selected vs. not selected
    const obstaclesDoc = await analyticsRef.doc('obstacles').get();
    if (obstaclesDoc.exists) {
      const obstaclesData = obstaclesDoc.data() || {};
      const total = obstaclesData.total_responses || 0;
      
      if (total > 0) {
        const selectedPercentages: Record<string, number> = {};
        const notSelectedPercentages: Record<string, number> = {};
        const selectedCounts: Record<string, number> = {};
        const notSelectedCounts: Record<string, number> = {};
        const comparisonData: Record<string, {selected: number, not_selected: number, ratio: number}> = {};
        
        // Calculate selected percentages
        if (obstaclesData.selected) {
          Object.keys(obstaclesData.selected).forEach(key => {
            const count = obstaclesData.selected[key] || 0;
            selectedPercentages[key] = parseFloat(((count / total) * 100).toFixed(1));
            selectedCounts[key] = count;
          });
        }
        
        // Calculate not selected percentages
        if (obstaclesData.not_selected) {
          Object.keys(obstaclesData.not_selected).forEach(key => {
            const count = obstaclesData.not_selected[key] || 0;
            notSelectedPercentages[key] = parseFloat(((count / total) * 100).toFixed(1));
            notSelectedCounts[key] = count;
          });
        }
        
        // Create comparison data
        const allKeys = new Set([
          ...Object.keys(selectedPercentages),
          ...Object.keys(notSelectedPercentages)
        ]);
        
        allKeys.forEach(key => {
          const selected = selectedCounts[key] || 0;
          const notSelected = notSelectedCounts[key] || 0;
          comparisonData[key] = {
            selected: selectedPercentages[key] || 0,
            not_selected: notSelectedPercentages[key] || 0,
            ratio: notSelected === 0 ? selected : parseFloat((selected / notSelected).toFixed(2))
          };
        });
        
        // Store obstacles percentages
        batch.set(percentagesRef.doc('obstacles'), {
          selected_percentages: selectedPercentages,
          not_selected_percentages: notSelectedPercentages,
          selected_counts: selectedCounts,
          not_selected_counts: notSelectedCounts,
          comparison: comparisonData,
          total_responses: total,
          percent_of_all_submissions: parseFloat(((total / totalSubmissions) * 100).toFixed(1)),
          last_updated: timestamp
        });
        
        // Add to summary - top obstacle
        if (Object.keys(selectedPercentages).length > 0) {
          const topObstacle = Object.entries(selectedPercentages)
            .sort(([, a], [, b]) => b - a)[0];
          
          summary['obstacles'] = {
            top_obstacle: topObstacle?.[0] || 'unknown',
            top_obstacle_percentage: topObstacle?.[1] || 0
          };
        }
      }
    }
    
    // Process important factors with comparison of selected vs. not selected
    const factorsDoc = await analyticsRef.doc('important_factors').get();
    if (factorsDoc.exists) {
      const factorsData = factorsDoc.data() || {};
      const total = factorsData.total_responses || 0;
      
      if (total > 0) {
        const selectedPercentages: Record<string, number> = {};
        const notSelectedPercentages: Record<string, number> = {};
        const selectedCounts: Record<string, number> = {};
        const notSelectedCounts: Record<string, number> = {};
        const comparisonData: Record<string, {selected: number, not_selected: number, ratio: number}> = {};
        
        // Calculate selected percentages
        if (factorsData.selected) {
          Object.keys(factorsData.selected).forEach(key => {
            const count = factorsData.selected[key] || 0;
            selectedPercentages[key] = parseFloat(((count / total) * 100).toFixed(1));
            selectedCounts[key] = count;
          });
        }
        
        // Calculate not selected percentages
        if (factorsData.not_selected) {
          Object.keys(factorsData.not_selected).forEach(key => {
            const count = factorsData.not_selected[key] || 0;
            notSelectedPercentages[key] = parseFloat(((count / total) * 100).toFixed(1));
            notSelectedCounts[key] = count;
          });
        }
        
        // Create comparison data
        const allKeys = new Set([
          ...Object.keys(selectedPercentages),
          ...Object.keys(notSelectedPercentages)
        ]);
        
        allKeys.forEach(key => {
          const selected = selectedCounts[key] || 0;
          const notSelected = notSelectedCounts[key] || 0;
          comparisonData[key] = {
            selected: selectedPercentages[key] || 0,
            not_selected: notSelectedPercentages[key] || 0,
            ratio: notSelected === 0 ? selected : parseFloat((selected / notSelected).toFixed(2))
          };
        });
        
        // Store important factors percentages
        batch.set(percentagesRef.doc('important_factors'), {
          selected_percentages: selectedPercentages,
          not_selected_percentages: notSelectedPercentages,
          selected_counts: selectedCounts,
          not_selected_counts: notSelectedCounts,
          comparison: comparisonData,
          total_responses: total,
          percent_of_all_submissions: parseFloat(((total / totalSubmissions) * 100).toFixed(1)),
          last_updated: timestamp
        });
        
        // Add to summary - top factor
        if (Object.keys(selectedPercentages).length > 0) {
          const topFactor = Object.entries(selectedPercentages)
            .sort(([, a], [, b]) => b - a)[0];
          
          summary['important_factors'] = {
            top_factor: topFactor?.[0] || 'unknown',
            top_factor_percentage: topFactor?.[1] || 0
          };
        }
      }
    }
    
    // Process preferred therapies with comparison of selected vs. not selected
    const therapiesDoc = await analyticsRef.doc('preferred_therapies').get();
    if (therapiesDoc.exists) {
      const therapiesData = therapiesDoc.data() || {};
      const total = therapiesData.total_responses || 0;
      
      if (total > 0) {
        const selectedPercentages: Record<string, number> = {};
        const notSelectedPercentages: Record<string, number> = {};
        const selectedCounts: Record<string, number> = {};
        const notSelectedCounts: Record<string, number> = {};
        const comparisonData: Record<string, {selected: number, not_selected: number, ratio: number}> = {};
        
        // Calculate selected percentages
        if (therapiesData.selected) {
          Object.keys(therapiesData.selected).forEach(key => {
            const count = therapiesData.selected[key] || 0;
            selectedPercentages[key] = parseFloat(((count / total) * 100).toFixed(1));
            selectedCounts[key] = count;
          });
        }
        
        // Calculate not selected percentages
        if (therapiesData.not_selected) {
          Object.keys(therapiesData.not_selected).forEach(key => {
            const count = therapiesData.not_selected[key] || 0;
            notSelectedPercentages[key] = parseFloat(((count / total) * 100).toFixed(1));
            notSelectedCounts[key] = count;
          });
        }
        
        // Create comparison data
        const allKeys = new Set([
          ...Object.keys(selectedPercentages),
          ...Object.keys(notSelectedPercentages)
        ]);
        
        allKeys.forEach(key => {
          const selected = selectedCounts[key] || 0;
          const notSelected = notSelectedCounts[key] || 0;
          comparisonData[key] = {
            selected: selectedPercentages[key] || 0,
            not_selected: notSelectedPercentages[key] || 0,
            ratio: notSelected === 0 ? selected : parseFloat((selected / notSelected).toFixed(2))
          };
        });
        
        // Store preferred therapies percentages
        batch.set(percentagesRef.doc('preferred_therapies'), {
          selected_percentages: selectedPercentages,
          not_selected_percentages: notSelectedPercentages,
          selected_counts: selectedCounts,
          not_selected_counts: notSelectedCounts,
          comparison: comparisonData,
          total_responses: total,
          percent_of_all_submissions: parseFloat(((total / totalSubmissions) * 100).toFixed(1)),
          last_updated: timestamp
        });
        
        // Add to summary - top therapy
        if (Object.keys(selectedPercentages).length > 0) {
          const topTherapy = Object.entries(selectedPercentages)
            .sort(([, a], [, b]) => b - a)[0];
          
          summary['preferred_therapies'] = {
            top_therapy: topTherapy?.[0] || 'unknown',
            top_therapy_percentage: topTherapy?.[1] || 0
          };
        }
      }
    }
    
    // Enhanced location analytics with multi-level percentages
    const locationsDoc = await analyticsRef.doc('locations').get();
    if (locationsDoc.exists) {
      const locationsData = locationsDoc.data() || {};
      const total = locationsData.total_responses || 0;
      
      if (total > 0) {
        // Country level percentages
        const countryPercentages: Record<string, number> = {};
        const countryCounts: Record<string, number> = {};
        
        if (locationsData.countries) {
          Object.keys(locationsData.countries).forEach(country => {
            const count = locationsData.countries[country] || 0;
            countryPercentages[country] = parseFloat(((count / total) * 100).toFixed(1));
            countryCounts[country] = count;
          });
        }
        
        // Region level percentages (by country and overall)
        const regionPercentages: Record<string, Record<string, number>> = {};
        const regionCountsByCountry: Record<string, Record<string, number>> = {};
        const regionOverallPercentages: Record<string, number> = {};
        const regionOverallCounts: Record<string, number> = {};
        
        if (locationsData.regions) {
          Object.keys(locationsData.regions).forEach(country => {
            const regions = locationsData.regions[country] || {};
            regionPercentages[country] = {};
            regionCountsByCountry[country] = {};
            
            const countryTotal = countryCounts[country] || 0;
            
            Object.keys(regions).forEach(region => {
              const count = regions[region] || 0;
              
              // Percentage within country
              if (countryTotal > 0) {
                regionPercentages[country][region] = parseFloat(((count / countryTotal) * 100).toFixed(1));
              }
              
              // Store counts by country and region
              regionCountsByCountry[country][region] = count;
              
              // Overall region percentages (regardless of country)
              regionOverallPercentages[`${country}_${region}`] = parseFloat(((count / total) * 100).toFixed(1));
              regionOverallCounts[`${country}_${region}`] = count;
            });
          });
        }
        
        // City level percentages
        const cityPercentages: Record<string, Record<string, Record<string, number>>> = {};
        const cityOverallPercentages: Record<string, number> = {};
        const cityOverallCounts: Record<string, number> = {};
        
        if (locationsData.cities) {
          Object.keys(locationsData.cities).forEach(country => {
            const regions = locationsData.cities[country] || {};
            cityPercentages[country] = {};
            
            Object.keys(regions).forEach(region => {
              const cities = regions[region] || {};
              cityPercentages[country][region] = {};
              
              const regionTotal = regionCountsByCountry[country]?.[region] || 0;
              
              Object.keys(cities).forEach(city => {
                const count = cities[city] || 0;
                
                // Percentage within region
                if (regionTotal > 0) {
                  cityPercentages[country][region][city] = parseFloat(((count / regionTotal) * 100).toFixed(1));
                }
                
                // Overall city percentages (regardless of country/region)
                cityOverallPercentages[`${country}_${region}_${city}`] = parseFloat(((count / total) * 100).toFixed(1));
                cityOverallCounts[`${country}_${region}_${city}`] = count;
              });
            });
          });
        }
        
        // Store enhanced location percentages
        batch.set(percentagesRef.doc('locations'), {
          country_percentages: countryPercentages,
          country_counts: countryCounts,
          region_percentages: regionPercentages,
          region_overall_percentages: regionOverallPercentages,
          city_percentages: cityPercentages,
          city_overall_percentages: cityOverallPercentages,
          total_responses: total,
          percent_of_all_submissions: parseFloat(((total / totalSubmissions) * 100).toFixed(1)),
          last_updated: timestamp
        });
        
        // Add to summary - top locations
        if (Object.keys(countryPercentages).length > 0) {
          const topCountry = Object.entries(countryPercentages)
            .sort(([, a], [, b]) => b - a)[0];
          
          const topRegion = Object.entries(regionOverallPercentages)
            .sort(([, a], [, b]) => b - a)[0];
          
          summary['locations'] = {
            top_country: topCountry?.[0] || 'unknown',
            top_country_percentage: topCountry?.[1] || 0,
            top_region: topRegion?.[0] || 'unknown',
            top_region_percentage: topRegion?.[1] || 0
          };
        }
      }
    }
    
    // Process device and browser usage
    const browserCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    let browserResponses = 0;
    let deviceResponses = 0;
    
    try {
      // Get all form submissions to count browsers and devices
      const submissions = await db.collection('form_submissions').get();
      
      submissions.forEach(doc => {
        const data = doc.data();
        const browser = data?.metadata?.browser;
        const device = data?.metadata?.device;
        
        if (browser) {
          browserCounts[browser] = (browserCounts[browser] || 0) + 1;
          browserResponses++;
        }
        
        if (device) {
          deviceCounts[device] = (deviceCounts[device] || 0) + 1;
          deviceResponses++;
        }
      });
      
      const browserPercentages: Record<string, number> = {};
      const devicePercentages: Record<string, number> = {};
      
      // Calculate browser percentages
      if (browserResponses > 0) {
        Object.keys(browserCounts).forEach(browser => {
          browserPercentages[browser] = parseFloat(
            ((browserCounts[browser] / browserResponses) * 100).toFixed(1)
          );
        });
      }
      
      // Calculate device percentages
      if (deviceResponses > 0) {
        Object.keys(deviceCounts).forEach(device => {
          devicePercentages[device] = parseFloat(
            ((deviceCounts[device] / deviceResponses) * 100).toFixed(1)
          );
        });
      }
      
      // Store device and browser percentages
      batch.set(percentagesRef.doc('platforms'), {
        browser_percentages: browserPercentages,
        browser_counts: browserCounts,
        device_percentages: devicePercentages,
        device_counts: deviceCounts,
        browser_total: browserResponses,
        device_total: deviceResponses,
        last_updated: timestamp
      });
      
      // Add to summary
      if (Object.keys(browserPercentages).length > 0) {
        const topBrowser = Object.entries(browserPercentages)
          .sort(([, a], [, b]) => b - a)[0];
        
        summary['platforms'] = {
          top_browser: topBrowser?.[0] || 'unknown',
          top_browser_percentage: topBrowser?.[1] || 0
        };
      }
      
      if (Object.keys(devicePercentages).length > 0) {
        const topDevice = Object.entries(devicePercentages)
          .sort(([, a], [, b]) => b - a)[0];
        
        if (!summary['platforms']) summary['platforms'] = {};
        summary['platforms']['top_device'] = topDevice?.[0] || 'unknown';
        summary['platforms']['top_device_percentage'] = topDevice?.[1] || 0;
      }
    } catch (error) {
      console.error('Error processing platform data:', error);
    }
    
    // Process time spent data
    const timeSpentDoc = await analyticsRef.doc('time_spent').get();
    if (timeSpentDoc.exists) {
      const timeData = timeSpentDoc.data() || {};
      const total = timeData.total_responses || 0;
      
      if (total > 0) {
        const timePercentages: Record<string, number> = {};
        const timeCounts: Record<string, number> = {};
        
        // Calculate time spent percentages
        ['under_2_min', '2_to_5_min', '5_to_10_min', 'over_10_min'].forEach(category => {
          const count = timeData[category] || 0;
          timePercentages[category] = parseFloat(((count / total) * 100).toFixed(1));
          timeCounts[category] = count;
        });
        
        // Calculate average time spent
        const avgTimeMs = timeData.total_time_ms ? timeData.total_time_ms / total : 0;
        const avgTimeMinutes = parseFloat((avgTimeMs / 60000).toFixed(1));
        
        // Store time spent percentages
        batch.set(percentagesRef.doc('time_spent'), {
          percentages: timePercentages,
          counts: timeCounts,
          average_time_ms: avgTimeMs,
          average_time_minutes: avgTimeMinutes,
          total_responses: total,
          percent_of_all_submissions: parseFloat(((total / totalSubmissions) * 100).toFixed(1)),
          last_updated: timestamp
        });
        
        // Add to summary
        summary['time_spent'] = {
          average_minutes: avgTimeMinutes,
          most_common_duration: Object.entries(timePercentages)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown'
        };
      }
    }
    
    // Store the summary data
    batch.set(summaryRef.doc('overview'), summary);
    
    // Execute all the batch operations
    await batch.commit();
    
  } catch (error) {
    console.error('Error calculating percentages:', error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get client IP address - prioritize x-forwarded-for for accuracy with proxies
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || // Cloudflare specific
               '127.0.0.1';
               
    // Clean the IP (in case of multiple IPs in x-forwarded-for)
    const cleanIp = ip.split(',')[0].trim();
    
    // Parse request body
    const body: FormSubmission = await request.json();
    const { formData = {}, timeSpent = 0, viewedSections = [] } = body;
    
    // Sanitize formData to remove undefined values
    const sanitizedFormData = Object.fromEntries(
      Object.entries(formData || {}).map(([key, value]) => {
        // Convert undefined to null for Firestore compatibility
        if (value === undefined) return [key, null];
        // Handle arrays with undefined values
        if (Array.isArray(value)) {
          return [key, value.map(item => item === undefined ? null : item)];
        }
        return [key, value];
      })
    );
    
    // Get detailed location data
    const locationData = await getDetailedLocationFromIp(cleanIp);
    
    // Sanitize location data for Firestore
    const sanitizedLocationData: LocationData = {
      ip: locationData.ip, // Ensure IP is always included as it's required
      ...Object.fromEntries(
        Object.entries(locationData || {})
          .filter(([_, value]) => value !== undefined)
      )
    };
    
    // Determine user type based on form responses
    const userType = determineUserType(sanitizedFormData);
    
    // Get referral source information
    const referralInfo = getReferringSource(request);
    
    // Build document to store with enhanced metadata
    const formSubmission = {
      formData: sanitizedFormData,
      metadata: {
        submittedAt: FieldValue.serverTimestamp(),
        ipAddress: cleanIp,
        location: sanitizedLocationData,
        referralInfo,
        timeSpent, // time in milliseconds
        viewedSections: Array.isArray(viewedSections) ? viewedSections : [],
        completionRate: viewedSections && Array.isArray(viewedSections) ? 
          viewedSections.length / 8 : 0, // 8 is total number of possible sections
        userType,
        browser: referralInfo.userAgent ? getBrowserInfo(referralInfo.userAgent) : 'Unknown',
        device: referralInfo.userAgent ? getDeviceInfo(referralInfo.userAgent) : 'Unknown'
      }
    };
    
    // Add document to Firestore
    const formSubmissionsRef = db.collection('form_submissions');
    const docRef = await formSubmissionsRef.add(formSubmission);
    
    // Also store by location for geographic analysis
    const locationKey = [
      (sanitizedLocationData.country_code || 'unknown'),
      (sanitizedLocationData.region_code || 'unknown')
    ].join('_').toLowerCase();
    
    await db.collection('form_submissions_by_location')
      .doc(locationKey)
      .collection('submissions')
      .add({
        submissionId: docRef.id,
        timestamp: FieldValue.serverTimestamp(),
        userType,
        preferredLocation: sanitizedFormData.preferredLocation || null,
        preferredTherapies: Array.isArray(sanitizedFormData.preferredTherapies) ? 
          sanitizedFormData.preferredTherapies : [],
        email: sanitizedFormData.email || null
      });
    
    // Create a user profile if email is provided
    if (sanitizedFormData.email) {
      const userProfilesRef = db.collection('user_profiles');
      
      // Ensure coordinates are properly formatted
      const hasValidCoordinates = 
        sanitizedLocationData.latitude != null && 
        sanitizedLocationData.longitude != null;
      
      await userProfilesRef.add({
        email: sanitizedFormData.email,
        name: sanitizedFormData.name || '',
        userType,
        location: {
          city: sanitizedLocationData.city || null,
          region: sanitizedLocationData.region || null,
          country: sanitizedLocationData.country_name || null,
          coordinates: hasValidCoordinates ? 
            [sanitizedLocationData.latitude, sanitizedLocationData.longitude] : null
        },
        interests: Array.isArray(sanitizedFormData.preferredTherapies) ? 
          sanitizedFormData.preferredTherapies : [],
        preferences: Array.isArray(sanitizedFormData.importantFactors) ? 
          sanitizedFormData.importantFactors : [],
        previousExperience: Array.isArray(sanitizedFormData.previousWellness) ? 
          sanitizedFormData.previousWellness : [],
        preferredLocation: sanitizedFormData.preferredLocation || '',
        createdAt: FieldValue.serverTimestamp(),
        lastActive: FieldValue.serverTimestamp(),
        source: 'landing_form'
      });
    }
    
    try {
      // Update analytics tracking with the new form submission data
      await updateAnalytics(formSubmission, sanitizedLocationData);
    } catch (analyticsError) {
      console.error('Analytics update failed but form submission was successful:', analyticsError);
      // Continue with the submission response even if analytics fails
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Form submitted successfully',
      submissionId: docRef.id
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    // Return error response
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to process form submission',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to extract browser information from user agent
function getBrowserInfo(userAgent: string): string {
  // Simple browser detection
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
  return 'Other';
}

// Helper function to extract device information from user agent
function getDeviceInfo(userAgent: string): string {
  if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) return 'iOS';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux';
  return 'Other';
}
