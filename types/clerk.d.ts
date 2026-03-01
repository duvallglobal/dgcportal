interface ClerkPublicMetadata {
  role?: 'admin' | 'client'
}

declare global {
  interface CustomJwtSessionClaims {
    metadata?: ClerkPublicMetadata
    publicMetadata?: ClerkPublicMetadata
  }
}

export {}
