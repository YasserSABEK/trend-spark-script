import { loadStripe } from '@stripe/stripe-js';

// This is your publishable key - it's safe to expose this in the frontend
const stripePromise = loadStripe(
  'pk_live_51QKlvOHOhG7sCJ8zJuQgVVHvagP9zQXS8l6rOhFHFw0yYSVPCr9P4b24q17PoP2HahlnQOdQCJl25ZrIvJU6mF4Z00YGaGhOoT'
);

export { stripePromise };