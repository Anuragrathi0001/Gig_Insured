const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

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

    if (process.env.SUPABASE_URL) {
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
        const workerId = `GIG-G-${uid ? uid.slice(-6).toUpperCase() : Math.floor(100000 + Math.random() * 900000)}`;
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
            worker_id: workerId,
            avg_weekly_income: 4500,
            upi_id: `${email.split('@')[0]}@okaxis`,
            kyc_status: 'verified'
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
            worker_id: workerId,
            avg_weekly_income: 4500,
            upi_id: `${email.split('@')[0]}@okaxis`,
            kyc_status: 'verified'
          };
          mockWorkerStore.set(worker.id, worker);
          mockWorkerStore.set(email, worker);
        } else {
          worker = created;
        }
      }
    } else {
      // In-memory fallback
      worker = mockWorkerStore.get(email) || mockWorkerStore.get(`google_${uid}`);

      if (!worker) {
        isNewWorker = true;
        const workerId = `GIG-G-${uid ? uid.slice(-6).toUpperCase() : Math.floor(100000 + Math.random() * 900000)}`;
        worker = {
          id: `google_${uid || Date.now()}`,
          name: displayName || email.split('@')[0],
          email: email,
          photo_url: photoURL || '',
          mobile: '',
          city: 'Bengaluru',
          zone: 'Indiranagar',
          platform: 'Zomato',
          worker_id: workerId,
          avg_weekly_income: 4500,
          upi_id: `${email.split('@')[0]}@okaxis`,
          kyc_status: 'verified',
          isNew: true
        };
        mockWorkerStore.set(worker.id, worker);
        mockWorkerStore.set(email, worker);
      }
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

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', req.worker.id)
        .single();

      if (error) throw new Error(error.message);
      worker = data;
    } else {
      worker = mockWorkerStore.get(req.worker.id) || 
               (req.worker.email ? mockWorkerStore.get(req.worker.email) : null) || 
               req.worker;
    }

    if (!worker) {
      return res.status(404).json({
        status: 'fail',
        message: 'Worker profile not found'
      });
    }

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
