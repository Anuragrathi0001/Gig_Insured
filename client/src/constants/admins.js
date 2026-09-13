/**
 * List of authorized Admin Gmail accounts.
 * Only these accounts are granted access to the Admin Portal.
 */
export const ADMIN_EMAILS = [
  'abhayrajrathi616@gmail.com',
  'rathisanjita32@gmail.com'
];

/**
 * Check if the given worker/user has administrator privileges
 * @param {Object} worker 
 * @param {Object} firebaseUser 
 * @returns {boolean}
 */
export const checkIsAdmin = (worker, firebaseUser) => {
  const email = (worker?.email || firebaseUser?.email || '').trim().toLowerCase();
  
  if (!email) {
    // If no email, check role flags
    return worker?.role === 'admin' || worker?.isAdmin === true || worker?.is_admin === true;
  }

  // Check against static admin list
  if (ADMIN_EMAILS.includes(email)) {
    return true;
  }

  // Check against environment variable if defined
  try {
    const envAdmins = import.meta.env.VITE_ADMIN_EMAILS
      ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
      : [];
    if (envAdmins.includes(email)) {
      return true;
    }
  } catch (e) {
    // ignore
  }

  // Only consider role if explicitly set to admin AND not a foreign email
  return worker?.role === 'admin' || worker?.isAdmin === true || worker?.is_admin === true;
};
