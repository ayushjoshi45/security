const SEVERITY_MAP = {
  'SQL Injection': 'High',
  'Command Injection': 'High',
  XXE: 'High',
  'NoSQL Injection': 'High',
  'Path Traversal': 'High',
  'Insecure File Upload': 'High',
  'Broken Authentication': 'High',
  'Sensitive Data Exposure': 'High',
  'LDAP Injection': 'Medium',
  XSS: 'Medium',
  CSRF: 'Medium',
  'Missing Security Headers': 'Low'
};

function getSeverity(vulnerabilityType) {
  return SEVERITY_MAP[vulnerabilityType] || 'Low';
}

module.exports = {
  getSeverity
};
