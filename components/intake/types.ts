export interface IntakeFormData {
  businessName: string
  industry: string
  websiteUrl: string
  phone: string
  email: string
  location: string
  servicesInterested: string[]
  goals: string
  timeline: string
  budgetRange: string
  brandColors: string[]
  fonts: string
  socialLinks: {
    instagram: string
    facebook: string
    tiktok: string
    linkedin: string
    twitter: string
    other: string
  }
  platformCredentials: {
    googleBusiness: string
    hosting: string
    domainRegistrar: string
    socialAccounts: string
    other: string
  }
}

export interface IntakeFiles {
  logos: File[]
  brandGuide: File | null
}

export const initialIntakeData: IntakeFormData = {
  businessName: '',
  industry: '',
  websiteUrl: '',
  phone: '',
  email: '',
  location: '',
  servicesInterested: [],
  goals: '',
  timeline: '',
  budgetRange: '',
  brandColors: ['#000000'],
  fonts: '',
  socialLinks: {
    instagram: '',
    facebook: '',
    tiktok: '',
    linkedin: '',
    twitter: '',
    other: '',
  },
  platformCredentials: {
    googleBusiness: '',
    hosting: '',
    domainRegistrar: '',
    socialAccounts: '',
    other: '',
  },
}
