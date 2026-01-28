import express from 'express';
import { getSkillMetrics } from '../utils/skillsMetrics.js';

export function createSkillsMetricsRouter() {
  const router = express.Router();
  router.get('/skills/dashboard', (req, res) => {
    const metrics = getSkillMetrics();
    res.json({
      timestamp: new Date().toISOString(),
      metrics
    });
  });
  return router;
}

