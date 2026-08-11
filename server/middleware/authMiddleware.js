const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Worker } = require('../models');
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

      const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

      if (isDbConnected) {
        req.worker = await Worker.findById(decoded.id).select('-__v');
      } else {
        // Fallback for offline DB mode
        if (decoded.mobile && mockWorkerStore.has(decoded.mobile)) {
          req.worker = mockWorkerStore.get(decoded.mobile);
        } else {
          req.worker = {
            _id: decoded.id,
            mobile: decoded.mobile,
            name: 'Delivery Partner',
            platform: 'Zomato',
            city: 'Bengaluru',
            zone: 'Indiranagar',
            workerId: `WRK-${decoded.mobile?.slice(-4) || '1234'}`,
            avgWeeklyIncome: 4500,
            kycStatus: 'verified',
            upiId: `${decoded.mobile || 'worker'}@paytm`
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
