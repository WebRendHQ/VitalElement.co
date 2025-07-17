'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './Landing.module.scss';

// Form question types
type QuestionType = 'text' | 'email' | 'select' | 'radio' | 'checkbox' | 'textarea';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  isIntroduction?: boolean;
  questions: Question[];
}

// Animation states for transitions
type AnimationState = 'normal' | 'slideInLeft' | 'slideInRight' | 'slideOutLeft' | 'slideOutRight';

// Form data structured according to the client discovery document
const formSections: FormSection[] = [
  {
    id: 'intro',
    title: '🌟 Thanks for taking part in the Solution.',
    isIntroduction: true,
    description: `Thank you for being part of this exciting journey! I'm on a mission to transform how we experience health and wellness, making it accessible to everyone through innovative technology.

I've developed a groundbreaking concept that could revolutionize wellness spaces, but before we launch, I want to hear directly from you about the challenges you've faced in your wellness journey.

Though I hear these stories from my patients daily, investors are eager for more comprehensive insights - and that's where your valuable input comes in!

Want to share your personal wellness story or chat about the future of health tech? Reach me directly at joe@vitalelement.co.`,
    questions: []
  },
  {
    id: 'vision',
    title: '🚀 Our Vision & Core Values',
    isIntroduction: true,
    description: `Vision: To integrate tech with complete wellness to form a world where individuals can easily engage and thrive in harmony with themselves.

Core Values:
• Empathy: Empathy for individual needs and aspirations at each interaction, human-to-human and machine-to-human.
• Complete Health: Optimizing the interconnectedness of mind and body.
• Transformation: Facilitating effortless, entertaining, and lasting personal wellbeing.
• Accessibility: Making wellness experiences available to each individual.
• Innovation: Eliminating the boundaries between technology and thriving.`,
    questions: []
  },
  {
    id: 'benefits',
    title: '✨ Why Your Voice Matters',
    isIntroduction: true,
    description: `• Exclusive Reward: Get a FREE 30-day unlimited membership to experience our breakthrough wellness space.
• Be a Pioneer: Be among the first to experience our revolutionary immersive wellness technology.
• Shape the Future: Help us create a wellness experience that perfectly fits your lifestyle - including work, family, and all your commitments.
• Be Heard: Your feedback will directly influence how we design our spaces and services.`,
    questions: []
  },
  {
    id: 'experience',
    title: 'Your Wellness Journey',
    description: 'Tell us about your experiences with wellness spaces so we can create something truly revolutionary',
    questions: [
      {
        id: 'previousWellness',
        text: 'Which of these wellness experiences have you tried or considered?',
        type: 'checkbox',
        required: true,
        options: [
          'Relaxation space',
          'Sauna',
          'Red light therapy',
          'Immersive music therapy',
          'HIIT Workouts',
          'Vibroacoustic therapy'
        ]
      },
      {
        id: 'reasonsNotJoining',
        text: "What obstacles prevented you from continuing with these wellness experiences?",
        type: 'checkbox',
        required: true,
        options: [
          'Too expensive',
          'Inconvenient location',
          'Didn\'t see results quickly enough',
          'Life just got too busy'
        ]
      }
    ]
  },
  {
    id: 'preferences',
    title: 'Reimagine Your Ideal Wellness Experience',
    description: 'Help us create the perfect wellness space that fits seamlessly into your life',
    questions: [
      {
        id: 'importantFactors',
        text: 'Which features would make you excited to try our revolutionary wellness space?',
        type: 'checkbox',
        required: true,
        options: [
          'Pay-as-you-go pricing (only pay for what you use)',
          'Smart workspace integration (be productive while getting healthy)',
          'Premium entertainment experience (IMAX-quality immersion)',
          'Ultimate convenience (access from 6am-11pm daily)',
          'Results guarantee',
          'Personalized care and attention'
        ]
      }
    ]
  },
  {
    id: 'therapies',
    title: 'Customize Your Wellness Experience',
    description: 'Select the innovative therapies you\'d be most excited to try',
    questions: [
      {
        id: 'preferredTherapies',
        text: 'Which cutting-edge therapies would you most look forward to experiencing?',
        type: 'checkbox',
        required: true,
        options: [
          'Luxury relaxation pods',
          'Advanced infrared sauna therapy',
          'Rejuvenating red light therapy',
          'Immersive 4D music experience',
          'Mood-enhancing blue light therapy',
          'AI-guided HIIT workouts'
        ]
      }
    ]
  },
  {
    id: 'openEndedFeedback',
    title: 'Share Your Ideas',
    description: 'We\'d love to hear your thoughts and suggestions for our wellness spaces',
    questions: [
      {
        id: 'otherFactors',
        text: 'Any dream features that would make our wellness space perfect for you?',
        type: 'textarea',
        required: false,
        placeholder: 'Share your wellness wishlist...'
      },
      {
        id: 'preferredLocation',
        text: "Where would you like to see our first wellness space open?",
        type: 'textarea',
        required: true,
        placeholder: 'Your city, state, or neighborhood...'
      }
    ]
  },
  {
    id: 'personal',
    title: 'Stay Connected (Optional)',
    description: 'If you\'d like to receive updates about our progress and your free membership, you can share your contact information. You\'re welcome to remain anonymous if you prefer.',
    questions: [
      {
        id: 'name',
        text: 'What should we call you?',
        type: 'text',
        required: false,
        placeholder: 'Your name (optional)'
      },
      {
        id: 'email',
        text: 'Where can we reach you with exclusive offers?',
        type: 'email',
        required: false,
        placeholder: 'your.email@example.com (optional)'
      }
    ]
  }
];

// Gradient Blob Component
const GradientBlobs = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position as percentage of screen dimensions
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Generate transform styles based on mouse position
  const getTransform = (factor: number, invertX: boolean = false, invertY: boolean = false) => {
    const maxMove = 15; // Maximum pixel movement
    const x = invertX ? -1 : 1;
    const y = invertY ? -1 : 1;
    
    // Create subtle movement based on mouse position
    const translateX = (mousePosition.x - 0.5) * maxMove * factor * x;
    const translateY = (mousePosition.y - 0.5) * maxMove * factor * y;
    
    return {
      transform: `translate(${translateX}px, ${translateY}px)`,
    };
  };

  return (
    <div className={styles.blobContainer}>
      <div 
        className={`${styles.blob} ${styles.blob1}`}
        style={getTransform(1.2, true, false)}
      ></div>
      <div 
        className={`${styles.blob} ${styles.blob2}`}
        style={getTransform(0.8, false, true)}
      ></div>
      <div 
        className={`${styles.blob} ${styles.blob3}`}
        style={getTransform(1.5, true, true)}
      ></div>
      <div 
        className={`${styles.blob} ${styles.blob4}`}
        style={getTransform(1)}
      ></div>
      <div 
        className={`${styles.blob} ${styles.blob5}`}
        style={getTransform(0.6, false, true)}
      ></div>
    </div>
  );
};

export default function LandingForm() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const formRef = useRef<HTMLDivElement>(null);
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set());
  const [currentInfoSection, setCurrentInfoSection] = useState(0);
  const [infoAnimationState, setInfoAnimationState] = useState<AnimationState>('normal');
  const [isInfoTransitioning, setIsInfoTransitioning] = useState(false);
  const infoSectionRef = useRef<HTMLDivElement>(null);
  const infoWrapperRef = useRef<HTMLDivElement>(null);
  
  // Separate intro and question sections
  const introSections = formSections.filter(section => section.isIntroduction);
  const questionSections = formSections.filter(section => !section.isIntroduction);
  
  // Hide navbar only on this page
  useEffect(() => {
    // Hide the navbar when this component mounts
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = 'none';
    }
    
    // Hide the footer when this component mounts
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.display = 'none';
    }
    
    // Show the navbar and footer again when the component unmounts
    return () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        navbar.style.display = 'block';
      }
      
      const footer = document.querySelector('footer');
      if (footer) {
        footer.style.display = 'block';
      }
    };
  }, []);
  
  // For tracking form section visibility
  useEffect(() => {
    if (!formRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.id) {
            setViewedSections(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = formRef.current.querySelectorAll('[data-section-id]');
    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);
  
  // Simple placeholder effect for refs
  useEffect(() => {
    // This effect just ensures the refs stay connected
    // We no longer need to adjust height dynamically
  }, []);

  const handleInputChange = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const navigateToInfoSection = (index: number) => {
    if (index >= 0 && index < introSections.length && !isInfoTransitioning) {
      // Don't animate if it's the same section
      if (index === currentInfoSection) return;
      
      // Determine animation direction
      const direction = index > currentInfoSection ? 'Right' : 'Left';
      
      // Start transition
      setIsInfoTransitioning(true);
      setInfoAnimationState(`slideOut${direction}` as AnimationState);
      
      // After a short delay, change section and animate in
      setTimeout(() => {
        setCurrentInfoSection(index);
        
        // Animate in the new section
        setInfoAnimationState(`slideIn${direction === 'Right' ? 'Left' : 'Right'}` as AnimationState);
        
        // Reset animation state after transition completes
        setTimeout(() => {
          setInfoAnimationState('normal');
          setIsInfoTransitioning(false);
        }, 700);
      }, 400);
    }
  };

  // Cycle through info sections automatically
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isInfoTransitioning) {
        navigateToInfoSection((currentInfoSection + 1) % introSections.length);
      }
    }, 8000); // Change every 8 seconds
    
    return () => clearInterval(timer);
  }, [currentInfoSection, isInfoTransitioning, introSections.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      // Calculate time spent on form
      const timeSpent = Date.now() - startTime;
      
      // Submit form data
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          timeSpent, // in milliseconds
          viewedSections: Array.from(viewedSections),
        }),
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={question.type}
            id={question.id}
            placeholder={question.placeholder}
            value={formData[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            required={question.required}
            className={styles.input}
            aria-label={question.text}
          />
        );
      case 'textarea':
        return (
          <div className={styles.textareaWrapper}>
            <textarea
              id={question.id}
              placeholder={question.placeholder}
              value={formData[question.id] || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              required={question.required}
              className={styles.textarea}
              rows={4}
              aria-label={question.text}
            />
            <div className={styles.textareaFocus}></div>
          </div>
        );
      case 'select':
        return (
          <div className={styles.selectWrapper}>
            <select
              id={question.id}
              value={formData[question.id] || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              required={question.required}
              className={styles.select}
              aria-label={question.text}
            >
              <option value="">Select an option</option>
              {question.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      case 'radio':
        return (
          <div className={styles.radioGroup}>
            {question.options?.map(option => (
              <label key={option} className={styles.radioOption}>
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={formData[question.id] === option}
                  onChange={() => handleInputChange(question.id, option)}
                  required={question.required}
                  aria-label={option}
                />
                <span dangerouslySetInnerHTML={{ __html: formatText(option) }}></span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className={styles.checkboxGroup}>
            {question.options?.map(option => (
              <label key={option} className={styles.checkboxOption}>
                <input
                  type="checkbox"
                  name={question.id}
                  value={option}
                  checked={formData[question.id]?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = formData[question.id] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((val: string) => val !== option);
                    handleInputChange(question.id, newValues);
                  }}
                  aria-label={option}
                />
                <span dangerouslySetInnerHTML={{ __html: formatText(option) }}></span>
              </label>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // Helper function to format text with highlighted keywords
  const formatText = (text: string) => {
    // Keywords we want to highlight
    const keywords = [
      'revolutionary', 'wellness', 'technology', 'innovative', 'premium', 
      'experience', 'breakthrough', 'cutting-edge', 'transformation',
      'immersive', 'relaxation', 'therapy', 'personalized'
    ];
    
    // Simple parser to add emphasis to keywords
    let formattedText = text;
    
    // For each keyword, wrap it in a span with special styling
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formattedText = formattedText.replace(regex, match => 
        `<span class="${styles.highlight}">${match}</span>`
      );
    });
    
    return formattedText;
  };

  if (submitted) {
    return (
      <div className={styles.pageContainer}>
        <GradientBlobs />
        <div className={`${styles.formContainer} ${styles.successContainer}`}>
          <div className={styles.successMessage}>
            <h2>Amazing! Thank You! 🎉</h2>
            <p>You're <span className={styles.emphasis}>officially</span> part of our wellness revolution! We'll be in touch soon with details about your <span className={styles.emphasis}>exclusive 30-day free membership</span>.</p>
            <p className={styles.successNote}>Get ready to experience wellness like never before!</p>
          </div>
        </div>
      </div>
    );
  }

  const currentIntroSection = introSections[currentInfoSection];

  return (
    <>
      <div className={styles.pageContainer}>
        <GradientBlobs />
        
        {/* Title Section */}
        <div className={styles.titleSection}>
          <h1 className={styles.mainTitle}>Introducing Vital Element</h1>
          <p className={styles.mainDescription}>
            Discover a revolutionary approach that combines cutting-edge technology with immersive therapeutic experiences, designed to transform how you engage with your health and wellbeing.
          </p>
        </div>
        
        {/* Profile Images - Positioned as bubbles */}
        <div className={styles.profileBubbles}>
          <div className={`${styles.profileImageContainer} ${styles.mainProfile}`}>
            <img 
              src="/joe.jpeg" 
              alt="Dr. Joe" 
              className={styles.profileImage}
            />
          </div>
          <div className={`${styles.profileImageContainer} ${styles.profileBubble1}`}>
            <img 
              src="/team1.jpg" 
              alt="Team Member" 
              className={styles.profileImage}
            />
          </div>
          <div className={`${styles.profileImageContainer} ${styles.profileBubble2}`}>
            <img 
              src="/team2.jpeg" 
              alt="Team Member" 
              className={styles.profileImage}
            />
          </div>
        </div>
        
        <div className={styles.singlePageContainer}>
          {/* Introduction section as slides at the top */}
          <div className={styles.infoContainer}>
            <div className={styles.infoSectionWrapper} ref={infoWrapperRef}>
              <div 
                className={`${styles.infoSection} ${styles[infoAnimationState]}`}
                ref={infoSectionRef}
              >
                <h2>
                  <span className={styles.titleEmoji}>
                    {currentIntroSection.title.substring(0, 2)}
                  </span>
                  {currentIntroSection.title.substring(2)}
                </h2>
                {currentIntroSection.description && (
                  <div 
                    className={styles.introductionText}
                    dangerouslySetInnerHTML={{ __html: formatText(currentIntroSection.description.replace(/\n/g, '<br />')) }}
                  />
                )}
              </div>
            </div>
            
            <div className={styles.infoDots}>
              {introSections.map((section, index) => (
                <button 
                  key={section.id}
                  type="button"
                  className={`${styles.infoDot} ${currentInfoSection === index ? styles.active : ''}`}
                  onClick={() => navigateToInfoSection(index)}
                  aria-label={`View info: ${section.title}`}
                />
              ))}
            </div>
          </div>
          
          {/* All questions in a single form */}
          <div className={styles.formContainer} ref={formRef}>
            <form onSubmit={handleSubmit}>
              {questionSections.map((section) => (
                <div 
                  key={section.id}
                  className={styles.formSection}
                  data-section-id={section.id}
                >
                  <h2>{section.title}</h2>
                  {section.description && (
                    <div 
                      className={styles.sectionDescription}
                      dangerouslySetInnerHTML={{ __html: formatText(section.description.replace(/\n/g, '<br />')) }}
                    />
                  )}
                  
                  {section.questions.map((question, idx) => (
                    <div 
                      key={question.id} 
                      className={styles.questionContainer}
                    >
                      <label htmlFor={question.id} className={styles.questionLabel}>
                        <span dangerouslySetInnerHTML={{ __html: formatText(question.text) }}></span>
                        {question.required && <span className={styles.required}>*</span>}
                      </label>
                      {renderQuestion(question)}
                    </div>
                  ))}
                </div>
              ))}
              
              <div className={styles.navigation}>
                <button
                  type="submit"
                  className={styles.nextButton}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 
                    <span className={styles.buttonText}>Submit & Get Free Access</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
