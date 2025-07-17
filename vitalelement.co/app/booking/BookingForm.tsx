'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '../lib/firebase-client';
import { useAuthState } from 'react-firebase-hooks/auth';
import LocationMap from './LocationMap';
import styles from './bookingForm.module.scss';

// Define the categories and their corresponding Stripe price IDs
const CATEGORIES = [
  { id: 'gaming', name: 'Gaming', priceId: 'price_gaming123', description: 'Immersive gaming experiences in high-resolution environments' },
  { id: 'therapy', name: 'Therapy', priceId: 'price_therapy123', description: 'Relaxing and therapeutic environments for mental wellness' },
  { id: 'meditation', name: 'Meditation', priceId: 'price_meditation123', description: 'Peaceful environments designed for mindfulness and meditation' },
  { id: 'productivity', name: 'Productivity', priceId: 'price_productivity123', description: 'Distraction-free workspaces for maximum focus and productivity' },
  { id: 'social', name: 'Social Gathering', priceId: 'price_social123', description: 'Virtual spaces for social interactions and gatherings' }
];

// Define the locations
const LOCATIONS = [
  { id: 'nyc', name: 'New York City' },
  { id: 'sf', name: 'San Francisco' },
  { id: 'la', name: 'Los Angeles' },
  { id: 'chicago', name: 'Chicago' },
  { id: 'miami', name: 'Miami' }
];

// Define available time slots
const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', 
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
];

interface TimeSlotAvailability {
  timeSlot: string;
  maxPods: number;
  bookedPods: number;
  availablePods: number;
  isAvailable: boolean;
}

// Client component that uses useSearchParams
function BookingFormContent() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [duration, setDuration] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlotAvailability[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  // Calculate the minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  
  // Calculate the maximum date (3 months from now)
  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Restore form state from URL params if available
  useEffect(() => {
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const date = searchParams.get('date');
    const timeSlot = searchParams.get('timeSlot');
    const durationParam = searchParams.get('duration');

    if (category) setSelectedCategory(category);
    if (location) setSelectedLocation(location);
    if (date) setSelectedDate(date);
    if (timeSlot) setSelectedTimeSlot(timeSlot);
    if (durationParam) setDuration(parseInt(durationParam, 10) || 1);
  }, [searchParams]);

  // Check availability when location or date changes
  useEffect(() => {
    if (selectedLocation && selectedDate) {
      checkAvailability();
    }
  }, [selectedLocation, selectedDate]);

  const checkAvailability = async () => {
    if (!selectedLocation || !selectedDate) return;
    
    setIsCheckingAvailability(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/booking/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: selectedLocation,
          date: selectedDate,
          timeSlots: TIME_SLOTS
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check availability');
      }
      
      const data = await response.json();
      setAvailableTimeSlots(data.availability);
      
      // If the currently selected time slot is not available, clear it
      if (selectedTimeSlot) {
        const isCurrentTimeSlotAvailable = data.availability.find(
          (slot: TimeSlotAvailability) => slot.timeSlot === selectedTimeSlot && slot.isAvailable
        );
        
        if (!isCurrentTimeSlotAvailable) {
          setSelectedTimeSlot('');
        }
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Failed to check availability. Please try again.');
    } finally {
      setIsCheckingAvailability(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Save current form state in URL params
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLocation) params.append('location', selectedLocation);
      if (selectedDate) params.append('date', selectedDate);
      if (selectedTimeSlot) params.append('timeSlot', selectedTimeSlot);
      params.append('duration', duration.toString());
      
      // Redirect to auth page with redirect back to booking with saved state
      router.push(`/auth?redirect=/booking?${params.toString()}`);
      return;
    }
    
    if (!selectedCategory || !selectedLocation || !selectedDate || !selectedTimeSlot || duration < 1) {
      setError('Please fill in all fields');
      return;
    }
    
    // Check availability one more time before submitting
    try {
      const availabilityResponse = await fetch(`/api/booking/availability?location=${selectedLocation}&date=${selectedDate}&timeSlot=${selectedTimeSlot}`);
      const availabilityData = await availabilityResponse.json();
      
      if (!availabilityData.isAvailable) {
        setError('Sorry, this time slot is no longer available. Please select another time.');
        await checkAvailability(); // Refresh availability
        return;
      }
    } catch (err) {
      console.error('Error checking final availability:', err);
      setError('Failed to verify availability. Please try again.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Find the selected category to get the price ID
      const category = CATEGORIES.find(cat => cat.id === selectedCategory);
      
      if (!category) {
        throw new Error('Invalid category selected');
      }
      
      // Create the booking in Firestore and generate a checkout session
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          priceId: category.priceId,
          duration: duration,
          category: selectedCategory,
          location: selectedLocation,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          userToken: await user.getIdToken(),
          metadata: {
            type: 'pod_booking',
            category: selectedCategory,
            location: selectedLocation,
            date: selectedDate,
            timeSlot: selectedTimeSlot,
            duration: duration
          }
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Booking error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsProcessing(false);
    }
  };
  
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }
  
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Book Your Pod</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="category">What will you use the pod for?</label>
        <select 
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          required
          className={styles.select}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        
        {selectedCategory && (
          <p className={styles.categoryDescription}>
            {CATEGORIES.find(cat => cat.id === selectedCategory)?.description}
          </p>
        )}
      </div>
      
      <div className={styles.formGroup}>
        <label>Select a Location</label>
        <LocationMap 
          selectedLocation={selectedLocation}
          onLocationSelect={(locationId) => setSelectedLocation(locationId)}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="date">Date</label>
        <input 
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={minDate}
          max={maxDateString}
          required
          className={styles.input}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="timeSlot">Time Slot</label>
        <select 
          id="timeSlot"
          value={selectedTimeSlot}
          onChange={(e) => setSelectedTimeSlot(e.target.value)}
          required
          className={styles.select}
          disabled={isCheckingAvailability || availableTimeSlots.length === 0}
        >
          <option value="">Select a time slot</option>
          {availableTimeSlots.map(slot => (
            <option 
              key={slot.timeSlot} 
              value={slot.timeSlot}
              disabled={!slot.isAvailable}
            >
              {slot.timeSlot} {!slot.isAvailable ? '(Fully Booked)' : `(${slot.availablePods} pods available)`}
            </option>
          ))}
        </select>
        
        {isCheckingAvailability && (
          <p className={styles.checkingAvailability}>Checking availability...</p>
        )}
        
        {!isCheckingAvailability && selectedLocation && selectedDate && availableTimeSlots.length === 0 && (
          <p className={styles.noAvailability}>Please select a location and date to see available time slots</p>
        )}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="duration">Duration (hours)</label>
        <div className={styles.durationContainer}>
          <button 
            type="button" 
            className={styles.durationButton}
            onClick={() => setDuration(prev => Math.max(1, prev - 1))}
            disabled={duration <= 1}
          >
            -
          </button>
          <span className={styles.durationValue}>{duration}</span>
          <button 
            type="button" 
            className={styles.durationButton}
            onClick={() => setDuration(prev => Math.min(8, prev + 1))}
            disabled={duration >= 8}
          >
            +
          </button>
        </div>
      </div>
      
      {selectedCategory && duration > 0 && (
        <div className={styles.priceSummary}>
          <div className={styles.priceRow}>
            <span>Price per hour:</span>
            <span>$30.00</span>
          </div>
          <div className={styles.priceRow}>
            <span>Duration:</span>
            <span>{duration} hour{duration !== 1 ? 's' : ''}</span>
          </div>
          <div className={styles.priceTotal}>
            <span>Total:</span>
            <span>${(30 * duration).toFixed(2)}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      <button 
        type="submit" 
        className={styles.submitButton}
        disabled={isProcessing || isCheckingAvailability}
      >
        {isProcessing ? 'Processing...' : 'Book Now'}
      </button>
      
      {!user && (
        <p className={styles.loginPrompt}>
          You&apos;ll need to log in to complete your booking.
        </p>
      )}
    </form>
  );
}

// Export the wrapped component with Suspense
export default function BookingForm() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading booking form...</div>}>
      <BookingFormContent />
    </Suspense>
  );
} 