// Utility function to get the correct API endpoint based on user role
export const getApiEndpoint = (endpoint, userRole) => {
  const roleMapping = {
    'developer': 'developerdashboard',
    'tester': 'testerdashboard', 
    'crm': 'crmdashboard',
    'client': 'clientdashboard',
    'director': 'directordashboard',
    'project_manager': 'projectmanagerdashboard'
  };

  const dashboardPath = roleMapping[userRole] || 'projectmanagerdashboard';
  return `/${dashboardPath}/${endpoint}`;
};