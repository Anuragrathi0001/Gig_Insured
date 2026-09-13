const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { mockWorkerStore } = require('../controllers/authController');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
      const decoded = jwt.verify(token, secret);

      // Try Supabase first, fall back to in-memory store
      if (supabase) {
        try {
          const { data: worker, error } = await supabase
            .from('workers')
            .select('*')
            .eq('id', decoded.id)
            .single();

          if (!error && worker) {
            req.worker = worker;
          }
        } catch (err) {
          console.warn('[Auth Middleware]: Supabase query error, using in-memory store:', err.message);
        }
      }

      if (!req.worker) {
        // Use in-memory store
        req.worker = mockWorkerStore.get(decoded.id) || 
                     mockWorkerStore.get(decoded.mobile) || 
                     (decoded.email ? mockWorkerStore.get(decoded.email) : null) || {
          id: decoded.id,
          mobile: decoded.mobile || '',
          name: decoded.name || 'Delivery Partner',
          platform: 'Zomato',
          city: 'Bengaluru',
          zone: 'Indiranagar',
          worker_id: '',
          avg_weekly_income: 4500,
          kyc_status: 'pending',
          upi_id: ''
        };
      }

      if (!req.worker) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, worker record no longer exists'
        });
      }

      return next();
    } catch (error) {
      console.error(`[Auth Middleware Error]: ${error.message}`);
      return res.status(401).json({
        status: 'fail',
        message: 'Not authorized, token verification failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized, no token provided'
    });
  }
};

module.exports = { protect };
