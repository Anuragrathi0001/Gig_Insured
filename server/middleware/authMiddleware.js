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
      if (process.env.SUPABASE_URL) {
        const { data: worker, error } = await supabase
          .from('workers')
          .select('*')
          .eq('id', decoded.id)
          .single();

        if (error || !worker) {
          // Fallback to in-memory store when Supabase unreachable
          req.worker = mockWorkerStore.get(decoded.mobile) || {
            id: decoded.id,
            mobile: decoded.mobile,
            name: 'Delivery Partner',
            platform: 'Zomato',
            city: 'Bengaluru',
            zone: 'Indiranagar',
            worker_id: `WRK-${decoded.mobile?.slice(-4) || '1234'}`,
            avg_weekly_income: 4500,
            kyc_status: 'verified',
            upi_id: `${decoded.mobile || 'worker'}@paytm`
          };
        } else {
          req.worker = worker;
        }
      } else {
        // No Supabase configured — use in-memory store
        if (decoded.mobile && mockWorkerStore.has(decoded.mobile)) {
          req.worker = mockWorkerStore.get(decoded.mobile);
        } else {
          req.worker = {
            id: decoded.id,
            mobile: decoded.mobile,
            name: 'Delivery Partner',
            platform: 'Zomato',
            city: 'Bengaluru',
            zone: 'Indiranagar',
            worker_id: `WRK-${decoded.mobile?.slice(-4) || '1234'}`,
            avg_weekly_income: 4500,
            kyc_status: 'verified',
            upi_id: `${decoded.mobile || 'worker'}@paytm`
          };
        }
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
