"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"

// Simple CAPTCHA generator
const generateCaptcha = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const length = Math.floor(Math.random() * 2) + 5; // 5-6 characters
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function ContactForm({ dictionary }: { dictionary: any }) {
  const { lang } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [formData, setFormData] = useState<HTMLFormElement | null>(null)
  const [csrfToken, setCsrfToken] = useState("")
  
  // CAPTCHA states
  const [captchaText, setCaptchaText] = useState("")
  const [userCaptchaInput, setUserCaptchaInput] = useState("")
  const [captchaError, setCaptchaError] = useState(false)
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false)

  // Generate initial CAPTCHA on component mount
  useEffect(() => {
    setCaptchaText(generateCaptcha());
  }, []);

  // Generate CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/submit-form')
        const data = await response.json()
        setCsrfToken(data.token)
      } catch (error) {
        console.error('Error fetching CSRF token:', error)
      }
    }
    fetchCsrfToken()
  }, [])

  // Refresh the CAPTCHA
  const refreshCaptcha = () => {
    setCaptchaText(generateCaptcha());
    setUserCaptchaInput("");
    setCaptchaError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Store the form data for later submission
    setFormData(e.target as HTMLFormElement)
    
    // Show the CAPTCHA confirmation step instead of submitting directly
    setShowFinalConfirmation(true)
  }

  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userCaptchaInput.toLowerCase() === captchaText.toLowerCase()) {
      // CAPTCHA is correct, proceed with form submission
      setCaptchaError(false)
      setIsSubmitting(true)
      
      try {
        if (formData) {
          // Create FormData object
          const formDataObj = new FormData(formData)

          // Add CSRF token
          formDataObj.append("_csrf", csrfToken)

          // Send to our API endpoint first
          const response = await fetch('/api/submit-form', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              formData: Object.fromEntries(formDataObj),
              captcha: userCaptchaInput,
              csrfToken
            })
          })

          if (!response.ok) {
            throw new Error('Form submission failed')
          }

          // If successful, update UI
          setIsSubmitting(false)
          setSubmitStatus("success")
          setShowFinalConfirmation(false)
        }
      } catch (error) {
        console.error('Error submitting form:', error)
        setIsSubmitting(false)
        setSubmitStatus("error")
      }
    } else {
      // CAPTCHA is incorrect
      setCaptchaError(true)
      refreshCaptcha()
    }
  }

  // Handle canceling the CAPTCHA confirmation
  const handleCancelConfirmation = () => {
    setShowFinalConfirmation(false)
    refreshCaptcha()
  }

  return (
    <div>
      {submitStatus === "success" ? (
        <div className="p-8 bg-green-50 border border-green-200 text-center fade-in">
          <h3 className="text-xl mb-4 text-green-800">{dictionary.contact.successMessage || "Message sent successfully!"}</h3>
          <p className="text-green-700 mb-6">
            {dictionary.contact.successDescription || "We will get back to you as soon as possible."}
          </p>
          <button
            onClick={() => setSubmitStatus("idle")}
            className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors duration-300"
          >
            {dictionary.contact.newMessage || "Send another message"}
          </button>
        </div>
      ) : showFinalConfirmation ? (
        <div className="p-8 bg-gray-50 border border-gray-200 text-center fade-in">
          <h3 className="text-xl mb-4">{dictionary.contact.captchaVerification || "Please verify you are human"}</h3>
          
          <div className="mb-6 flex flex-col items-center">
            <div className="relative bg-gray-100 p-4 rounded-md mb-4 select-none">
              <div className="text-2xl font-bold tracking-wider opacity-85 select-none"
                style={{ 
                  fontFamily: "monospace", 
                  letterSpacing: "0.2em",
                  transform: "skew(-10deg, 2deg)",
                  textShadow: "1px 1px 1px #00000030"
                }}>
                {captchaText}
              </div>
              <button 
                type="button"
                onClick={refreshCaptcha}
                className="absolute right-2 top-4 text-gray-500 hover:text-black"
                aria-label="Refresh CAPTCHA"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 22v-6h6"></path>
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCaptchaSubmit} className="w-full max-w-xs">
              <div className="mb-4">
                <input 
                  type="text" 
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value)}
                  placeholder={dictionary.contact.enterCaptcha || "Enter text shown above"}
                  className={`w-full p-3 bg-gray-100 border ${captchaError ? "border-red-500" : "border-transparent"} focus:outline-none focus:border-gray-300`}
                  autoFocus
                />
                {captchaError && (
                  <p className="text-sm text-red-500 mt-1">
                    {dictionary.contact.captchaError || "Incorrect verification code. Please try again."}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-4 justify-center">
                <button
                  type="button"
                  onClick={handleCancelConfirmation}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 transition-colors"
                  disabled={isSubmitting}
                >
                  {dictionary.contact.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors"
                  disabled={isSubmitting || !userCaptchaInput}
                >
                  {isSubmitting ? 
                    (dictionary.contact.submitting || "Submitting...") : 
                    (dictionary.contact.confirm || "Send Message")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <input type="hidden" name="language" value={lang} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm text-gray-600 mb-1">
                {dictionary.contact.nameLabel}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full p-3 bg-gray-100 border border-transparent focus:outline-none focus:border-gray-300"
                placeholder={dictionary.contact.namePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
                {dictionary.contact.emailLabel}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full p-3 bg-gray-100 border border-transparent focus:outline-none focus:border-gray-300"
                placeholder={dictionary.contact.emailPlaceholder}
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm text-gray-600 mb-1">
              {dictionary.contact.detailsLabel}
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              required
              className="w-full p-3 bg-gray-100 border border-transparent focus:outline-none focus:border-gray-300"
              placeholder={dictionary.contact.detailsPlaceholder}
            ></textarea>
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors duration-300"
            >
              {dictionary.contact.submitButton}
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 