{
  "project_name": "Security-as-a-Service (SECaaS)",
  "selected_features": [
    {
      "id": "F01",
      "name": "User Authentication",
      "description": "User signup, login, logout using JWT or session-based authentication",
      "priority": "high",
      "impact": "Required for SaaS platform",
      "tech": ["NextAuth/JWT", "bcrypt", "cookies"]
    },
    {
      "id": "F04",
      "name": "Vulnerability Scanner Engine",
      "description": "Scan web applications for SQL Injection, XSS, and extended vulnerability types",
      "priority": "high",
      "impact": "Core functionality of the platform",
      "tech": ["Node.js", "Axios/Fetch", "Custom payloads"]
    },
    {
      "id": "F05",
      "name": "Payload Injection Engine",
      "description": "Inject malicious payloads into inputs and analyze server responses",
      "priority": "high",
      "impact": "Simulates real-world attack scenarios",
      "tech": ["Custom scripts", "Regex", "Response parsing"]
    },
    {
      "id": "F06",
      "name": "Website Crawler",
      "description": "Automatically crawl website pages, endpoints, and forms for scanning",
      "priority": "medium",
      "impact": "Improves scan coverage and detection",
      "tech": ["Cheerio", "Recursive crawling"]
    },
    {
      "id": "F08",
      "name": "Scan Status Tracking",
      "description": "Track scan states such as pending, running, and completed",
      "priority": "high",
      "impact": "Improves user experience and transparency",
      "tech": ["Database state", "Polling/WebSockets"]
    },
    {
      "id": "F09",
      "name": "Real-Time Scan Logs",
      "description": "Display live logs of scanning steps and activities",
      "priority": "medium",
      "impact": "Enhances interactivity and debugging visibility",
      "tech": ["Socket.io", "WebSockets"]
    },
    {
      "id": "F10",
      "name": "Security Report Generation",
      "description": "Generate detailed vulnerability reports after scanning",
      "priority": "high",
      "impact": "Primary output for users",
      "tech": ["PDFKit", "Structured JSON"]
    },
    {
      "id": "F11",
      "name": "Vulnerability Severity Classification",
      "description": "Classify vulnerabilities into Low, Medium, and High severity",
      "priority": "medium",
      "impact": "Helps users prioritize fixes",
      "tech": ["Rule-based logic"]
    },
    {
      "id": "F12",
      "name": "Scan History Dashboard",
      "description": "Display previous scans and results in a dashboard view",
      "priority": "high",
      "impact": "Improves usability and tracking",
      "tech": ["Next.js UI", "Charts"]
    },
    {
      "id": "F13",
      "name": "Email Notifications",
      "description": "Send email notifications when scan is completed",
      "priority": "medium",
      "impact": "Improves user engagement",
      "tech": ["Nodemailer"]
    }
  ]
}