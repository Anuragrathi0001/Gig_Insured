const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// Designated Admin Emails
const ADMIN_EMAILS = [
  'abhayrajrathi616@gmail.com',
  'rathisanjita32@gmail.com'
];

const checkIsAdminEmail = (email) => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : [];
  return [...ADMIN_EMAILS, ...envAdmins].includes(normalized);
};

// In-memory worker fallback store when Supabase is offline
const mockWorkerStore = new Map();

/**
 * Generate 7-day JWT token
 */
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * @desc    Google Firebase Login / Verification
 * @route   POST /api/auth/google-login
 * @access  Public
 */
const googleLogin = async (req, res) => {
  try {
    const { email, displayName, photoURL, uid } = req.body;

    if (!email && !uid) {
      return res.status(400).json({
        status: 'fail',
        message: 'Google credentials or email/uid required'
      });
    }

    let worker = null;
    let isNewWorker = false;

    const isUserAdmin = checkIsAdminEmail(email);

    if (supabase) {
      try {
        // Look up existing worker by email
        const { data: existing } = await supabase
          .from('workers')
          .select('*')
          .eq('email', email)
          .single();

      if (existing) {
        worker = existing;
      } else {
        // Create worker with Google info
        isNewWorker = true;
        const tempDbId = `PENDING-${uid ? uid.slice(-6).toUpperCase() : Math.floor(100000 + Math.random() * 900000)}`;
        const { data: created, error } = await supabase
          .from('workers')
          .insert({
            name: displayName || email.split('@')[0],
            email: email,
            photo_url: photoURL || '',
            mobile: '',
            city: 'Bengaluru',
            zone: 'Indiranagar',
            platform: 'Zomato',
            worker_id: tempDbId,
            avg_weekly_income: 4500,
            upi_id: '',
            kyc_status: 'pending',
            role: isUserAdmin ? 'admin' : 'worker'
          })
          .select()
          .single();

          if (error) {
            console.warn('[Auth googleLogin]: Supabase insert error, falling back to in-memory:', error.message);
            worker = {
              id: `google_${uid || Date.now()}`,
              name: displayName || email.split('@')[0],
              email: email,
              photo_url: photoURL || '',
              mobile: '',
              city: 'Bengaluru',
              zone: 'Indiranagar',
              platform: 'Zomato',
              worker_id: '',
              avg_weekly_income: 4500,
              upi_id: '',
              kyc_status: 'pending',
              role: isUserAdmin ? 'admin' : 'worker',
              isAdmin: isUserAdmin,
              is_admin: isUserAdmin
            };
            mockWorkerStore.set(worker.id, worker);
            mockWorkerStore.set(email, worker);
          } else {
            worker = created;
          }
        }
      } catch (sbErr) {
        console.warn('[Auth googleLogin]: Supabase exception, falling back to in-memory:', sbErr.message);
      }
    }

    if (!worker) {
      // In-memory fallback
      worker = mockWorkerStore.get(email) || mockWorkerStore.get(`google_${uid}`);

      if (!worker) {
        isNewWorker = true;
        worker = {
          id: `google_${uid || Date.now()}`,
          name: displayName || email.split('@')[0],
          email: email,
          photo_url: photoURL || '',
          mobile: '',
          city: 'Bengaluru',
          zone: 'Indiranagar',
          platform: 'Zomato',
          worker_id: '',
          avg_weekly_income: 4500,
          upi_id: '',
          kyc_status: 'pending',
          role: isUserAdmin ? 'admin' : 'worker',
          isAdmin: isUserAdmin,
          is_admin: isUserAdmin,
          isNew: true
        };
        mockWorkerStore.set(worker.id, worker);
        mockWorkerStore.set(email, worker);
      }
    }

    if (isNewWorker && worker) {
      worker.worker_id = '';
      worker.workerId = '';
      worker.upi_id = '';
      worker.upiId = '';
      worker.kyc_status = 'pending';
      worker.kycStatus = 'pending';
    }

    // Strictly enforce role and isAdmin flags based on authorized email list
    if (worker) {
      const isAuthorizedAdmin = checkIsAdminEmail(worker.email || email);
      worker.role = isAuthorizedAdmin ? 'admin' : 'worker';
      worker.isAdmin = isAuthorizedAdmin;
      worker.is_admin = isAuthorizedAdmin;

      // Persist in mock store
      mockWorkerStore.set(worker.id, worker);
      if (worker.email) mockWorkerStore.set(worker.email, worker);
    }

    const token = generateToken(worker.id, worker.email || worker.id);

    return res.status(200).json({
      status: 'success',
      message: 'Google verification successful',
      token,
      worker,
      isNewWorker
    });
  } catch (error) {
    console.error('[Google Login Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error during Google authentication'
    });
  }
};

/**
 * @desc    Get current authenticated worker profile
 * @route   GET /api/auth/me
 * @access  Private (JWT Protected)
 */
const getMe = async (req, res) => {
  try {
    let worker = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workers')
          .select('*')
          .eq('id', req.worker.id)
          .single();

        if (!error && data) worker = data;
      } catch (err) {
        console.warn('[Auth getMe]: Supabase query exception, falling back to in-memory store:', err.message);
      }
    }

    if (!worker) {
      worker = mockWorkerStore.get(req.worker.id) || 
               (req.worker.email ? mockWorkerStore.get(req.worker.email) : null) || 
               (req.worker.mobile ? mockWorkerStore.get(req.worker.mobile) : null) || 
               req.worker;
    }

    if (!worker) {
      return res.status(404).json({
        status: 'fail',
        message: 'Worker profile not found'
      });
    }

    const isAuthorizedAdmin = checkIsAdminEmail(worker.email || req.worker.email);
    worker.role = isAuthorizedAdmin ? 'admin' : (worker.role === 'admin' ? 'worker' : (worker.role || 'worker'));
    worker.isAdmin = isAuthorizedAdmin;
    worker.is_admin = isAuthorizedAdmin;

    return res.status(200).json({
      status: 'success',
      worker
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve worker profile'
    });
  }
};

module.exports = {
  googleLogin,
  getMe,
  mockWorkerStore
};
