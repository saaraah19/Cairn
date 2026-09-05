import { apiRequest } from '../../lib/apiClient.js'

export function getStatisticsRequest() {
  return apiRequest('/api/statistics')
}
