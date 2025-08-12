import axios from 'axios';

const API_URL = '/api/analytics';

export const fetchAnalytics = async (params = {}) => {
  const res = await axios.get(API_URL, { params });
  return res.data;
};
